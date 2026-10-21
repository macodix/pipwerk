"""The acquisition: what the program does with a request (specification backtest 5.4).

``FetchService`` maps the designation of the instrument to the symbol of the broker (table of
the startup configuration), reads from the gateway, converts server time to UTC
(``timeconv.py``), checks the limits and builds the files in the format of the import
(``models.py``). It knows no HTTP and no MetaTrader 5 package; it works on any
``TerminalGateway``.

Limits:

- At most ``max_rows`` rows in an answer. For candles the number is estimated before anything
  is read (period divided by the nominal duration of the time unit); for ticks it is counted
  while reading. A period with more rows is answered with ``range_too_large``.
- A large period is read in several calls: candles in steps of at most ``CANDLE_CHUNK`` bars,
  ticks in steps of ``TICK_CHUNK_HOURS`` hours. The steps are cut in UTC. The window passed
  to the gateway (server times) is the step, widened where the offset of the zone changes
  (``timeconv.server_window``). A step keeps only the rows whose UTC time lies in it, so rows
  that the gateway returns in addition belong to the neighbouring step.
- At most ``max_reads`` reads of the gateway per request. The number of steps of the period
  is known before the first read; a period with more is answered with ``range_too_large``.

Rows that cannot be delivered are left out and counted; the first ``MAX_REPORTED`` are named:

- ``time_does_not_exist``: a server time that does not exist (the clocks were put forward).
- ``double_local_time``: a server time that occurs twice (the clocks were put back). A time
  that occurs twice counts as the earlier one (rule of the import), so the second occurrence
  would get the UTC time of the first. The program recognises the second occurrence by its
  order (the server time goes backwards) and leaves it out instead of delivering two rows for
  one UTC time. The first occurrence is always delivered.
- ``duplicate_time``: a candle with the server time of the candle before it.
- ``invalid_price``: a candle or tick without prices above zero.

Every file states the period that was asked for (``period``): the source covers it, even where
it has no candle or tick (weekend, holiday). A period without a single row is the error
``no_data``.
"""

from __future__ import annotations

import logging
import math
import re
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

from pipwerk_fetch_mt5.config import BROKER_NAME_PATTERN, StartupConfig
from pipwerk_fetch_mt5.errors import FetchError
from pipwerk_fetch_mt5.gateway import (
    TIME_UNIT_MINUTES,
    RawCandle,
    SymbolInfo,
    TerminalGateway,
    TimeUnit,
)
from pipwerk_fetch_mt5.models import (
    CandleEntry,
    CandleSeriesDocument,
    CandleSeriesResponse,
    InstrumentDocument,
    InstrumentResponse,
    OmittedReason,
    OmittedRow,
    PeriodDocument,
    TickEntry,
    TickSeriesDocument,
    TickSeriesResponse,
    TradingSessionDocument,
)
from pipwerk_fetch_mt5.timeconv import (
    format_utc,
    resolve_server_time,
    server_window,
    sessions_to_utc,
)

logger = logging.getLogger(__name__)

#: Largest number of bars of one read of the gateway.
CANDLE_CHUNK = 10_000

#: Length of one read of ticks, in hours.
TICK_CHUNK_HOURS = 6

#: Largest number of omitted rows that an answer names (the count is always complete).
MAX_REPORTED = 100

#: The currency of a tick value, as the schema of the import defines it.
_CURRENCY = re.compile(r"[A-Za-z0-9]{2,10}")


class _Omissions:
    """The rows that were left out."""

    def __init__(self) -> None:
        self.count = 0
        self.rows: list[OmittedRow] = []

    def add(self, server_time: datetime, reason: OmittedReason) -> None:
        self.count += 1
        if len(self.rows) < MAX_REPORTED:
            text = (
                server_time.strftime("%Y-%m-%dT%H:%M:%S.")
                + f"{server_time.microsecond // 1000:03d}"
            )
            self.rows.append(OmittedRow(server_time=text, reason=reason))


class _Order:
    """Recognises the second occurrence of a repeated hour in the rows of one read.

    The server time of the rows rises. When it falls (the clocks were put back), the rows are
    the second occurrence until the time passes the highest time seen before; a row with
    exactly that time is still part of the second occurrence.
    """

    def __init__(self) -> None:
        self._high: datetime | None = None
        self._repeating = False

    def is_repeat(self, server_time: datetime) -> bool:
        if self._high is not None and server_time < self._high:
            self._repeating = True
        elif self._high is None or server_time > self._high:
            self._repeating = False
            self._high = server_time
        return self._repeating


def _valid_prices(candle: RawCandle) -> bool:
    """All four prices are finite numbers above zero (specification 5.3)."""
    return all(
        math.isfinite(price) and price > 0
        for price in (candle.open, candle.high, candle.low, candle.close)
    )


def _positive(*values: float) -> bool:
    return all(math.isfinite(value) and value > 0 for value in values)


@dataclass(frozen=True)
class _Step:
    """One read: the step ``[start, end)`` in UTC, which owns the rows whose UTC time lies in
    it, and the window ``[server_start, server_end)`` in server time that is passed to the
    gateway (``timeconv.server_window``)."""

    start: datetime
    end: datetime
    server_start: datetime
    server_end: datetime


class FetchService:
    """Acquisition of candles, ticks and details of an instrument from a gateway."""

    def __init__(
        self,
        gateway: TerminalGateway,
        config: StartupConfig,
        clock: Callable[[], datetime] | None = None,
    ) -> None:
        self._gateway = gateway
        self._config = config
        self._zone = ZoneInfo(config.server_time_zone)
        self._clock: Callable[[], datetime] = clock or (lambda: datetime.now(UTC))

    # --- shared steps ----------------------------------------------------------------------

    def check_terminal(self) -> None:
        """Raise ``FetchError("terminal_unavailable")`` if MetaTrader 5 cannot be reached."""
        self._gateway.ping()

    def _broker(self) -> str:
        name = self._config.broker_name or self._gateway.server_name() or ""
        name = name.strip()
        if len(name) > 128 or BROKER_NAME_PATTERN.fullmatch(name) is None:
            raise FetchError("broker_unknown")
        return name

    def _open_symbol(self, instrument: str) -> tuple[str, SymbolInfo]:
        """Check that the terminal is reachable, map the designation to the symbol, and make
        the symbol available. ``symbol_unknown`` if the broker does not know it."""
        self._gateway.ping()
        symbol = self._config.symbol_for(instrument)
        info = self._gateway.symbol(symbol)
        if info is None:
            raise FetchError("symbol_unknown")
        self._gateway.select(symbol)
        return symbol, info

    def _steps(self, start: datetime, end: datetime, length: timedelta) -> list[_Step]:
        """The steps of a period, cut in UTC. ``range_too_large`` if there are more than
        ``max_reads`` of them: the number is known before the first read."""
        if math.ceil((end - start) / length) > self._config.max_reads:
            raise FetchError("range_too_large")
        steps: list[_Step] = []
        cursor = start
        while cursor < end:
            until = min(cursor + length, end)
            low, high = server_window(cursor, until, self._zone)
            steps.append(_Step(cursor, until, low, high))
            cursor = until
        return steps

    def _place(
        self, server_time: datetime, step: _Step, order: _Order, omitted: _Omissions
    ) -> datetime | None:
        """The UTC time of a row of a step, or ``None`` if the row is not delivered: it
        belongs to another step (silently) or it is left out and counted.

        A row belongs to the step in which its UTC time lies. The window passed to the gateway
        is wider than the step where the offset of the zone changes, so a row is placed by its
        UTC time and never by whether its server time lies in the window. The first occurrence
        of a repeated hour is delivered with the UTC time of the earlier clock. The second
        occurrence (recognised by the order) is left out and counted by the step that holds
        its UTC time; a missing time by the step that holds its nominal UTC time."""
        try:
            meaning = resolve_server_time(server_time, self._zone)
        except OverflowError, ValueError, OSError:
            # A time the zone cannot convert counts as a time that does not exist.
            if step.server_start <= server_time < step.server_end:
                omitted.add(server_time, "time_does_not_exist")
            return None
        if not meaning.exists:
            if step.start <= meaning.first < step.end:
                omitted.add(server_time, "time_does_not_exist")
            return None
        if order.is_repeat(server_time):
            moment = meaning.second or meaning.first
            if step.start <= moment < step.end:
                omitted.add(server_time, "double_local_time")
            return None
        return meaning.first if step.start <= meaning.first < step.end else None

    def _trading_hours(self, symbol: str) -> list[TradingSessionDocument] | None:
        """The weekly trading hours of the symbol in UTC, or ``None`` if the source delivers
        none or they cannot be given in UTC (the zone has summer time)."""
        sessions = self._gateway.sessions(symbol)
        if not sessions:
            return None
        converted = sessions_to_utc(sessions, self._zone, self._clock().year)
        if converted is None:
            logger.info("The trading hours are not delivered: the server time has summer time.")
            return None
        return [
            TradingSessionDocument(weekday=weekday, from_=begin, to=finish)
            for weekday, begin, finish in converted
        ]

    @staticmethod
    def _period(start: datetime, end: datetime) -> PeriodDocument:
        return PeriodDocument(start=format_utc(start), end=format_utc(end))

    # --- candles ---------------------------------------------------------------------------

    def candles(
        self, instrument: str, time_unit: TimeUnit, start: datetime, end: datetime
    ) -> CandleSeriesResponse:
        """The candles of ``[start, end)`` (aware datetimes) of a time unit."""
        start_utc, end_utc = start.astimezone(UTC), end.astimezone(UTC)
        symbol, _info = self._open_symbol(instrument)
        broker = self._broker()
        duration = timedelta(minutes=TIME_UNIT_MINUTES[time_unit])
        if math.ceil((end_utc - start_utc) / duration) > self._config.max_rows:
            raise FetchError("range_too_large")
        omitted = _Omissions()
        rows: list[CandleEntry] = []
        for step in self._steps(start_utc, end_utc, duration * CANDLE_CHUNK):
            order = _Order()
            last_time: datetime | None = None
            for candle in self._gateway.candles(
                symbol, time_unit, step.server_start, step.server_end
            ):
                moment = self._place(candle.time, step, order, omitted)
                if moment is None:
                    continue
                if candle.time == last_time:
                    omitted.add(candle.time, "duplicate_time")
                    continue
                last_time = candle.time
                if not _valid_prices(candle):
                    omitted.add(candle.time, "invalid_price")
                    continue
                rows.append(
                    CandleEntry(
                        time=format_utc(moment),
                        open=candle.open,
                        high=candle.high,
                        low=candle.low,
                        close=candle.close,
                        volume=candle.volume,
                        spread=candle.spread,
                    )
                )
            if len(rows) > self._config.max_rows:
                raise FetchError("range_too_large")
        if not rows:
            raise FetchError("no_data")
        logger.info("Delivered %d candles %s (%d omitted).", len(rows), time_unit, omitted.count)
        return CandleSeriesResponse(
            file=CandleSeriesDocument(
                broker=broker,
                instrument=instrument,
                time_unit=time_unit,
                period=self._period(start_utc, end_utc),
                trading_hours=self._trading_hours(symbol),
                candles=rows,
            ),
            omitted_count=omitted.count,
            omitted=omitted.rows,
        )

    # --- ticks -----------------------------------------------------------------------------

    def ticks(self, instrument: str, start: datetime, end: datetime) -> TickSeriesResponse:
        """The ticks of ``[start, end)`` (aware datetimes)."""
        start_utc, end_utc = start.astimezone(UTC), end.astimezone(UTC)
        symbol, _info = self._open_symbol(instrument)
        broker = self._broker()
        omitted = _Omissions()
        rows: list[TickEntry] = []
        for step in self._steps(start_utc, end_utc, timedelta(hours=TICK_CHUNK_HOURS)):
            order = _Order()
            for tick in self._gateway.ticks(symbol, step.server_start, step.server_end):
                moment = self._place(tick.time, step, order, omitted)
                if moment is None:
                    continue
                if not _positive(tick.bid, tick.ask):
                    omitted.add(tick.time, "invalid_price")
                    continue
                rows.append(TickEntry(time=format_utc(moment), bid=tick.bid, ask=tick.ask))
            if len(rows) > self._config.max_rows:
                raise FetchError("range_too_large")
        if not rows:
            raise FetchError("no_data")
        logger.info("Delivered %d ticks (%d omitted).", len(rows), omitted.count)
        return TickSeriesResponse(
            file=TickSeriesDocument(
                broker=broker,
                instrument=instrument,
                period=self._period(start_utc, end_utc),
                trading_hours=self._trading_hours(symbol),
                ticks=rows,
            ),
            omitted_count=omitted.count,
            omitted=omitted.rows,
        )

    # --- details of the instrument ---------------------------------------------------------

    def instrument_details(self, instrument: str) -> InstrumentResponse:
        """The details of the instrument at the time of the call."""
        symbol, info = self._open_symbol(instrument)
        broker = self._broker()
        if not (
            _positive(
                info.tick_size,
                info.tick_value,
                info.point,
                info.min_volume,
                info.volume_step,
                info.contract_size,
            )
            and math.isfinite(info.swap_long)
            and math.isfinite(info.swap_short)
            and info.spread >= 0
            and 0 <= info.digits <= 12
            and _CURRENCY.fullmatch(info.tick_value_currency) is not None
        ):
            logger.error("MetaTrader 5 delivers values for the instrument that cannot be used.")
            raise FetchError("invalid_broker_data")
        # The margin for one lot as the terminal calculates it (it knows the leverage); if it
        # cannot, the initial margin the symbol states, if the symbol states one.
        margin = self._gateway.margin_per_lot(symbol)
        if margin is None or not (math.isfinite(margin) and margin >= 0):
            margin = info.margin_initial if math.isfinite(info.margin_initial) else 0.0
            margin = margin if margin > 0 else None
        # A pip is ten points for a symbol with three or five digits, else one point (the
        # convention of brokers; MetaTrader 5 does not deliver it).
        pip = info.point * 10 if info.digits in (3, 5) else info.point
        logger.info("Delivered the details of an instrument.")
        return InstrumentResponse(
            file=InstrumentDocument(
                broker=broker,
                instrument=instrument,
                acquired_at=format_utc(self._clock()),
                tick_size=info.tick_size,
                tick_value=info.tick_value,
                tick_value_currency=info.tick_value_currency,
                point=info.point,
                pip=round(pip, info.digits),
                spread=round(info.spread * info.point, info.digits),
                min_volume=info.min_volume,
                volume_step=info.volume_step,
                contract_size=info.contract_size,
                swap_long=info.swap_long,
                swap_short=info.swap_short,
                swap_triple_weekday=info.triple_swap_weekday,
                margin_per_lot=margin,
            )
        )
