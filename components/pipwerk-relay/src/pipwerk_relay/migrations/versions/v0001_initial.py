"""Initial schema: queue, seen handovers and operating configuration.

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
        "relay_queue",
        sa.Column("seq", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("entry_key", sa.String(length=36), nullable=False),
        sa.Column("message_id", sa.String(length=36), nullable=False),
        sa.Column("kind", sa.String(length=64), nullable=False),
        sa.Column("sender", sa.String(length=191), nullable=False),
        sa.Column("recipient", sa.String(length=191), nullable=False),
        sa.Column("message_json", sa.Text(), nullable=False),
        sa.Column("hops_json", sa.Text(), nullable=False),
        sa.Column("attachment_count", sa.Integer(), nullable=False),
        sa.Column("attachment_bytes", sa.BigInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("next_attempt_at", sa.DateTime(), nullable=False),
        sa.Column("last_error", sa.String(length=64), nullable=True),
        sa.PrimaryKeyConstraint("seq"),
        sa.UniqueConstraint("entry_key"),
        sqlite_autoincrement=True,
    )
    op.create_index("ix_relay_queue_next_attempt_at", "relay_queue", ["next_attempt_at"])
    op.create_table(
        "relay_seen",
        sa.Column("message_id", sa.String(length=36), autoincrement=False, nullable=False),
        sa.Column("hops", sa.Integer(), autoincrement=False, nullable=False),
        sa.Column("seen_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("message_id", "hops"),
    )
    op.create_index("ix_relay_seen_seen_at", "relay_seen", ["seen_at"])
    op.create_table(
        "relay_config",
        sa.Column("id", sa.Integer(), autoincrement=False, nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("document", sa.Text(), nullable=False),
        sa.Column("loaded_at", sa.DateTime(), nullable=False),
        sa.CheckConstraint("id = 1", name="ck_relay_config_single_row"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("relay_config")
    op.drop_index("ix_relay_seen_seen_at", table_name="relay_seen")
    op.drop_table("relay_seen")
    op.drop_index("ix_relay_queue_next_attempt_at", table_name="relay_queue")
    op.drop_table("relay_queue")
