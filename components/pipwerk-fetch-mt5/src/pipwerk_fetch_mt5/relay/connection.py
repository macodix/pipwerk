"""The connection of the component to its relay, built from the section ``[relay]``.

Reading the section and opening the connection are the same for every component of pipwerk relay,
so they live in the library (``pipwerk_relaycore.connection``): it checks the address, the key and
the rights of the directory for secrets, the name and the own settings of the way and the
database. Every failure is a ``RelayStartError`` whose text names the entry or the file, never a
value of the startup configuration and never the key.
"""

from __future__ import annotations

from pipwerk_relaycore import ConnectionSettingsError as RelayStartError
from pipwerk_relaycore import connector_config, open_connector

__all__ = ["RelayStartError", "connector_config", "open_connector"]
