"""Startup configuration of Pipwerk Studio.

The startup configuration contains only the information needed to start the
Studio backend and let it find and use its configured storage
(req-system-016, req-system-017, req-system-018). It is provided as an INI
file with a ``[database]`` section and a ``url`` entry holding the
SQLAlchemy database URL. All other, non-startup settings - such as the
Studio language - are stored in the configured database itself
(req-system-016) and are not part of this file.
"""

from __future__ import annotations

import configparser
import os
from pathlib import Path

#: File name of the Pipwerk Studio startup configuration at every searched
#: location.
CONFIG_FILE_NAME = "pipwerk-studio.ini"


class StartupConfigError(Exception):
    """Raised when no valid startup configuration is available.

    Pipwerk Studio does not start without a valid INI startup configuration
    that defines the database connection; there is no implicit replacement
    database.
    """


#: System-wide search directory on POSIX systems.
_POSIX_SYSTEM_DIR = Path("/etc/pipwerk")


def _env_base(name: str) -> Path | None:
    """Return the absolute directory in environment variable ``name``.

    An unset, empty or relative value yields ``None`` so that no search
    location can become relative to the current working directory.
    """
    value = os.environ.get(name, "")
    if not value:
        return None
    path = Path(value)
    return path if path.is_absolute() else None


def _locations(entries: list[tuple[Path | None, tuple[str, ...]]]) -> list[Path]:
    return [base.joinpath(*parts, CONFIG_FILE_NAME) for base, parts in entries if base is not None]


def _posix_search_locations() -> list[Path]:
    home = _env_base("HOME")
    return _locations(
        [
            (home, ("pipwerk", "etc")),
            (home, (".config", "pipwerk")),
            (_POSIX_SYSTEM_DIR, ()),
        ]
    )


def _windows_search_locations() -> list[Path]:
    return _locations(
        [
            (_env_base("USERPROFILE"), ("pipwerk", "etc")),
            (_env_base("APPDATA"), ("pipwerk",)),
            (_env_base("PROGRAMDATA"), ("pipwerk",)),
        ]
    )


def default_search_locations() -> list[Path]:
    """Return the documented automatic search locations in priority order."""
    if os.name == "nt":
        return _windows_search_locations()
    return _posix_search_locations()


def resolve_config_path(explicit_path: str | Path | None) -> Path:
    """Resolve which startup configuration file to use.

    An explicitly given path has the highest priority (req-system-017). If
    none is given, the documented automatic search locations are checked in
    their documented priority order. If no file exists at any location,
    ``StartupConfigError`` names the searched locations.
    """
    if explicit_path is not None:
        path = Path(explicit_path)
        if not path.is_file():
            raise StartupConfigError(f"Startup configuration not found: {path}")
        return path
    for candidate in default_search_locations():
        if candidate.is_file():
            return candidate
    searched = ", ".join(str(location) for location in default_search_locations())
    raise StartupConfigError(
        "No startup configuration found. Pipwerk Studio does not start without one. "
        f"Searched: {searched or '(no search location available)'}. "
        "Provide a startup configuration file with -c <PATH>."
    )


def load_database_url(explicit_path: str | Path | None = None) -> str:
    """Load the configured SQLAlchemy database URL.

    Exactly one startup configuration is used; the contents of several INI
    files are never merged (req-system-017). Raises ``StartupConfigError``
    if no startup configuration is found, if it cannot be read or parsed,
    or if it has no non-empty ``url`` in its ``[database]`` section.
    """
    path = resolve_config_path(explicit_path)
    parser = configparser.ConfigParser()
    try:
        read_files = parser.read(path, encoding="utf-8")
    except (configparser.Error, UnicodeDecodeError) as error:
        raise StartupConfigError(f"Startup configuration is invalid: {path}: {error}") from error
    if not read_files:
        raise StartupConfigError(f"Startup configuration could not be read: {path}")
    try:
        url = parser.get("database", "url")
    except (configparser.NoSectionError, configparser.NoOptionError) as error:
        raise StartupConfigError(
            f"Startup configuration {path} is missing a [database] url entry"
        ) from error
    if not url:
        raise StartupConfigError(f"Startup configuration {path} has an empty [database] url")
    return url
