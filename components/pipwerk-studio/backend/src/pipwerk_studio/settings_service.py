"""Application-level settings service of pipwerk Studio.

This module is the repository/service boundary in front of the SQLAlchemy
persistence. It exposes framework-independent domain types (``Language``,
``ObjectDirectorySetting``) instead of leaking the ORM row. The settings are
operational, component-wide configuration: there is no user or account
modelling and exactly one central settings row exists.

Two settings are kept: the user interface language and the object directory
(specification 4.1). The service also owns the object store and changes the
object directory, optionally moving the object files (req-ablauf-009).
"""

from __future__ import annotations

import os
from collections.abc import Callable, Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Literal, get_args

from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker

from pipwerk_studio.config import ConfigOrigin
from pipwerk_studio.object_store import ObjectMoveError, ObjectStore, move_objects
from pipwerk_studio.storage import SETTINGS_SINGLETON_ID, StudioSettingsRecord

#: Supported Studio user interface languages. Default is German
#: (req-ui-008): the Studio starts in German whenever no value has been
#: stored yet.
Language = Literal["de", "en"]

SUPPORTED_LANGUAGES: tuple[Language, ...] = get_args(Language)

DEFAULT_LANGUAGE: Language = "de"

#: Longest accepted object directory path (the length of the database column).
MAX_OBJECT_DIRECTORY_LENGTH = 4096

#: Base of the default object directory of a system-wide installation on POSIX
#: systems (specification 4.1).
_POSIX_SYSTEM_DATA_DIR = Path("/var/lib/pipwerk")


class StoredLanguageInvalidError(Exception):
    """Raised when the stored language value is not a supported language.

    This is a technically defective storage content (for example a manually
    edited database), not a user input error. Reading fails with this error
    instead of guessing a replacement; writing a valid language repairs it.
    """


class StoredObjectDirectoryInvalidError(Exception):
    """Raised when the stored object directory is not an absolute path.

    Like an invalid stored language, this is a technically defective storage
    content; a valid write repairs it.
    """


class InvalidObjectDirectoryError(ValueError):
    """Raised when a new object directory is not an absolute path."""


@dataclass(frozen=True)
class ObjectDirectorySetting:
    """The object directory in force.

    ``path`` is ``None`` if nothing is stored and the default cannot be
    determined (a needed environment variable is unset, empty or not
    absolute): the directory is "not set". ``is_default`` tells that nothing
    is stored and the default applies.
    """

    path: Path | None
    is_default: bool


def _absolute_environment_path(environ: Mapping[str, str], name: str) -> Path | None:
    value = environ.get(name, "")
    if not value:
        return None
    path = Path(value)
    return path if path.is_absolute() else None


def default_object_directory(
    origin: ConfigOrigin,
    *,
    windows: bool | None = None,
    environ: Mapping[str, str] | None = None,
) -> Path | None:
    """Return the default object directory (specification 4.1), or ``None``.

    The default depends on where the startup configuration was found: a
    startup configuration of the system-wide search location gives the
    system-wide directory; any other (a user location or a file given with
    ``-c``) gives the directory of the user. ``None`` means that the needed
    environment variable (``HOME``, ``LOCALAPPDATA`` or ``PROGRAMDATA``) is
    unset, empty or not absolute. ``windows`` and ``environ`` default to the
    running system; only tests pass others.
    """
    use_windows = os.name == "nt" if windows is None else windows
    variables = os.environ if environ is None else environ
    if use_windows:
        base = _absolute_environment_path(
            variables, "PROGRAMDATA" if origin == "system" else "LOCALAPPDATA"
        )
        return None if base is None else base.joinpath("pipwerk", "studio", "objects")
    if origin == "system":
        return _POSIX_SYSTEM_DATA_DIR.joinpath("studio", "objects")
    home = _absolute_environment_path(variables, "HOME")
    return (
        None if home is None else home.joinpath(".local", "share", "pipwerk", "studio", "objects")
    )


def check_object_directory(value: str) -> Path:
    """Return ``value`` as a path if it is an absolute path, else raise."""
    if (
        not value
        or len(value) > MAX_OBJECT_DIRECTORY_LENGTH
        or "\x00" in value
        or not Path(value).is_absolute()
    ):
        raise InvalidObjectDirectoryError("The object directory must be an absolute path.")
    return Path(value)


def _object_directory_setter(value: str) -> Callable[[StudioSettingsRecord], None]:
    def apply(record: StudioSettingsRecord) -> None:
        record.object_directory = value

    return apply


def _language_setter(value: Language) -> Callable[[StudioSettingsRecord], None]:
    def apply(record: StudioSettingsRecord) -> None:
        record.language = value

    return apply


class SettingsService:
    """Reads and writes the authoritative Studio settings and owns the object store."""

    def __init__(
        self,
        session_factory: sessionmaker[Session],
        config_origin: ConfigOrigin = "explicit",
        *,
        windows: bool | None = None,
        environ: Mapping[str, str] | None = None,
    ) -> None:
        self._session_factory = session_factory
        self._config_origin = config_origin
        self._windows = windows
        self._environ = environ
        #: The object store writes into the object directory in force.
        self.object_store = ObjectStore(self.effective_object_directory)

    def get_language(self) -> Language:
        """Return the stored language, or the documented default (req-ui-008).

        Raises ``StoredLanguageInvalidError`` if the stored value is not a
        supported language.
        """
        with self._session_factory() as session:
            record = session.get(StudioSettingsRecord, SETTINGS_SINGLETON_ID)
            if record is None:
                return DEFAULT_LANGUAGE
            stored = record.language
            for language in SUPPORTED_LANGUAGES:
                if stored == language:
                    return language
            raise StoredLanguageInvalidError(
                f"Stored pipwerk Studio language is not a supported language: {stored!r}"
            )

    def set_language(self, language: Language) -> Language:
        """Persist ``language`` as the single authoritative Studio language.

        Concurrent calls are handled robustly: the singleton row is created
        at most once. A race between two concurrent first writes is resolved
        by retrying as an update once the competing transaction has
        committed the row.
        """
        self._update_record(_language_setter(language))
        return language

    def _update_record(self, apply: Callable[[StudioSettingsRecord], None]) -> None:
        """Change the singleton row with ``apply``; create it if it is missing.

        A newly created row holds the default language, which is what reading
        returns while no row exists.
        """
        with self._session_factory() as session:
            record = session.get(StudioSettingsRecord, SETTINGS_SINGLETON_ID)
            if record is not None:
                apply(record)
                session.commit()
                return
            record = StudioSettingsRecord(id=SETTINGS_SINGLETON_ID, language=DEFAULT_LANGUAGE)
            apply(record)
            session.add(record)
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
                apply(record)
                session.commit()

    def _stored_object_directory(self) -> Path | None:
        with self._session_factory() as session:
            record = session.get(StudioSettingsRecord, SETTINGS_SINGLETON_ID)
            stored = None if record is None else record.object_directory
        if stored is None:
            return None
        try:
            return check_object_directory(stored)
        except InvalidObjectDirectoryError as error:
            raise StoredObjectDirectoryInvalidError(
                "The stored pipwerk Studio object directory is not an absolute path."
            ) from error

    def get_object_directory(self) -> ObjectDirectorySetting:
        """Return the stored object directory, or the default (specification 4.1).

        Raises ``StoredObjectDirectoryInvalidError`` if the stored value is not
        an absolute path.
        """
        stored = self._stored_object_directory()
        if stored is not None:
            return ObjectDirectorySetting(stored, is_default=False)
        default = default_object_directory(
            self._config_origin, windows=self._windows, environ=self._environ
        )
        return ObjectDirectorySetting(default, is_default=True)

    def effective_object_directory(self) -> Path | None:
        """Return the directory the object store uses, or ``None`` if not set."""
        return self.get_object_directory().path

    def set_object_directory(self, path: str, *, move: bool) -> ObjectDirectorySetting:
        """Change the object directory (req-ablauf-009, specification 4.1).

        ``path`` must be absolute (``InvalidObjectDirectoryError``). With
        ``move`` all object files are moved to the new directory first and the
        setting is saved afterwards. A file of the same name in the new
        directory rejects the change (``ObjectConflictError``), nothing is
        moved. If moving fails on the way, the files moved so far are brought
        back and the old setting stays (``ObjectMoveError``, or
        ``ObjectMoveRollbackError`` if bringing them back fails too). Without
        ``move`` only the setting is saved. A file is never overwritten.

        The change is locked against other changes and against all accesses of
        the object store in this process.
        """
        target = check_object_directory(path)
        with self.object_store.lock:
            moved = None
            if move:
                source = self.effective_object_directory()
                if source is not None:
                    moved = move_objects(source, target)
            try:
                self._update_record(_object_directory_setter(str(target)))
            except SQLAlchemyError as error:
                if moved is None:
                    raise
                moved.restore()
                raise ObjectMoveError("The object directory could not be saved.") from error
            return self.get_object_directory()
