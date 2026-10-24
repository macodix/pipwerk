"""Covered periods of series that were imported before: whole days in UTC.

Specification 5.2 lets a CSV file cover whole days, so that an early close of trading on the
last day of a file is no gap. Earlier versions stored the covered period of a series as the
period from the first to the last entry. The schema already holds the covered periods of each
series (table ``marketdata_coverage``) and does not change; this migration widens each stored
period to whole days in UTC (the start to the beginning of its day, the end to the beginning of
the next day, if it is not at a day boundary already) and joins periods that overlap or touch
afterwards. The time zone of an earlier import is not stored, so UTC is the choice that needs no
guess. The downgrade changes nothing: the widened periods stay.

Revision ID: 0002
Revises: 0001
"""

from collections.abc import Sequence
from datetime import datetime, timedelta

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_DAY = timedelta(days=1)
_LAST_DAY_START = datetime(2100, 1, 1)

_COVERAGE = sa.table(
    "marketdata_coverage",
    sa.column("id", sa.Integer()),
    sa.column("series_id", sa.Integer()),
    sa.column("period_start", sa.DateTime()),
    sa.column("period_end", sa.DateTime()),
)


def _day_start(moment: datetime) -> datetime:
    return moment.replace(hour=0, minute=0, second=0, microsecond=0)


def _widened(start: datetime, end: datetime) -> tuple[datetime, datetime]:
    first = _day_start(start)
    last = _day_start(end)
    if last < end:
        last += _DAY
    return first, min(last, _LAST_DAY_START)


def upgrade() -> None:
    bind = op.get_bind()
    rows = bind.execute(
        sa.select(_COVERAGE.c.series_id, _COVERAGE.c.period_start, _COVERAGE.c.period_end).order_by(
            _COVERAGE.c.series_id, _COVERAGE.c.period_start
        )
    ).all()
    merged: list[tuple[int, datetime, datetime]] = []
    for series_id, start, end in rows:
        first, last = _widened(start, end)
        if merged and merged[-1][0] == series_id and first <= merged[-1][2]:
            merged[-1] = (series_id, merged[-1][1], max(merged[-1][2], last))
        else:
            merged.append((series_id, first, last))
    bind.execute(sa.delete(_COVERAGE))
    if merged:
        bind.execute(
            sa.insert(_COVERAGE),
            [
                {"series_id": series_id, "period_start": start, "period_end": end}
                for series_id, start, end in merged
            ],
        )


def downgrade() -> None:
    """The schema is the same in both versions; the widened periods stay."""
