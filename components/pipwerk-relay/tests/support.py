"""Test world: relays with their directories, databases and secrets, and components that use
the real connector of the library.

::

    app-a --(in of r1)--> r1 --(in of r2)--> r2 --(out_app-b of r2)--> app-b

Every relay has one inbox directory ``in`` that its components and the relays that know it write
to, and one directory ``out_<component>`` per component for what the relay hands to it. The
clock is one the test moves.
"""

import os
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

import sqlalchemy as sa
from pipwerk_relaycore import (
    Address,
    ConnectionKey,
    Connector,
    ConnectorConfig,
    Envelope,
    Handler,
    Message,
    ReceivedMessage,
    SecretsDirectory,
    WayConfig,
    load_way,
)
from pipwerk_relaycore.contents import UndeliverableContent

from pipwerk_relay.attachments import AttachmentStore
from pipwerk_relay.configuration import load_configuration
from pipwerk_relay.database import create_engine, migrate
from pipwerk_relay.relay import CycleResult, Relay
from pipwerk_relay.store import RelayStore


class Clock:
    """A clock that the test moves."""

    def __init__(self) -> None:
        self.moment = datetime.now(UTC)

    def __call__(self) -> datetime:
        return self.moment

    def advance(self, **how_long: float) -> None:
        self.moment += timedelta(**how_long)


class RecordingHandler(Handler):
    """A component that remembers what it is told."""

    def __init__(self) -> None:
        self.stored: list[ReceivedMessage] = []

    def store(self, received: ReceivedMessage) -> None:
        self.stored.append(received)

    @property
    def notices(self) -> list[ReceivedMessage]:
        return [item for item in self.stored if item.message.kind == "relay.undeliverable"]

    @property
    def others(self) -> list[ReceivedMessage]:
        return [item for item in self.stored if item.message.kind != "relay.undeliverable"]

    def reasons(self) -> list[str]:
        return [str(item.message.content["reason"]) for item in self.notices]


@dataclass
class Component:
    """A running component: its connector, its handler and its address."""

    address: Address
    connector: Connector
    handler: RecordingHandler = field(default_factory=RecordingHandler)

    def poll(self) -> None:
        self.connector.poll(self.handler)

    def send(
        self,
        recipient: str,
        *,
        kind: str = "probe.message",
        content: Mapping[str, Any] | None = None,
        attachments: Sequence[tuple[str, bytes]] = (),
        **options: Any,
    ) -> Message:
        return self.connector.send(
            recipient, kind, content or {"text": "hello"}, attachments=attachments, **options
        )


def write_key_copy(secrets_directory: Path, name: str, key: ConnectionKey) -> None:
    """Give another side a copy of a key: a file with the rights of a key file."""
    descriptor = os.open(secrets_directory / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "wb") as file:
        file.write(key.to_file_text().encode("ascii"))


class Site:
    """One relay with its directories, database, secrets and components."""

    def __init__(self, world: World, name: str, network: str, limits: dict[str, int]) -> None:
        self.world = world
        self.name = name
        self.network = network
        self.root = world.root / f"{network}-{name}"
        self.root.mkdir()
        self.inbox = self.root / "in"
        self.inbox.mkdir()
        self.secrets_directory = self.root / "secrets"
        self.secrets_directory.mkdir()
        self.secrets_directory.chmod(0o700)
        self.secrets = SecretsDirectory(self.secrets_directory)
        self.engine = create_engine(sa.URL.create("sqlite", database=str(self.root / "relay.db")))
        migrate(self.engine)
        self.store = RelayStore(self.engine)
        self.attachments_directory = self.root / "attachments"
        self.attachments = AttachmentStore(self.attachments_directory)
        self.attachments.ensure_directory()
        self.components: dict[str, Component] = {}
        self.component_entries: list[dict[str, Any]] = []
        self.address_book: list[dict[str, Any]] = []
        self.periods: dict[str, Any] = {
            "read_interval_seconds": 1,
            "retry_first_seconds": 10,
            "retry_max_seconds": 60,
            "delivery_deadline_seconds": 600,
        }
        self.limits: dict[str, Any] = dict(limits)
        self.input_settings: dict[str, Any] = {}
        self.shared_inbox: Path | None = None
        """A second inbox in the directory the relays share (a network drive), where other relays
        put their envelopes. Without it the inbox ``in`` serves components and relays alike."""
        self.relay = self.new_relay()
        self.applied = 0

    def new_relay(self) -> Relay:
        return Relay(self.store, self.attachments, self.secrets, clock=self.world.clock)

    def restart(self) -> None:
        """A new process on the same database and directories."""
        self.relay = self.new_relay()

    @property
    def own(self) -> str:
        return f"{self.network}.{self.name}"

    def out_directory(self, component: str) -> Path:
        return self.root / f"out_{component}"

    def document(self) -> dict[str, Any]:
        inputs = [
            {
                "name": "main",
                "way": "files",
                "settings": {"directory": str(self.inbox), **self.input_settings},
            }
        ]
        if self.shared_inbox is not None:
            inputs.append(
                {
                    "name": "shared",
                    "way": "files",
                    "settings": {"directory": str(self.shared_inbox), **self.input_settings},
                }
            )
        return {
            "network": self.network,
            "name": self.name,
            "inputs": inputs,
            "components": self.component_entries,
            "address_book": self.address_book,
            "periods": self.periods,
            "limits": self.limits,
        }

    def apply(self) -> int:
        """Load the configuration of the site; the new version."""
        import json

        self.applied = load_configuration(
            self.store, self.secrets, json.dumps(self.document()), self.world.clock()
        )
        return self.applied

    def add_component(self, name: str) -> Component:
        """Connect a component: key, directory, entry of the configuration and connector."""
        out = self.out_directory(name)
        out.mkdir()
        key = self.secrets.new_key(f"comp-{name}")
        self.component_entries.append(
            {
                "name": name,
                "way": "files",
                "settings": {"directory": str(out)},
                "key_file": f"comp-{name}",
            }
        )
        address = Address(name, self.network, self.name)
        config = ConnectorConfig(
            address=address,
            key=key,
            target=WayConfig("files", {"directory": str(self.inbox)}),
            inbox=WayConfig("files", {"directory": str(out)}),
            database=self.root / f"{name}.db",
        )
        component = Component(address, Connector(config, clock=self.world.clock))
        self.components[name] = component
        return component

    def add_relay_entry(
        self, other: Site, key_file: str, *, standard: bool = False, **settings: Any
    ) -> None:
        self.address_book.append(
            {
                "network": other.network,
                "relay": other.name,
                "way": "files",
                "settings": {"directory": str(other.shared_inbox or other.inbox), **settings},
                "key_file": key_file,
                "standard": standard,
            }
        )

    def queue_size(self) -> int:
        return self.store.totals().messages

    def close(self) -> None:
        for component in self.components.values():
            component.connector.close()
        self.engine.dispose()


class World:
    """Several relays that share one clock."""

    def __init__(self, root: Path) -> None:
        self.root = root
        root.mkdir(parents=True, exist_ok=True)
        self.clock = Clock()
        self.sites: dict[str, Site] = {}

    @property
    def shared_directory(self) -> Path:
        """The directory the relays share (the network drive)."""
        return self.root / "shared"

    def site(
        self,
        name: str = "r1",
        *,
        network: str = "net1",
        components: Sequence[str] = (),
        max_hops: int | None = None,
        read_batch: int | None = None,
        max_queue_messages: int | None = None,
        max_attachment_storage_bytes: int | None = None,
        shared: bool = False,
    ) -> Site:
        """A relay. With ``shared`` other relays put their envelopes into a directory of its own
        under ``shared/`` (the stand-in for the network drive between the relays)."""
        chosen = {
            "max_hops": max_hops,
            "read_batch": read_batch,
            "max_queue_messages": max_queue_messages,
            "max_attachment_storage_bytes": max_attachment_storage_bytes,
        }
        site = Site(self, name, network, {k: v for k, v in chosen.items() if v is not None})
        if shared:
            site.shared_inbox = self.shared_directory / f"in-{name}"
            site.shared_inbox.mkdir(parents=True)
        self.sites[name] = site
        for component in components:
            site.add_component(component)
        return site

    def link(
        self,
        first: Site,
        second: Site,
        *,
        first_standard: bool = False,
        second_standard: bool = False,
    ) -> None:
        """Two relays that know each other, with one key."""
        key = first.secrets.new_key(f"relay-{second.name}")
        write_key_copy(second.secrets_directory, f"relay-{first.name}", key)
        first.add_relay_entry(second, f"relay-{second.name}", standard=first_standard)
        second.add_relay_entry(first, f"relay-{first.name}", standard=second_standard)

    def start(self) -> None:
        for site in self.sites.values():
            site.apply()

    def pump(self, rounds: int = 4) -> list[CycleResult]:
        """Let every relay work and every component read, several times."""
        results: list[CycleResult] = []
        for _ in range(rounds):
            for site in self.sites.values():
                results.append(site.relay.cycle())
                for component in site.components.values():
                    component.poll()
        return results

    def close(self) -> None:
        for site in self.sites.values():
            site.close()


def make_message(
    sender: str,
    recipient: str,
    *,
    kind: str = "probe.message",
    content: Mapping[str, Any] | None = None,
    attachments: Sequence[tuple[str, bytes]] = (),
    message_id: UUID | None = None,
    created_at: datetime | None = None,
) -> Message:
    from pipwerk_relaycore import Attachment

    return Message(
        id=message_id or uuid4(),
        sender=sender,
        recipient=recipient,
        priority="normal",
        kind=kind,
        content=dict(content or {"text": "hello"}),
        created_at=created_at or datetime.now(UTC),
        attachments=tuple(Attachment.of(name, data) for name, data in attachments),
    )


def place(
    directory: Path,
    message: Message,
    key: ConnectionKey,
    *,
    sender: str,
    recipient: str,
    hops: Sequence[str] = (),
    attachments: Sequence[bytes] = (),
) -> Envelope:
    """Put an envelope into a directory as a neighbour would (also a forged one)."""
    envelope = Envelope.create(message, hops=hops, sender=sender, recipient=recipient, key=key)
    load_way("files", {"directory": str(directory)}).send(envelope, attachments)
    return envelope


def undeliverable_content(reason: str, recipient: str, kind: str) -> dict[str, Any]:
    from pipwerk_relaycore import UndeliverableReason

    return dict(UndeliverableContent.of(UndeliverableReason(reason), recipient, kind).to_content())


def names(directory: Path) -> set[str]:
    return {path.name for path in directory.iterdir()}


Factory = Callable[..., World]
