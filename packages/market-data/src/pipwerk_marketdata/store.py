"""The data store: writing the result of an import, reading, overview and completeness.

The store gets the database as an engine from the caller. It does not create the tables; the
caller runs ``migrate_database`` first. Every operation that changes data runs in one
transaction: after an error nothing is visible. Errors of the database become
``MarketDataStoreError`` with a fixed message; the original error is the cause.
"""

import contextlib
from collections.abc import Iterator, Sequence
from datetime import datetime, timedelta

import sqlalchemy as sa
from sqlalchemy.engine import Connection, Engine
from sqlalchemy.exc import SQLAlchemyError

from pipwerk_marketdata import tables
from pipwerk_marketdata.completeness import combine, merge
from pipwerk_marketdata.csvimport import CsvSeries, parse_csv
from pipwerk_marketdata.deletion import broker_names
from pipwerk_marketdata.deletion import check_period as check_deletion_period
from pipwerk_marketdata.deletion import run as run_deletion
from pipwerk_marketdata.errors import ImportBatchError, ImportFileError, MarketDataStoreError
from pipwerk_marketdata.jsonimport import parse_json
from pipwerk_marketdata.limits import DEFAULT_MAX_PAGE_SIZE, MAX_MOMENT, MIN_MOMENT, ImportLimits
from pipwerk_marketdata.parsed import (
    KIND_CANDLES,
    KIND_INSTRUMENT,
    KIND_TICKS,
    ParsedImport,
    content_data,
    with_names,
)
from pipwerk_marketdata.records import (
    BatchErrorCode,
    Candle,
    CandlePage,
    Completeness,
    CompletenessRules,
    Deletion,
    DeletionKind,
    FileErrorCode,
    FileFormat,
    FileOutcome,
    ImportBatchResult,
    ImportFile,
    ImportResult,
    InstrumentInfo,
    InstrumentOverview,
    Interval,
    MissingPart,
    Overview,
    SeriesDetails,
    SeriesOverview,
    SeriesRow,
    SeriesRowPage,
    Tick,
    TickPage,
    TradingSession,
    Weekday,
)
from pipwerk_marketdata.space import return_space
from pipwerk_marketdata.timeunits import (
    CONTRACT,
    TICKS,
    TIME_UNITS,
    require_utc,
    time_unit,
)

_CHUNK = 500
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


_DATA_ORDER = {name: index for index, name in enumerate([*TIME_UNITS, TICKS, CONTRACT])}


def _name_key(name: str) -> tuple[str, str]:
    """Alphabetical order without regard to case; equal names in the order of their text."""
    return name.casefold(), name


def _row_key(key: tuple[str, str, str]) -> tuple[tuple[str, str], tuple[str, str], int]:
    broker, instrument, data = key
    return _name_key(broker), _name_key(instrument), _DATA_ORDER.get(data, len(_DATA_ORDER))


def _contains(text: str, part: str | None) -> bool:
    """``True`` if ``part`` is empty or missing or a part of ``text`` (case ignored)."""
    return not part or part.casefold() in text.casefold()


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

    def import_files(
        self,
        files: Sequence[ImportFile],
        *,
        broker: str | None = None,
        timezone: str | None = None,
        limits: ImportLimits | None = None,
    ) -> ImportBatchResult:
        """Import files, each in a transaction of its own.

        ``broker`` is the broker of the whole process: it is the broker of the CSV files and
        replaces the broker named in a JSON file; without it a JSON file keeps its own broker
        and a CSV file is refused. ``timezone`` (IANA name) is the time zone of the times in
        all CSV files. A CSV file needs ``instrument`` and ``data`` (time unit or ``ticks``).

        The result has one outcome per file in the order given. A refused file (reason in the
        outcome) does not stop the others. There is no limit for the number of files or their
        total size; ``limits`` apply to each file. ``ImportBatchError`` if there is no file.
        """
        limits = limits or ImportLimits()
        if not files:
            raise ImportBatchError(BatchErrorCode.NO_FILES, "The process has no file.")
        return ImportBatchResult(
            tuple(self._import_file(file, broker, timezone, limits) for file in files)
        )

    def _import_file(
        self, file: ImportFile, broker: str | None, timezone: str | None, limits: ImportLimits
    ) -> FileOutcome:
        try:
            parsed = self._parse_file(file, broker, timezone, limits)
            return FileOutcome(file.name, self._write(parsed), None, None)
        except ImportFileError as error:
            return FileOutcome(file.name, None, error.code, error.message)
        except MarketDataStoreError as error:
            return FileOutcome(file.name, None, FileErrorCode.STORE_FAILED, str(error))

    @staticmethod
    def _parse_file(
        file: ImportFile, broker: str | None, timezone: str | None, limits: ImportLimits
    ) -> ParsedImport:
        if file.format == FileFormat.JSON:
            parsed = parse_json(file.content, limits)
            if file.data is not None and file.data != content_data(parsed):
                raise ImportFileError(
                    FileErrorCode.SERIES_INVALID,
                    "The data of a JSON file (time unit, ticks or instrument data) "
                    "come from its content and cannot be changed.",
                )
            return with_names(parsed, broker, file.instrument)
        if broker is None or file.instrument is None or file.data is None:
            raise ImportFileError(
                FileErrorCode.SERIES_INVALID,
                "A CSV file needs broker, instrument and data (time unit or ticks).",
            )
        if timezone is None:
            raise ImportFileError(
                FileErrorCode.TIMEZONE_UNKNOWN, "A CSV file needs the time zone of its times."
            )
        if file.data == TICKS:
            series = CsvSeries(KIND_TICKS, broker, file.instrument, None, timezone)
        else:
            series = CsvSeries(KIND_CANDLES, broker, file.instrument, file.data, timezone)
        return parse_csv(file.content, series, limits)

    def _write(self, parsed: ParsedImport) -> ImportResult:
        with _database_errors(), self._engine.begin() as connection:
            if parsed.kind == KIND_INSTRUMENT:
                result = self._write_info(connection, parsed)
            else:
                result = self._write_series(connection, parsed)
        if result.replaced:
            return_space(self._engine)  # after the commit (specification 5.6)
        return result

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
                return self._result(request, [], None)
            covered = self._coverage(connection, series_id)
            sessions = self._sessions(connection, series_id) or None
        return self._result(request, covered, sessions)

    def _result(
        self,
        request: Interval,
        covered: list[Interval],
        sessions: list[TradingSession] | None,
    ) -> Completeness:
        present, missing = combine(request, covered, sessions, self._rules)
        return Completeness(
            request.start, request.end, tuple(present), tuple(missing), sessions is not None
        )

    def overview(self) -> Overview:
        """All series with count, first and last moment, covered periods and missing parts, and
        the newest instrument data per instrument and broker.

        The missing parts are computed over the whole covered range of each series.
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

    def _missing_parts(
        self, covered: list[Interval], sessions: list[TradingSession] | None
    ) -> list[MissingPart]:
        """The gaps of a series: the missing parts over its whole covered range (5.2)."""
        if not covered:
            return []
        request = Interval(covered[0].start, max(part.end for part in covered))
        return combine(request, covered, sessions, self._rules)[1]

    # ----- list of series, details, brokers -------------------------------------------------

    def brokers(self) -> tuple[str, ...]:
        """The brokers that occur in the data store (series or instrument data), sorted."""
        with _database_errors(), self._engine.connect() as connection:
            names = broker_names(connection)
        return tuple(sorted(names, key=_name_key))

    def _row_keys(self, connection: Connection) -> list[tuple[str, str, str]]:
        """All (broker, instrument, data) of the data store, including instruments that have
        instrument data only, in the fixed order of the list."""
        series = {
            (row[0], row[1], row[2])
            for row in connection.execute(
                sa.select(tables.series.c.broker, tables.series.c.instrument, tables.series.c.unit)
            )
        }
        with_series = {(broker, instrument) for broker, instrument, _ in series}
        pairs = {
            (row[0], row[1])
            for row in connection.execute(
                sa.select(tables.instrument.c.broker, tables.instrument.c.instrument).distinct()
            )
        }
        keys = series | {
            (broker, instrument, CONTRACT) for broker, instrument in pairs - with_series
        }
        return sorted(keys, key=_row_key)

    def list_series(
        self,
        *,
        broker: str | None = None,
        instrument: str | None = None,
        data: str | None = None,
        offset: int = 0,
        limit: int | None = None,
    ) -> SeriesRowPage:
        """The series page by page, filtered by broker, instrument and data.

        Each filter is a part of the text, matched without regard to case; an empty or missing
        filter matches everything. ``data`` is matched against the identifier (``m1``, ``h1``,
        ``ticks``, ``contract``). The rows are sorted by broker, instrument and data (time units
        from short to long, then ticks, then contract); the order is the same for equal data.
        A row with data ``contract`` stands for an instrument at a broker that has instrument
        data but no series. ``total`` counts all rows that match, ``limit`` is at most
        ``max_page_size``. Missing parts are computed for the rows of the page only.
        """
        if offset < 0:
            raise ValueError("offset must not be negative")
        count = self._page_limit(limit)
        with _database_errors(), self._engine.connect() as connection:
            keys = [
                key
                for key in self._row_keys(connection)
                if _contains(key[0], broker)
                and _contains(key[1], instrument)
                and _contains(key[2], data)
            ]
            items = tuple(self._row(connection, *key)[0] for key in keys[offset : offset + count])
        return SeriesRowPage(items, len(keys))

    def _row(
        self, connection: Connection, broker: str, instrument: str, data: str
    ) -> tuple[SeriesRow, list[MissingPart]]:
        """The row of the list and its missing parts."""
        if data == CONTRACT:
            return SeriesRow(broker, instrument, data, None, None, 0), []
        series_id = self._series_id(connection, broker, instrument, data, False)
        assert series_id is not None  # noqa: S101 - the row was read from the table
        if data == TICKS:
            column = tables.tick.c.moment
            table = tables.tick
        else:
            column = tables.candle.c.opened_at
            table = tables.candle
        first, last = connection.execute(
            sa.select(sa.func.min(column), sa.func.max(column)).where(
                table.c.series_id == series_id
            )
        ).one()
        covered = self._coverage(connection, series_id)
        sessions = self._sessions(connection, series_id) or None
        missing = self._missing_parts(covered, sessions)
        return SeriesRow(broker, instrument, data, first, last, len(missing)), missing

    def series_details(self, broker: str, instrument: str, data: str) -> SeriesDetails | None:
        """The details of one row of the list: all missing parts (start, end, reason) and the
        instrument data of the instrument at this broker (``contract`` is ``None`` if there are
        none).

        ``None`` if the list has no such row. The row with ``data`` equal to ``contract`` exists
        only for an instrument that has instrument data and no series; it has no missing parts.
        """
        if data not in (TICKS, CONTRACT):
            time_unit(data)
        info = self.instrument_info(broker, instrument)
        with _database_errors(), self._engine.connect() as connection:
            if data == CONTRACT:
                table = tables.series
                has_series = connection.execute(
                    sa.select(table.c.id).where(
                        table.c.broker == broker, table.c.instrument == instrument
                    )
                ).first()
                if has_series is not None or info is None:
                    return None
                return SeriesDetails(SeriesRow(broker, instrument, data, None, None, 0), (), info)
            if self._series_id(connection, broker, instrument, data, False) is None:
                return None
            row, missing = self._row(connection, broker, instrument, data)
        return SeriesDetails(row, tuple(missing), info)

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
        missing = self._missing_parts(covered, sessions)
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

    # ----- deleting (specification 5.5) -----------------------------------------------------

    def plan_delete_series(self, broker: str, instrument: str, data: str) -> Deletion:
        """What ``delete_series`` would remove; nothing is changed.

        ``data`` is a time unit identifier or ``ticks``. ``DeletionError`` if the broker, the
        instrument or the series is unknown.
        """
        return self._delete(DeletionKind.SERIES, broker, instrument, data, None, execute=False)

    def delete_series(self, broker: str, instrument: str, data: str) -> Deletion:
        """Delete a whole series (all its candles or ticks, covered periods and trading hours),
        in one transaction. Returns what was removed."""
        return self._delete(DeletionKind.SERIES, broker, instrument, data, None, execute=True)

    def plan_delete_period(
        self, broker: str, instrument: str, data: str, start: datetime, end: datetime
    ) -> Deletion:
        """What ``delete_period`` would remove; nothing is changed.

        The period runs from ``start`` (included) to ``end`` (excluded), both UTC and on the
        minute. ``DeletionError`` if it is invalid, if the broker, the instrument or the series
        is unknown, or if the series has neither data nor a covered period in it.
        """
        period = check_deletion_period(start, end)
        return self._delete(DeletionKind.PERIOD, broker, instrument, data, period, execute=False)

    def delete_period(
        self, broker: str, instrument: str, data: str, start: datetime, end: datetime
    ) -> Deletion:
        """Delete the candles or ticks in a period and take the period out of the covered
        periods of the series, in one transaction. A series without a candle or tick left is
        removed. Returns what was removed."""
        period = check_deletion_period(start, end)
        return self._delete(DeletionKind.PERIOD, broker, instrument, data, period, execute=True)

    def plan_delete_contract(self, broker: str, instrument: str) -> Deletion:
        """What ``delete_contract`` would remove; nothing is changed."""
        return self._delete(DeletionKind.CONTRACT, broker, instrument, None, None, execute=False)

    def delete_contract(self, broker: str, instrument: str) -> Deletion:
        """Delete all instrument data of an instrument at a broker, in one transaction."""
        return self._delete(DeletionKind.CONTRACT, broker, instrument, None, None, execute=True)

    def plan_delete_broker(self, broker: str) -> Deletion:
        """What ``delete_broker`` would remove; nothing is changed."""
        return self._delete(DeletionKind.BROKER, broker, None, None, None, execute=False)

    def delete_broker(self, broker: str) -> Deletion:
        """Delete all series and all instrument data of a broker, in one transaction. The broker
        does not occur in the data store afterwards."""
        return self._delete(DeletionKind.BROKER, broker, None, None, None, execute=True)

    def _delete(
        self,
        kind: DeletionKind,
        broker: str,
        instrument: str | None,
        data: str | None,
        period: Interval | None,
        *,
        execute: bool,
    ) -> Deletion:
        with _database_errors(), self._engine.begin() as connection:
            deletion = run_deletion(
                connection, kind, broker, instrument, data, period, execute=execute
            )
        if execute:
            return_space(self._engine)  # after the commit (specification 5.6)
        return deletion
