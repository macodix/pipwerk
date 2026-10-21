"""Startup configuration of pipwerk-fetch-mt5 (req-system-017, req-system-018).

The startup configuration is an INI file named ``pipwerk-fetch-mt5.ini``. It is found with
``-c <PATH>`` or at the search locations of req-system-017; exactly one file is used and the
contents of several files are never merged. The program does not start without a valid one.

Sections and entries (all other sections and entries are rejected, so that a misspelled
entry never goes unnoticed):

``[server]``
    ``host`` (bind address, default ``127.0.0.1``), ``port`` (default ``8765``),
    ``allowed_hosts`` (comma separated names and IP addresses allowed in the ``Host`` header in
    addition to the defaults, see ``host_check.py``).
``[security]``
    ``shared_key`` (required): the shared key. It stands only here, never in the repository,
    and never in a message or a log.
``[broker]``
    ``server_time_zone`` (required): IANA name of the time zone of the server time of the
    broker. ``name`` (optional): the name of the broker as delivered in the files; without it
    the name of the trade server MetaTrader 5 is connected to is used.
    ``max_rows_per_request`` (default 50000): the largest number of rows of one answer.
    ``max_reads_per_request`` (default 500): the largest number of reads of MetaTrader 5 for
    one request (a long period is read in several steps).
``[metatrader5]``
    Optional details of the connection with MetaTrader 5: ``path`` (terminal program),
    ``login``, ``password``, ``server``, ``timeout_ms``. Without any, the program attaches to
    the terminal that is running, with the account it is logged in to.
``[symbols]``
    Table designation -> symbol of the broker. Without an entry the designation itself is the
    symbol.

Error messages name the entry that is wrong, never a value of the file: the file holds the key.
"""

from __future__ import annotations

import configparser
import ipaddress
import os
import re
from collections.abc import Mapping
from dataclasses import dataclass, field
from pathlib import Path
from types import MappingProxyType
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pipwerk_fetch_mt5.host_check import InvalidAllowedHostError, normalize_entry

#: File name of the startup configuration at every searched location.
CONFIG_FILE_NAME = "pipwerk-fetch-mt5.ini"

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8765
DEFAULT_MAX_ROWS = 50_000
MAX_ROWS_LIMIT = 1_000_000
DEFAULT_MAX_READS = 500
MAX_READS_LIMIT = 100_000
DEFAULT_TIMEOUT_MS = 60_000

#: The shared key: printable ASCII without blanks (it travels in a header), 16 to 256 characters.
KEY_PATTERN = re.compile(r"[\x21-\x7e]{16,256}")

#: A designation or a symbol: 1 to 64 characters without control characters.
NAME_PATTERN = re.compile(r"[^\x00-\x1f\x7f]{1,64}")

#: The name of a broker as the schemas of the import allow it (at most 128 characters; no
#: control characters; no blank at either end).
BROKER_NAME_PATTERN = re.compile(r"\S(?:[^\x00-\x1f\x7f]*\S)?")

_ALLOWED_OPTIONS: dict[str, frozenset[str]] = {
    "server": frozenset({"host", "port", "allowed_hosts"}),
    "security": frozenset({"shared_key"}),
    "broker": frozenset(
        {"server_time_zone", "name", "max_rows_per_request", "max_reads_per_request"}
    ),
    "metatrader5": frozenset({"path", "login", "password", "server", "timeout_ms"}),
}
_FREE_SECTIONS = frozenset({"symbols"})


class StartupConfigError(Exception):
    """Raised when no valid startup configuration is available."""


@dataclass(frozen=True)
class MetaTraderSettings:
    """Details of the connection with MetaTrader 5 (all optional)."""

    path: str | None = None
    login: int | None = None
    password: str | None = field(default=None, repr=False)
    server: str | None = None
    timeout_ms: int = DEFAULT_TIMEOUT_MS


@dataclass(frozen=True)
class StartupConfig:
    """The content of the startup configuration."""

    server_time_zone: str
    shared_key: str = field(repr=False)
    host: str = DEFAULT_HOST
    port: int = DEFAULT_PORT
    allowed_hosts: tuple[str, ...] = ()
    broker_name: str | None = None
    max_rows: int = DEFAULT_MAX_ROWS
    max_reads: int = DEFAULT_MAX_READS
    symbols: Mapping[str, str] = field(default_factory=lambda: MappingProxyType({}))
    metatrader: MetaTraderSettings = field(default_factory=MetaTraderSettings)

    def symbol_for(self, designation: str) -> str:
        """The symbol of the broker for a designation; without an entry the designation."""
        return self.symbols.get(designation, designation)


#: System-wide search directory on POSIX systems.
_POSIX_SYSTEM_DIR = Path("/etc/pipwerk")


def _env_base(name: str) -> Path | None:
    """The absolute directory in environment variable ``name``; an unset, empty or relative
    value yields ``None`` so that no location is relative to the working directory."""
    value = os.environ.get(name, "")
    if not value:
        return None
    path = Path(value)
    return path if path.is_absolute() else None


def _locations(entries: list[tuple[Path | None, tuple[str, ...]]]) -> list[Path]:
    return [base.joinpath(*parts, CONFIG_FILE_NAME) for base, parts in entries if base is not None]


def default_search_locations() -> list[Path]:
    """The automatic search locations in priority order (req-system-017)."""
    if os.name == "nt":
        return _locations(
            [
                (_env_base("USERPROFILE"), ("pipwerk", "etc")),
                (_env_base("APPDATA"), ("pipwerk",)),
                (_env_base("PROGRAMDATA"), ("pipwerk",)),
            ]
        )
    home = _env_base("HOME")
    return _locations(
        [
            (home, ("pipwerk", "etc")),
            (home, (".config", "pipwerk")),
            (_POSIX_SYSTEM_DIR, ()),
        ]
    )


def resolve_config_path(explicit_path: str | Path | None) -> Path:
    """The startup configuration to use: ``-c <PATH>`` first, then the search locations."""
    if explicit_path is not None:
        path = Path(explicit_path)
        if not path.is_file():
            raise StartupConfigError(f"Startup configuration not found: {path}")
        return path
    locations = default_search_locations()
    for candidate in locations:
        if candidate.is_file():
            return candidate
    searched = ", ".join(str(location) for location in locations)
    raise StartupConfigError(
        "No startup configuration found. pipwerk-fetch-mt5 does not start without one. "
        f"Searched: {searched or '(no search location available)'}. "
        "Provide a startup configuration file with -c <PATH>."
    )


def _parse(path: Path) -> configparser.ConfigParser:
    # No interpolation (a key may contain %); the case of the keys of [symbols] is kept.
    parser = configparser.ConfigParser(interpolation=None)
    parser.optionxform = str  # type: ignore[assignment,method-assign]
    try:
        text = path.read_text(encoding="utf-8")
        parser.read_string(text, source=path.name)
    except configparser.ParsingError as error:
        # The text of the error contains the offending line, which may hold the key.
        numbers = [number for number, _line in getattr(error, "errors", [])]
        if not numbers and hasattr(error, "lineno"):
            numbers = [error.lineno]  # a line before the first section header
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
        if section in _FREE_SECTIONS:
            continue
        allowed = _ALLOWED_OPTIONS.get(section)
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


def _integer(
    parser: configparser.ConfigParser,
    path: Path,
    section: str,
    option: str,
    default: int,
    low: int,
    high: int,
) -> int:
    """A whole number between ``low`` and ``high``; ``default`` if the entry is missing."""
    number = _optional_integer(parser, path, section, option, low, high)
    return default if number is None else number


def _optional_integer(
    parser: configparser.ConfigParser,
    path: Path,
    section: str,
    option: str,
    low: int,
    high: int,
) -> int | None:
    value = _text(parser, section, option)
    if value is None:
        return None
    if not (value.isascii() and value.isdigit()):
        raise StartupConfigError(
            f"Startup configuration {path}: [{section}] {option} must be a whole number."
        )
    number = int(value)
    if not low <= number <= high:
        raise StartupConfigError(
            f"Startup configuration {path}: [{section}] {option} must be between {low} and {high}."
        )
    return number


def _bind_address(parser: configparser.ConfigParser, path: Path) -> str:
    value = _text(parser, "server", "host") or DEFAULT_HOST
    try:
        ipaddress.ip_address(value)
    except ValueError:
        # A name (for example localhost) is allowed as a bind address.
        if re.fullmatch(r"[A-Za-z0-9._-]{1,253}", value) is None:
            raise StartupConfigError(
                f"Startup configuration {path}: [server] host is no name and no IP address."
            ) from None
    return value


def _allowed_hosts(parser: configparser.ConfigParser, path: Path) -> tuple[str, ...]:
    hosts: list[str] = []
    for item in (_text(parser, "server", "allowed_hosts") or "").split(","):
        if not item.strip():
            continue
        try:
            hosts.append(normalize_entry(item))
        except InvalidAllowedHostError:
            raise StartupConfigError(
                f"Startup configuration {path} has an invalid [server] allowed_hosts entry."
            ) from None
    return tuple(hosts)


def _time_zone(parser: configparser.ConfigParser, path: Path) -> str:
    name = _text(parser, "broker", "server_time_zone")
    if name is None:
        raise StartupConfigError(
            f"Startup configuration {path} is missing the entry server_time_zone in section "
            "[broker]: the IANA name of the time zone of the server time of the broker "
            "(for example Europe/Athens)."
        )
    try:
        ZoneInfo(name)
    except ZoneInfoNotFoundError, ValueError, OSError:
        raise StartupConfigError(
            f"Startup configuration {path}: [broker] server_time_zone is not an IANA time "
            "zone name."
        ) from None
    return name


def _shared_key(parser: configparser.ConfigParser, path: Path) -> str:
    key = _text(parser, "security", "shared_key")
    if key is None:
        raise StartupConfigError(
            f"Startup configuration {path} is missing the entry shared_key in section [security]."
        )
    if KEY_PATTERN.fullmatch(key) is None:
        raise StartupConfigError(
            f"Startup configuration {path}: [security] shared_key must have 16 to 256 "
            "characters, without blanks and only printable ASCII characters."
        )
    return key


def _symbols(parser: configparser.ConfigParser, path: Path) -> Mapping[str, str]:
    table: dict[str, str] = {}
    if parser.has_section("symbols"):
        for designation, symbol in parser.items("symbols"):
            value = symbol.strip()
            if NAME_PATTERN.fullmatch(designation) is None or NAME_PATTERN.fullmatch(value) is None:
                raise StartupConfigError(
                    f"Startup configuration {path} has an invalid entry in section [symbols]."
                )
            table[designation] = value
    return MappingProxyType(table)


def _metatrader(parser: configparser.ConfigParser, path: Path) -> MetaTraderSettings:
    return MetaTraderSettings(
        path=_text(parser, "metatrader5", "path"),
        login=_optional_integer(parser, path, "metatrader5", "login", 1, 2**63 - 1),
        password=_text(parser, "metatrader5", "password"),
        server=_text(parser, "metatrader5", "server"),
        timeout_ms=_integer(
            parser, path, "metatrader5", "timeout_ms", DEFAULT_TIMEOUT_MS, 1_000, 600_000
        ),
    )


def load_startup_config(explicit_path: str | Path | None = None) -> StartupConfig:
    """Load and check the startup configuration (``-c <PATH>`` or the search locations)."""
    path = resolve_config_path(explicit_path)
    parser = _parse(path)
    _check_names(parser, path)
    max_rows = _integer(
        parser, path, "broker", "max_rows_per_request", DEFAULT_MAX_ROWS, 1, MAX_ROWS_LIMIT
    )
    max_reads = _integer(
        parser, path, "broker", "max_reads_per_request", DEFAULT_MAX_READS, 1, MAX_READS_LIMIT
    )
    port = _integer(parser, path, "server", "port", DEFAULT_PORT, 1, 65535)
    broker_name = _text(parser, "broker", "name")
    if broker_name is not None and (
        len(broker_name) > 128 or BROKER_NAME_PATTERN.fullmatch(broker_name) is None
    ):
        raise StartupConfigError(f"Startup configuration {path}: [broker] name is invalid.")
    return StartupConfig(
        server_time_zone=_time_zone(parser, path),
        shared_key=_shared_key(parser, path),
        host=_bind_address(parser, path),
        port=port,
        allowed_hosts=_allowed_hosts(parser, path),
        broker_name=broker_name,
        max_rows=max_rows,
        max_reads=max_reads,
        symbols=_symbols(parser, path),
        metatrader=_metatrader(parser, path),
    )
