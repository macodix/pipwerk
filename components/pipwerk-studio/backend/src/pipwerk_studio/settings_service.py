"""Application-level settings service of Pipwerk Studio.

This module is the repository/service boundary in front of the SQLAlchemy
persistence. It exposes a framework-independent
domain type (``Language``) instead of leaking the ORM row. Studio language is
operational, component-wide configuration: there is no
user or account modelling and exactly one central language setting exists.
"""

from __future__ import annotations

from typing import Literal, get_args

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker

from pipwerk_studio.storage import SETTINGS_SINGLETON_ID, StudioSettingsRecord

#: Supported Studio user interface languages. Default is German
#: (req-ui-008): the Studio starts in German whenever no value has been
#: stored yet.
Language = Literal["de", "en"]

SUPPORTED_LANGUAGES: tuple[Language, ...] = get_args(Language)

DEFAULT_LANGUAGE: Language = "de"


def is_supported_language(value: str) -> bool:
    """Return whether ``value`` is one of the supported Studio languages."""
    return value in SUPPORTED_LANGUAGES


class SettingsService:
    """Reads and writes the single, authoritative Studio language setting."""

    def __init__(self, session_factory: sessionmaker[Session]) -> None:
        self._session_factory = session_factory

    def get_language(self) -> Language:
        """Return the stored language, or the documented default (req-ui-008)."""
        with self._session_factory() as session:
            record = session.get(StudioSettingsRecord, SETTINGS_SINGLETON_ID)
            if record is None:
                return DEFAULT_LANGUAGE
            # The column is validated on write; a cast is safe here.
            return record.language  # type: ignore[return-value]

    def set_language(self, language: Language) -> Language:
        """Persist ``language`` as the single authoritative Studio language.

        Concurrent calls are handled robustly: the singleton row is created
        at most once. A race between two concurrent first writes is resolved
        by retrying as an update once the competing transaction has
        committed the row.
        """
        with self._session_factory() as session:
            record = session.get(StudioSettingsRecord, SETTINGS_SINGLETON_ID)
            if record is not None:
                record.language = language
                session.commit()
                return language
            session.add(StudioSettingsRecord(id=SETTINGS_SINGLETON_ID, language=language))
            try:
                session.commit()
            except IntegrityError:
                # Another concurrent request created the singleton row first;
                # fall back to updating the now-existing row in a fresh
                # transaction instead of failing the request.
                session.rollback()
                record = session.get(StudioSettingsRecord, SETTINGS_SINGLETON_ID)
                if record is None:
                    raise
                record.language = language
                session.commit()
            return language
