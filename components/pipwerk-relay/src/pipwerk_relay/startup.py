"""Startup configuration of pipwerk relay (req-system-016, req-system-017, req-system-018).

The startup configuration is an INI file named ``pipwerk-relay.ini``. It is found with
``-c <PATH>`` or at the search locations of req-system-017; exactly one file is used and the
contents of several files are never merged. The relay does not start without a valid one.

Sections and entries (all other sections and entries are rejected, so that a misspelled entry
never goes unnoticed):

``[database]``
    ``url`` (required): the connection to the database as a URL of SQLAlchemy, for example
    ``sqlite:///<file>``. The URL may hold a password, so no error names its value.
``[storage]``
    ``attachments_directory`` (required): the directory in which the relay keeps the attachments
    of the messages in its queue.
``[secrets]``
    ``directory`` (required): the directory for secrets (the key files of the connections).
``[log]``
    ``level`` (default ``INFO``): ``DEBUG``, ``INFO``, ``WARNING`` or ``ERROR``. ``file``: the
    log file; without it the relay writes the log to the standard error output.

The operating configuration (relay name, inboxes, components, address book, periods, limits)
is not part of this file; it lives in the database (``pipwerk-relay config load``).
"""

import configparser
import os
from dataclasses import dataclass
from pathlib import Path

import sqlalchemy as sa
from sqlalchemy.exc import ArgumentError

from pipwerk_relay.errors import StartupConfigError

CONFIG_FILE_NAME = "pipwerk-relay.ini"
"""File name of the startup configuration at every searched location."""

LOG_LEVELS = ("DEBUG", "INFO", "WARNING", "ERROR")
DEFAULT_LOG_LEVEL = "INFO"

ALLOWED_OPTIONS: dict[str, frozenset[str]] = {
    "database": frozenset({"url"}),
    "storage": frozenset({"attachments_directory"}),
    "secrets": frozenset({"directory"}),
    "log": frozenset({"level", "file"}),
}
_REQUIRED = (
    ("database", "url"),
    ("storage", "attachments_directory"),
    ("secrets", "directory"),
)

_POSIX_SYSTEM_DIR = Path("/etc/pipwerk")


@dataclass(frozen=True)
class StartupConfig:
    """The content of the startup configuration."""

    database_url: sa.URL
    attachments_directory: Path
    secrets_directory: Path
    log_level: str = DEFAULT_LOG_LEVEL
    log_file: Path | None = None

    def __repr__(self) -> str:
        return "StartupConfig(...)"  # the URL of the database may hold a password


def _env_base(name: str) -> Path | None:
    """The absolute directory in environment variable ``name``.

    An unset, empty or relative value yields ``None``, so that no location is relative to the
    working directory.
    """
    value = os.environ.get(name, "")
    if not value:
        return None
    path = Path(value)
    return path if path.is_absolute() else None


def _locations(entries: list[tuple[Path | None, tuple[str, ...]]], file_name: str) -> list[Path]:
    return [base.joinpath(*parts, file_name) for base, parts in entries if base is not None]


def default_search_locations(file_name: str = CONFIG_FILE_NAME) -> list[Path]:
    """The automatic search locations of the file ``file_name`` in priority order
    (req-system-017)."""
    if os.name == "nt":
        return _locations(
            [
                (_env_base("USERPROFILE"), ("pipwerk", "etc")),
                (_env_base("APPDATA"), ("pipwerk",)),
                (_env_base("PROGRAMDATA"), ("pipwerk",)),
            ],
            file_name,
        )
    home = _env_base("HOME")
    return _locations(
        [
            (home, ("pipwerk", "etc")),
            (home, (".config", "pipwerk")),
            (_POSIX_SYSTEM_DIR, ()),
        ],
        file_name,
    )


def resolve_config_path(
    explicit_path: str | Path | None,
    file_name: str = CONFIG_FILE_NAME,
    purpose: str = "pipwerk-relay",
) -> Path:
    """The startup configuration to use: ``-c <PATH>`` first, then the search locations.

    ``file_name`` and ``purpose`` (the program that cannot start) are those of the relay unless
    another program of this package, the probe, reads a startup configuration of its own.
    """
    if explicit_path is not None:
        path = Path(explicit_path)
        if not path.is_file():
            raise StartupConfigError(f"Startup configuration not found: {path}")
        return path
    locations = default_search_locations(file_name)
    for candidate in locations:
        if candidate.is_file():
            return candidate
    searched = ", ".join(str(location) for location in locations)
    raise StartupConfigError(
        f"No startup configuration found. {purpose} does not start without one. "
        f"Searched: {searched or '(no search location available)'}. "
        "Provide a startup configuration file with -c <PATH>."
    )


def parse_ini_file(path: Path, *, keep_case: bool = False) -> configparser.ConfigParser:
    """Read an INI file; an error names the file and the line, never the content.

    ``keep_case`` keeps the case of the entries (the form of ``[relay.way]``, which the way
    reads); the startup configuration of the relay reads them in lower case.
    """
    parser = configparser.ConfigParser(interpolation=None)  # a value may contain %
    if keep_case:
        parser.optionxform = str  # type: ignore[assignment,method-assign]
    try:
        parser.read_string(path.read_text(encoding="utf-8"), source=path.name)
    except configparser.ParsingError as error:
        # The text of the error holds the offending line, and a line may hold the URL.
        numbers = [number for number, _line in getattr(error, "errors", [])]
        if not numbers and hasattr(error, "lineno"):
            numbers = [error.lineno]
        lines = ", ".join(str(number) for number in numbers) or "unknown"
        raise StartupConfigError(
            f"Startup configuration {path} is invalid (syntax error in line {lines})."
        ) from None
    except configparser.Error:
        raise StartupConfigError(
            f"Startup configuration {path} is invalid (section or entry given twice or "
            "entry outside of a section)."
        ) from None
    except OSError, UnicodeDecodeError:
        raise StartupConfigError(f"Startup configuration {path} could not be read.") from None
    return parser


def _check_names(parser: configparser.ConfigParser, path: Path) -> None:
    for section in parser.sections():
        allowed = ALLOWED_OPTIONS.get(section)
        if allowed is None:
            raise StartupConfigError(f"Startup configuration {path} has an unknown section.")
        for option in parser.options(section):
            if option not in allowed:
                raise StartupConfigError(
                    f"Startup configuration {path} has an unknown entry {option!r} in "
                    f"section [{section}]."
                )


def _text(parser: configparser.ConfigParser, section: str, option: str) -> str | None:
    if not parser.has_option(section, option):
        return None
    value = parser.get(section, option).strip()
    return value or None


def _required(parser: configparser.ConfigParser, path: Path, section: str, option: str) -> str:
    value = _text(parser, section, option)
    if value is None:
        raise StartupConfigError(
            f"Startup configuration {path} is missing the entry {option} in section [{section}]."
        )
    return value


def load_startup_config(explicit_path: str | Path | None = None) -> StartupConfig:
    """Load and check the startup configuration (``-c <PATH>`` or the search locations)."""
    path = resolve_config_path(explicit_path)
    parser = parse_ini_file(path)
    _check_names(parser, path)
    url_text = _required(parser, path, "database", "url")
    try:
        url = sa.make_url(url_text)
    except ArgumentError:
        raise StartupConfigError(
            f"Startup configuration {path}: [database] url is not a valid database URL."
        ) from None
    level = (_text(parser, "log", "level") or DEFAULT_LOG_LEVEL).upper()
    if level not in LOG_LEVELS:
        raise StartupConfigError(
            f"Startup configuration {path}: [log] level must be one of {', '.join(LOG_LEVELS)}."
        )
    log_file = _text(parser, "log", "file")
    return StartupConfig(
        database_url=url,
        attachments_directory=Path(_required(parser, path, "storage", "attachments_directory")),
        secrets_directory=Path(_required(parser, path, "secrets", "directory")),
        log_level=level,
        log_file=None if log_file is None else Path(log_file),
    )
