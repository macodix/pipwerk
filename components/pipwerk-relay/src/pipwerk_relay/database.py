"""The database of the relay: engine, migration and check of the schema version.

``pipwerk-relay migrate`` brings the database to the newest schema (Alembic, all or nothing, see
``pipwerk_relaycore.migrate_scripts``). Every other command that uses the database first checks
that the schema is the newest one and refuses otherwise: the operator decides when the schema
changes (technical rules 8.2 no. 10).
"""

from pathlib import Path

import sqlalchemy as sa
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from pipwerk_relaycore import migrate_scripts

from pipwerk_relay.errors import SchemaOutdated
from pipwerk_relay.tables import VERSION_TABLE

MIGRATIONS_DIRECTORY = Path(__file__).resolve().parent / "migrations"
DATABASE_BUSY_SECONDS = 30


def create_engine(url: sa.URL) -> sa.Engine:
    """The engine for the database of the startup configuration."""
    if url.get_backend_name() == "sqlite":
        return sa.create_engine(url, connect_args={"timeout": DATABASE_BUSY_SECONDS})
    return sa.create_engine(url)


def migrate(engine: sa.Engine) -> None:
    """Bring the database to the newest schema; raises ``DatabaseMigrationError``."""
    migrate_scripts(engine, MIGRATIONS_DIRECTORY, "relay")


def newest_revision() -> str | None:
    """The newest revision of the migrations of this version of the relay."""
    return ScriptDirectory(str(MIGRATIONS_DIRECTORY)).get_current_head()


def current_revision(engine: sa.Engine) -> str | None:
    """The revision the database is at; ``None`` if it was never migrated."""
    with engine.connect() as connection:
        context = MigrationContext.configure(connection, opts={"version_table": VERSION_TABLE})
        return context.get_current_revision()


def ensure_current_schema(engine: sa.Engine) -> None:
    """Raise ``SchemaOutdated`` unless the database is at the newest revision."""
    if current_revision(engine) != newest_revision():
        raise SchemaOutdated(
            "the database is not at the newest version of the schema; run 'pipwerk-relay migrate'"
        )
