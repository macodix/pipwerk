"""The own interface to MetaTrader 5 (specification backtest 10, order 03 point 3).

All access to the package ``MetaTrader5`` goes through ``TerminalGateway``. The program
(``service.py``) knows only this interface, so the tests use a replica: ``mt5_gateway.py``
translates the interface to the real package, ``fake_source.py`` implements it with
deterministic data.

Times at this interface are **server times**: naive ``datetime`` values (no ``tzinfo``) in the
wall clock of the broker, exactly as MetaTrader 5 delivers them. The conversion to UTC is the
job of the program (``timeconv.py``), not of the gateway.

A gateway method that cannot do its job raises ``FetchError`` with one of the codes
``terminal_unavailable``, ``broker_error`` or ``no_data``. It never puts a detail of the
connection (login, password, path) into the error.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Literal, Protocol

#: The time units of MetaTrader 5, written like the field ``time_unit`` of the files of the
#: import (``contracts/market-data/v1``): lower case. The package names them ``TIMEFRAME_M1``
#: and so on; ``mt5_gateway.py`` makes the name.
TimeUnit = Literal[
    "m1",
    "m2",
    "m3",
    "m4",
    "m5",
    "m6",
    "m10",
    "m12",
    "m15",
    "m20",
    "m30",
    "h1",
    "h2",
    "h3",
    "h4",
    "h6",
    "h8",
    "h12",
    "d1",
    "w1",
    "mn1",
]

#: Nominal duration of a time unit in minutes (a month counts 30 days; used only to estimate
#: the number of candles of a period).
TIME_UNIT_MINUTES: dict[str, int] = {
    "m1": 1,
    "m2": 2,
    "m3": 3,
    "m4": 4,
    "m5": 5,
    "m6": 6,
    "m10": 10,
    "m12": 12,
    "m15": 15,
    "m20": 20,
    "m30": 30,
    "h1": 60,
    "h2": 120,
    "h3": 180,
    "h4": 240,
    "h6": 360,
    "h8": 480,
    "h12": 720,
    "d1": 1440,
    "w1": 10080,
    "mn1": 43200,
}

Weekday = Literal["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


@dataclass(frozen=True)
class RawCandle:
    """A candle as the broker delivers it; ``time`` is the open time in server time.
    ``volume`` is the tick volume; ``spread`` is in points, ``None`` if not delivered."""

    time: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    spread: int | None


@dataclass(frozen=True)
class RawTick:
    """A tick; ``time`` is the time in server time with milliseconds."""

    time: datetime
    bid: float
    ask: float


@dataclass(frozen=True)
class RawSession:
    """A trading session of a weekday in server time, as ``HH:MM`` (``24:00`` for midnight)."""

    weekday: Weekday
    start: str
    end: str


@dataclass(frozen=True)
class SymbolInfo:
    """The details MetaTrader 5 delivers about a symbol.

    ``spread`` is the current spread in points. ``tick_value`` is the value of one tick in
    ``tick_value_currency`` (the profit currency of the symbol), per lot. ``margin_initial``
    is the initial margin per lot in ``margin_currency`` as the symbol gives it (0 if the
    broker gives none). ``swap_mode`` is the number of ``ENUM_SYMBOL_SWAP_MODE`` and says in
    which unit ``swap_long`` and ``swap_short`` are given. ``triple_swap_weekday`` is the
    weekday of the triple swap.
    """

    tick_size: float
    tick_value: float
    tick_value_currency: str
    point: float
    digits: int
    spread: int
    min_volume: float
    volume_step: float
    contract_size: float
    swap_long: float
    swap_short: float
    swap_mode: int
    triple_swap_weekday: Weekday
    margin_initial: float
    margin_currency: str


class TerminalGateway(Protocol):
    """Everything the program needs from MetaTrader 5."""

    def ping(self) -> None:
        """Return if MetaTrader 5 is reachable and connected to its trade server; raise
        ``FetchError("terminal_unavailable")`` otherwise."""
        ...

    def server_name(self) -> str | None:
        """The name of the trade server (the broker), or ``None`` if there is none."""
        ...

    def symbol(self, symbol: str) -> SymbolInfo | None:
        """The details of a symbol, or ``None`` if the broker does not know the symbol."""
        ...

    def select(self, symbol: str) -> None:
        """Make the symbol available for reading data."""
        ...

    def candles(
        self, symbol: str, time_unit: TimeUnit, start: datetime, end: datetime
    ) -> list[RawCandle]:
        """The candles whose open time lies in ``[start, end)`` (server time). The result may
        contain more candles near the limits; the caller keeps only the ones it needs."""
        ...

    def ticks(self, symbol: str, start: datetime, end: datetime) -> list[RawTick]:
        """The ticks with a time in ``[start, end)`` (server time), same rule as for candles."""
        ...

    def sessions(self, symbol: str) -> list[RawSession]:
        """The weekly trading sessions of the symbol in server time if the source delivers
        them, else an empty list."""
        ...

    def margin_per_lot(self, symbol: str) -> float | None:
        """The margin for one lot in the margin currency, calculated by the terminal, or
        ``None`` if it cannot be determined."""
        ...
