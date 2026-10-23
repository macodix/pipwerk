"""Doubles and helpers shared by the tests.

``ScriptedGateway`` is a ``TerminalGateway`` whose rows the test writes down; it records the
reads. ``FakeMt5Module`` is a replica of the package ``MetaTrader5`` (the functions and
constants the program uses) for the tests of ``Mt5Gateway`` and of the whole program.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from types import MappingProxyType
from typing import Any

from pipwerk_fetch_mt5.config import StartupConfig
from pipwerk_fetch_mt5.errors import FetchError
from pipwerk_fetch_mt5.gateway import (
    RawCandle,
    RawSession,
    RawTick,
    SymbolInfo,
    TimeUnit,
)

EURUSD = SymbolInfo(
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
)


def make_config(**changes: Any) -> StartupConfig:
    values: dict[str, Any] = {"server_time_zone": "UTC", "symbols": MappingProxyType({})}
    values.update(changes)
    return StartupConfig(**values)


def utc(
    year: int, month: int, day: int, hour: int = 0, minute: int = 0, second: int = 0
) -> datetime:
    return datetime(year, month, day, hour, minute, second, tzinfo=UTC)


def naive(
    year: int, month: int, day: int, hour: int = 0, minute: int = 0, second: int = 0
) -> datetime:
    return datetime(year, month, day, hour, minute, second)


def candle(moment: datetime, price: float = 1.1, spread: int | None = 10) -> RawCandle:
    return RawCandle(
        time=moment,
        open=price,
        high=price + 0.001,
        low=price - 0.001,
        close=price + 0.0005,
        volume=100,
        spread=spread,
    )


def tick(moment: datetime, bid: float = 1.1, ask: float = 1.1001) -> RawTick:
    return RawTick(time=moment, bid=bid, ask=ask)


@dataclass
class ScriptedGateway:
    """A gateway whose data the test writes down.

    With ``return_all`` it returns all rows whatever the window is (the gateway may return
    more than asked); otherwise only the rows in ``[start, end)``.
    """

    symbols: dict[str, SymbolInfo] = field(default_factory=lambda: {"EURUSD": EURUSD})
    candle_rows: list[RawCandle] = field(default_factory=list)
    tick_rows: list[RawTick] = field(default_factory=list)
    session_rows: list[RawSession] = field(default_factory=list)
    margin: float | None = None
    server: str | None = "Test-Server"
    return_all: bool = False
    available: bool = True
    candle_calls: list[tuple[str, str, datetime, datetime]] = field(default_factory=list)
    tick_calls: list[tuple[str, datetime, datetime]] = field(default_factory=list)
    selected: list[str] = field(default_factory=list)

    def ping(self) -> None:
        if not self.available:
            raise FetchError("terminal_unavailable")

    def server_name(self) -> str | None:
        return self.server

    def symbol(self, symbol: str) -> SymbolInfo | None:
        return self.symbols.get(symbol)

    def select(self, symbol: str) -> None:
        self.selected.append(symbol)

    def candles(
        self, symbol: str, time_unit: TimeUnit, start: datetime, end: datetime
    ) -> list[RawCandle]:
        self.candle_calls.append((symbol, time_unit, start, end))
        if self.return_all:
            return list(self.candle_rows)
        return [row for row in self.candle_rows if start <= row.time < end]

    def ticks(self, symbol: str, start: datetime, end: datetime) -> list[RawTick]:
        self.tick_calls.append((symbol, start, end))
        if self.return_all:
            return list(self.tick_rows)
        return [row for row in self.tick_rows if start <= row.time < end]

    def sessions(self, symbol: str) -> list[RawSession]:
        return list(self.session_rows)

    def margin_per_lot(self, symbol: str) -> float | None:
        return self.margin


def minutes(start: datetime, count: int, step: int = 1) -> list[datetime]:
    return [start + timedelta(minutes=step * number) for number in range(count)]


# --- replica of the package MetaTrader5 -------------------------------------------------------


class _Info:
    """An object with attributes, like the named tuples of the package."""

    def __init__(self, **values: Any) -> None:
        self.__dict__.update(values)


class FakeMt5Module:
    """The functions and constants of ``MetaTrader5`` that ``Mt5Gateway`` uses.

    The tests set the attributes ``terminal``, ``account``, ``symbols``, ``rates``,
    ``tick_rows``, ``margin`` and ``error`` to what MetaTrader 5 should deliver; ``calls``
    records the calls with their arguments.
    """

    TIMEFRAME_M1 = 1
    TIMEFRAME_M2 = 2
    TIMEFRAME_M3 = 3
    TIMEFRAME_M4 = 4
    TIMEFRAME_M5 = 5
    TIMEFRAME_M6 = 6
    TIMEFRAME_M10 = 10
    TIMEFRAME_M12 = 12
    TIMEFRAME_M15 = 15
    TIMEFRAME_M20 = 20
    TIMEFRAME_M30 = 30
    TIMEFRAME_H1 = 16385
    TIMEFRAME_H2 = 16386
    TIMEFRAME_H3 = 16387
    TIMEFRAME_H4 = 16388
    TIMEFRAME_H6 = 16390
    TIMEFRAME_H8 = 16392
    TIMEFRAME_H12 = 16396
    TIMEFRAME_D1 = 16408
    TIMEFRAME_W1 = 32769
    TIMEFRAME_MN1 = 49153
    COPY_TICKS_INFO = 1
    ORDER_TYPE_BUY = 0

    def __init__(self) -> None:
        self.calls: list[tuple[str, tuple[Any, ...], dict[str, Any]]] = []
        self.initialize_result = True
        self.terminal: Any = _Info(connected=True)
        self.account: Any = _Info(server="Broker-Live-1")
        self.symbols: dict[str, Any] = {}
        self.selectable = True
        self.rates: Any = []
        self.tick_rows: Any = []
        self.tick: Any = _Info(ask=1.1002)
        self.margin: float | None = 1234.5
        self.error: tuple[int, str] = (1, "Success")
        self.shutdowns = 0

    def _record(self, name: str, *args: Any, **kwargs: Any) -> None:
        self.calls.append((name, args, kwargs))

    def names(self) -> list[str]:
        return [name for name, _args, _kwargs in self.calls]

    def initialize(self, **kwargs: Any) -> bool:
        self._record("initialize", **kwargs)
        return self.initialize_result

    def shutdown(self) -> None:
        self._record("shutdown")
        self.shutdowns += 1

    def last_error(self) -> tuple[int, str]:
        return self.error

    def terminal_info(self) -> Any:
        self._record("terminal_info")
        return self.terminal

    def account_info(self) -> Any:
        self._record("account_info")
        return self.account

    def symbol_info(self, symbol: str) -> Any:
        self._record("symbol_info", symbol)
        return self.symbols.get(symbol)

    def symbol_select(self, symbol: str, enable: bool) -> bool:
        self._record("symbol_select", symbol, enable)
        return self.selectable

    def copy_rates_range(self, symbol: str, timeframe: int, start: datetime, end: datetime) -> Any:
        self._record("copy_rates_range", symbol, timeframe, start, end)
        return self.rates

    def copy_ticks_range(self, symbol: str, start: datetime, end: datetime, flags: int) -> Any:
        self._record("copy_ticks_range", symbol, start, end, flags)
        return self.tick_rows

    def symbol_info_tick(self, symbol: str) -> Any:
        self._record("symbol_info_tick", symbol)
        return self.tick

    def order_calc_margin(self, action: int, symbol: str, volume: float, price: float) -> Any:
        self._record("order_calc_margin", action, symbol, volume, price)
        return self.margin


class ArchiveMt5Module(FakeMt5Module):
    """A replica of ``MetaTrader5`` that holds data for symbols and answers like the package
    for a window: ``copy_rates_range`` and ``copy_ticks_range`` return the rows whose time lies
    in ``[start, end]`` (the end is included, as the package does). Times are the seconds of
    the server clock; the datetimes passed in carry them as if they were UTC.

    ``candle_seconds[symbol]`` are the open times of the candles, ``tick_milliseconds[symbol]``
    the times of the ticks. The same candle times serve every time unit. A symbol in
    ``failing`` makes the calls for data return ``None`` with error -2 (not "not found").
    """

    def __init__(self) -> None:
        super().__init__()
        self.symbols = {"EURUSD": symbol_record(), "GBPUSD": symbol_record()}
        self.candle_seconds: dict[str, list[int]] = {}
        self.tick_milliseconds: dict[str, list[int]] = {}
        self.failing: set[str] = set()

    def copy_rates_range(self, symbol: str, timeframe: int, start: datetime, end: datetime) -> Any:
        self._record("copy_rates_range", symbol, timeframe, start, end)
        if symbol in self.failing:
            self.error = (-2, "Invalid arguments")
            return None
        first, last = int(start.timestamp()), int(end.timestamp())
        return rates_rows(
            [second for second in self.candle_seconds.get(symbol, []) if first <= second <= last]
        )

    def copy_ticks_range(self, symbol: str, start: datetime, end: datetime, flags: int) -> Any:
        self._record("copy_ticks_range", symbol, start, end, flags)
        if symbol in self.failing:
            self.error = (-2, "Invalid arguments")
            return None
        first, last = int(start.timestamp() * 1000), int(end.timestamp() * 1000)
        return [
            {"time_msc": millisecond, "bid": 1.1, "ask": 1.1002}
            for millisecond in self.tick_milliseconds.get(symbol, [])
            if first <= millisecond <= last
        ]


def server_seconds(moment: datetime) -> int:
    """The seconds of the server clock for a naive server time."""
    return int((moment - datetime(1970, 1, 1)).total_seconds())


def symbol_record(**changes: Any) -> Any:
    """The record ``symbol_info`` returns, with the attribute names of the package."""
    values: dict[str, Any] = {
        "trade_tick_size": 0.00001,
        "trade_tick_value_profit": 1.0,
        "currency_profit": "USD",
        "point": 0.00001,
        "digits": 5,
        "spread": 12,
        "volume_min": 0.01,
        "volume_step": 0.01,
        "trade_contract_size": 100000.0,
        "swap_long": -6.5,
        "swap_short": 1.2,
        "swap_mode": 1,
        "swap_rollover3days": 3,
        "margin_initial": 0.0,
        "currency_margin": "EUR",
    }
    values.update(changes)
    return _Info(**values)


def rates_rows(seconds: Sequence[int]) -> list[dict[str, Any]]:
    """Rows of ``copy_rates_range`` (the package returns a structured array, a row is read
    by field name like a dictionary)."""
    return [
        {
            "time": second,
            "open": 1.1,
            "high": 1.2,
            "low": 1.0,
            "close": 1.15,
            "tick_volume": 7,
            "spread": 9,
            "real_volume": 0,
        }
        for second in seconds
    ]
