"""The settings for files and directories (specification 5.7).

The table ``replay_settings`` gets four columns: ``keep_imported_files`` (the preset of the box
"Dateien behalten" of the import, ``false`` for the rows that exist) and the three directories
``storage_directory``, ``import_directory`` and ``export_directory`` (absolute paths, ``NULL``:
the default of the operating system applies). The downgrade drops them.

Revision ID: 0004
Revises: 0003
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("replay_settings") as table:
        table.add_column(
            sa.Column(
                "keep_imported_files", sa.Boolean(), nullable=False, server_default=sa.false()
            )
        )
        table.add_column(sa.Column("storage_directory", sa.String(length=4096), nullable=True))
        table.add_column(sa.Column("import_directory", sa.String(length=4096), nullable=True))
        table.add_column(sa.Column("export_directory", sa.String(length=4096), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("replay_settings") as table:
        table.drop_column("export_directory")
        table.drop_column("import_directory")
        table.drop_column("storage_directory")
        table.drop_column("keep_imported_files")
