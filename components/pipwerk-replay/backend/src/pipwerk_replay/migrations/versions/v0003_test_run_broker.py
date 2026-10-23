"""The broker for test runs replaces the default source (specification 5.1).

The column ``default_source`` of the table ``replay_settings`` is replaced by
``test_run_broker``: the name of the broker whose data a test run uses, ``NULL`` as long as none
is chosen. The value of the old column is taken over, so a choice made before stays; the old
column is dropped. The downgrade does the same the other way round.

Revision ID: 0003
Revises: 0002
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_SETTINGS = sa.table(
    "replay_settings",
    sa.column("default_source", sa.String(length=128)),
    sa.column("test_run_broker", sa.String(length=128)),
)


def upgrade() -> None:
    with op.batch_alter_table("replay_settings") as table:
        table.add_column(sa.Column("test_run_broker", sa.String(length=128), nullable=True))
    op.execute(_SETTINGS.update().values(test_run_broker=_SETTINGS.c.default_source))
    with op.batch_alter_table("replay_settings") as table:
        table.drop_column("default_source")


def downgrade() -> None:
    with op.batch_alter_table("replay_settings") as table:
        table.add_column(sa.Column("default_source", sa.String(length=128), nullable=True))
    op.execute(_SETTINGS.update().values(default_source=_SETTINGS.c.test_run_broker))
    with op.batch_alter_table("replay_settings") as table:
        table.drop_column("test_run_broker")
