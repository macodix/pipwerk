"""Application-level settings service of pipwerk replay.

This module is the service boundary in front of the SQLAlchemy persistence. It
exposes the framework-independent type ``Language`` instead of the ORM row. The
settings are operational, component-wide configuration: there is no user or
account modelling and exactly one central settings row exists. Only the user
interface language is kept so far.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Literal, get_args

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker

from pipwerk_replay.storage import SETTINGS_SINGLETON_ID, SettingsRecord

#: Supported user interface languages. Default is German (req-ui-008): the
#: component starts in German whenever no value has been stored yet.
Language = Literal["de", "en"]

SUPPORTED_LANGUAGES: tuple[Language, ...] = get_args(Language)

DEFAULT_LANGUAGE: Language = "de"


class StoredLanguageInvalidError(Exception):
    """Raised when the stored language value is not a supported language.

    This is a technically defective storage content (for example a manually
    edited database), not a user input error. Reading fails with this error
    instead of guessing a replacement; writing a valid language repairs it.
    """


def _language_setter(value: Language) -> Callable[[SettingsRecord], None]:
    def apply(record: SettingsRecord) -> None:
        record.language = value

    return apply


class SettingsService:
    """Reads and writes the authoritative settings of pipwerk replay."""

    def __init__(self, session_factory: sessionmaker[Session]) -> None:
        self._session_factory = session_factory

    def get_language(self) -> Language:
        """Return the stored language, or the documented default (req-ui-008).

        Raises ``StoredLanguageInvalidError`` if the stored value is not a
        supported language.
        """
        with self._session_factory() as session:
            record = session.get(SettingsRecord, SETTINGS_SINGLETON_ID)
            if record is None:
                return DEFAULT_LANGUAGE
            stored = record.language
            for language in SUPPORTED_LANGUAGES:
                if stored == language:
                    return language
            raise StoredLanguageInvalidError(
                f"Stored pipwerk replay language is not a supported language: {stored!r}"
            )

    def set_language(self, language: Language) -> Language:
        """Persist ``language`` as the single authoritative language.

        Concurrent calls are handled robustly: the singleton row is created
        at most once. A race between two concurrent first writes is resolved
        by retrying as an update once the competing transaction has
        committed the row.
        """
        self._update_record(_language_setter(language))
        return language

    def _update_record(self, apply: Callable[[SettingsRecord], None]) -> None:
        """Change the singleton row with ``apply``; create it if it is missing."""
        with self._session_factory() as session:
            record = session.get(SettingsRecord, SETTINGS_SINGLETON_ID)
            if record is not None:
                apply(record)
                session.commit()
                return
            record = SettingsRecord(id=SETTINGS_SINGLETON_ID, language=DEFAULT_LANGUAGE)
            apply(record)
            session.add(record)
            try:
                session.commit()
            except IntegrityError:
                # Another concurrent request created the singleton row first;
                # fall back to updating the now-existing row in a fresh
                # transaction instead of failing the request.
                session.rollback()
                record = session.get(SettingsRecord, SETTINGS_SINGLETON_ID)
                if record is None:
                    raise
                apply(record)
                session.commit()
