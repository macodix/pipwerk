"""Persistence infrastructure of Pipwerk Studio.

SQLAlchemy is used as the shared storage interface (req-system-015) behind a
small application-level repository/service boundary (Architekturvorgabe 2).
SQLAlchemy ORM classes defined here are infrastructure only: they are never
the public domain or API representation of Studio settings.
"""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy import Integer, String, create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker


class Base(DeclarativeBase):
    """Declarative base of the Pipwerk Studio persistence schema."""


#: Fixed primary key of the single Studio settings row. Studio settings are
#: a singleton operational configuration (Architekturvorgabe 1): exactly one
#: central language setting exists, never one per user or session.
SETTINGS_SINGLETON_ID = 1


class StudioSettingsRecord(Base):
    """ORM row holding the operational settings of Pipwerk Studio.

    Only the backend-authoritative language setting is modelled here. The UI
    language is never stored in the browser (localStorage, sessionStorage,
    cookies) and never as part of strategy data.
    """

    __tablename__ = "studio_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    language: Mapped[str] = mapped_column(String(8), nullable=False)


def create_studio_engine(database_url: str) -> Engine:
    """Create the SQLAlchemy engine for the given database URL and ensure schema."""
    connect_args: dict[str, object] = {}
    if database_url.startswith("sqlite"):
        # check_same_thread=False allows the engine to serve FastAPI's worker
        # threads; a busy timeout makes concurrent write transactions wait for
        # the SQLite file lock instead of failing immediately.
        connect_args = {"check_same_thread": False, "timeout": 30}
    engine = create_engine(database_url, connect_args=connect_args)
    Base.metadata.create_all(engine)
    return engine


def create_session_factory(engine: Engine) -> sessionmaker[Session]:
    """Create a session factory bound to the given engine."""
    return sessionmaker(bind=engine, expire_on_commit=False)


@contextmanager
def session_scope(session_factory: sessionmaker[Session]) -> Iterator[Session]:
    """Provide a single committed-or-rolled-back transactional session."""
    session = session_factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
