"""Test network: two components, two relay steps and the directories between them.

The relay steps imitate what a relay does with an envelope (specification 4.1) as far as the
connector needs it: read, check the check value, add the own relay to ``hops``, pack for the next
connection. The real relay is not part of this library.

::

    app-a --(outbox_a)--> relay1 --(between_12)--> relay2 --(inbox_b)--> app-b
    app-a <--(inbox_a)--- relay1 <--(between_21)-- relay2 <--(outbox_b)-- app-b
"""

from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from pipwerk_relaycore import (
    Address,
    ConnectionKey,
    Connector,
    ConnectorConfig,
    Envelope,
    Handler,
    Message,
    ReceiptArrived,
    ReceiptMissing,
    ReceivedEnvelope,
    ReceivedMessage,
    WayConfig,
    load_way,
)
from pipwerk_relaycore.ways.files import FilesWay

ADDRESS_A = "app-a.net1.relay1"
ADDRESS_B = "app-b.net1.relay2"
RELAY_1 = "net1.relay1"
RELAY_2 = "net1.relay2"


class Clock:
    """A clock that the test moves."""

    def __init__(self) -> None:
        self.moment = datetime.now(UTC)

    def __call__(self) -> datetime:
        return self.moment

    def advance(self, **how_long: float) -> None:
        self.moment += timedelta(**how_long)


class RecordingHandler(Handler):
    """A component that remembers what it is told. ``failure`` makes ``store`` fail."""

    def __init__(self) -> None:
        self.stored: list[ReceivedMessage] = []
        self.arrived: list[ReceiptArrived] = []
        self.missing: list[ReceiptMissing] = []
        self.failure: BaseException | None = None

    def store(self, received: ReceivedMessage) -> None:
        if self.failure is not None:
            raise self.failure
        self.stored.append(received)

    def receipt_arrived(self, arrived: ReceiptArrived) -> None:
        self.arrived.append(arrived)

    def receipt_missing(self, missing: ReceiptMissing) -> None:
        self.missing.append(missing)


def files_way(directory: Path) -> FilesWay:
    way = load_way("files", {"directory": str(directory)})
    assert isinstance(way, FilesWay)
    return way


def count_files(directory: Path) -> int:
    return len([path for path in directory.iterdir() if path.suffix in {".json", ".att"}])


@dataclass
class Component:
    """One component: its connector, its handler and its two directories."""

    address: str
    key: ConnectionKey
    outbox: Path
    inbox: Path
    database: Path
    clock: Clock
    handler: RecordingHandler = field(default_factory=RecordingHandler)
    connector: Connector = field(init=False)

    def __post_init__(self) -> None:
        self.connector = self.open()

    def open(self, **settings: Any) -> Connector:
        """A (new) connector on the same directories and the same database."""
        parsed = Address.parse(self.address)
        config = ConnectorConfig(
            address=parsed,
            key=self.key,
            target=WayConfig("files", {"directory": str(self.outbox)}),
            inbox=WayConfig("files", {"directory": str(self.inbox)}),
            database=self.database,
            **settings,
        )
        return Connector(config, clock=self.clock)

    def restart(self, **settings: Any) -> None:
        """Close the connector and open a new one: a restart of the component."""
        self.connector.close()
        self.connector = self.open(**settings)

    def poll(self) -> Any:
        return self.connector.poll(self.handler)


def forward(
    source: Path,
    source_keys: Mapping[str, ConnectionKey],
    me: str,
    target: Path,
    sender: str,
    recipient: str,
    key: ConnectionKey,
) -> int:
    """Take everything from ``source`` and put it, as the relay ``me``, into ``target``."""
    reading = files_way(source)
    writing = files_way(target)
    moved = 0
    for item in reading.read():
        assert isinstance(item, ReceivedEnvelope)
        opened = item.envelope.open(source_keys, recipient=me)
        envelope = Envelope.create(
            opened.message,
            hops=(*opened.hops, me),
            sender=sender,
            recipient=recipient,
            key=key,
        )
        writing.send(envelope, item.attachments)
        reading.acknowledge(item.token)
        moved += 1
    return moved


class Network:
    """Two components that talk over two relay steps."""

    def __init__(self, root: Path) -> None:
        self.clock = Clock()
        for name in ("outbox_a", "inbox_a", "outbox_b", "inbox_b", "between_12", "between_21"):
            (root / name).mkdir()
        self.between_12 = root / "between_12"
        self.between_21 = root / "between_21"
        self.key_a = ConnectionKey.generate()
        self.key_b = ConnectionKey.generate()
        self.key_relays = ConnectionKey.generate()
        self.a = Component(
            ADDRESS_A, self.key_a, root / "outbox_a", root / "inbox_a", root / "a.db", self.clock
        )
        self.b = Component(
            ADDRESS_B, self.key_b, root / "outbox_b", root / "inbox_b", root / "b.db", self.clock
        )

    def relay_step(self) -> int:
        """Move everything one step; the number of envelopes moved."""
        moved = forward(
            self.a.outbox,
            {"app-a": self.key_a},
            RELAY_1,
            self.between_12,
            RELAY_1,
            RELAY_2,
            self.key_relays,
        )
        moved += forward(
            self.between_12,
            {RELAY_1: self.key_relays},
            RELAY_2,
            self.b.inbox,
            RELAY_2,
            "app-b",
            self.key_b,
        )
        moved += forward(
            self.b.outbox,
            {"app-b": self.key_b},
            RELAY_2,
            self.between_21,
            RELAY_2,
            RELAY_1,
            self.key_relays,
        )
        moved += forward(
            self.between_21,
            {RELAY_2: self.key_relays},
            RELAY_1,
            self.a.inbox,
            RELAY_1,
            "app-a",
            self.key_a,
        )
        return moved

    def close(self) -> None:
        self.a.connector.close()
        self.b.connector.close()


def place(
    inbox: Path,
    message: Message,
    key: ConnectionKey,
    attachments: Sequence[bytes] = (),
    *,
    sender: str = RELAY_2,
    recipient: str = "app-b",
    hops: Sequence[str] = (RELAY_1,),
) -> Envelope:
    """Put an envelope into an inbox as a relay would (also a forged one with a wrong key)."""
    envelope = Envelope.create(message, hops=hops, sender=sender, recipient=recipient, key=key)
    files_way(inbox).send(envelope, attachments)
    return envelope
