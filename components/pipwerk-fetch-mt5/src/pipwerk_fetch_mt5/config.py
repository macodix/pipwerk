"""Startup configuration of pipwerk-fetch-mt5 (req-system-017, req-system-018).

The startup configuration is an INI file named ``pipwerk-fetch-mt5.ini``. It is found with
``-c <PATH>`` or at the search locations of req-system-017; exactly one file is used and the
contents of several files are never merged. The program does not start without a valid one.

Sections and entries (all other sections and entries are rejected, so that a misspelled
entry never goes unnoticed; the program has no server, so there is no port, no list of hosts
and no key to log in to it):

``[broker]``
    ``server_time_zone`` (required): IANA name of the time zone of the server time of the
    trade server. ``max_rows_per_file`` (default 200000): the largest number of rows of one
    file. ``max_reads_per_file`` (default 500): the largest number of reads of MetaTrader 5
    for one file (a long period is read in several steps).
``[metatrader5]``
    Optional details of the connection with MetaTrader 5: ``path`` (terminal program),
    ``login``, ``password``, ``server``, ``timeout_ms``. Without any, the program attaches to
    the terminal that is running, with the account it is logged in to.
``[symbols]``
    Table designation -> symbol of the broker. Without an entry the designation itself is the
    symbol. It applies to the call on the command line only: a request through pipwerk relay
    names the symbol itself.
``[relay]``
    Optional; required by the commands ``serve`` and ``request``. The connection of the
    component to its relay (specification relay 3.5, 6.1): ``address`` (own address
    ``<component>.<network>.<relay>``), ``way`` (name of the transmission way),
    ``secrets_directory`` and ``key_file`` (the key of the connection with the relay),
    ``database`` (the SQLite file of the connection), optionally ``relay_link`` and
    ``poll_interval_seconds``.
``[relay.way]``
    The own settings of the way, passed on unchanged: ``target.<entry>`` for the target (where
    the relay reads what this component sends) and ``inbox.<entry>`` for the inbox (where the
    relay puts what is meant for this component). The way checks them itself; this file does
    not know them. ``[relay.file_way]`` does not exist in this version and is rejected like
    every other unknown section.

Error messages name the entry that is wrong, never a value of the file: the file may hold a
password.
"""

from __future__ import annotations

import configparser
import os
import re
from collections.abc import Mapping
from dataclasses import dataclass, field
from pathlib import Path
from types import MappingProxyType
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

#: File name of the startup configuration at every searched location.
CONFIG_FILE_NAME = "pipwerk-fetch-mt5.ini"

#: A file of the import may have 500000 rows and 32 MiB (``pipwerk_marketdata.limits``). A
#: candle takes about 130 bytes in the file, so 200000 rows stay below the size limit.
DEFAULT_MAX_ROWS = 200_000
MAX_ROWS_LIMIT = 5_000_000
DEFAULT_MAX_READS = 500
MAX_READS_LIMIT = 100_000
DEFAULT_TIMEOUT_MS = 60_000

#: A designation or a symbol: 1 to 64 characters without control characters.
NAME_PATTERN = re.compile(r"[^\x00-\x1f\x7f]{1,64}")

#: The name of a broker as the schemas of the import allow it (at most 128 characters; no
#: control characters; no blank at either end).
BROKER_NAME_PATTERN = re.compile(r"\S(?:[^\x00-\x1f\x7f]*\S)?")

_ALLOWED_OPTIONS: dict[str, frozenset[str]] = {
    "broker": frozenset({"server_time_zone", "max_rows_per_file", "max_reads_per_file"}),
    "metatrader5": frozenset({"path", "login", "password", "server", "timeout_ms"}),
    "relay": frozenset(
        {
            "address",
            "way",
            "secrets_directory",
            "key_file",
            "database",
            "relay_link",
            "poll_interval_seconds",
        }
    ),
}
#: Sections with entries of any name: the table of symbols and the own settings of the way,
#: which only the way knows and checks (specification relay 3.4).
_FREE_SECTIONS = frozenset({"symbols", "relay.way"})

#: ``[relay]`` entries that must be given.
_RELAY_REQUIRED = ("address", "way", "secrets_directory", "key_file", "database")
DEFAULT_POLL_INTERVAL_SECONDS = 2
MAX_POLL_INTERVAL_SECONDS = 3600
TARGET_PREFIX = "target."
INBOX_PREFIX = "inbox."


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
class RelaySettings:
    """The connection of the component to its relay, as the file states it.

    The values are text as they stand in the file. The library of pipwerk relay checks them
    (address, key, way) when ``serve`` or ``request`` opens the connection; this module does
    not load the library. ``target`` and ``inbox`` are the own settings of the way, passed on
    unchanged.
    """

    address: str
    way: str
    secrets_directory: Path
    key_file: str
    database: Path
    target: Mapping[str, str] = field(default_factory=lambda: MappingProxyType({}))
    inbox: Mapping[str, str] = field(default_factory=lambda: MappingProxyType({}))
    relay_link: str | None = None
    poll_interval_seconds: int = DEFAULT_POLL_INTERVAL_SECONDS


@dataclass(frozen=True)
class StartupConfig:
    """The content of the startup configuration."""

    server_time_zone: str
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


def _way_settings(parser: configparser.ConfigParser, path: Path) -> tuple[dict[str, str], ...]:
    """The own settings of the way for the target and for the inbox, passed on unchanged."""
    target: dict[str, str] = {}
    inbox: dict[str, str] = {}
    if parser.has_section("relay.way"):
        for entry, value in parser.items("relay.way"):
            for prefix, settings in ((TARGET_PREFIX, target), (INBOX_PREFIX, inbox)):
                if entry.startswith(prefix) and len(entry) > len(prefix):
                    settings[entry[len(prefix) :]] = value.strip()
                    break
            else:
                raise StartupConfigError(
                    f"Startup configuration {path}: [relay.way] entry {entry!r} must begin with "
                    f"{TARGET_PREFIX!r} or {INBOX_PREFIX!r}."
                )
    return target, inbox


def _relay(parser: configparser.ConfigParser, path: Path) -> RelaySettings | None:
    """The section ``[relay]``; ``None`` if the file has none. ``[relay.way]`` without
    ``[relay]`` is an error."""
    if not parser.has_section("relay"):
        if parser.has_section("relay.way"):
            raise StartupConfigError(
                f"Startup configuration {path} has [relay.way] without [relay]."
            )
        return None
    values: dict[str, str] = {}
    for option in _RELAY_REQUIRED:
        text = _text(parser, "relay", option)
        if text is None:
            raise StartupConfigError(
                f"Startup configuration {path} is missing the entry {option} in section [relay]."
            )
        values[option] = text
    target, inbox = _way_settings(parser, path)
    return RelaySettings(
        address=values["address"],
        way=values["way"],
        secrets_directory=Path(values["secrets_directory"]),
        key_file=values["key_file"],
        database=Path(values["database"]),
        target=MappingProxyType(target),
        inbox=MappingProxyType(inbox),
        relay_link=_text(parser, "relay", "relay_link"),
        poll_interval_seconds=_integer(
            parser,
            path,
            "relay",
            "poll_interval_seconds",
            DEFAULT_POLL_INTERVAL_SECONDS,
            1,
            MAX_POLL_INTERVAL_SECONDS,
        ),
    )


def _read(explicit_path: str | Path | None) -> tuple[Path, configparser.ConfigParser]:
    path = resolve_config_path(explicit_path)
    parser = _parse(path)
    _check_names(parser, path)
    return path, parser


def _common(
    parser: configparser.ConfigParser, path: Path
) -> tuple[int, int, Mapping[str, str], MetaTraderSettings]:
    """The entries that every use of the file checks: limits, table of symbols, MetaTrader 5."""
    max_rows = _integer(
        parser, path, "broker", "max_rows_per_file", DEFAULT_MAX_ROWS, 1, MAX_ROWS_LIMIT
    )
    max_reads = _integer(
        parser, path, "broker", "max_reads_per_file", DEFAULT_MAX_READS, 1, MAX_READS_LIMIT
    )
    return max_rows, max_reads, _symbols(parser, path), _metatrader(parser, path)


def load_startup_config(explicit_path: str | Path | None = None) -> StartupConfig:
    """Load and check the startup configuration (``-c <PATH>`` or the search locations).

    Used by the call on the command line and by ``serve``: ``server_time_zone`` is required.
    The section ``[relay]`` is checked for unknown entries like every section, but its values are
    not read here: ``load_relay_settings`` reads them (``serve`` and ``request``).
    """
    path, parser = _read(explicit_path)
    max_rows, max_reads, symbols, metatrader = _common(parser, path)
    return StartupConfig(
        server_time_zone=_time_zone(parser, path),
        max_rows=max_rows,
        max_reads=max_reads,
        symbols=symbols,
        metatrader=metatrader,
    )


def load_relay_settings(explicit_path: str | Path | None = None) -> RelaySettings:
    """Load and check the startup configuration for ``request``.

    ``request`` does not read MetaTrader 5, so ``server_time_zone`` is not required (a given one
    is checked like everywhere else). ``[relay]`` is required.
    """
    path, parser = _read(explicit_path)
    _common(parser, path)
    if _text(parser, "broker", "server_time_zone") is not None:
        _time_zone(parser, path)
    relay = _relay(parser, path)
    if relay is None:
        raise StartupConfigError(
            f"Startup configuration {path} has no section [relay]: the commands serve and "
            "request need the connection to the relay."
        )
    return relay
