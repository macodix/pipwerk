"""Initial schema: the table studio_settings with the user interface language.

This is the schema that pipwerk Studio created before Alembic was introduced.
A database of that stage without the version table of Alembic is recognised
as this revision (``pipwerk_studio.migrate``).

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
        "studio_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("language", sa.String(length=8), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("studio_settings")
