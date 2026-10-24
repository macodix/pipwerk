"""Helpers of the tests: paths, messages, keys and envelopes."""

from collections.abc import Sequence
from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID, uuid4

from pipwerk_relaycore import Attachment, ConnectionKey, Envelope, Message

REPOSITORY = Path(__file__).resolve().parents[3]
CONTRACT_DIRECTORY = REPOSITORY / "contracts" / "messages" / "v1"
EXAMPLE_DIRECTORY = CONTRACT_DIRECTORY / "examples"
TECHNICAL_DOCUMENT = REPOSITORY / "docs" / "technical" / "pipwerk-relay.md"
LIBRARY_SOURCE = Path(__file__).resolve().parents[1] / "src" / "pipwerk_relaycore"

EXAMPLE_KEY = ConnectionKey(bytes(range(32)))
"""The key of the examples and of the test vector. It protects nothing; never use it."""

SENDER_LINK = "app-a"
RECIPIENT_LINK = "net1.relay1"
SENDER = "app-a.net1.relay1"
RECIPIENT = "app-b.net1.relay2"


def make_message(
    attachments: Sequence[tuple[str, bytes]] = (),
    *,
    message_id: UUID | None = None,
    kind: str = "example.request",
) -> Message:
    return Message(
        id=message_id or uuid4(),
        sender=SENDER,
        recipient=RECIPIENT,
        priority="normal",
        kind=kind,
        content={"text": "hello"},
        created_at=datetime(2026, 10, 24, 12, 0, 0, tzinfo=UTC),
        attachments=tuple(Attachment.of(name, content) for name, content in attachments),
    )


def make_envelope(
    message: Message | None = None,
    key: ConnectionKey | None = None,
    *,
    hops: Sequence[str] = (),
) -> Envelope:
    return Envelope.create(
        message or make_message(),
        hops=hops,
        sender=SENDER_LINK,
        recipient=RECIPIENT_LINK,
        key=key or EXAMPLE_KEY,
    )
