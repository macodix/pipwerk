"""A replica of the package ``MetaTrader5`` for the test environment of pipwerk relay.

``scripts/testenv`` puts the directory of this file on the search path of ``pipwerk-fetch-mt5
serve``, so that ``import MetaTrader5`` finds this module instead of the package, which exists
only for Windows. It offers the functions and constants that ``pipwerk-fetch-mt5`` uses and
delivers made-up, regular data:

- the symbols ``EURUSD``, ``GBPUSD`` and ``USDJPY``,
- candles at every full step of the time unit (counted from 1970-01-01 00:00:00), with the same
  prices in every row,
- one tick every ten seconds,
- the trade server named in the environment variable ``PIPWERK_TESTENV_BROKER``. The test
  environment sets it; the time zone of the server time is UTC.

The data are only for trying the transport through pipwerk relay. They are not market data.
"""

import os
from datetime import datetime
from typing import Any

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

_STEP_SECONDS = {
    TIMEFRAME_M1: 60,
    TIMEFRAME_M2: 120,
    TIMEFRAME_M3: 180,
    TIMEFRAME_M4: 240,
    TIMEFRAME_M5: 300,
    TIMEFRAME_M6: 360,
    TIMEFRAME_M10: 600,
    TIMEFRAME_M12: 720,
    TIMEFRAME_M15: 900,
    TIMEFRAME_M20: 1200,
    TIMEFRAME_M30: 1800,
    TIMEFRAME_H1: 3600,
    TIMEFRAME_H2: 7200,
    TIMEFRAME_H3: 10800,
    TIMEFRAME_H4: 14400,
    TIMEFRAME_H6: 21600,
    TIMEFRAME_H8: 28800,
    TIMEFRAME_H12: 43200,
    TIMEFRAME_D1: 86400,
    TIMEFRAME_W1: 604800,
    TIMEFRAME_MN1: 2592000,
}
_TICK_MILLISECONDS = 10_000
_SYMBOLS = ("EURUSD", "GBPUSD", "USDJPY")


class _Info:
    """An object with attributes, like the named tuples of the package."""

    def __init__(self, **values: Any) -> None:
        self.__dict__.update(values)


def initialize(**_arguments: Any) -> bool:
    return True


def shutdown() -> None:
    return None


def last_error() -> tuple[int, str]:
    return (1, "Success")


def terminal_info() -> _Info:
    return _Info(connected=True)


def account_info() -> _Info:
    return _Info(server=os.environ.get("PIPWERK_TESTENV_BROKER", "Testbroker"))


def symbol_info(symbol: str) -> _Info | None:
    if symbol not in _SYMBOLS:
        return None
    return _Info(
        trade_tick_size=0.00001,
        trade_tick_value_profit=1.0,
        currency_profit="USD",
        point=0.00001,
        digits=5,
        spread=12,
        volume_min=0.01,
        volume_step=0.01,
        trade_contract_size=100000.0,
        swap_long=-6.5,
        swap_short=1.2,
        swap_mode=1,
        swap_rollover3days=3,
        margin_initial=0.0,
        currency_margin="EUR",
    )


def symbol_select(symbol: str, enable: bool) -> bool:
    return symbol in _SYMBOLS and enable


def copy_rates_range(
    symbol: str, timeframe: int, start: datetime, end: datetime
) -> list[dict[str, Any]] | None:
    if symbol not in _SYMBOLS or timeframe not in _STEP_SECONDS:
        return None
    step = _STEP_SECONDS[timeframe]
    first, last = int(start.timestamp()), int(end.timestamp())
    moment = -(-first // step) * step  # the first full step at or after the start
    rows = []
    while moment <= last:
        rows.append(
            {
                "time": moment,
                "open": 1.1,
                "high": 1.2,
                "low": 1.0,
                "close": 1.15,
                "tick_volume": 7,
                "spread": 9,
                "real_volume": 0,
            }
        )
        moment += step
    return rows


def copy_ticks_range(
    symbol: str, start: datetime, end: datetime, flags: int
) -> list[dict[str, Any]] | None:
    if symbol not in _SYMBOLS or flags != COPY_TICKS_INFO:
        return None
    first, last = int(start.timestamp() * 1000), int(end.timestamp() * 1000)
    moment = -(-first // _TICK_MILLISECONDS) * _TICK_MILLISECONDS
    rows = []
    while moment <= last:
        rows.append({"time_msc": moment, "bid": 1.1, "ask": 1.1002})
        moment += _TICK_MILLISECONDS
    return rows


def symbol_info_tick(symbol: str) -> _Info | None:
    return _Info(ask=1.1002) if symbol in _SYMBOLS else None


def order_calc_margin(action: int, symbol: str, volume: float, price: float) -> float | None:
    return 1234.5 if symbol in _SYMBOLS and action == ORDER_TYPE_BUY and price > 0 else None
