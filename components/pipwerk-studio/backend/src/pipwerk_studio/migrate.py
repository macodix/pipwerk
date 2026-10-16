"""Versioned database schema of pipwerk Studio (Alembic).

``migrate_database`` brings the configured database to the newest schema at
startup. The migrations live in the package ``pipwerk_studio.migrations`` and
are shipped with the installation. Alembic gets the connection from the
application; the database URL comes from the startup configuration only.

Three starting points are handled:

- a new database (no table of pipwerk Studio): all migrations run;
- a database of the schema before Alembic was introduced (table
  ``studio_settings`` with the columns ``id`` and ``language``, no version
  table of Alembic): it is recognised as the first migration and then updated;
- a current database: nothing changes.
"""

from __future__ import annotations

from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.util.exc import CommandError
from sqlalchemy import inspect
from sqlalchemy.engine import Connection, Engine

MIGRATIONS_DIRECTORY = Path(__file__).resolve().parent / "migrations"

#: Revision that equals the schema created before Alembic was introduced.
INITIAL_REVISION = "0001"

_VERSION_TABLE = "alembic_version"
_SETTINGS_TABLE = "studio_settings"
_INITIAL_SETTINGS_COLUMNS = frozenset({"id", "language"})


class DatabaseMigrationError(Exception):
    """Raised when the database cannot be brought to the current schema.

    The message is fixed and names no database content.
    """


def _alembic_config(connection: Connection) -> Config:
    config = Config()
    # Alembic reads this value through ConfigParser; "%" needs to be doubled.
    config.set_main_option("script_location", str(MIGRATIONS_DIRECTORY).replace("%", "%%"))
    config.attributes["connection"] = connection
    return config


def _is_unversioned_initial_schema(connection: Connection) -> bool:
    """Tell whether the database has the schema from before Alembic.

    Raises ``DatabaseMigrationError`` if table ``studio_settings`` exists
    without a version table but does not have the expected columns.
    """
    inspector = inspect(connection)
    tables = set(inspector.get_table_names())
    if _VERSION_TABLE in tables or _SETTINGS_TABLE not in tables:
        return False
    columns = {column["name"] for column in inspector.get_columns(_SETTINGS_TABLE)}
    if columns != _INITIAL_SETTINGS_COLUMNS:
        raise DatabaseMigrationError(
            "The database has a pipwerk Studio schema that is not known to this version."
        )
    return True


def migrate_database(engine: Engine) -> None:
    """Bring the database of ``engine`` to the newest schema."""
    try:
        with engine.begin() as connection:
            config = _alembic_config(connection)
            if _is_unversioned_initial_schema(connection):
                command.stamp(config, INITIAL_REVISION)
            command.upgrade(config, "head")
    except CommandError as error:
        # For example a database written by a newer version of pipwerk Studio.
        raise DatabaseMigrationError(
            "The database schema cannot be updated by this version of pipwerk Studio."
        ) from error
