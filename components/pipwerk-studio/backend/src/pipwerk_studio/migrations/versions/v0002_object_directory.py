"""Add the setting "object directory" to studio_settings.

Without a value (NULL) the default of the object directory applies.

Revision ID: 0002
Revises: 0001
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "studio_settings",
        sa.Column("object_directory", sa.String(length=4096), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("studio_settings", "object_directory")
