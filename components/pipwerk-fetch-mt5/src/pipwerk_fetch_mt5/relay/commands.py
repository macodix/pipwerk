"""The command line of ``serve`` and ``request`` (specification relay 6.1, 6.3).

::

    pipwerk-fetch-mt5 serve [-c <PATH>]

    pipwerk-fetch-mt5 request [-c <PATH>] --address <ADDRESS> --broker <BROKER>
                              [--instrument <DESIGNATION>] --from <FROM> --to <TO>
                              [-u <UNITS>] [--ticks] [-o <DIRECTORY>] [--wait <MINUTES>]
                              <SYMBOL>

The command stands first. ``serve`` runs until it is ended (Ctrl+C, or a termination signal);
``request`` ends when the answer is complete. Exit codes: 0 all files written; 1 a part could
not be fetched or another failure of the request (see ``request.py``); 2 an invalid call or an
invalid startup configuration, nothing was sent.
"""

from __future__ import annotations

import argparse
import logging
import signal
import threading
import time
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from types import FrameType
from typing import Any, TextIO, cast

from pipwerk_relaycore import Address, AddressError
from pydantic import ValidationError

from pipwerk_fetch_mt5.cli import (
    CallError,
    check_instruments,
    parse_moment,
    parse_time_units,
    prepare_directory,
)
from pipwerk_fetch_mt5.config import (
    StartupConfigError,
    load_relay_settings,
    load_startup_config,
    resolve_config_path,
)
from pipwerk_fetch_mt5.files import INSTRUMENT_PATTERN
from pipwerk_fetch_mt5.mt5_gateway import Mt5Gateway
from pipwerk_fetch_mt5.relay.connection import RelayStartError, open_connector
from pipwerk_fetch_mt5.relay.contents import FetchRequestContent, TimeUnitName
from pipwerk_fetch_mt5.relay.request import DEFAULT_WAIT, run_request
from pipwerk_fetch_mt5.relay.serve import RequestHandler, serve_forever

EXIT_OK = 0
EXIT_FAILED = 1
EXIT_INVALID_CALL = 2


@dataclass(frozen=True)
class RelayHooks:
    """Replacements for the tests: the event that ends ``serve``, the sleep and the clock of
    ``request``, and the interval of reading the inbox. A real call passes none."""

    stop: threading.Event | None = None
    sleep: Callable[[float], None] | None = None
    monotonic: Callable[[], float] | None = None
    poll_interval: float | None = None


def build_serve_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="pipwerk-fetch-mt5 serve",
        description=(
            "Run on the machine of MetaTrader 5, with MetaTrader 5 running and logged in. "
            "Receives requests for candles, ticks and the details of instruments through "
            "pipwerk relay, fetches them like the call on the command line and sends every "
            "file back to the sender of the request. Runs until it is ended (Ctrl+C). The "
            "section [relay] of the startup configuration states the connection to the relay."
        ),
        epilog="Exit code 0: ended by the user. 2: invalid startup configuration.",
    )
    _add_config(parser)
    return parser


def build_request_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="pipwerk-fetch-mt5 request",
        description=(
            "Ask a running 'pipwerk-fetch-mt5 serve' for candles, ticks and the details of an "
            "instrument through pipwerk relay and write the files that arrive into a "
            "directory. Does not need MetaTrader 5 on this machine. The section [relay] of the "
            "startup configuration states the connection to the relay; server_time_zone is "
            "not needed."
        ),
        epilog=(
            "Exit code 0: all files written. 1: a part could not be fetched, the request was "
            "refused or could not be delivered, or the wait time passed. 2: invalid call or "
            "startup configuration."
        ),
    )
    parser.add_argument(
        "symbol", metavar="SYMBOL", help="Symbol at the broker, as MetaTrader 5 knows it."
    )
    parser.add_argument(
        "--address",
        required=True,
        metavar="ADDRESS",
        help="Address of the running 'serve': <component>.<network>.<relay>.",
    )
    parser.add_argument(
        "--broker",
        required=True,
        metavar="BROKER",
        help="Name of the trade server MetaTrader 5 is logged in to.",
    )
    parser.add_argument(
        "--instrument",
        default=None,
        metavar="DESIGNATION",
        help=(
            "Designation of the files (default: the symbol). Needed if the symbol holds "
            "characters that are not allowed in a file name."
        ),
    )
    parser.add_argument(
        "--from",
        dest="start",
        required=True,
        metavar="FROM",
        help=(
            "Start of the period, included: 2026-01-05 or 2026-01-05T10:30[:15], with Z or an "
            "offset; without a zone UTC."
        ),
    )
    parser.add_argument(
        "--to",
        dest="end",
        required=True,
        metavar="TO",
        help="End of the period, excluded (same formats as --from).",
    )
    parser.add_argument(
        "-u",
        "--time-unit",
        dest="time_units",
        action="append",
        default=[],
        metavar="UNITS",
        help="Time unit(s) of the candles, for example H1 or M1,H1,D1; may be repeated.",
    )
    parser.add_argument("--ticks", action="store_true", help="Also ask for the ticks.")
    parser.add_argument(
        "-o",
        "--output-dir",
        dest="directory",
        default=".",
        metavar="DIRECTORY",
        help="Directory the files are written to (created if missing); default: the current one.",
    )
    parser.add_argument(
        "--wait",
        type=int,
        default=int(DEFAULT_WAIT.total_seconds() // 60),
        metavar="MINUTES",
        help="How long to wait for the answer (default: %(default)s minutes).",
    )
    _add_config(parser)
    return parser


def _add_config(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "-c",
        "--config",
        dest="config_path",
        default=None,
        help=(
            "Path to the INI startup configuration. If omitted, the automatic search "
            "locations are searched (see 'pipwerk-fetch-mt5 --help')."
        ),
    )


def run_command(
    command: str,
    arguments: Sequence[str],
    *,
    module: Any | None,
    clock: Callable[[], datetime] | None,
    out: TextIO,
    err: TextIO,
    hooks: RelayHooks | None,
) -> int:
    """Run ``serve`` or ``request`` with the arguments after the command."""
    hooks = hooks or RelayHooks()
    if command == "serve":
        return _serve(arguments, module=module, clock=clock, out=out, err=err, hooks=hooks)
    return _request(arguments, clock=clock, out=out, err=err, hooks=hooks)


# --- serve ----------------------------------------------------------------------------------------


def _serve(
    arguments: Sequence[str],
    *,
    module: Any | None,
    clock: Callable[[], datetime] | None,
    out: TextIO,
    err: TextIO,
    hooks: RelayHooks,
) -> int:
    args = build_serve_parser().parse_args(arguments)
    try:
        path = resolve_config_path(args.config_path)
        config = load_startup_config(path)
        relay = load_relay_settings(path)
        connector = open_connector(relay, clock=clock)
    except (StartupConfigError, RelayStartError) as error:
        print(f"pipwerk-fetch-mt5: {error}", file=err)
        return EXIT_INVALID_CALL
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
    )
    stop = hooks.stop or threading.Event()
    restore = _end_on_signal(stop) if hooks.stop is None else None
    gateway = Mt5Gateway(config.metatrader, module)
    handler = RequestHandler(connector, gateway, config, clock=clock, out=out)
    interval = hooks.poll_interval or float(relay.poll_interval_seconds)
    print(
        f"pipwerk-fetch-mt5 serve: Adresse {relay.address}, wartet auf Anfragen "
        "(Beenden mit Strg+C).",
        file=out,
    )
    try:
        serve_forever(connector, handler, interval=interval, stop=stop)
    except KeyboardInterrupt:
        pass
    finally:
        gateway.close()
        connector.close()
        if restore is not None:
            restore()
    print("pipwerk-fetch-mt5 serve: beendet.", file=out)
    return EXIT_OK


def _end_on_signal(stop: threading.Event) -> Callable[[], None]:
    """Set ``stop`` when the process gets SIGINT or SIGTERM; return the call that undoes it.

    Only in the main thread (elsewhere a handler cannot be installed)."""
    if threading.current_thread() is not threading.main_thread():
        return lambda: None

    def handle(_number: int, _frame: FrameType | None) -> None:
        stop.set()

    previous = {number: signal.signal(number, handle) for number in (signal.SIGINT, signal.SIGTERM)}

    def restore() -> None:
        for number, handler in previous.items():
            signal.signal(number, handler)

    return restore


# --- request ------------------------------------------------------------------------------------


def _printable(text: str) -> str:
    return "".join(character if character.isprintable() else "?" for character in text)[:80]


def _content(args: argparse.Namespace) -> FetchRequestContent:
    units = parse_time_units(args.time_units)
    start, end = parse_moment(args.start), parse_moment(args.end)
    if not start < end:
        raise CallError("--from must lie before --to.")
    instrument: str | None = None
    if args.instrument is not None:
        instrument = check_instruments([args.instrument])[0]
    elif INSTRUMENT_PATTERN.fullmatch(args.symbol) is None:
        raise CallError(
            f"The symbol '{_printable(args.symbol)}' cannot be the designation of the files: "
            "name one with --instrument (1 to 64 letters, digits and . _ # + - , starting with a "
            "letter or a digit)."
        )
    names: list[TimeUnitName] = [_unit_name(unit) for unit in units]
    try:
        return FetchRequestContent.of(
            broker=args.broker,
            symbol=args.symbol,
            instrument=instrument,
            time_units=names,
            ticks=bool(args.ticks),
            start=start,
            end=end,
        )
    except ValidationError as error:
        entries = ", ".join(
            dict.fromkeys(
                ".".join(str(part) for part in item["loc"]) or "request" for item in error.errors()
            )
        )
        raise CallError(f"The request is not valid (check: {entries}).") from None


def _unit_name(unit: str) -> TimeUnitName:
    # parse_time_units only returns the 21 units, so the upper case name is one of TimeUnitName.
    return cast(TimeUnitName, unit.upper())


def _request(
    arguments: Sequence[str],
    *,
    clock: Callable[[], datetime] | None,
    out: TextIO,
    err: TextIO,
    hooks: RelayHooks,
) -> int:
    args = build_request_parser().parse_args(arguments)
    directory = Path(args.directory)
    try:
        if args.wait < 1:
            raise CallError("--wait must be at least 1 minute.")
        wait = timedelta(minutes=args.wait)
        content = _content(args)
        Address.parse(args.address)
        settings = load_relay_settings(args.config_path)
        connector = open_connector(settings, clock=clock)
        try:
            prepare_directory(directory)  # only now: nothing is created for an invalid call
        except CallError:
            connector.close()
            raise
    except AddressError:
        print(
            "pipwerk-fetch-mt5: --address is not an address <component>.<network>.<relay>.",
            file=err,
        )
        return EXIT_INVALID_CALL
    except OverflowError:
        print("pipwerk-fetch-mt5: --wait is too large.", file=err)
        return EXIT_INVALID_CALL
    except (CallError, StartupConfigError, RelayStartError) as error:
        print(f"pipwerk-fetch-mt5: {error}", file=err)
        return EXIT_INVALID_CALL
    logging.basicConfig(level=logging.WARNING, format="%(levelname)s %(name)s: %(message)s")
    interval = hooks.poll_interval or float(settings.poll_interval_seconds)
    try:
        return run_request(
            connector,
            content,
            retrieval=args.address,
            directory=directory,
            wait=wait,
            interval=interval,
            monotonic=hooks.monotonic or time.monotonic,
            sleep=hooks.sleep or time.sleep,
            out=out,
            err=err,
        )
    except KeyboardInterrupt:
        print("Abgebrochen.", file=err)
        return EXIT_FAILED
    finally:
        connector.close()
