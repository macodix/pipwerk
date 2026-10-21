"""The default source: the broker whose data a test run uses (specification 5.1).

Adds the column ``default_source`` (name of the broker, ``NULL`` as long as none is set) to
the table ``replay_settings``. The rows that exist keep their language and get no default
source.

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
    with op.batch_alter_table("replay_settings") as table:
        table.add_column(sa.Column("default_source", sa.String(length=128), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("replay_settings") as table:
        table.drop_column("default_source")
