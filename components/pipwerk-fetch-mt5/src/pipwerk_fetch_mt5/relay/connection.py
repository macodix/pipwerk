"""The connection of the component to its relay, built from the section ``[relay]``.

``open_connector`` checks what the library checks (the address, the key and the rights of the
directory for secrets, the name and the own settings of the way, the database) and returns the
``Connector`` of ``pipwerk_relaycore``. Every failure is a ``RelayStartError`` whose text names
the entry or the file, never a value of the startup configuration and never the key.
"""

from __future__ import annotations

from collections.abc import Callable
from datetime import datetime

from pipwerk_relaycore import (
    Address,
    Connector,
    ConnectorConfig,
    RelayCoreError,
    SecretsDirectory,
    WayConfig,
)
from sqlalchemy.exc import SQLAlchemyError

from pipwerk_fetch_mt5.config import RelaySettings


class RelayStartError(Exception):
    """The connection to the relay cannot be opened. The text is shown to the user."""


def connector_config(settings: RelaySettings) -> ConnectorConfig:
    """The ``ConnectorConfig`` for the settings; raises ``RelayStartError``."""
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
        raise RelayStartError(f"[relay]: {error}") from None
    except ValueError:
        raise RelayStartError("[relay]: relay_link is not a name '<network>.<relay>'.") from None


def open_connector(
    settings: RelaySettings, *, clock: Callable[[], datetime] | None = None
) -> Connector:
    """Open the connection to the relay; the database is created and migrated.

    ``clock`` is for the tests. Raises ``RelayStartError``.
    """
    config = connector_config(settings)
    try:
        settings.database.parent.mkdir(parents=True, exist_ok=True)
    except OSError:
        raise RelayStartError("[relay]: the directory of the database cannot be created.") from None
    try:
        return Connector(config) if clock is None else Connector(config, clock=clock)
    except RelayCoreError as error:
        raise RelayStartError(f"[relay]: {error}") from None
    except OSError, SQLAlchemyError:
        raise RelayStartError("[relay]: the database cannot be opened.") from None
