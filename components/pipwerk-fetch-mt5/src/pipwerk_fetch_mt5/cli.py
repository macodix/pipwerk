"""Command line of pipwerk-fetch-mt5 (specification backtest 5.4).

The program is called on the machine of MetaTrader 5, writes the files and ends. It has no
server and opens no port.

    pipwerk-fetch-mt5 [-c <PATH>] --from <FROM> --to <TO> [-u <UNITS>] [--ticks]
                      [-o <DIRECTORY>] <INSTRUMENT> [<INSTRUMENT> ...]

Exit code 0: every file was written. 1: at least one part could not be fetched (the other
files were written, every failed part is named with its reason on the error output). 2: the
call or the startup configuration is invalid; nothing was fetched. 130: interrupted (Ctrl+C
or a request to end); the files finished so far stay, no temporary file is left.

``main`` takes ``module`` (a replica of the package ``MetaTrader5``) and ``clock`` for the
tests; a real call passes neither.
"""

from __future__ import annotations

import argparse
import contextlib
import logging
import signal
import sys
from collections import Counter
from collections.abc import Callable, Iterator, Sequence
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, TextIO, cast

from pipwerk_fetch_mt5.config import StartupConfigError, load_startup_config
from pipwerk_fetch_mt5.errors import FetchError
from pipwerk_fetch_mt5.fetch import CONTRACT, TICKS, PartOutcome, Request, fetch
from pipwerk_fetch_mt5.files import INSTRUMENT_PATTERN, remove_stale_temporaries
from pipwerk_fetch_mt5.gateway import TIME_UNIT_MINUTES, TimeUnit
from pipwerk_fetch_mt5.mt5_gateway import Mt5Gateway
from pipwerk_fetch_mt5.service import FetchService

EXIT_OK = 0
EXIT_PARTS_FAILED = 1
EXIT_INVALID_CALL = 2
EXIT_INTERRUPTED = 130

#: The periods the files of the import can hold (``pipwerk_marketdata.limits``).
_FIRST_YEAR = 1970
_LAST_YEAR = 2100

#: How many omitted rows the summary names per file.
_NAMED_OMISSIONS = 5

_OMISSION_TEXTS = {
    "time_does_not_exist": "Uhrzeit des Servers gab es nicht (Umstellung auf Sommerzeit)",
    "double_local_time": "zweite Stunde der doppelten Uhrzeit (Rückstellung der Uhr)",
    "duplicate_time": "Kerze mit der Zeit der vorigen",
    "invalid_price": "Kurs nicht größer als null",
}


class CallError(Exception):
    """An invalid call; the text is shown to the user."""


def parse_moment(text: str) -> datetime:
    """A moment given as ISO 8601: ``2026-01-05`` (midnight), ``2026-01-05T10:30`` or
    ``2026-01-05T10:30:15``, optionally with ``Z`` or an offset such as ``+02:00``. Without a
    time zone the time is UTC. Fractions of a second are refused."""
    try:
        moment = datetime.fromisoformat(text.strip())
    except ValueError:
        raise CallError(
            f"'{text}' is not a date or a time (use 2026-01-05 or 2026-01-05T10:30)."
        ) from None
    if moment.microsecond:
        raise CallError(f"'{text}' has fractions of a second; use whole seconds.")
    moment = moment.replace(tzinfo=UTC) if moment.tzinfo is None else moment.astimezone(UTC)
    if not _FIRST_YEAR <= moment.year <= _LAST_YEAR:
        raise CallError(f"'{text}' is not between the years {_FIRST_YEAR} and {_LAST_YEAR}.")
    return moment


def parse_time_units(values: Sequence[str]) -> tuple[TimeUnit, ...]:
    """Time units as given (``H1`` or ``h1``, comma separated or repeated), without repeats."""
    units: list[TimeUnit] = []
    for value in values:
        for item in value.split(","):
            name = item.strip().lower()
            if not name:
                continue
            if name not in TIME_UNIT_MINUTES:
                raise CallError(
                    f"'{item.strip()}' is not a time unit of MetaTrader 5 "
                    f"({', '.join(unit.upper() for unit in TIME_UNIT_MINUTES)})."
                )
            unit = cast(TimeUnit, name)  # checked against the table above
            if unit not in units:
                units.append(unit)
    return tuple(units)


def check_instruments(values: Sequence[str]) -> tuple[str, ...]:
    """The designations of the instruments, without repeats. A designation becomes part of a
    file name, so it may hold only letters, digits and ``. _ # + -`` and must start with a
    letter or a digit."""
    instruments: list[str] = []
    for value in values:
        if INSTRUMENT_PATTERN.fullmatch(value) is None:
            raise CallError(
                f"The instrument '{_printable(value)}' is not allowed: use 1 to 64 letters, "
                "digits and . _ # + - , starting with a letter or a digit."
            )
        if value not in instruments:
            instruments.append(value)
    return tuple(instruments)


def _printable(text: str) -> str:
    return "".join(character if character.isprintable() else "?" for character in text)[:80]


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="pipwerk-fetch-mt5",
        description=(
            "Write candles, ticks and the details of instruments from MetaTrader 5 as JSON "
            "files for the import of pipwerk replay. Run it on the machine of MetaTrader 5, "
            "with MetaTrader 5 running and logged in. One file per instrument and series, "
            "named <INSTRUMENT>_<DATA>_<FROM>_<TO>.json; DATA is the time unit (M1, H1, ...), "
            "TICKS or CONTRACT. The details of every instrument (CONTRACT) are always written."
        ),
        epilog=(
            "Exit code 0: all files written. 1: at least one part could not be fetched (the "
            "other files are written). 2: invalid call or startup configuration."
        ),
    )
    parser.add_argument("instruments", nargs="+", metavar="INSTRUMENT", help="Designation(s).")
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
        help=(
            "Time unit(s) of the candles, for example H1 or M1,H1,D1; may be repeated. One of "
            + ", ".join(unit.upper() for unit in TIME_UNIT_MINUTES)
            + "."
        ),
    )
    parser.add_argument("--ticks", action="store_true", help="Also write the ticks.")
    parser.add_argument(
        "-o",
        "--output-dir",
        dest="directory",
        default=".",
        metavar="DIRECTORY",
        help=(
            "Directory the files are written to (created if missing); default: the current "
            "directory. A file of the same name is replaced."
        ),
    )
    parser.add_argument(
        "-c",
        "--config",
        dest="config_path",
        default=None,
        help=(
            "Path to the INI startup configuration. If omitted, the automatic search "
            "locations ($HOME/pipwerk/etc, $HOME/.config/pipwerk, /etc/pipwerk, or on Windows "
            "%%USERPROFILE%%\\pipwerk\\etc, %%APPDATA%%\\pipwerk, %%PROGRAMDATA%%\\pipwerk) "
            "are searched. pipwerk-fetch-mt5 does not run without a valid startup "
            "configuration."
        ),
    )
    return parser


def _request(args: argparse.Namespace) -> Request:
    instruments = check_instruments(args.instruments)
    time_units = parse_time_units(args.time_units)
    start, end = parse_moment(args.start), parse_moment(args.end)
    if not start < end:
        raise CallError("--from must lie before --to.")
    return Request(
        instruments=instruments,
        time_units=time_units,
        ticks=bool(args.ticks),
        start=start,
        end=end,
        directory=Path(args.directory),
    )


def _prepare_directory(directory: Path) -> None:
    """Create the target directory if it is missing."""
    try:
        directory.mkdir(parents=True, exist_ok=True)
    except OSError:
        raise CallError("The target directory cannot be created or is not a directory.") from None
    if not directory.is_dir():
        raise CallError("The target directory is not a directory.")


@contextlib.contextmanager
def _signals_as_interrupt() -> Iterator[None]:
    """Turn a request to end (SIGTERM, SIGHUP, and SIGBREAK on Windows) into a
    ``KeyboardInterrupt`` for the time of the call, so that the cleanup runs like for Ctrl+C.
    Outside the main thread nothing is changed."""
    names = ("SIGTERM", "SIGHUP", "SIGBREAK")
    numbers = [getattr(signal, name) for name in names if hasattr(signal, name)]

    def interrupt(_number: int, _frame: object) -> None:
        raise KeyboardInterrupt

    previous: dict[int, Any] = {}
    try:
        for number in numbers:
            previous[number] = signal.signal(number, interrupt)
    except ValueError, OSError:
        pass  # not the main thread, or not allowed here
    try:
        yield
    finally:
        for number, handler in previous.items():
            with contextlib.suppress(ValueError, OSError):
                signal.signal(number, handler)


def _moment_text(moment: datetime) -> str:
    return moment.astimezone(UTC).strftime("%Y-%m-%d %H:%M:%S UTC")


def _kind_text(data: str) -> str:
    if data == CONTRACT:
        return "Angaben zum Instrument (CONTRACT)"
    if data == TICKS:
        return "Ticks"
    return f"Kerzen {data}"


def _success_lines(outcome: PartOutcome, path: Path) -> list[str]:
    detail = _kind_text(outcome.part.data)
    if outcome.rows is not None:
        detail += f", {outcome.rows} Zeilen"
    if outcome.omitted_count:
        detail += f", {outcome.omitted_count} Zeilen ausgelassen"
    lines = [f"Geschrieben: {path.name} ({detail})"]
    reasons = Counter(row.reason for row in outcome.omitted)
    if outcome.omitted_count:
        for reason, count in reasons.items():
            shown = f"{count}x" if count < outcome.omitted_count else "alle"
            lines.append(f"  ausgelassen ({shown}): {_OMISSION_TEXTS[reason]}")
        for row in outcome.omitted[:_NAMED_OMISSIONS]:
            lines.append(f"  Serverzeit {row.server_time}: {_OMISSION_TEXTS[row.reason]}")
    return lines


def report(request: Request, outcomes: Sequence[PartOutcome], *, out: TextIO, err: TextIO) -> int:
    """Print the outcome of every part and a summary; return the exit code."""
    period = f"{_moment_text(request.start)} bis {_moment_text(request.end)}"
    written = 0
    failed: list[tuple[PartOutcome, FetchError]] = []
    for outcome in outcomes:
        if outcome.error is not None:
            failed.append((outcome, outcome.error))
        elif outcome.path is not None:
            written += 1
            for line in _success_lines(outcome, outcome.path):
                print(line, file=out)
    for outcome, error in failed:
        print(
            f"Fehler: {outcome.part.instrument}, {_kind_text(outcome.part.data)}, {period}: "
            f"{error.reason}",
            file=err,
        )
    if failed:
        print(
            f"{written} von {len(outcomes)} Dateien geschrieben, "
            f"{len(failed)} Teile nicht geholt (Exitcode {EXIT_PARTS_FAILED}).",
            file=err,
        )
        return EXIT_PARTS_FAILED
    print(f"{written} Dateien geschrieben nach {request.directory}.", file=out)
    return EXIT_OK


def main(
    argv: Sequence[str] | None = None,
    *,
    module: Any | None = None,
    clock: Callable[[], datetime] | None = None,
    out: TextIO | None = None,
    err: TextIO | None = None,
) -> int:
    out = out or sys.stdout
    err = err or sys.stderr
    args = build_parser().parse_args(argv)
    try:
        request = _request(args)
        config = load_startup_config(args.config_path)
        _prepare_directory(request.directory)
    except (CallError, StartupConfigError) as error:
        print(f"pipwerk-fetch-mt5: {error}", file=err)
        return EXIT_INVALID_CALL

    removed = remove_stale_temporaries(request.directory)
    if removed:
        print(f"Zwischendateien eines früheren Abbruchs entfernt: {removed}.", file=out)
    logging.basicConfig(level=logging.WARNING, format="%(levelname)s %(name)s: %(message)s")
    gateway = Mt5Gateway(config.metatrader, module)
    try:
        with _signals_as_interrupt():
            outcomes = fetch(FetchService(gateway, config, clock), request)
    except KeyboardInterrupt:
        print("Abgebrochen. Fertige Dateien bleiben, eine halbe Datei bleibt nicht.", file=err)
        return EXIT_INTERRUPTED
    finally:
        gateway.close()
    return report(request, outcomes, out=out, err=err)


if __name__ == "__main__":
    raise SystemExit(main())
