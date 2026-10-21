"""Persistence infrastructure of pipwerk replay.

SQLAlchemy is used as the shared storage interface (req-system-015) behind a
small application-level service boundary. The ORM classes defined here are
infrastructure only: they are never the public representation of settings or
test accounts.
"""

from __future__ import annotations

from pipwerk_marketdata import DatabaseMigrationError as MarketDataMigrationError
from pipwerk_marketdata import migrate_database as migrate_marketdata_database
from sqlalchemy import Float, Integer, String, create_engine
from sqlalchemy.engine import Engine, make_url
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker
from sqlalchemy.pool import StaticPool

from pipwerk_replay.migrate import DatabaseMigrationError, migrate_database


class Base(DeclarativeBase):
    """Declarative base of the pipwerk replay persistence schema."""


#: Fixed primary key of the single settings row. The settings are a singleton
#: operational configuration of the component, never one per user or session.
SETTINGS_SINGLETON_ID = 1


class SettingsRecord(Base):
    """ORM row holding the operational settings of pipwerk replay.

    The backend-authoritative language setting is modelled here. It is never
    stored in the browser. The schema is created and changed by the Alembic
    migrations in ``pipwerk_replay.migrations``, not by this class.
    """

    __tablename__ = "replay_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    language: Mapped[str] = mapped_column(String(8), nullable=False)
    #: Name of the broker of the default source (specification 5.1); ``NULL``: none is set.
    default_source: Mapped[str | None] = mapped_column(String(128), nullable=True)


class AccountRecord(Base):
    """ORM row of a test account (specification 6.2)."""

    __tablename__ = "test_accounts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    initial_capital: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    leverage: Mapped[int] = mapped_column(Integer, nullable=False)
    spread_mode: Mapped[str] = mapped_column(String(8), nullable=False)
    spread_points: Mapped[float | None] = mapped_column(Float, nullable=True)
    commission_per_lot_side: Mapped[float] = mapped_column(Float, nullable=False)


def create_replay_engine(database_url: str) -> Engine:
    """Create the SQLAlchemy engine and bring the database to the newest schema.

    The schema is migrated with Alembic (``pipwerk_replay.migrate``).
    """
    engine = create_database_engine(database_url)
    # The engine of the operation keeps the default transaction behaviour of
    # the driver. The migration at startup takes one connection from it and
    # controls the transaction of that connection only (pipwerk_replay.migrate).
    migrate_database(engine)
    return engine


def migrate_marketdata(engine: Engine) -> None:
    """Bring the data stock (``pipwerk_marketdata``) in the database of ``engine`` to its
    newest schema. It has its own migrations and its own version table, so it may share the
    database with pipwerk replay. A failure is a ``DatabaseMigrationError`` of pipwerk replay
    (the text of the library names no detail)."""
    try:
        migrate_marketdata_database(engine)
    except MarketDataMigrationError as error:
        raise DatabaseMigrationError(str(error)) from error


def create_database_engine(database_url: str) -> Engine:
    """Create the SQLAlchemy engine of a database; it does not migrate anything."""
    connect_args: dict[str, object] = {}
    if database_url.startswith("sqlite"):
        # check_same_thread=False allows the engine to serve FastAPI's worker
        # threads; a busy timeout makes concurrent write transactions wait for
        # the SQLite file lock instead of failing immediately.
        connect_args = {"check_same_thread": False, "timeout": 30}
    if _is_sqlite_memory(database_url):
        # A database in memory exists only as long as its connection, and a
        # private one once per connection: the worker threads of the web
        # application would each get their own, empty one. All threads share
        # one connection instead.
        engine = create_engine(database_url, connect_args=connect_args, poolclass=StaticPool)
    else:
        engine = create_engine(database_url, connect_args=connect_args)
    return engine


def _is_sqlite_memory(database_url: str) -> bool:
    """Tell whether the URL names a SQLite database in memory (also as URI)."""
    url = make_url(database_url)
    if url.get_backend_name() != "sqlite":
        return False
    return url.database in (None, "", ":memory:") or url.query.get("mode") == "memory"


def create_session_factory(engine: Engine) -> sessionmaker[Session]:
    """Create a session factory bound to the given engine."""
    return sessionmaker(bind=engine, expire_on_commit=False)
