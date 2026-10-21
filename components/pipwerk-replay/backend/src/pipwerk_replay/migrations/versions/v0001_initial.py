"""Initial schema: the settings of pipwerk replay and the test accounts.

Creates the table ``replay_settings`` (one row, the language) and the table
``test_accounts`` (specification 6.2).

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
        "replay_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("language", sa.String(length=8), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "test_accounts",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("initial_capital", sa.Float(), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("leverage", sa.Integer(), nullable=False),
        sa.Column("spread_mode", sa.String(length=8), nullable=False),
        sa.Column("spread_points", sa.Float(), nullable=True),
        sa.Column("commission_per_lot_side", sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("test_accounts")
    op.drop_table("replay_settings")
