"""What the relay needs to work, built from an operating configuration.

``build_runtime`` loads the ways that the configuration names (by their names, through the entry
points of the library; the relay knows no way in its code) and the key of every connection from
the directory for secrets. It collects every problem it finds and raises ``ConfigRejected`` with
all of them. ``pipwerk-relay config load`` calls it to reject a configuration that the relay could
not run with; a running relay calls it to take over a new configuration.
"""

import json
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

from pipwerk_relaycore import (
    ConnectionKey,
    KeyHandlingError,
    SecretsDirectory,
    Way,
    WayLoadError,
    load_way,
)

from pipwerk_relay.errors import ConfigRejected
from pipwerk_relay.operating import RelayConfig


@dataclass(frozen=True, slots=True)
class Connection:
    """A connection of the relay: the other side, the way to it and the key."""

    name: str
    way_name: str
    way: Way[Any]
    key: ConnectionKey


@dataclass(frozen=True, slots=True)
class Inbox:
    name: str
    way_name: str
    way: Way[Any]


@dataclass(frozen=True)
class Runtime:
    """The configuration of a relay, ready to use."""

    config: RelayConfig
    version: int
    inboxes: tuple[Inbox, ...]
    components: Mapping[str, Connection]
    relays: Mapping[str, Connection]
    standard_relay: str | None
    keys: Mapping[str, ConnectionKey]
    ways: tuple[Way[Any], ...]
    """Every way once, for cleaning up."""

    @property
    def own(self) -> str:
        """This relay as a side of a connection: ``<network>.<relay>``."""
        return self.config.own_link_name


def build_runtime(config: RelayConfig, version: int, secrets: SecretsDirectory) -> Runtime:
    """Load the ways and the keys of a configuration; raises ``ConfigRejected``."""
    problems: list[str] = []
    ways: dict[tuple[str, str], Way[Any]] = {}

    def way_of(place: str, name: str, settings: Mapping[str, object]) -> Way[Any] | None:
        key = (name, json.dumps(settings, sort_keys=True))
        if key in ways:
            return ways[key]
        try:
            way = load_way(name, settings)
        except WayLoadError as error:
            problems.append(f"{place}: {error}")
            return None
        ways[key] = way
        return way

    def key_of(place: str, file_name: str) -> ConnectionKey | None:
        try:
            return secrets.load_key(file_name)
        except KeyHandlingError as error:
            problems.append(f"{place}: {error}")
            return None

    inboxes: list[Inbox] = []
    for index, item in enumerate(config.inputs):
        way = way_of(f"inputs.{index}", item.way, item.settings)
        if way is not None:
            inboxes.append(Inbox(item.name, item.way, way))
    components: dict[str, Connection] = {}
    for index, component in enumerate(config.components):
        place = f"components.{index}"
        way = way_of(place, component.way, component.settings)
        key = key_of(place, component.key_file)
        if way is not None and key is not None:
            components[component.name] = Connection(component.name, component.way, way, key)
    relays: dict[str, Connection] = {}
    for index, entry in enumerate(config.address_book):
        place = f"address_book.{index}"
        way = way_of(place, entry.way, entry.settings)
        key = key_of(place, entry.key_file)
        if way is not None and key is not None:
            relays[entry.link_name] = Connection(entry.link_name, entry.way, way, key)
    if problems:
        raise ConfigRejected(tuple(dict.fromkeys(problems)))
    standard = config.standard_relay
    return Runtime(
        config=config,
        version=version,
        inboxes=tuple(inboxes),
        components=components,
        relays=relays,
        standard_relay=None if standard is None else standard.link_name,
        keys={**{n: c.key for n, c in components.items()}, **{n: c.key for n, c in relays.items()}},
        ways=tuple(ways.values()),
    )
