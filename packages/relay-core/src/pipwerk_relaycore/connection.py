"""The connection of a component to its relay, as an INI file states it (specification 3.5, 6.1).

Every component that sends and receives messages states its connection in two sections of its
startup configuration, in the same form (``pipwerk-fetch-mt5`` and the probe of pipwerk relay):

``[relay]``
    ``address`` (own address ``<component>.<network>.<relay>``), ``way`` (name of the
    transmission way), ``secrets_directory`` and ``key_file`` (the key of the connection with the
    relay), ``database`` (the SQLite file of the connection; the directory is created) are
    required. ``relay_link`` (``<network>.<relay>``, the name of the relay side of the
    connection if it differs from the relay of the address) and ``poll_interval_seconds``
    (default 2, from 1 to 3600) are optional.
``[relay.way]``
    The own settings of the way, passed on unchanged and checked by the way itself:
    ``target.<entry>`` for the target (where the relay reads what the component sends) and
    ``inbox.<entry>`` for the inbox (where the relay puts what is meant for the component).

``read_connection_settings`` reads and checks the two sections of a ``ConfigParser`` that the
caller has built with ``interpolation=None`` (a key or a path may contain ``%``).
``open_connector`` checks what the library checks (the address, the key and the rights of the
directory for secrets, the name and the own settings of the way, the database) and returns the
``Connector``. Every error is a ``ConnectionSettingsError`` whose text names the entry or the
file, never a value of the file and never the key.
"""

from __future__ import annotations

import configparser
from collections.abc import Callable, Mapping
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from types import MappingProxyType

from sqlalchemy.exc import SQLAlchemyError

from pipwerk_relaycore.address import Address
from pipwerk_relaycore.connector import Connector, ConnectorConfig, WayConfig
from pipwerk_relaycore.errors import RelayCoreError
from pipwerk_relaycore.keys import SecretsDirectory

RELAY_SECTION = "relay"
WAY_SECTION = "relay.way"
RELAY_OPTIONS = frozenset(
    {
        "address",
        "way",
        "secrets_directory",
        "key_file",
        "database",
        "relay_link",
        "poll_interval_seconds",
    }
)
"""The entries of ``[relay]``; every other entry is rejected."""
RELAY_REQUIRED = ("address", "way", "secrets_directory", "key_file", "database")
DEFAULT_POLL_INTERVAL_SECONDS = 2
MAX_POLL_INTERVAL_SECONDS = 3600
TARGET_PREFIX = "target."
INBOX_PREFIX = "inbox."


class ConnectionSettingsError(RelayCoreError):
    """The connection of a component cannot be read or opened. The text is for the user."""


def _empty() -> Mapping[str, str]:
    return MappingProxyType({})


@dataclass(frozen=True)
class ConnectionSettings:
    """The connection of the component to its relay, as the file states it.

    The values are text as they stand in the file; ``open_connector`` checks them. ``target``
    and ``inbox`` are the own settings of the way, passed on unchanged.
    """

    address: str
    way: str
    secrets_directory: Path
    key_file: str
    database: Path
    target: Mapping[str, str] = field(default_factory=_empty)
    inbox: Mapping[str, str] = field(default_factory=_empty)
    relay_link: str | None = None
    poll_interval_seconds: int = DEFAULT_POLL_INTERVAL_SECONDS


def _text(parser: configparser.ConfigParser, option: str) -> str | None:
    if not parser.has_option(RELAY_SECTION, option):
        return None
    value = parser.get(RELAY_SECTION, option).strip()
    return value or None


def _poll_interval(parser: configparser.ConfigParser, origin: str) -> int:
    value = _text(parser, "poll_interval_seconds")
    if value is None:
        return DEFAULT_POLL_INTERVAL_SECONDS
    name = f"{origin}: [{RELAY_SECTION}] poll_interval_seconds"
    if not (value.isascii() and value.isdigit()):
        raise ConnectionSettingsError(f"{name} must be a whole number.")
    number = int(value)
    if not 1 <= number <= MAX_POLL_INTERVAL_SECONDS:
        raise ConnectionSettingsError(f"{name} must be between 1 and {MAX_POLL_INTERVAL_SECONDS}.")
    return number


def _way_settings(
    parser: configparser.ConfigParser, origin: str
) -> tuple[dict[str, str], dict[str, str]]:
    """The own settings of the way for the target and for the inbox, passed on unchanged."""
    target: dict[str, str] = {}
    inbox: dict[str, str] = {}
    if parser.has_section(WAY_SECTION):
        for entry, value in parser.items(WAY_SECTION):
            for prefix, settings in ((TARGET_PREFIX, target), (INBOX_PREFIX, inbox)):
                if entry.startswith(prefix) and len(entry) > len(prefix):
                    settings[entry[len(prefix) :]] = value.strip()
                    break
            else:
                raise ConnectionSettingsError(
                    f"{origin}: [{WAY_SECTION}] entry {entry!r} must begin with "
                    f"{TARGET_PREFIX!r} or {INBOX_PREFIX!r}."
                )
    return target, inbox


def read_connection_settings(
    parser: configparser.ConfigParser, origin: str
) -> ConnectionSettings | None:
    """The sections ``[relay]`` and ``[relay.way]``; ``None`` if the file has no ``[relay]``.

    ``origin`` starts every message ("Startup configuration <path>"). ``[relay.way]`` without
    ``[relay]`` is an error. An unknown entry of ``[relay]`` is an error that names the entry.
    """
    if not parser.has_section(RELAY_SECTION):
        if parser.has_section(WAY_SECTION):
            raise ConnectionSettingsError(
                f"{origin} has [{WAY_SECTION}] without [{RELAY_SECTION}]."
            )
        return None
    for option in parser.options(RELAY_SECTION):
        if option not in RELAY_OPTIONS:
            raise ConnectionSettingsError(
                f"{origin} has an unknown entry {option!r} in section [{RELAY_SECTION}]."
            )
    values: dict[str, str] = {}
    for option in RELAY_REQUIRED:
        text = _text(parser, option)
        if text is None:
            raise ConnectionSettingsError(
                f"{origin} is missing the entry {option} in section [{RELAY_SECTION}]."
            )
        values[option] = text
    interval = _poll_interval(parser, origin)
    target, inbox = _way_settings(parser, origin)
    return ConnectionSettings(
        address=values["address"],
        way=values["way"],
        secrets_directory=Path(values["secrets_directory"]),
        key_file=values["key_file"],
        database=Path(values["database"]),
        target=MappingProxyType(target),
        inbox=MappingProxyType(inbox),
        relay_link=_text(parser, "relay_link"),
        poll_interval_seconds=interval,
    )


def connector_config(settings: ConnectionSettings) -> ConnectorConfig:
    """The ``ConnectorConfig`` for the settings; raises ``ConnectionSettingsError``."""
    try:
        address = Address.parse(settings.address)
        key = SecretsDirectory(settings.secrets_directory).load_key(settings.key_file)
        return ConnectorConfig(
            address=address,
            key=key,
            target=WayConfig(settings.way, dict(settings.target)),
            inbox=WayConfig(settings.way, dict(settings.inbox)),
            database=settings.database,
            relay_link=settings.relay_link,
        )
    except RelayCoreError as error:
        raise ConnectionSettingsError(f"[{RELAY_SECTION}]: {error}") from None
    except ValueError:
        raise ConnectionSettingsError(
            f"[{RELAY_SECTION}]: relay_link is not a name '<network>.<relay>'."
        ) from None


def open_connector(
    settings: ConnectionSettings, *, clock: Callable[[], datetime] | None = None
) -> Connector:
    """Open the connection to the relay; the database is created and migrated.

    ``clock`` is for the tests. Raises ``ConnectionSettingsError``.
    """
    config = connector_config(settings)
    try:
        settings.database.parent.mkdir(parents=True, exist_ok=True)
    except OSError:
        raise ConnectionSettingsError(
            f"[{RELAY_SECTION}]: the directory of the database cannot be created."
        ) from None
    try:
        return Connector(config) if clock is None else Connector(config, clock=clock)
    except RelayCoreError as error:
        raise ConnectionSettingsError(f"[{RELAY_SECTION}]: {error}") from None
    except OSError, SQLAlchemyError:
        raise ConnectionSettingsError(
            f"[{RELAY_SECTION}]: the database cannot be opened."
        ) from None


__all__ = [
    "DEFAULT_POLL_INTERVAL_SECONDS",
    "INBOX_PREFIX",
    "MAX_POLL_INTERVAL_SECONDS",
    "RELAY_OPTIONS",
    "RELAY_REQUIRED",
    "RELAY_SECTION",
    "TARGET_PREFIX",
    "WAY_SECTION",
    "ConnectionSettings",
    "ConnectionSettingsError",
    "connector_config",
    "open_connector",
    "read_connection_settings",
]
