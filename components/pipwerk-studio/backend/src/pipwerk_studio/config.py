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

#: Development default used only when no startup configuration file is given
#: explicitly and none is found at any documented automatic search location.
#: Production deployments must provide an explicit startup configuration.
DEFAULT_DATABASE_URL = "sqlite:///./pipwerk-studio.db"


class StartupConfigError(Exception):
    """Raised when an explicitly given startup configuration cannot be used."""


def _posix_search_locations() -> list[Path]:
    home = Path(os.environ.get("HOME", ""))
    return [
        home / "pipwerk" / "etc" / CONFIG_FILE_NAME,
        home / ".config" / "pipwerk" / CONFIG_FILE_NAME,
        Path("/etc/pipwerk") / CONFIG_FILE_NAME,
    ]


def _windows_search_locations() -> list[Path]:
    userprofile = Path(os.environ.get("USERPROFILE", ""))
    appdata = Path(os.environ.get("APPDATA", ""))
    programdata = Path(os.environ.get("PROGRAMDATA", ""))
    return [
        userprofile / "pipwerk" / "etc" / CONFIG_FILE_NAME,
        appdata / "pipwerk" / CONFIG_FILE_NAME,
        programdata / "pipwerk" / CONFIG_FILE_NAME,
    ]


def default_search_locations() -> list[Path]:
    """Return the documented automatic search locations in priority order."""
    if os.name == "nt":
        return _windows_search_locations()
    return _posix_search_locations()


def resolve_config_path(explicit_path: str | Path | None) -> Path | None:
    """Resolve which startup configuration file to use.

    An explicitly given path has the highest priority (req-system-017). If
    none is given, the documented automatic search locations are checked in
    their documented priority order. ``None`` is returned if no file exists
    at any location, in which case callers fall back to a documented
    default.
    """
    if explicit_path is not None:
        path = Path(explicit_path)
        if not path.is_file():
            raise StartupConfigError(f"Startup configuration not found: {path}")
        return path
    for candidate in default_search_locations():
        if candidate.is_file():
            return candidate
    return None


def load_database_url(explicit_path: str | Path | None = None) -> str:
    """Load the configured SQLAlchemy database URL.

    Exactly one startup configuration is used; the contents of several INI
    files are never merged (req-system-017). Falls back to a documented
    development default when no startup configuration file is found
    anywhere and no explicit path was given.
    """
    path = resolve_config_path(explicit_path)
    if path is None:
        return DEFAULT_DATABASE_URL
    parser = configparser.ConfigParser()
    read_files = parser.read(path, encoding="utf-8")
    if not read_files:
        raise StartupConfigError(f"Startup configuration could not be read: {path}")
    try:
        return parser.get("database", "url")
    except (configparser.NoSectionError, configparser.NoOptionError) as error:
        raise StartupConfigError(
            f"Startup configuration {path} is missing a [database] url entry"
        ) from error
