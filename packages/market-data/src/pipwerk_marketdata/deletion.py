"""Deleting data (specification 5.5): series, periods, instrument data and all data of a broker.

Every function works inside the transaction of the connection it gets; the caller opens and ends
the transaction (``MarketDataStore``). ``plan`` computes what a deletion removes and changes
nothing; ``delete`` computes the same and then removes it.

The tables are emptied one by one and not through ``ON DELETE CASCADE``: SQLite checks foreign
keys only if asked to, and the data store must not depend on that.
"""

from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.engine import Connection

from pipwerk_marketdata import tables
from pipwerk_marketdata.completeness import subtract
from pipwerk_marketdata.errors import DeletionError
from pipwerk_marketdata.limits import MAX_MOMENT, MIN_MOMENT
from pipwerk_marketdata.records import Deletion, DeletionErrorCode, DeletionKind, Interval
from pipwerk_marketdata.timeunits import TICKS, TIME_UNITS, require_utc

_CHUNK = 500


def check_period(start: datetime, end: datetime) -> Interval:
    """The period to delete. ``ValueError`` for a moment without time zone; ``DeletionError`` for
    a period that is not valid (not on the minute, not ending after it starts, outside the
    supported times)."""
    start_utc, end_utc = require_utc(start), require_utc(end)
    on_minute = start_utc.second == 0 and start_utc.microsecond == 0
    on_minute = on_minute and end_utc.second == 0 and end_utc.microsecond == 0
    if not on_minute or not MIN_MOMENT <= start_utc < end_utc <= MAX_MOMENT:
        raise DeletionError(
            DeletionErrorCode.PERIOD_INVALID,
            "The period must start before it ends, begin and end on a minute, and lie between "
            "1970-01-01T00:00:00Z and 2100-01-01T00:00:00Z.",
        )
    return Interval(start_utc, end_utc)


def run(
    connection: Connection,
    kind: DeletionKind,
    broker: str,
    instrument: str | None,
    data: str | None,
    period: Interval | None,
    *,
    execute: bool,
) -> Deletion:
    """Plan a deletion and, with ``execute``, carry it out. ``DeletionError`` if the broker,
    the instrument, the series or the period is unknown."""
    _require_broker(connection, broker)
    if kind is DeletionKind.BROKER:
        return _delete_broker(connection, broker, execute)
    assert instrument is not None  # noqa: S101 - set for every other kind
    _require_instrument(connection, broker, instrument)
    if kind is DeletionKind.CONTRACT:
        return _delete_contract(connection, broker, instrument, execute)
    assert data is not None  # noqa: S101 - set for a series and a period
    series_id = _require_series(connection, broker, instrument, data)
    if kind is DeletionKind.SERIES:
        return _delete_series(connection, broker, instrument, data, series_id, execute)
    assert period is not None  # noqa: S101 - set for a period
    return _delete_period(connection, broker, instrument, data, series_id, period, execute)


def _delete_series(
    connection: Connection,
    broker: str,
    instrument: str,
    data: str,
    series_id: int,
    execute: bool,
) -> Deletion:
    count = _count_rows(connection, series_id, data)
    deletion = Deletion(
        kind=DeletionKind.SERIES,
        broker=broker,
        instrument=instrument,
        data=data,
        start=None,
        end=None,
        candle_count=0 if data == TICKS else count,
        tick_count=count if data == TICKS else 0,
        series_count=1,
        instrument_count=0,
        broker_removed=not _broker_remains(connection, broker, [series_id], None),
    )
    if execute:
        _remove_series(connection, [series_id])
    return deletion


def _delete_period(
    connection: Connection,
    broker: str,
    instrument: str,
    data: str,
    series_id: int,
    period: Interval,
    execute: bool,
) -> Deletion:
    table, column = _rows_of(data)
    in_period = sa.and_(table.c.series_id == series_id, column >= period.start, column < period.end)
    removed = int(
        connection.execute(
            sa.select(sa.func.count()).select_from(table).where(in_period)
        ).scalar_one()
    )
    coverage = tables.coverage
    touched = connection.execute(
        sa.select(sa.func.count()).where(
            coverage.c.series_id == series_id,
            coverage.c.period_start < period.end,
            coverage.c.period_end > period.start,
        )
    ).scalar_one()
    if removed == 0 and touched == 0:
        raise DeletionError(
            DeletionErrorCode.PERIOD_EMPTY,
            "The series has neither data nor a covered period in this period.",
        )
    vanishes = removed == _count_rows(connection, series_id, data)
    deletion = Deletion(
        kind=DeletionKind.PERIOD,
        broker=broker,
        instrument=instrument,
        data=data,
        start=period.start,
        end=period.end,
        candle_count=0 if data == TICKS else removed,
        tick_count=removed if data == TICKS else 0,
        series_count=1 if vanishes else 0,
        instrument_count=0,
        broker_removed=vanishes and not _broker_remains(connection, broker, [series_id], None),
    )
    if execute:
        if vanishes:
            _remove_series(connection, [series_id])
        else:
            connection.execute(sa.delete(table).where(in_period))
            _remove_coverage(connection, series_id, period)
    return deletion


def _delete_contract(
    connection: Connection, broker: str, instrument: str, execute: bool
) -> Deletion:
    table = tables.instrument
    match = sa.and_(table.c.broker == broker, table.c.instrument == instrument)
    if connection.execute(sa.select(sa.func.count()).where(match)).scalar_one() == 0:
        raise DeletionError(
            DeletionErrorCode.CONTRACT_UNKNOWN,
            "The instrument has no instrument data at this broker.",
        )
    deletion = Deletion(
        kind=DeletionKind.CONTRACT,
        broker=broker,
        instrument=instrument,
        data=None,
        start=None,
        end=None,
        candle_count=0,
        tick_count=0,
        series_count=0,
        instrument_count=1,
        broker_removed=not _broker_remains(connection, broker, [], instrument),
    )
    if execute:
        connection.execute(sa.delete(table).where(match))
    return deletion


def _delete_broker(connection: Connection, broker: str, execute: bool) -> Deletion:
    series = tables.series
    rows = connection.execute(
        sa.select(series.c.id, series.c.unit).where(series.c.broker == broker)
    ).all()
    candles = sum(_count_rows(connection, row[0], row[1]) for row in rows if row[1] != TICKS)
    ticks = sum(_count_rows(connection, row[0], row[1]) for row in rows if row[1] == TICKS)
    instruments = connection.execute(
        sa.select(sa.func.count(sa.distinct(tables.instrument.c.instrument))).where(
            tables.instrument.c.broker == broker
        )
    ).scalar_one()
    deletion = Deletion(
        kind=DeletionKind.BROKER,
        broker=broker,
        instrument=None,
        data=None,
        start=None,
        end=None,
        candle_count=candles,
        tick_count=ticks,
        series_count=len(rows),
        instrument_count=instruments,
        broker_removed=True,
    )
    if execute:
        _remove_series(connection, [row[0] for row in rows])
        connection.execute(sa.delete(tables.instrument).where(tables.instrument.c.broker == broker))
    return deletion


def broker_names(connection: Connection) -> set[str]:
    """The brokers that occur in the data store: those of a series or of instrument data."""
    names = {row[0] for row in connection.execute(sa.select(tables.series.c.broker).distinct())}
    names |= {
        row[0] for row in connection.execute(sa.select(tables.instrument.c.broker).distinct())
    }
    return names


def _require_broker(connection: Connection, broker: str) -> None:
    if broker not in broker_names(connection):
        raise DeletionError(
            DeletionErrorCode.BROKER_UNKNOWN, "The broker does not occur in the data store."
        )


def _require_instrument(connection: Connection, broker: str, instrument: str) -> None:
    series = connection.execute(
        sa.select(tables.series.c.id)
        .where(tables.series.c.broker == broker, tables.series.c.instrument == instrument)
        .limit(1)
    ).first()
    contract = connection.execute(
        sa.select(tables.instrument.c.broker)
        .where(tables.instrument.c.broker == broker, tables.instrument.c.instrument == instrument)
        .limit(1)
    ).first()
    if series is None and contract is None:
        raise DeletionError(
            DeletionErrorCode.INSTRUMENT_UNKNOWN,
            "The broker has no data of this instrument in the data store.",
        )


def _require_series(connection: Connection, broker: str, instrument: str, data: str) -> int:
    found = None
    if data == TICKS or data in TIME_UNITS:
        found = connection.execute(
            sa.select(tables.series.c.id).where(
                tables.series.c.broker == broker,
                tables.series.c.instrument == instrument,
                tables.series.c.unit == data,
            )
        ).scalar()
    if found is None:
        raise DeletionError(
            DeletionErrorCode.SERIES_UNKNOWN,
            "The instrument has no such series (candles of this time unit or ticks) at this "
            "broker.",
        )
    return int(found)


def _broker_remains(
    connection: Connection,
    broker: str,
    removed_series: list[int],
    removed_instrument: str | None,
) -> bool:
    """Whether the broker still occurs after the series and the instrument data are removed."""
    series_left = connection.execute(
        sa.select(sa.func.count()).where(
            tables.series.c.broker == broker, tables.series.c.id.not_in(removed_series)
        )
    ).scalar_one()
    contract = tables.instrument
    condition = contract.c.broker == broker
    if removed_instrument is not None:
        condition = sa.and_(condition, contract.c.instrument != removed_instrument)
    contract_left = connection.execute(sa.select(sa.func.count()).where(condition)).scalar_one()
    return bool(series_left or contract_left)


def _rows_of(data: str) -> tuple[sa.Table, sa.Column[datetime]]:
    """The table of the rows of a series (ticks or candles) and its column of moments."""
    if data == TICKS:
        return tables.tick, tables.tick.c.moment
    return tables.candle, tables.candle.c.opened_at


def _count_rows(connection: Connection, series_id: int, data: str) -> int:
    table, _ = _rows_of(data)
    return int(
        connection.execute(
            sa.select(sa.func.count()).select_from(table).where(table.c.series_id == series_id)
        ).scalar_one()
    )


def _remove_series(connection: Connection, series_ids: list[int]) -> None:
    """Delete series with everything that belongs to them."""
    for start in range(0, len(series_ids), _CHUNK):
        chunk = series_ids[start : start + _CHUNK]
        for table in (tables.candle, tables.tick, tables.coverage, tables.session):
            connection.execute(sa.delete(table).where(table.c.series_id.in_(chunk)))
        connection.execute(sa.delete(tables.series).where(tables.series.c.id.in_(chunk)))


def _remove_coverage(connection: Connection, series_id: int, period: Interval) -> None:
    """Take a period out of the covered periods of a series."""
    table = tables.coverage
    touching = connection.execute(
        sa.select(table.c.id, table.c.period_start, table.c.period_end).where(
            table.c.series_id == series_id,
            table.c.period_start < period.end,
            table.c.period_end > period.start,
        )
    ).all()
    connection.execute(sa.delete(table).where(table.c.id.in_([row[0] for row in touching])))
    for row in touching:
        for part in subtract(Interval(row[1], row[2]), [period]):
            connection.execute(
                sa.insert(table).values(
                    series_id=series_id, period_start=part.start, period_end=part.end
                )
            )
