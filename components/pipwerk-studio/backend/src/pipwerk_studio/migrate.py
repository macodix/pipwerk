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

All migrations of one start, including the version table, run in one
transaction. If one fails, the transaction is rolled back and the database is as
it was before; the next start begins again. On SQLite this needs explicit
transactions, which only the migration uses (own engine, see
``_sqlite_migration_engine``); the engine of the operation is not changed.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.util.exc import CommandError
from sqlalchemy import create_engine, event, inspect
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


def _sqlite_migration_engine(engine: Engine) -> Engine | None:
    """Return a separate engine with explicit transactions for a SQLite file.

    The driver ``sqlite3`` commits a DDL statement at once, outside the
    transaction of the connection, so a migration that failed half way would
    stay half done. This engine (used for the migration only, then discarded)
    turns off the implicit transaction control of the driver and begins each
    transaction with ``BEGIN IMMEDIATE``: the write lock is taken first, so a
    second process that starts at the same time waits (busy timeout) instead of
    failing. ``None`` for every other database and for an in-memory database,
    which exists only per connection.
    """
    if engine.dialect.name != "sqlite" or engine.url.database in (None, "", ":memory:"):
        return None
    migration_engine = create_engine(engine.url, connect_args={"timeout": 30})

    @event.listens_for(migration_engine, "connect")
    def disable_implicit_transactions(
        dbapi_connection: sqlite3.Connection, _record: object
    ) -> None:
        dbapi_connection.isolation_level = None

    @event.listens_for(migration_engine, "begin")
    def begin_immediately(connection: Connection) -> None:
        connection.exec_driver_sql("BEGIN IMMEDIATE")

    return migration_engine


def migrate_database(engine: Engine) -> None:
    """Bring the database of ``engine`` to the newest schema, all or nothing.

    A database that cannot be reached raises the error of SQLAlchemy as before.
    A failure of the migrations themselves raises ``DatabaseMigrationError``
    after the transaction was rolled back. ``engine`` itself is not changed.
    """
    migration_engine = _sqlite_migration_engine(engine)
    try:
        _migrate(engine if migration_engine is None else migration_engine)
    finally:
        if migration_engine is not None:
            migration_engine.dispose()


def _migrate(engine: Engine) -> None:
    with engine.connect() as connection:
        try:
            with connection.begin():
                config = _alembic_config(connection)
                if _is_unversioned_initial_schema(connection):
                    command.stamp(config, INITIAL_REVISION)
                command.upgrade(config, "head")
        except DatabaseMigrationError:
            raise
        except CommandError as error:
            # For example a database written by a newer version of pipwerk Studio.
            raise DatabaseMigrationError(
                "The database schema cannot be updated by this version of pipwerk Studio."
            ) from error
        except Exception as error:
            raise DatabaseMigrationError(
                "A migration of the pipwerk Studio database schema failed. "
                "The changes of this start were rolled back."
            ) from error
