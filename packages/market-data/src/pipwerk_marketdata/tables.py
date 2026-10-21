"""The tables of the data store (SQLAlchemy Core).

All table names begin with ``marketdata_`` so the tables can live in a database next to
tables of the caller. The migrations in ``pipwerk_marketdata.migrations`` create exactly these
tables; a test compares both.
"""

from datetime import UTC, datetime
from typing import Any

import sqlalchemy as sa
from sqlalchemy.engine import Dialect

VERSION_TABLE = "marketdata_alembic_version"
"""Version table of Alembic of this library (separate from the one of the caller)."""

metadata = sa.MetaData()


class UtcDateTime(sa.TypeDecorator[datetime]):
    """A moment stored as UTC without time zone; read back as aware UTC."""

    impl = sa.DateTime(timezone=False)
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("a moment needs a time zone")
        return value.astimezone(UTC).replace(tzinfo=None)

    def process_result_value(self, value: Any, dialect: Dialect) -> datetime | None:
        if value is None:
            return None
        moment: datetime = value.replace(tzinfo=UTC)
        return moment


series = sa.Table(
    "marketdata_series",
    metadata,
    sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
    sa.Column("broker", sa.String(128), nullable=False),
    sa.Column("instrument", sa.String(128), nullable=False),
    sa.Column("unit", sa.String(8), nullable=False),
    sa.UniqueConstraint("broker", "instrument", "unit", name="uq_marketdata_series"),
)

candle = sa.Table(
    "marketdata_candle",
    metadata,
    sa.Column(
        "series_id",
        sa.Integer(),
        sa.ForeignKey("marketdata_series.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    sa.Column("opened_at", UtcDateTime(), primary_key=True),
    sa.Column("open", sa.Float(), nullable=False),
    sa.Column("high", sa.Float(), nullable=False),
    sa.Column("low", sa.Float(), nullable=False),
    sa.Column("close", sa.Float(), nullable=False),
    sa.Column("volume", sa.BigInteger(), nullable=True),
    sa.Column("spread", sa.Integer(), nullable=True),
    sa.CheckConstraint("open > 0 AND high > 0 AND low > 0 AND close > 0", name="ck_candle_prices"),
    sa.CheckConstraint(
        "high >= open AND high >= low AND high >= close AND low <= open AND low <= close",
        name="ck_candle_relations",
    ),
)

tick = sa.Table(
    "marketdata_tick",
    metadata,
    sa.Column(
        "series_id",
        sa.Integer(),
        sa.ForeignKey("marketdata_series.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    sa.Column("moment", UtcDateTime(), primary_key=True),
    sa.Column("bid", sa.Float(), nullable=False),
    sa.Column("ask", sa.Float(), nullable=False),
    sa.CheckConstraint("bid > 0 AND ask > 0", name="ck_tick_prices"),
)

coverage = sa.Table(
    "marketdata_coverage",
    metadata,
    sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
    sa.Column(
        "series_id",
        sa.Integer(),
        sa.ForeignKey("marketdata_series.id", ondelete="CASCADE"),
        nullable=False,
    ),
    sa.Column("period_start", UtcDateTime(), nullable=False),
    sa.Column("period_end", UtcDateTime(), nullable=False),
    sa.CheckConstraint("period_start < period_end", name="ck_coverage_order"),
)
sa.Index("ix_marketdata_coverage_series", coverage.c.series_id)

session = sa.Table(
    "marketdata_session",
    metadata,
    sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
    sa.Column(
        "series_id",
        sa.Integer(),
        sa.ForeignKey("marketdata_series.id", ondelete="CASCADE"),
        nullable=False,
    ),
    sa.Column("weekday", sa.SmallInteger(), nullable=False),
    sa.Column("start_minute", sa.SmallInteger(), nullable=False),
    sa.Column("end_minute", sa.SmallInteger(), nullable=False),
    sa.CheckConstraint(
        "weekday >= 0 AND weekday <= 6 AND start_minute >= 0 AND start_minute < end_minute "
        "AND end_minute <= 1440",
        name="ck_session_range",
    ),
)
sa.Index("ix_marketdata_session_series", session.c.series_id)

instrument = sa.Table(
    "marketdata_instrument",
    metadata,
    sa.Column("broker", sa.String(128), primary_key=True),
    sa.Column("instrument", sa.String(128), primary_key=True),
    sa.Column("acquired_at", UtcDateTime(), primary_key=True),
    sa.Column("tick_size", sa.Float(), nullable=False),
    sa.Column("tick_value", sa.Float(), nullable=False),
    sa.Column("tick_value_currency", sa.String(10), nullable=False),
    sa.Column("point", sa.Float(), nullable=False),
    sa.Column("pip", sa.Float(), nullable=False),
    sa.Column("spread", sa.Float(), nullable=False),
    sa.Column("min_volume", sa.Float(), nullable=False),
    sa.Column("volume_step", sa.Float(), nullable=False),
    sa.Column("contract_size", sa.Float(), nullable=False),
    sa.Column("swap_long", sa.Float(), nullable=False),
    sa.Column("swap_short", sa.Float(), nullable=False),
    sa.Column("swap_triple_weekday", sa.SmallInteger(), nullable=False),
    sa.Column("margin_per_lot", sa.Float(), nullable=True),
)
