"""Initial schema: series, candles, ticks, coverage, trading sessions, instrument data.

Revision ID: 0001
Revises: -
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "marketdata_series",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("broker", sa.String(length=128), nullable=False),
        sa.Column("instrument", sa.String(length=128), nullable=False),
        sa.Column("unit", sa.String(length=8), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("broker", "instrument", "unit", name="uq_marketdata_series"),
    )
    op.create_table(
        "marketdata_candle",
        sa.Column("series_id", sa.Integer(), nullable=False),
        sa.Column("opened_at", sa.DateTime(), nullable=False),
        sa.Column("open", sa.Float(), nullable=False),
        sa.Column("high", sa.Float(), nullable=False),
        sa.Column("low", sa.Float(), nullable=False),
        sa.Column("close", sa.Float(), nullable=False),
        sa.Column("volume", sa.BigInteger(), nullable=True),
        sa.Column("spread", sa.Integer(), nullable=True),
        sa.CheckConstraint(
            "open > 0 AND high > 0 AND low > 0 AND close > 0", name="ck_candle_prices"
        ),
        sa.CheckConstraint(
            "high >= open AND high >= low AND high >= close AND low <= open AND low <= close",
            name="ck_candle_relations",
        ),
        sa.ForeignKeyConstraint(["series_id"], ["marketdata_series.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("series_id", "opened_at"),
    )
    op.create_table(
        "marketdata_tick",
        sa.Column("series_id", sa.Integer(), nullable=False),
        sa.Column("moment", sa.DateTime(), nullable=False),
        sa.Column("bid", sa.Float(), nullable=False),
        sa.Column("ask", sa.Float(), nullable=False),
        sa.CheckConstraint("bid > 0 AND ask > 0", name="ck_tick_prices"),
        sa.ForeignKeyConstraint(["series_id"], ["marketdata_series.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("series_id", "moment"),
    )
    op.create_table(
        "marketdata_coverage",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("series_id", sa.Integer(), nullable=False),
        sa.Column("period_start", sa.DateTime(), nullable=False),
        sa.Column("period_end", sa.DateTime(), nullable=False),
        sa.CheckConstraint("period_start < period_end", name="ck_coverage_order"),
        sa.ForeignKeyConstraint(["series_id"], ["marketdata_series.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_marketdata_coverage_series", "marketdata_coverage", ["series_id"])
    op.create_table(
        "marketdata_session",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("series_id", sa.Integer(), nullable=False),
        sa.Column("weekday", sa.SmallInteger(), nullable=False),
        sa.Column("start_minute", sa.SmallInteger(), nullable=False),
        sa.Column("end_minute", sa.SmallInteger(), nullable=False),
        sa.CheckConstraint(
            "weekday >= 0 AND weekday <= 6 AND start_minute >= 0 AND start_minute < end_minute "
            "AND end_minute <= 1440",
            name="ck_session_range",
        ),
        sa.ForeignKeyConstraint(["series_id"], ["marketdata_series.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_marketdata_session_series", "marketdata_session", ["series_id"])
    op.create_table(
        "marketdata_instrument",
        sa.Column("broker", sa.String(length=128), nullable=False),
        sa.Column("instrument", sa.String(length=128), nullable=False),
        sa.Column("acquired_at", sa.DateTime(), nullable=False),
        sa.Column("tick_size", sa.Float(), nullable=False),
        sa.Column("tick_value", sa.Float(), nullable=False),
        sa.Column("tick_value_currency", sa.String(length=10), nullable=False),
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
        sa.PrimaryKeyConstraint("broker", "instrument", "acquired_at"),
    )


def downgrade() -> None:
    op.drop_table("marketdata_instrument")
    op.drop_index("ix_marketdata_session_series", table_name="marketdata_session")
    op.drop_table("marketdata_session")
    op.drop_index("ix_marketdata_coverage_series", table_name="marketdata_coverage")
    op.drop_table("marketdata_coverage")
    op.drop_table("marketdata_tick")
    op.drop_table("marketdata_candle")
    op.drop_table("marketdata_series")
