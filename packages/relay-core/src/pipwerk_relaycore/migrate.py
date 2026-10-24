"""Versioned database schema of the connector (Alembic).

``migrate_database`` brings the database of an engine to the newest schema. The caller decides
when (the connector does it when it is opened) and passes the engine; the library never opens
a database by itself.

The library may share the database with tables of the caller: it creates only tables named
``relaycore_*`` and keeps its version in its own table ``relaycore_alembic_version``. A version
table of the caller (``alembic_version``) is not touched.

All migrations of one call run in one transaction. If one fails, the transaction is rolled back
and the database is as before. The migration takes exactly one connection from the engine. On
SQLite the driver ``sqlite3`` commits a DDL statement at once, outside the transaction of the
connection, so for this one connection the transaction control of the driver is switched off
(``AUTOCOMMIT``) and the migration runs ``BEGIN IMMEDIATE``, ``COMMIT`` and ``ROLLBACK``
itself. ``BEGIN IMMEDIATE`` takes the write lock first, so a second process that migrates at the
same time waits instead of failing. Other databases use the usual transaction of SQLAlchemy.
"""

import contextlib
from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.util.exc import CommandError
from sqlalchemy.engine import Connection, Engine
from sqlalchemy.exc import DBAPIError

from pipwerk_relaycore.errors import DatabaseMigrationError

MIGRATIONS_DIRECTORY = Path(__file__).resolve().parent / "migrations"


def _alembic_config(connection: Connection) -> Config:
    config = Config()
    # Alembic reads this value through ConfigParser; "%" needs to be doubled.
    config.set_main_option("script_location", str(MIGRATIONS_DIRECTORY).replace("%", "%%"))
    config.attributes["connection"] = connection
    return config


def _upgrade_in_sqlite_transaction(connection: Connection) -> None:
    connection.execution_options(isolation_level="AUTOCOMMIT")
    connection.exec_driver_sql("BEGIN IMMEDIATE")
    try:
        command.upgrade(_alembic_config(connection), "head")
        connection.exec_driver_sql("COMMIT")
    except BaseException:
        with contextlib.suppress(DBAPIError):
            connection.exec_driver_sql("ROLLBACK")
        raise


def migrate_database(engine: Engine) -> None:
    """Bring the database of ``engine`` to the newest schema, all or nothing.

    A database that cannot be reached raises the error of SQLAlchemy. A failure of the
    migrations themselves raises ``DatabaseMigrationError`` after the rollback.
    """
    with engine.connect() as connection:
        try:
            if connection.dialect.name == "sqlite":
                _upgrade_in_sqlite_transaction(connection)
            else:
                with connection.begin():
                    command.upgrade(_alembic_config(connection), "head")
        except CommandError as error:
            raise DatabaseMigrationError(
                "The database schema cannot be updated by this version of the library."
            ) from error
        except Exception as error:
            raise DatabaseMigrationError(
                "A migration of the connector schema failed. The changes were rolled back."
            ) from error
