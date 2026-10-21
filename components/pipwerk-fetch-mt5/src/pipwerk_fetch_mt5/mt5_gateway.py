"""``TerminalGateway`` on top of the package ``MetaTrader5`` (Windows only).

The package is imported when it is first needed (``importlib``), never at import of this
module, so installation and tests work on every system without it. A test passes a replica
of the package module as ``module``.

How the package treats time: the times it returns are the server time of the broker written
as seconds since 1970, as if the server time were UTC; datetimes passed to it are read the
same way. This gateway therefore reads ``time`` as seconds of the server clock and passes
naive server times as datetimes with ``tzinfo=UTC`` (only as a carrier, no conversion).

Error codes of the package (``last_error()``): ``-4`` not found, ``-6`` authorization failed,
``-10000`` and below internal errors of the connection to the terminal (send, receive, init,
connect, timeout). They are the values of the documentation of the package. This module is not
tested against a real MetaTrader 5 (specification backtest 10); the acceptance does that.
"""

from __future__ import annotations

import importlib
import logging
import threading
from datetime import UTC, datetime, timedelta
from typing import Any

from pipwerk_fetch_mt5.config import MetaTraderSettings
from pipwerk_fetch_mt5.errors import FetchError
from pipwerk_fetch_mt5.gateway import (
    RawCandle,
    RawSession,
    RawTick,
    SymbolInfo,
    TimeUnit,
    Weekday,
)

logger = logging.getLogger(__name__)

_EPOCH = datetime(1970, 1, 1)

RES_E_NOT_FOUND = -4
RES_E_AUTH_FAILED = -6
RES_E_INTERNAL_FAIL = -10000

#: ``swap_rollover3days`` of the package: 0 is Sunday.
_TRIPLE_SWAP_WEEKDAYS: tuple[Weekday, ...] = (
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
)


def _server_time(seconds: int) -> datetime:
    return _EPOCH + timedelta(seconds=seconds)


def _carrier(server_time: datetime) -> datetime:
    """A naive server time as the datetime the package expects (UTC as a carrier)."""
    return server_time.replace(tzinfo=UTC)


class Mt5Gateway:
    """Reads from a running MetaTrader 5 through the package ``MetaTrader5``.

    The package is not thread safe; the caller (``service.py``) calls one method at a time.
    """

    def __init__(self, settings: MetaTraderSettings, module: Any | None = None) -> None:
        self._settings = settings
        self._module: Any | None = module
        self._initialized = False
        self._lock = threading.Lock()

    # --- connection ------------------------------------------------------------------------

    def _package(self) -> Any:
        if self._module is None:
            try:
                self._module = importlib.import_module("MetaTrader5")
            except ImportError:
                logger.error("The package MetaTrader5 is not installed.")
                raise FetchError("terminal_unavailable") from None
        return self._module

    def _reset(self) -> None:
        """Forget the connection so that the next call connects again."""
        if self._initialized:
            try:
                self._package().shutdown()
            except Exception:
                logger.warning("Shutting down the connection to MetaTrader 5 failed.")
            self._initialized = False

    def _ready(self) -> Any:
        module = self._package()
        if self._initialized:
            return module
        settings = self._settings
        arguments: dict[str, Any] = {"timeout": settings.timeout_ms}
        if settings.path is not None:
            arguments["path"] = settings.path
        if settings.login is not None:
            arguments["login"] = settings.login
        if settings.password is not None:
            arguments["password"] = settings.password
        if settings.server is not None:
            arguments["server"] = settings.server
        try:
            started = bool(module.initialize(**arguments))
        except Exception as error:
            logger.error("Connecting to MetaTrader 5 failed (%s).", type(error).__name__)
            raise FetchError("terminal_unavailable") from None
        if not started:
            logger.error("Connecting to MetaTrader 5 failed (code %s).", self._code(module))
            raise FetchError("terminal_unavailable")
        self._initialized = True
        return module

    @staticmethod
    def _code(module: Any) -> int | None:
        try:
            code = module.last_error()[0]
        except Exception:
            return None
        return code if isinstance(code, int) else None

    def _failure(self, module: Any) -> FetchError:
        """The error for a call of the package that returned ``None``."""
        code = self._code(module)
        if code is not None and (code <= RES_E_INTERNAL_FAIL or code == RES_E_AUTH_FAILED):
            logger.error("MetaTrader 5 is not reachable (code %s).", code)
            self._reset()
            return FetchError("terminal_unavailable")
        logger.error("MetaTrader 5 ended a call with an error (code %s).", code)
        return FetchError("broker_error")

    # --- TerminalGateway -------------------------------------------------------------------

    def ping(self) -> None:
        with self._lock:
            module = self._ready()
            info = module.terminal_info()
            if info is None or not bool(getattr(info, "connected", False)):
                logger.error("MetaTrader 5 is not connected to its trade server.")
                self._reset()
                raise FetchError("terminal_unavailable")

    def server_name(self) -> str | None:
        with self._lock:
            module = self._ready()
            account = module.account_info()
            name = getattr(account, "server", None) if account is not None else None
            return name if isinstance(name, str) and name.strip() else None

    def symbol(self, symbol: str) -> SymbolInfo | None:
        with self._lock:
            module = self._ready()
            info = module.symbol_info(symbol)
            if info is None:
                code = self._code(module)
                if code is not None and code <= RES_E_INTERNAL_FAIL:
                    raise self._failure(module)
                return None
            return SymbolInfo(
                tick_size=float(info.trade_tick_size),
                tick_value=float(info.trade_tick_value_profit),
                tick_value_currency=str(info.currency_profit),
                point=float(info.point),
                digits=int(info.digits),
                spread=int(info.spread),
                min_volume=float(info.volume_min),
                volume_step=float(info.volume_step),
                contract_size=float(info.trade_contract_size),
                swap_long=float(info.swap_long),
                swap_short=float(info.swap_short),
                swap_mode=int(info.swap_mode),
                triple_swap_weekday=_TRIPLE_SWAP_WEEKDAYS[int(info.swap_rollover3days) % 7],
                margin_initial=float(info.margin_initial),
                margin_currency=str(info.currency_margin),
            )

    def select(self, symbol: str) -> None:
        with self._lock:
            module = self._ready()
            if not bool(module.symbol_select(symbol, True)):
                raise self._failure(module)

    def candles(
        self, symbol: str, time_unit: TimeUnit, start: datetime, end: datetime
    ) -> list[RawCandle]:
        with self._lock:
            module = self._ready()
            first = start.replace(microsecond=0)
            # The package includes the end; a candle opens at a whole second.
            last = end.replace(microsecond=0) + timedelta(seconds=1 if end.microsecond else 0)
            last -= timedelta(seconds=1)
            code = getattr(module, f"TIMEFRAME_{time_unit.upper()}")
            rows = module.copy_rates_range(symbol, code, _carrier(first), _carrier(last))
            if rows is None:
                return self._empty_or_fail(module)
            candles: list[RawCandle] = []
            for row in rows:
                candles.append(
                    RawCandle(
                        time=_server_time(int(row["time"])),
                        open=float(row["open"]),
                        high=float(row["high"]),
                        low=float(row["low"]),
                        close=float(row["close"]),
                        volume=int(row["tick_volume"]),
                        spread=int(row["spread"]),
                    )
                )
            return candles

    def ticks(self, symbol: str, start: datetime, end: datetime) -> list[RawTick]:
        with self._lock:
            module = self._ready()
            first = start.replace(microsecond=start.microsecond // 1000 * 1000)
            last = end - timedelta(milliseconds=1)
            rows = module.copy_ticks_range(
                symbol, _carrier(first), _carrier(last), module.COPY_TICKS_INFO
            )
            if rows is None:
                return self._empty_or_fail(module)
            return [
                RawTick(
                    time=_EPOCH + timedelta(milliseconds=int(row["time_msc"])),
                    bid=float(row["bid"]),
                    ask=float(row["ask"]),
                )
                for row in rows
            ]

    def sessions(self, symbol: str) -> list[RawSession]:
        # The package MetaTrader5 has no function for the trading hours of a symbol
        # (SymbolInfoSessionTrade exists only in MQL5), so there is nothing to deliver.
        return []

    def margin_per_lot(self, symbol: str) -> float | None:
        with self._lock:
            module = self._ready()
            tick = module.symbol_info_tick(symbol)
            price = float(getattr(tick, "ask", 0.0)) if tick is not None else 0.0
            if price <= 0:
                return None
            margin = module.order_calc_margin(module.ORDER_TYPE_BUY, symbol, 1.0, price)
            return None if margin is None else float(margin)

    def _empty_or_fail(self, module: Any) -> list[Any]:
        code = self._code(module)
        if code is None or code == 1 or code == RES_E_NOT_FOUND:
            return []  # the call worked and found nothing
        raise self._failure(module)
