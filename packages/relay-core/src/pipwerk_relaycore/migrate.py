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


def alembic_config(connection: Connection, directory: Path) -> Config:
    """The Alembic configuration for a directory of migrations on one connection.

    The ``env.py`` of the directory reads the connection from ``config.attributes``.
    """
    config = Config()
    # Alembic reads this value through ConfigParser; "%" needs to be doubled.
    config.set_main_option("script_location", str(directory).replace("%", "%%"))
    config.attributes["connection"] = connection
    return config


def _upgrade_in_sqlite_transaction(connection: Connection, directory: Path) -> None:
    connection.execution_options(isolation_level="AUTOCOMMIT")
    connection.exec_driver_sql("BEGIN IMMEDIATE")
    try:
        command.upgrade(alembic_config(connection, directory), "head")
        connection.exec_driver_sql("COMMIT")
    except BaseException:
        with contextlib.suppress(DBAPIError):
            connection.exec_driver_sql("ROLLBACK")
        raise


def migrate_scripts(engine: Engine, directory: Path, subject: str) -> None:
    """Bring the database of ``engine`` to the newest version of the migrations in ``directory``.

    The same all-or-nothing procedure as ``migrate_database``; it is meant for the migrations of
    a program that uses this library (the relay). ``subject`` names what is migrated, for the
    text of an error. The ``env.py`` in ``directory`` must keep its own version table.
    """
    with engine.connect() as connection:
        try:
            if connection.dialect.name == "sqlite":
                _upgrade_in_sqlite_transaction(connection, directory)
            else:
                with connection.begin():
                    command.upgrade(alembic_config(connection, directory), "head")
        except CommandError as error:
            raise DatabaseMigrationError(
                f"The {subject} schema cannot be updated by this version of the program."
            ) from error
        except Exception as error:
            raise DatabaseMigrationError(
                f"A migration of the {subject} schema failed. The changes were rolled back."
            ) from error


def migrate_database(engine: Engine) -> None:
    """Bring the database of ``engine`` to the newest schema, all or nothing.

    A database that cannot be reached raises the error of SQLAlchemy. A failure of the
    migrations themselves raises ``DatabaseMigrationError`` after the rollback.
    """
    migrate_scripts(engine, MIGRATIONS_DIRECTORY, "connector")
