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
    file (defaults of ``pipwerk_marketdata``); there is no limit for the number of files or
    the total size of an import (specification 5.3),
  - ``import_idle_timeout_seconds``: an import process ends by itself when no request of it
    arrives for this long (default 300 seconds, specification 5.5),
  - ``no_trading_days``: the days of the year without trade, ``MM-DD`` separated by commas
    (default ``12-25, 01-01``, specification 5.2); they are no gaps in the data stock,
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

from pipwerk_marketdata import CalendarDay
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
#: Time after which an import process without a request ends by itself (5 minutes).
DEFAULT_IMPORT_IDLE_TIMEOUT_SECONDS = 300
MAX_IMPORT_IDLE_TIMEOUT_SECONDS = 24 * 60 * 60
#: The days of the year without trade: 25 December and 1 January (specification 5.2).
DEFAULT_NO_TRADING_DAYS = (CalendarDay(12, 25), CalendarDay(1, 1))
DEFAULT_MAX_CONCURRENT_IMPORTS = 2
DEFAULT_MAX_LISTED_ITEMS = 1000
DEFAULT_MAX_PARTS_PER_REQUEST = 100

_DAY_ENTRY = re.compile(r"([0-9]{2})-([0-9]{2})")


@dataclass(frozen=True)
class MarketDataSettings:
    """The settings of the data stock (section ``[marketdata]``)."""

    #: Database of the data stock; ``None``: the database of pipwerk replay.
    database_url: str | None = None
    #: Largest size of one uploaded file in bytes. The request of a file may be this size plus
    #: the envelope of the form (``import_form.py``). There is no limit for the number of files
    #: or the total size of an import (specification 5.3).
    max_upload_bytes: int = DEFAULT_MAX_UPLOAD_BYTES
    #: Seconds without a request after which an import process ends by itself (specification 5.5).
    import_idle_timeout_seconds: int = DEFAULT_IMPORT_IDLE_TIMEOUT_SECONDS
    #: The days of the year without trade; no gaps in the data stock (specification 5.2).
    no_trading_days: tuple[CalendarDay, ...] = DEFAULT_NO_TRADING_DAYS
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


def _no_trading_days(parser: configparser.ConfigParser, path: Path) -> tuple[CalendarDay, ...]:
    """The days without trade of ``[marketdata] no_trading_days``: ``MM-DD`` separated by commas.
    An empty value means no day at all; without the entry the default days apply."""
    if not parser.has_option("marketdata", "no_trading_days"):
        return DEFAULT_NO_TRADING_DAYS
    days: list[CalendarDay] = []
    for item in parser.get("marketdata", "no_trading_days").split(","):
        text = item.strip()
        if not text:
            continue
        match = _DAY_ENTRY.fullmatch(text)
        try:
            if match is None:
                raise ValueError("not a day")
            day = CalendarDay(int(match.group(1)), int(match.group(2)))
        except ValueError:
            raise StartupConfigError(
                f"Startup configuration {path} has an invalid [marketdata] no_trading_days entry"
            ) from None
        if day not in days:
            days.append(day)
    return tuple(days)


def _marketdata_settings(parser: configparser.ConfigParser, path: Path) -> MarketDataSettings:
    url = _optional_text(parser, "marketdata", "url")
    if parser.has_option("marketdata", "url") and url is None:
        raise StartupConfigError(f"Startup configuration {path} has an empty [marketdata] url")

    def number(option: str, default: int, bounds: tuple[int, int]) -> int:
        return _limited_integer(parser, "marketdata", option, default, bounds, path)

    return MarketDataSettings(
        database_url=url,
        max_upload_bytes=number(
            "max_upload_bytes",
            DEFAULT_MAX_UPLOAD_BYTES,
            (MIN_MAX_UPLOAD_BYTES, MAX_MAX_UPLOAD_BYTES),
        ),
        import_idle_timeout_seconds=number(
            "import_idle_timeout_seconds",
            DEFAULT_IMPORT_IDLE_TIMEOUT_SECONDS,
            (1, MAX_IMPORT_IDLE_TIMEOUT_SECONDS),
        ),
        no_trading_days=_no_trading_days(parser, path),
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
