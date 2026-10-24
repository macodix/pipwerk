"""Initial schema: seen message ids and messages that wait for a receipt.

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
        "relaycore_seen",
        sa.Column("message_id", sa.String(length=36), nullable=False),
        sa.Column("seen_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("message_id"),
    )
    op.create_index("ix_relaycore_seen_seen_at", "relaycore_seen", ["seen_at"])
    op.create_table(
        "relaycore_waiting",
        sa.Column("message_id", sa.String(length=36), nullable=False),
        sa.Column("kind", sa.String(length=64), nullable=False),
        sa.Column("recipient", sa.String(length=191), nullable=False),
        sa.Column("sent_at", sa.DateTime(), nullable=False),
        sa.Column("deadline", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("message_id"),
    )
    op.create_index("ix_relaycore_waiting_deadline", "relaycore_waiting", ["deadline"])


def downgrade() -> None:
    op.drop_index("ix_relaycore_waiting_deadline", table_name="relaycore_waiting")
    op.drop_table("relaycore_waiting")
    op.drop_index("ix_relaycore_seen_seen_at", table_name="relaycore_seen")
    op.drop_table("relaycore_seen")
