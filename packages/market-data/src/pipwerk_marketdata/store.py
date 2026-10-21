"""The data store: writing the result of an import, reading, overview and completeness.

The store gets the database as an engine from the caller. It does not create the tables; the
caller runs ``migrate_database`` first. Every operation that changes data runs in one
transaction: after an error nothing is visible. Errors of the database become
``MarketDataStoreError`` with a fixed message; the original error is the cause.
"""

import contextlib
from collections.abc import Iterator
from datetime import datetime, timedelta

import sqlalchemy as sa
from sqlalchemy.engine import Connection, Engine
from sqlalchemy.exc import SQLAlchemyError

from pipwerk_marketdata import tables
from pipwerk_marketdata.completeness import candle_gaps, combine, merge, tick_gaps
from pipwerk_marketdata.csvimport import CsvSeries, parse_csv
from pipwerk_marketdata.errors import MarketDataStoreError
from pipwerk_marketdata.jsonimport import parse_json
from pipwerk_marketdata.limits import DEFAULT_MAX_PAGE_SIZE, MAX_MOMENT, MIN_MOMENT, ImportLimits
from pipwerk_marketdata.parsed import KIND_CANDLES, KIND_INSTRUMENT, ParsedImport
from pipwerk_marketdata.records import (
    Candle,
    CandlePage,
    Completeness,
    CompletenessRules,
    ImportResult,
    InstrumentInfo,
    InstrumentOverview,
    Interval,
    MissingPart,
    Overview,
    SeriesOverview,
    Tick,
    TickPage,
    TradingSession,
    Weekday,
)
from pipwerk_marketdata.timeunits import TICKS, TimeUnit, require_utc, time_unit

_CHUNK = 500
_STREAM = 10_000
_MONTH_LOOKBACK = timedelta(days=31)
_WEEKDAYS = list(Weekday)


@contextlib.contextmanager
def _database_errors() -> Iterator[None]:
    try:
        yield
    except SQLAlchemyError as error:
        raise MarketDataStoreError(
            "The database operation failed. The data store was not changed."
        ) from error


def _check_moments(*moments: datetime | None) -> None:
    """``ValueError`` if a moment has no time zone."""
    for moment in moments:
        if moment is not None:
            require_utc(moment)


def _lookback(unit: TimeUnit) -> timedelta:
    return unit.duration if unit.duration is not None else _MONTH_LOOKBACK


class MarketDataStore:
    """Access to the data store in one database."""

    def __init__(
        self,
        engine: Engine,
        *,
        max_page_size: int = DEFAULT_MAX_PAGE_SIZE,
        rules: CompletenessRules | None = None,
    ) -> None:
        if max_page_size <= 0:
            raise ValueError("max_page_size must be positive")
        self._engine = engine
        self._max_page_size = max_page_size
        self._rules = rules or CompletenessRules()

    @property
    def max_page_size(self) -> int:
        """Largest number of candles or ticks one reading returns."""
        return self._max_page_size

    # ----- import -----------------------------------------------------------------------

    def import_json(self, data: bytes, limits: ImportLimits | None = None) -> ImportResult:
        """Import a JSON file (schema ``contracts/market-data/v1/``).

        Raises ``ImportFileError`` if the file is refused as a whole. Rows that are rejected
        are listed in the result; the other rows are taken over in one transaction.
        """
        return self._write(parse_json(data, limits))

    def import_csv(
        self,
        data: bytes,
        *,
        kind: str,
        broker: str,
        instrument: str,
        timezone: str,
        time_unit: str | None = None,
        limits: ImportLimits | None = None,
    ) -> ImportResult:
        """Import a CSV file in the export format of MetaTrader 5.

        ``kind`` is ``candles`` or ``ticks``; ``time_unit`` is needed for candles. ``timezone``
        is the IANA name of the time zone of the times in the file.
        """
        series = CsvSeries(kind, broker, instrument, time_unit, timezone)
        return self._write(parse_csv(data, series, limits))

    def _write(self, parsed: ParsedImport) -> ImportResult:
        with _database_errors(), self._engine.begin() as connection:
            if parsed.kind == KIND_INSTRUMENT:
                return self._write_info(connection, parsed)
            return self._write_series(connection, parsed)

    def _write_info(self, connection: Connection, parsed: ParsedImport) -> ImportResult:
        info = parsed.info
        assert info is not None  # noqa: S101 - set by the parser for this kind
        table = tables.instrument
        key = sa.and_(
            table.c.broker == info.broker,
            table.c.instrument == info.instrument,
            table.c.acquired_at == info.acquired_at,
        )
        replaced = connection.execute(sa.delete(table).where(key)).rowcount
        connection.execute(
            sa.insert(table).values(
                broker=info.broker,
                instrument=info.instrument,
                acquired_at=info.acquired_at,
                tick_size=info.tick_size,
                tick_value=info.tick_value,
                tick_value_currency=info.tick_value_currency,
                point=info.point,
                pip=info.pip,
                spread=info.spread,
                min_volume=info.min_volume,
                volume_step=info.volume_step,
                contract_size=info.contract_size,
                swap_long=info.swap_long,
                swap_short=info.swap_short,
                swap_triple_weekday=info.swap_triple_weekday.number,
                margin_per_lot=info.margin_per_lot,
            )
        )
        return ImportResult(
            kind=KIND_INSTRUMENT,
            broker=info.broker,
            instrument=info.instrument,
            unit=None,
            accepted=1,
            replaced=replaced,
            period_start=info.acquired_at,
            period_end=info.acquired_at,
            rejected=(),
            rejected_count=0,
        )

    def _write_series(self, connection: Connection, parsed: ParsedImport) -> ImportResult:
        is_candles = parsed.kind == KIND_CANDLES
        rows: list[Candle] | list[Tick] = parsed.candles if is_candles else parsed.ticks
        unit_name = parsed.series_unit
        assert unit_name is not None  # noqa: S101 - set for series
        first = rows[0].time if rows else None
        last = rows[-1].time if rows else None
        replaced = 0
        if rows or parsed.declared_period is not None or parsed.trading_hours is not None:
            series_id = self._series_id(
                connection, parsed.broker, parsed.instrument, unit_name, True
            )
            assert series_id is not None  # noqa: S101 - created above
            if is_candles:
                replaced = self._insert_candles(connection, series_id, parsed.candles)
            else:
                replaced = self._insert_ticks(connection, series_id, parsed.ticks)
            covered = self._covered(parsed, first, last)
            if covered is not None:
                self._add_coverage(connection, series_id, covered)
            if parsed.trading_hours is not None:
                self._replace_sessions(connection, series_id, parsed.trading_hours)
        return ImportResult(
            kind=parsed.kind,
            broker=parsed.broker,
            instrument=parsed.instrument,
            unit=parsed.unit,
            accepted=len(rows),
            replaced=replaced,
            period_start=first,
            period_end=last,
            rejected=tuple(parsed.rejected),
            rejected_count=parsed.rejected_count,
        )

    @staticmethod
    def _covered(
        parsed: ParsedImport, first: datetime | None, last: datetime | None
    ) -> Interval | None:
        if parsed.declared_period is not None:
            return parsed.declared_period
        if first is None or last is None:
            return None
        if parsed.kind == KIND_CANDLES:
            assert parsed.unit is not None  # noqa: S101 - candles have a time unit
            return Interval(first, min(time_unit(parsed.unit).add(last), MAX_MOMENT))
        return Interval(first, min(last + timedelta(milliseconds=1), MAX_MOMENT))

    @staticmethod
    def _series_id(
        connection: Connection, broker: str, instrument: str, unit: str, create: bool
    ) -> int | None:
        table = tables.series
        condition = sa.and_(
            table.c.broker == broker, table.c.instrument == instrument, table.c.unit == unit
        )
        found = connection.execute(sa.select(table.c.id).where(condition)).scalar()
        if found is not None or not create:
            return found
        result = connection.execute(
            sa.insert(table).values(broker=broker, instrument=instrument, unit=unit)
        )
        inserted = result.inserted_primary_key
        assert inserted is not None  # noqa: S101 - an insert into this table has a key
        return int(inserted[0])

    @staticmethod
    def _insert_candles(connection: Connection, series_id: int, candles: list[Candle]) -> int:
        table = tables.candle
        replaced = 0
        for start in range(0, len(candles), _CHUNK):
            chunk = candles[start : start + _CHUNK]
            replaced += connection.execute(
                sa.delete(table).where(
                    table.c.series_id == series_id,
                    table.c.opened_at.in_([item.time for item in chunk]),
                )
            ).rowcount
            connection.execute(
                sa.insert(table),
                [
                    {
                        "series_id": series_id,
                        "opened_at": item.time,
                        "open": item.open,
                        "high": item.high,
                        "low": item.low,
                        "close": item.close,
                        "volume": item.volume,
                        "spread": item.spread,
                    }
                    for item in chunk
                ],
            )
        return replaced

    @staticmethod
    def _insert_ticks(connection: Connection, series_id: int, ticks: list[Tick]) -> int:
        table = tables.tick
        replaced = 0
        for start in range(0, len(ticks), _CHUNK):
            chunk = ticks[start : start + _CHUNK]
            replaced += connection.execute(
                sa.delete(table).where(
                    table.c.series_id == series_id,
                    table.c.moment.in_([item.time for item in chunk]),
                )
            ).rowcount
            connection.execute(
                sa.insert(table),
                [
                    {"series_id": series_id, "moment": item.time, "bid": item.bid, "ask": item.ask}
                    for item in chunk
                ],
            )
        return replaced

    @staticmethod
    def _add_coverage(connection: Connection, series_id: int, interval: Interval) -> None:
        table = tables.coverage
        touching = connection.execute(
            sa.select(table.c.id, table.c.period_start, table.c.period_end).where(
                table.c.series_id == series_id,
                table.c.period_start <= interval.end,
                table.c.period_end >= interval.start,
            )
        ).all()
        union = merge([interval, *(Interval(row[1], row[2]) for row in touching)])[0]
        if touching:
            connection.execute(sa.delete(table).where(table.c.id.in_([row[0] for row in touching])))
        connection.execute(
            sa.insert(table).values(
                series_id=series_id, period_start=union.start, period_end=union.end
            )
        )

    @staticmethod
    def _replace_sessions(
        connection: Connection, series_id: int, sessions: list[TradingSession]
    ) -> None:
        table = tables.session
        connection.execute(sa.delete(table).where(table.c.series_id == series_id))
        if sessions:
            connection.execute(
                sa.insert(table),
                [
                    {
                        "series_id": series_id,
                        "weekday": item.weekday.number,
                        "start_minute": item.start_minute,
                        "end_minute": item.end_minute,
                    }
                    for item in sessions
                ],
            )

    # ----- reading ------------------------------------------------------------------------

    def _page_limit(self, limit: int | None) -> int:
        if limit is None:
            return self._max_page_size
        if limit <= 0 or limit > self._max_page_size:
            raise ValueError(f"limit must be between 1 and {self._max_page_size}")
        return limit

    def read_candles(
        self,
        broker: str,
        instrument: str,
        unit: str,
        start: datetime,
        end: datetime,
        *,
        limit: int | None = None,
        after: datetime | None = None,
    ) -> CandlePage:
        """Candles with opening moment from ``start`` (included) to ``end`` (excluded).

        At most ``limit`` candles (never more than ``max_page_size``) are returned. If more
        follow, ``next_after`` is the opening moment of the last candle returned: pass it as
        ``after`` to continue.
        """
        time_unit(unit)
        count = self._page_limit(limit)
        _check_moments(start, end, after)
        with _database_errors(), self._engine.connect() as connection:
            series_id = self._series_id(connection, broker, instrument, unit, False)
            if series_id is None:
                return CandlePage((), None)
            table = tables.candle
            statement = (
                sa.select(table)
                .where(
                    table.c.series_id == series_id,
                    table.c.opened_at >= require_utc(start),
                    table.c.opened_at < require_utc(end),
                )
                .order_by(table.c.opened_at)
                .limit(count + 1)
            )
            if after is not None:
                statement = statement.where(table.c.opened_at > require_utc(after))
            rows = connection.execute(statement).all()
        items = tuple(
            Candle(row.opened_at, row.open, row.high, row.low, row.close, row.volume, row.spread)
            for row in rows[:count]
        )
        more = len(rows) > count
        return CandlePage(items, items[-1].time if more else None)

    def read_ticks(
        self,
        broker: str,
        instrument: str,
        start: datetime,
        end: datetime,
        *,
        limit: int | None = None,
        after: datetime | None = None,
    ) -> TickPage:
        """Ticks from ``start`` (included) to ``end`` (excluded), continued like candles."""
        count = self._page_limit(limit)
        _check_moments(start, end, after)
        with _database_errors(), self._engine.connect() as connection:
            series_id = self._series_id(connection, broker, instrument, TICKS, False)
            if series_id is None:
                return TickPage((), None)
            table = tables.tick
            statement = (
                sa.select(table)
                .where(
                    table.c.series_id == series_id,
                    table.c.moment >= require_utc(start),
                    table.c.moment < require_utc(end),
                )
                .order_by(table.c.moment)
                .limit(count + 1)
            )
            if after is not None:
                statement = statement.where(table.c.moment > require_utc(after))
            rows = connection.execute(statement).all()
        items = tuple(Tick(row.moment, row.bid, row.ask) for row in rows[:count])
        more = len(rows) > count
        return TickPage(items, items[-1].time if more else None)

    def instrument_info(
        self, broker: str, instrument: str, as_of: datetime | None = None
    ) -> InstrumentInfo | None:
        """The newest instrument data (obtained not after ``as_of``), ``None`` if there is none."""
        table = tables.instrument
        statement = (
            sa.select(table)
            .where(table.c.broker == broker, table.c.instrument == instrument)
            .order_by(table.c.acquired_at.desc())
            .limit(1)
        )
        if as_of is not None:
            statement = statement.where(table.c.acquired_at <= require_utc(as_of))
        with _database_errors(), self._engine.connect() as connection:
            row = connection.execute(statement).first()
        if row is None:
            return None
        return InstrumentInfo(
            broker=row.broker,
            instrument=row.instrument,
            acquired_at=row.acquired_at,
            tick_size=row.tick_size,
            tick_value=row.tick_value,
            tick_value_currency=row.tick_value_currency,
            point=row.point,
            pip=row.pip,
            spread=row.spread,
            min_volume=row.min_volume,
            volume_step=row.volume_step,
            contract_size=row.contract_size,
            swap_long=row.swap_long,
            swap_short=row.swap_short,
            swap_triple_weekday=_WEEKDAYS[row.swap_triple_weekday],
            margin_per_lot=row.margin_per_lot,
        )

    def trading_hours(self, broker: str, instrument: str, unit: str) -> list[TradingSession]:
        """The delivered trading hours of a series (empty if none were delivered)."""
        with _database_errors(), self._engine.connect() as connection:
            series_id = self._series_id(connection, broker, instrument, unit, False)
            if series_id is None:
                return []
            return self._sessions(connection, series_id)

    @staticmethod
    def _sessions(connection: Connection, series_id: int) -> list[TradingSession]:
        table = tables.session
        rows = connection.execute(
            sa.select(table.c.weekday, table.c.start_minute, table.c.end_minute)
            .where(table.c.series_id == series_id)
            .order_by(table.c.weekday, table.c.start_minute)
        ).all()
        return [TradingSession(_WEEKDAYS[row[0]], row[1], row[2]) for row in rows]

    @staticmethod
    def _coverage(connection: Connection, series_id: int) -> list[Interval]:
        table = tables.coverage
        rows = connection.execute(
            sa.select(table.c.period_start, table.c.period_end)
            .where(table.c.series_id == series_id)
            .order_by(table.c.period_start)
        ).all()
        return [Interval(row[0], row[1]) for row in rows]

    # ----- completeness and overview ------------------------------------------------------

    def completeness(
        self, broker: str, instrument: str, unit: str, start: datetime, end: datetime
    ) -> Completeness:
        """What exists and what is missing of a series between ``start`` and ``end``.

        ``unit`` is a time unit for candles or ``ticks``. The result lists the parts present
        and the missing parts with their reason; see ``completeness`` in the documentation for
        the rules.
        """
        if unit != TICKS:
            time_unit(unit)
        request = Interval(require_utc(start), require_utc(end))
        if request.start >= request.end:
            raise ValueError("the period must end after it starts")
        if request.start < MIN_MOMENT or request.end > MAX_MOMENT:
            raise ValueError(
                "the period must lie between 1970-01-01T00:00:00Z and 2100-01-01T00:00:00Z"
            )
        with _database_errors(), self._engine.connect() as connection:
            series_id = self._series_id(connection, broker, instrument, unit, False)
            if series_id is None:
                return self._result(request, [], [], None)
            covered = self._coverage(connection, series_id)
            sessions = self._sessions(connection, series_id) or None
            gaps = self._gaps(connection, series_id, unit, request, covered, sessions)
        return self._result(request, covered, gaps, sessions)

    def _result(
        self,
        request: Interval,
        covered: list[Interval],
        gaps: list[Interval],
        sessions: list[TradingSession] | None,
    ) -> Completeness:
        present, missing = combine(request, covered, gaps, sessions, self._rules)
        return Completeness(
            request.start, request.end, tuple(present), tuple(missing), sessions is not None
        )

    def _gaps(
        self,
        connection: Connection,
        series_id: int,
        unit: str,
        request: Interval,
        covered: list[Interval],
        sessions: list[TradingSession] | None,
    ) -> list[Interval]:
        gaps: list[Interval] = []
        for part in covered:
            start, end = max(part.start, request.start), min(part.end, request.end)
            if start >= end:
                continue
            window = Interval(start, end)
            if unit == TICKS:
                table = tables.tick
                moments = connection.execute(
                    sa.select(table.c.moment)
                    .where(
                        table.c.series_id == series_id,
                        table.c.moment >= window.start,
                        table.c.moment < window.end,
                    )
                    .order_by(table.c.moment)
                ).yield_per(_STREAM)
                gaps.extend(tick_gaps((row[0] for row in moments), window, sessions, self._rules))
            else:
                candle_unit = time_unit(unit)
                table = tables.candle
                opens = connection.execute(
                    sa.select(table.c.opened_at)
                    .where(
                        table.c.series_id == series_id,
                        table.c.opened_at > window.start - _lookback(candle_unit),
                        table.c.opened_at < window.end,
                    )
                    .order_by(table.c.opened_at)
                ).yield_per(_STREAM)
                gaps.extend(
                    candle_gaps(
                        (row[0] for row in opens), candle_unit, window, sessions, self._rules
                    )
                )
        return merge(gaps)

    def overview(self) -> Overview:
        """All series with count, first and last moment, covered periods and missing parts, and
        the newest instrument data per instrument and broker.

        The missing parts are computed over the whole covered range of each series; the
        computation reads all times of the series.
        """
        with _database_errors(), self._engine.connect() as connection:
            series_rows = connection.execute(
                sa.select(tables.series).order_by(
                    tables.series.c.broker, tables.series.c.instrument, tables.series.c.unit
                )
            ).all()
            result: list[SeriesOverview] = []
            for row in series_rows:
                result.append(
                    self._series_overview(connection, row.id, row.broker, row.instrument, row.unit)
                )
            info_rows = connection.execute(
                sa.select(
                    tables.instrument.c.broker,
                    tables.instrument.c.instrument,
                    sa.func.max(tables.instrument.c.acquired_at),
                )
                .group_by(tables.instrument.c.broker, tables.instrument.c.instrument)
                .order_by(tables.instrument.c.broker, tables.instrument.c.instrument)
            ).all()
        instruments = tuple(InstrumentOverview(row[0], row[1], row[2]) for row in info_rows)
        return Overview(tuple(result), instruments)

    def _series_overview(
        self, connection: Connection, series_id: int, broker: str, instrument: str, unit: str
    ) -> SeriesOverview:
        if unit == TICKS:
            table, column = tables.tick, tables.tick.c.moment
        else:
            table, column = tables.candle, tables.candle.c.opened_at
        count, first, last = connection.execute(
            sa.select(sa.func.count(), sa.func.min(column), sa.func.max(column)).where(
                table.c.series_id == series_id
            )
        ).one()
        covered = self._coverage(connection, series_id)
        sessions = self._sessions(connection, series_id) or None
        missing: list[MissingPart] = []
        if covered:
            request = Interval(covered[0].start, max(part.end for part in covered))
            gaps = self._gaps(connection, series_id, unit, request, covered, sessions)
            missing = combine(request, covered, gaps, sessions, self._rules)[1]
        return SeriesOverview(
            broker=broker,
            instrument=instrument,
            unit=unit,
            count=count,
            first=first,
            last=last,
            covered=tuple(covered),
            missing=tuple(missing),
            has_trading_hours=sessions is not None,
        )
