"""Persistence infrastructure of pipwerk Studio.

SQLAlchemy is used as the shared storage interface (req-system-015) behind a
small application-level repository/service boundary.
SQLAlchemy ORM classes defined here are infrastructure only: they are never
the public domain or API representation of Studio settings.
"""

from __future__ import annotations

import sqlite3

from sqlalchemy import Integer, String, create_engine, event
from sqlalchemy.engine import Connection, Engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

from pipwerk_studio.migrate import migrate_database


class Base(DeclarativeBase):
    """Declarative base of the pipwerk Studio persistence schema."""


#: Fixed primary key of the single Studio settings row. Studio settings are
#: a singleton operational configuration: exactly one
#: central language setting exists, never one per user or session.
SETTINGS_SINGLETON_ID = 1


class StudioSettingsRecord(Base):
    """ORM row holding the operational settings of pipwerk Studio.

    The backend-authoritative language setting and the object directory are
    modelled here. The UI language is never stored in the browser
    (localStorage, sessionStorage, cookies) and never as part of strategy
    data. ``object_directory`` is ``NULL`` as long as the default applies. The
    schema is created and changed by the Alembic migrations in
    ``pipwerk_studio.migrations``, not by this class.
    """

    __tablename__ = "studio_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    language: Mapped[str] = mapped_column(String(8), nullable=False)
    object_directory: Mapped[str | None] = mapped_column(String(4096), nullable=True)


def create_studio_engine(database_url: str) -> Engine:
    """Create the SQLAlchemy engine and bring the database to the newest schema.

    The schema is migrated with Alembic (``pipwerk_studio.migrate``).
    """
    connect_args: dict[str, object] = {}
    if database_url.startswith("sqlite"):
        # check_same_thread=False allows the engine to serve FastAPI's worker
        # threads; a busy timeout makes concurrent write transactions wait for
        # the SQLite file lock instead of failing immediately.
        connect_args = {"check_same_thread": False, "timeout": 30}
    engine = create_engine(database_url, connect_args=connect_args)
    if database_url.startswith("sqlite"):
        _make_sqlite_transactions_explicit(engine)
    migrate_database(engine)
    return engine


def _make_sqlite_transactions_explicit(engine: Engine) -> None:
    """Let SQLite run schema changes inside the transaction of the connection.

    The driver ``sqlite3`` does not open a transaction before a DDL statement
    and commits such a statement at once. A migration that failed half way would
    then stay half done. With the documented SQLAlchemy recipe the driver does
    not start transactions itself and SQLAlchemy begins each one explicitly, so
    a failed migration is rolled back as a whole.
    """

    @event.listens_for(engine, "connect")
    def disable_implicit_transactions(
        dbapi_connection: sqlite3.Connection, _record: object
    ) -> None:
        dbapi_connection.isolation_level = None

    @event.listens_for(engine, "begin")
    def begin_explicitly(connection: Connection) -> None:
        connection.exec_driver_sql("BEGIN")


def create_session_factory(engine: Engine) -> sessionmaker[Session]:
    """Create a session factory bound to the given engine."""
    return sessionmaker(bind=engine, expire_on_commit=False)
