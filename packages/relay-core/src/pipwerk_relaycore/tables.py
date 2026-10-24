"""The tables of the connector (SQLAlchemy Core, specification E4, 3.7).

All table names begin with ``relaycore_`` so the tables can live in a database next to tables of
the component. The migrations in ``pipwerk_relaycore.migrations`` create exactly these tables;
a test compares both.

``relaycore_seen``
    The message ids that the component has stored, with the moment. A repetition of such a
    message is not handed over again (E4). The entries older than the period are removed.
``relaycore_waiting``
    The messages sent with ``receipt`` whose receipt has not arrived, with the deadline. They
    survive a restart (3.7).
"""

from datetime import UTC, datetime
from typing import Any

import sqlalchemy as sa
from sqlalchemy.engine import Dialect

VERSION_TABLE = "relaycore_alembic_version"
"""Version table of Alembic of this library (separate from the one of the component)."""

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


seen = sa.Table(
    "relaycore_seen",
    metadata,
    sa.Column("message_id", sa.String(length=36), primary_key=True),
    sa.Column("seen_at", UtcDateTime(), nullable=False),
    sa.Index("ix_relaycore_seen_seen_at", "seen_at"),
)

waiting = sa.Table(
    "relaycore_waiting",
    metadata,
    sa.Column("message_id", sa.String(length=36), primary_key=True),
    sa.Column("kind", sa.String(length=64), nullable=False),
    sa.Column("recipient", sa.String(length=191), nullable=False),
    sa.Column("sent_at", UtcDateTime(), nullable=False),
    sa.Column("deadline", UtcDateTime(), nullable=False),
    sa.Index("ix_relaycore_waiting_deadline", "deadline"),
)
