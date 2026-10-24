"""The tables of the relay (SQLAlchemy Core, specification E6).

``relay_queue``
    The messages the relay has accepted and not yet handed over: the message with its list of
    relays, the number and size of its attachments (the attachments themselves lie in the
    directory for attachments, under the key of the entry), the number of attempts and the time
    of the next one.
``relay_seen``
    The handovers the relay has seen: message id and number of entries in ``hops`` (specification
    4.1 step 4), with the moment. A handover that comes again is dropped (E4).
``relay_config``
    The operating configuration: one row with the version and the JSON document.

The migrations in ``pipwerk_relay.migrations`` create exactly these tables; a test compares both.
"""

import sqlalchemy as sa
from pipwerk_relaycore.tables import UtcDateTime

VERSION_TABLE = "relay_alembic_version"
"""Version table of Alembic of the relay."""

metadata = sa.MetaData()

queue = sa.Table(
    "relay_queue",
    metadata,
    sa.Column("seq", sa.Integer, primary_key=True, autoincrement=True),
    sa.Column("entry_key", sa.String(length=36), nullable=False, unique=True),
    sa.Column("message_id", sa.String(length=36), nullable=False),
    sa.Column("kind", sa.String(length=64), nullable=False),
    sa.Column("sender", sa.String(length=191), nullable=False),
    sa.Column("recipient", sa.String(length=191), nullable=False),
    sa.Column("message_json", sa.Text, nullable=False),
    sa.Column("hops_json", sa.Text, nullable=False),
    sa.Column("attachment_count", sa.Integer, nullable=False),
    sa.Column("attachment_bytes", sa.BigInteger, nullable=False),
    sa.Column("created_at", UtcDateTime(), nullable=False),
    sa.Column("attempts", sa.Integer, nullable=False),
    sa.Column("next_attempt_at", UtcDateTime(), nullable=False),
    sa.Column("last_error", sa.String(length=64), nullable=True),
    sa.Index("ix_relay_queue_next_attempt_at", "next_attempt_at"),
    sqlite_autoincrement=True,
)

seen = sa.Table(
    "relay_seen",
    metadata,
    sa.Column("message_id", sa.String(length=36), primary_key=True),
    sa.Column("hops", sa.Integer, primary_key=True, autoincrement=False),
    sa.Column("seen_at", UtcDateTime(), nullable=False),
    sa.Index("ix_relay_seen_seen_at", "seen_at"),
)

config = sa.Table(
    "relay_config",
    metadata,
    sa.Column("id", sa.Integer, primary_key=True, autoincrement=False),
    sa.Column("version", sa.Integer, nullable=False),
    sa.Column("document", sa.Text, nullable=False),
    sa.Column("loaded_at", UtcDateTime(), nullable=False),
    sa.CheckConstraint("id = 1", name="ck_relay_config_single_row"),
)
