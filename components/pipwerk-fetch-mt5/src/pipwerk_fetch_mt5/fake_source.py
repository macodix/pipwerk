"""A replica of the source with the same interface, for the tests of other components.

pipwerk replay (and anything else that talks to a source) tests against this module instead of
a real MetaTrader 5. It is the real program with a replica of MetaTrader 5 underneath: the
same HTTP interface (``contracts/api/pipwerk-fetch/v1/openapi.json``), the same checks of the
shared key, the ``Host`` header and the size, the same errors, the same files. Only the data
come from ``FakeGateway`` instead of the terminal. Use:

- ``create_fake_source_app(...)``: the ASGI application, for ``fastapi.testclient.TestClient``
  or ``httpx`` with an ASGI transport (no network, no port).
- ``python -m pipwerk_fetch_mt5.fake_source --port 8766``: the same application as a program on
  a port, for tests that need a real connection (end-to-end tests).

The data are fixed and deterministic: the same request gives the same bytes on every run and
every machine, with no clock and no random numbers. Instruments ``EURUSD``, ``GBPUSD`` and
``USDJPY``; every other designation is unknown to the replica (``symbol_unknown``). The
description of the data is in ``docs/technical/pipwerk-fetch-mt5.md``, section "Nachgebildete
Quelle", and in ``components/pipwerk-fetch-mt5/README.md``.

The data of the replica:

- Candles of every time unit of MetaTrader 5, aligned like the real ones (minutes, hours and
  days to the server day, weeks to Sunday, months to the first day), prices with five digits
  (``USDJPY`` the same prices, the details say three digits). No candle opens on the weekend
  from Friday 22:00 to Sunday 22:00 (server time); days open Monday to Friday. The candles of
  different time units are not consistent with each other (an ``H1`` candle is not the
  combination of its ``M1`` candles).
- Ticks about every 1.5 seconds with milliseconds, bid and ask, none on the weekend.
- Details of the instrument: contract size, swap, margin. The files of candles and ticks carry
  the trading hours (Sunday 22:00 to Friday 22:00 server time, given in UTC) as long as the
  server time zone of the replica has no summer time; the default zone ``UTC`` has none. With a
  zone that has summer time the files carry no trading hours, like those of the real program.

Errors on request: ``FakeGateway.available = False`` makes the replica answer
``terminal_unavailable`` everywhere; ``FakeGateway.fail(symbol, code, kinds)`` makes reading
candles, ticks or the details of that symbol fail with ``broker_error``, ``no_data`` or
``terminal_unavailable``. An unknown designation gives ``symbol_unknown``, a small
``max_rows`` gives ``range_too_large``, a wrong key gives ``unauthorized``.
"""

from __future__ import annotations

import argparse
import sys
from collections.abc import Callable, Mapping, Sequence
from datetime import datetime, timedelta
from types import MappingProxyType

import uvicorn
from fastapi import FastAPI

from pipwerk_fetch_mt5.app import create_app
from pipwerk_fetch_mt5.config import StartupConfig
from pipwerk_fetch_mt5.errors import ErrorCode, FetchError
from pipwerk_fetch_mt5.gateway import (
    TIME_UNIT_MINUTES,
    RawCandle,
    RawSession,
    RawTick,
    SymbolInfo,
    TimeUnit,
    Weekday,
)
from pipwerk_fetch_mt5.service import FetchService

#: The shared key of the replica. A value for tests, no secret.
FAKE_SHARED_KEY = "fake-source-test-key-not-a-secret"

#: The name of the broker in the files of the replica.
FAKE_BROKER = "Fake-Broker-Demo"

#: Names allowed in the ``Host`` header of the replica in addition to the defaults:
#: ``testserver`` is the name the test client of FastAPI sends, ``*ip`` every IP address.
FAKE_ALLOWED_HOSTS = ("testserver", "*ip")

KINDS = ("candles", "ticks", "instrument")

_EPOCH = datetime(1970, 1, 1)
_TICK_SPACING_MS = 1500
_WEEKDAYS: tuple[Weekday, ...] = (
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
)

DEFAULT_SYMBOLS: Mapping[str, SymbolInfo] = MappingProxyType(
    {
        "EURUSD": SymbolInfo(
            tick_size=0.00001,
            tick_value=1.0,
            tick_value_currency="USD",
            point=0.00001,
            digits=5,
            spread=12,
            min_volume=0.01,
            volume_step=0.01,
            contract_size=100000.0,
            swap_long=-6.5,
            swap_short=1.2,
            swap_mode=1,
            triple_swap_weekday="wednesday",
            margin_initial=0.0,
            margin_currency="EUR",
        ),
        "GBPUSD": SymbolInfo(
            tick_size=0.00001,
            tick_value=1.0,
            tick_value_currency="USD",
            point=0.00001,
            digits=5,
            spread=15,
            min_volume=0.01,
            volume_step=0.01,
            contract_size=100000.0,
            swap_long=-4.25,
            swap_short=0.5,
            swap_mode=1,
            triple_swap_weekday="wednesday",
            margin_initial=1300.0,
            margin_currency="GBP",
        ),
        "USDJPY": SymbolInfo(
            tick_size=0.001,
            tick_value=0.65,
            tick_value_currency="JPY",
            point=0.001,
            digits=3,
            spread=18,
            min_volume=0.01,
            volume_step=0.01,
            contract_size=100000.0,
            swap_long=3.1,
            swap_short=-9.0,
            swap_mode=1,
            triple_swap_weekday="friday",
            margin_initial=0.0,
            margin_currency="USD",
        ),
    }
)

#: The margin for one lot that the replica calculates (like ``order_calc_margin``); ``None``
#: for a symbol without an entry: the margin the symbol itself states counts then (``GBPUSD``
#: 1300; ``USDJPY`` states none, so the margin of its details is empty).
DEFAULT_MARGINS: Mapping[str, float | None] = MappingProxyType({"EURUSD": 1100.0})

DEFAULT_SESSIONS: tuple[RawSession, ...] = (
    *(RawSession(day, "00:00", "24:00") for day in _WEEKDAYS[:4]),
    RawSession("friday", "00:00", "22:00"),
    RawSession("sunday", "22:00", "24:00"),
)


def _minute_index(moment: datetime) -> int:
    return int((moment - _EPOCH).total_seconds() // 60)


def _points(index: int) -> int:
    """The price in points (five digits) at a minute of the server clock."""
    return 110_000 + (index * 7919) % 400 - 200 + (index // 1440) % 50


def _is_closed(moment: datetime) -> bool:
    """The weekend: Friday 22:00 to Sunday 22:00 server time."""
    weekday = moment.weekday()
    return (
        weekday == 5 or (weekday == 4 and moment.hour >= 22) or (weekday == 6 and moment.hour < 22)
    )


def _bar_opens(time_unit: TimeUnit, start: datetime, end: datetime) -> list[datetime]:
    """The open times of the bars of a time unit in ``[start, end)``."""
    opens: list[datetime] = []
    if time_unit == "mn1":
        year, month = start.year, start.month
        while True:
            moment = datetime(year, month, 1)
            if moment >= end:
                break
            if moment >= start:
                opens.append(moment)
            year, month = (year + 1, 1) if month == 12 else (year, month + 1)
        return opens
    if time_unit == "w1":
        first_sunday = _EPOCH + timedelta(days=3)  # 1970-01-04 was a Sunday
        weeks = -((first_sunday - start) // timedelta(weeks=1))  # rounded up
        moment = first_sunday + timedelta(weeks=weeks)
        while moment < end:
            opens.append(moment)
            moment += timedelta(weeks=1)
        return opens
    step = timedelta(minutes=TIME_UNIT_MINUTES[time_unit])
    steps = -((_EPOCH - start) // step)  # rounded up
    moment = _EPOCH + steps * step
    while moment < end:
        closed = moment.weekday() >= 5 if time_unit == "d1" else _is_closed(moment)
        if not closed:
            opens.append(moment)
        moment += step
    return opens


def _month_length_minutes(moment: datetime) -> int:
    following = (
        datetime(moment.year + 1, 1, 1)
        if moment.month == 12
        else datetime(moment.year, moment.month + 1, 1)
    )
    return int((following - moment).total_seconds() // 60)


class FakeGateway:
    """``TerminalGateway`` with deterministic data (see the module description)."""

    def __init__(
        self,
        symbols: Mapping[str, SymbolInfo] = DEFAULT_SYMBOLS,
        *,
        server: str | None = FAKE_BROKER,
        sessions: Sequence[RawSession] = DEFAULT_SESSIONS,
        margins: Mapping[str, float | None] = DEFAULT_MARGINS,
    ) -> None:
        self.symbols = dict(symbols)
        self.server = server
        self.session_times = tuple(sessions)
        self.margins = dict(margins)
        #: ``False`` makes the replica answer ``terminal_unavailable`` everywhere.
        self.available = True
        self._failures: dict[str, tuple[ErrorCode, tuple[str, ...]]] = {}

    def fail(self, symbol: str, code: ErrorCode, kinds: Sequence[str] = KINDS) -> None:
        """Make reading ``kinds`` (candles, ticks, instrument) of ``symbol`` fail with the
        error ``code`` (``broker_error``, ``no_data`` or ``terminal_unavailable``)."""
        unknown = set(kinds) - set(KINDS)
        if unknown or code not in ("broker_error", "no_data", "terminal_unavailable"):
            raise ValueError("unknown kind or error code")
        self._failures[symbol] = (code, tuple(kinds))

    def clear_failures(self) -> None:
        self._failures.clear()

    def _check_failure(self, symbol: str, kind: str) -> None:
        failure = self._failures.get(symbol)
        if failure is not None and kind in failure[1]:
            raise FetchError(failure[0])

    # --- TerminalGateway -------------------------------------------------------------------

    def ping(self) -> None:
        if not self.available:
            raise FetchError("terminal_unavailable")

    def server_name(self) -> str | None:
        return self.server

    def symbol(self, symbol: str) -> SymbolInfo | None:
        return self.symbols.get(symbol)

    def select(self, symbol: str) -> None:
        return None

    def candles(
        self, symbol: str, time_unit: TimeUnit, start: datetime, end: datetime
    ) -> list[RawCandle]:
        self._check_failure(symbol, "candles")
        result: list[RawCandle] = []
        for opened in _bar_opens(time_unit, start, end):
            minutes = (
                _month_length_minutes(opened)
                if time_unit == "mn1"
                else 10080
                if time_unit == "w1"
                else TIME_UNIT_MINUTES[time_unit]
            )
            index = _minute_index(opened)
            first, last = _points(index), _points(index + minutes - 1)
            high = max(first, last) + 3 + index % 5
            low = min(first, last) - 3 - index % 7
            result.append(
                RawCandle(
                    time=opened,
                    open=first / 100_000,
                    high=high / 100_000,
                    low=low / 100_000,
                    close=last / 100_000,
                    volume=100 + index % 90,
                    spread=10 + index % 5,
                )
            )
        return result

    def ticks(self, symbol: str, start: datetime, end: datetime) -> list[RawTick]:
        self._check_failure(symbol, "ticks")
        first_ms = int((start - _EPOCH) / timedelta(milliseconds=1))
        last_ms = int((end - _EPOCH) / timedelta(milliseconds=1))
        result: list[RawTick] = []
        for number in range(
            max(first_ms // _TICK_SPACING_MS - 1, 0), last_ms // _TICK_SPACING_MS + 2
        ):
            milliseconds = number * _TICK_SPACING_MS + (number * 7919) % 500
            moment = _EPOCH + timedelta(milliseconds=milliseconds)
            if not start <= moment < end or _is_closed(moment):
                continue
            bid = _points(milliseconds // 60_000) + (number * 13) % 7
            result.append(
                RawTick(time=moment, bid=bid / 100_000, ask=(bid + 1 + number % 4) / 100_000)
            )
        return result

    def sessions(self, symbol: str) -> list[RawSession]:
        return list(self.session_times)

    def margin_per_lot(self, symbol: str) -> float | None:
        # Only the details of an instrument ask for it (kind "instrument").
        self._check_failure(symbol, "instrument")
        return self.margins.get(symbol)


def create_fake_source_app(
    shared_key: str = FAKE_SHARED_KEY,
    *,
    gateway: FakeGateway | None = None,
    time_zone: str = "UTC",
    max_rows: int = 50_000,
    broker_name: str | None = None,
    symbols: Mapping[str, str] | None = None,
    allowed_hosts: Sequence[str] = FAKE_ALLOWED_HOSTS,
    clock: Callable[[], datetime] | None = None,
) -> FastAPI:
    """The replica of the source as an ASGI application.

    ``gateway`` lets a test switch errors on (``fail``, ``available``); ``time_zone`` is the
    server time zone of the replica's broker (IANA name); ``max_rows`` the largest number of
    rows of an answer; ``broker_name`` overrides the name of the broker; ``symbols`` is the
    table designation -> symbol. ``clock`` gives ``retrieved_at`` of the details (a function
    that returns an aware datetime); without it the real time is used, so a test that compares
    whole answers sets it.
    """
    config = StartupConfig(
        server_time_zone=time_zone,
        shared_key=shared_key,
        broker_name=broker_name,
        max_rows=max_rows,
        symbols=MappingProxyType(dict(symbols or {})),
    )
    service = FetchService(gateway or FakeGateway(), config, clock=clock)
    return create_app(service, shared_key=shared_key, allowed_hosts=allowed_hosts)


def main(argv: Sequence[str] | None = None) -> int:
    """Run the replica as a program on a port."""
    parser = argparse.ArgumentParser(
        prog="python -m pipwerk_fetch_mt5.fake_source",
        description="Run the replica of the source (deterministic data, for tests).",
    )
    parser.add_argument("--host", default="127.0.0.1", help="Bind address (default: 127.0.0.1).")
    parser.add_argument("--port", type=int, default=8766, help="Bind port (default: 8766).")
    parser.add_argument(
        "--key",
        default=FAKE_SHARED_KEY,
        help="Shared key of the replica (default: the test key of this module).",
    )
    parser.add_argument("--time-zone", default="UTC", help="Server time zone (IANA name).")
    parser.add_argument("--max-rows", type=int, default=50_000, help="Rows per answer.")
    args = parser.parse_args(argv)
    app = create_fake_source_app(
        args.key,
        time_zone=args.time_zone,
        max_rows=args.max_rows,
        allowed_hosts=("*ip",),
    )
    uvicorn.run(app, host=args.host, port=args.port, server_header=False)
    return 0


if __name__ == "__main__":
    sys.exit(main())
