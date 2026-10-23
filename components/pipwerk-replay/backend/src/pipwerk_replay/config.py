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

- ``[marketdata]`` (optional section, every entry optional): the data stock of historical
  price data (``pipwerk_marketdata``):

  - ``url``: the database of the data stock; without it the database of ``[database]``
    (the data stock may share it, specification E4),
  - ``max_upload_bytes``, ``max_rows``, ``max_reported_rejections``: limits of an uploaded
    file (defaults of ``pipwerk_marketdata``),
  - ``max_files_per_import``, ``max_import_bytes``: limits of one import (number of files,
    total size of the files),
  - ``max_concurrent_imports``, ``max_listed_items``, ``max_parts_per_request``: limits
    against overload (see ``MarketDataSettings``).

The command line (``cli.py``) overrides ``host`` and ``port``. All other,
non-startup settings - such as the language - are stored in the configured
database itself (req-system-016) and are not part of this file.

Sections and entries that this module does not know are ignored, as they always were (so a
startup configuration from before the acquisition was removed, with a ``[source]`` section,
still starts; the section has no effect). Only the known entries are checked.

The file is read without interpolation: a ``%`` in a value is a character like any other.
An error never repeats a value of the file, and for a syntax error it names only the line
number, because the text of the parser would repeat the line (and so possibly the key).
"""

from __future__ import annotations

import configparser
import os
import re
from dataclasses import dataclass, field
from pathlib import Path

from pipwerk_marketdata import limits as marketdata_limits

from pipwerk_replay.host_check import InvalidAllowedHostError, normalize_entry

#: File name of the pipwerk replay startup configuration at every searched location.
CONFIG_FILE_NAME = "pipwerk-replay.ini"

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8000
DEFAULT_MAX_BODY_BYTES = 2 * 1024 * 1024
MIN_MAX_BODY_BYTES = 1024
MAX_MAX_BODY_BYTES = 1024 * 1024 * 1024

_HOST_RE = re.compile(r"[A-Za-z0-9._:-]+")

#: Largest upload of a file in bytes: default of ``pipwerk_marketdata`` (32 MiB).
DEFAULT_MAX_UPLOAD_BYTES = marketdata_limits.DEFAULT_MAX_BYTES
MIN_MAX_UPLOAD_BYTES = 1024
MAX_MAX_UPLOAD_BYTES = 1024 * 1024 * 1024
#: Largest number of rows of an uploaded file: default of ``pipwerk_marketdata``.
DEFAULT_MAX_ROWS_PER_FILE = marketdata_limits.DEFAULT_MAX_ROWS
#: Number of rejected rows an answer lists: default of ``pipwerk_marketdata``.
DEFAULT_MAX_REPORTED_REJECTIONS = marketdata_limits.DEFAULT_MAX_REPORTED_REJECTIONS
#: Largest number of files of one import.
DEFAULT_MAX_FILES_PER_IMPORT = 100
MAX_MAX_FILES_PER_IMPORT = 1000
#: Largest total size of the files of one import in bytes (256 MiB; at least the size of one file).
DEFAULT_MAX_IMPORT_BYTES = 256 * 1024 * 1024
MAX_MAX_IMPORT_BYTES = 4 * 1024 * 1024 * 1024
DEFAULT_MAX_CONCURRENT_IMPORTS = 2
DEFAULT_MAX_LISTED_ITEMS = 1000
DEFAULT_MAX_PARTS_PER_REQUEST = 100


@dataclass(frozen=True)
class MarketDataSettings:
    """The settings of the data stock (section ``[marketdata]``)."""

    #: Database of the data stock; ``None``: the database of pipwerk replay.
    database_url: str | None = None
    #: Largest size of one uploaded file in bytes.
    max_upload_bytes: int = DEFAULT_MAX_UPLOAD_BYTES
    #: Largest number of files of one import (specification 5.3).
    max_files_per_import: int = DEFAULT_MAX_FILES_PER_IMPORT
    #: Largest total size of the files of one import in bytes; the limit of the request body
    #: of an import is this size plus the envelope of the form (``marketdata_api.py``).
    max_import_bytes: int = DEFAULT_MAX_IMPORT_BYTES
    #: Largest number of data rows or entries of an uploaded file, rejected ones included.
    max_rows: int = DEFAULT_MAX_ROWS_PER_FILE
    #: Number of rejected rows an answer lists (all are counted).
    max_reported_rejections: int = DEFAULT_MAX_REPORTED_REJECTIONS
    #: Number of imports that run at the same time; the next one is answered with HTTP 429.
    max_concurrent_imports: int = DEFAULT_MAX_CONCURRENT_IMPORTS
    #: Largest number of items of a list in an answer (series, gaps, periods).
    max_listed_items: int = DEFAULT_MAX_LISTED_ITEMS
    #: Largest number of parts in a request for completeness.
    max_parts_per_request: int = DEFAULT_MAX_PARTS_PER_REQUEST

    def __post_init__(self) -> None:
        if self.max_import_bytes < self.max_upload_bytes:
            raise ValueError("max_import_bytes must not be smaller than max_upload_bytes")


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
    #: Data stock.
    marketdata: MarketDataSettings = field(default_factory=MarketDataSettings)


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


def _limited_integer(
    parser: configparser.ConfigParser,
    section: str,
    option: str,
    default: int,
    bounds: tuple[int, int],
    path: Path,
) -> int:
    """An optional whole number of ``section`` between the bounds (included)."""
    if not parser.has_option(section, option):
        return default
    text = parser.get(section, option).strip()
    if not (text.isascii() and text.isdigit()) or not bounds[0] <= int(text) <= bounds[1]:
        raise StartupConfigError(
            f"Startup configuration {path} has an invalid [{section}] {option} entry"
        )
    return int(text)


def _optional_text(parser: configparser.ConfigParser, section: str, option: str) -> str | None:
    """The value of an optional entry; an empty value counts as no entry."""
    if not parser.has_option(section, option):
        return None
    return parser.get(section, option).strip() or None


def _marketdata_settings(parser: configparser.ConfigParser, path: Path) -> MarketDataSettings:
    url = _optional_text(parser, "marketdata", "url")
    if parser.has_option("marketdata", "url") and url is None:
        raise StartupConfigError(f"Startup configuration {path} has an empty [marketdata] url")

    def number(option: str, default: int, bounds: tuple[int, int]) -> int:
        return _limited_integer(parser, "marketdata", option, default, bounds, path)

    max_upload_bytes = number(
        "max_upload_bytes",
        DEFAULT_MAX_UPLOAD_BYTES,
        (MIN_MAX_UPLOAD_BYTES, MAX_MAX_UPLOAD_BYTES),
    )
    # Without an entry the whole import may hold at least the largest single file.
    max_import_bytes = number(
        "max_import_bytes",
        max(DEFAULT_MAX_IMPORT_BYTES, max_upload_bytes),
        (MIN_MAX_UPLOAD_BYTES, MAX_MAX_IMPORT_BYTES),
    )
    if max_import_bytes < max_upload_bytes:
        raise StartupConfigError(
            f"Startup configuration {path} has an invalid [marketdata] max_import_bytes entry "
            "(smaller than max_upload_bytes)"
        )
    return MarketDataSettings(
        database_url=url,
        max_upload_bytes=max_upload_bytes,
        max_files_per_import=number(
            "max_files_per_import",
            DEFAULT_MAX_FILES_PER_IMPORT,
            (1, MAX_MAX_FILES_PER_IMPORT),
        ),
        max_import_bytes=max_import_bytes,
        max_rows=number("max_rows", DEFAULT_MAX_ROWS_PER_FILE, (1, 100_000_000)),
        max_reported_rejections=number(
            "max_reported_rejections", DEFAULT_MAX_REPORTED_REJECTIONS, (0, 1_000_000)
        ),
        max_concurrent_imports=number(
            "max_concurrent_imports", DEFAULT_MAX_CONCURRENT_IMPORTS, (1, 64)
        ),
        max_listed_items=number("max_listed_items", DEFAULT_MAX_LISTED_ITEMS, (1, 1_000_000)),
        max_parts_per_request=number(
            "max_parts_per_request", DEFAULT_MAX_PARTS_PER_REQUEST, (1, 10_000)
        ),
    )


def _syntax_error_text(error: configparser.Error) -> str:
    """Where the file is wrong, without the text of the parser (it repeats the line)."""
    lines: set[int] = set()
    for item in getattr(error, "errors", ()):
        if isinstance(item, tuple) and item and isinstance(item[0], int):
            lines.add(item[0])
    number = getattr(error, "lineno", None)
    if isinstance(number, int):
        lines.add(number)
    if not lines:
        return "syntax error"
    return "syntax error in line " + ", ".join(str(item) for item in sorted(lines))


def load_startup_config(explicit_path: str | Path | None = None) -> StartupConfig:
    """Load the startup configuration.

    Exactly one startup configuration is used; the contents of several INI
    files are never merged (req-system-017). Raises ``StartupConfigError``
    if no startup configuration is found, if it cannot be read or parsed,
    if it has no non-empty ``url`` in its ``[database]`` section or if an
    entry of ``[server]`` is invalid.
    """
    path = resolve_config_path(explicit_path)
    parser = configparser.ConfigParser(interpolation=None)
    try:
        read_files = parser.read(path, encoding="utf-8")
    except configparser.Error as error:
        raise StartupConfigError(
            f"Startup configuration is invalid: {path}: {_syntax_error_text(error)}"
        ) from error
    except UnicodeDecodeError as error:
        raise StartupConfigError(
            f"Startup configuration is invalid: {path}: not UTF-8 text"
        ) from error
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
        marketdata=_marketdata_settings(parser, path),
    )
