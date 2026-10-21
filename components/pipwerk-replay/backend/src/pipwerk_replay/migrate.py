"""Versioned database schema of pipwerk replay (Alembic).

``migrate_database`` brings the configured database to the newest schema at
startup. The migrations live in the package ``pipwerk_replay.migrations`` and
are shipped with the installation. Alembic gets the connection from the
application; the database URL comes from the startup configuration only.

All migrations of one start, including the version table, run in one
transaction. If one fails, the transaction is rolled back and the database is as
it was before; the next start begins again. The migration takes exactly one
connection from the engine it is given. On SQLite the driver ``sqlite3``
commits a DDL statement at once, outside the transaction of the connection, so
for this one connection the transaction control of the driver is switched off
(``AUTOCOMMIT``) and the migration runs ``BEGIN IMMEDIATE``, ``COMMIT`` and
``ROLLBACK`` itself. ``BEGIN IMMEDIATE`` takes the write lock first, so a
second process that starts at the same time waits (busy timeout) instead of
failing. When the connection is returned to the pool, SQLAlchemy restores the
default setting of the driver. The engine is not changed otherwise. Other
databases use the usual transaction of SQLAlchemy.
"""

from __future__ import annotations

import contextlib
from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.util.exc import CommandError
from sqlalchemy.engine import Connection, Engine
from sqlalchemy.exc import DBAPIError

MIGRATIONS_DIRECTORY = Path(__file__).resolve().parent / "migrations"


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


def _upgrade(connection: Connection) -> None:
    command.upgrade(_alembic_config(connection), "head")


def _upgrade_in_sqlite_transaction(connection: Connection) -> None:
    """Run the migration in one transaction that SQLite really rolls back."""
    connection.execution_options(isolation_level="AUTOCOMMIT")
    connection.exec_driver_sql("BEGIN IMMEDIATE")
    try:
        _upgrade(connection)
        connection.exec_driver_sql("COMMIT")
    except BaseException:
        with contextlib.suppress(DBAPIError):
            connection.exec_driver_sql("ROLLBACK")
        raise


def migrate_database(engine: Engine) -> None:
    """Bring the database of ``engine`` to the newest schema, all or nothing.

    A database that cannot be reached raises the error of SQLAlchemy as before.
    A failure of the migrations themselves raises ``DatabaseMigrationError``
    after the transaction was rolled back.
    """
    with engine.connect() as connection:
        try:
            if connection.dialect.name == "sqlite":
                _upgrade_in_sqlite_transaction(connection)
            else:
                with connection.begin():
                    _upgrade(connection)
        except DatabaseMigrationError:
            raise
        except CommandError as error:
            # For example a database written by a newer version of pipwerk replay.
            raise DatabaseMigrationError(
                "The database schema cannot be updated by this version of pipwerk replay."
            ) from error
        except Exception as error:
            raise DatabaseMigrationError(
                "A migration of the pipwerk replay database schema failed. "
                "The changes of this start were rolled back."
            ) from error
