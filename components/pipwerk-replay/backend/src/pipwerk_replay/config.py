"""Startup configuration of pipwerk replay.

The startup configuration contains only the information needed to start the
backend and let it find and use its storage (req-system-016, req-system-017,
req-system-018). It is an INI file:

- ``[database]``, entry ``url`` (required): the SQLAlchemy database URL.
- ``[server]`` (optional section, every entry optional):

  - ``host``: the address the backend binds to (default ``127.0.0.1``),
  - ``port``: the port of the backend (default ``8000``),
  - ``allowed_hosts``: further names allowed in the ``Host`` header, comma
    separated (see ``host_check.py``),
  - ``max_body_bytes``: the largest request body in bytes (default 2 MiB, see
    ``body_limit.py``).

The command line (``cli.py``) overrides ``host`` and ``port``. All other,
non-startup settings - such as the language - are stored in the configured
database itself (req-system-016) and are not part of this file.
"""

from __future__ import annotations

import configparser
import os
import re
from dataclasses import dataclass
from pathlib import Path

from pipwerk_replay.host_check import InvalidAllowedHostError, normalize_entry

#: File name of the pipwerk replay startup configuration at every searched location.
CONFIG_FILE_NAME = "pipwerk-replay.ini"

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8000
DEFAULT_MAX_BODY_BYTES = 2 * 1024 * 1024
MIN_MAX_BODY_BYTES = 1024
MAX_MAX_BODY_BYTES = 1024 * 1024 * 1024

_HOST_RE = re.compile(r"[A-Za-z0-9._:-]+")


@dataclass(frozen=True)
class StartupConfig:
    """The content of the startup configuration."""

    database_url: str
    #: Address the backend binds to.
    host: str = DEFAULT_HOST
    #: Port of the backend.
    port: int = DEFAULT_PORT
    #: Names from the entry ``allowed_hosts`` that are allowed in the ``Host`` header in
    #: addition to the default names (``host_check.py``).
    allowed_hosts: tuple[str, ...] = ()
    #: Largest request body in bytes.
    max_body_bytes: int = DEFAULT_MAX_BODY_BYTES


class StartupConfigError(Exception):
    """Raised when no valid startup configuration is available.

    pipwerk replay does not start without a valid INI startup configuration
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
        "No startup configuration found. pipwerk replay does not start without one. "
        f"Searched: {searched or '(no search location available)'}. "
        "Provide a startup configuration file with -c <PATH>."
    )


def _integer(parser: configparser.ConfigParser, option: str, default: int, path: Path) -> int:
    if not parser.has_option("server", option):
        return default
    text = parser.get("server", option).strip()
    if not (text.isascii() and text.isdigit()):
        raise StartupConfigError(
            f"Startup configuration {path} has an invalid [server] {option} entry"
        )
    return int(text)


def load_startup_config(explicit_path: str | Path | None = None) -> StartupConfig:
    """Load the startup configuration.

    Exactly one startup configuration is used; the contents of several INI
    files are never merged (req-system-017). Raises ``StartupConfigError``
    if no startup configuration is found, if it cannot be read or parsed,
    if it has no non-empty ``url`` in its ``[database]`` section or if an
    entry of ``[server]`` is invalid.
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
    if not url.strip():
        raise StartupConfigError(f"Startup configuration {path} has an empty [database] url")

    host = DEFAULT_HOST
    if parser.has_option("server", "host"):
        host = parser.get("server", "host").strip()
        if _HOST_RE.fullmatch(host) is None:
            raise StartupConfigError(f"Startup configuration {path} has an invalid [server] host")
    port = _integer(parser, "port", DEFAULT_PORT, path)
    if not 1 <= port <= 65535:
        raise StartupConfigError(f"Startup configuration {path} has an invalid [server] port")
    max_body_bytes = _integer(parser, "max_body_bytes", DEFAULT_MAX_BODY_BYTES, path)
    if not MIN_MAX_BODY_BYTES <= max_body_bytes <= MAX_MAX_BODY_BYTES:
        raise StartupConfigError(
            f"Startup configuration {path} has an invalid [server] max_body_bytes entry"
        )
    hosts: list[str] = []
    if parser.has_option("server", "allowed_hosts"):
        for item in parser.get("server", "allowed_hosts").split(","):
            if not item.strip():
                continue
            try:
                hosts.append(normalize_entry(item))
            except InvalidAllowedHostError as error:
                raise StartupConfigError(
                    f"Startup configuration {path} has an invalid [server] allowed_hosts entry"
                ) from error
    return StartupConfig(
        database_url=url,
        host=host,
        port=port,
        allowed_hosts=tuple(hosts),
        max_body_bytes=max_body_bytes,
    )
