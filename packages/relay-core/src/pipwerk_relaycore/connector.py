"""Connection of a component to its relay (specification 3.5, 3.7, E4).

The connector is what a component uses to send and receive messages:

- ``Connector.send`` packs a message with attachments into an envelope, protects it with the key
  of the connection and hands it to the way of the target (the inbox of the relay).
- ``Connector.poll`` reads the inbox of the component. Every envelope is checked (check value,
  connection, recipient, size and SHA-256 of the attachments, schema) before the component sees
  anything of it. What fails is dropped and noted in the log without content (req-relay-010).
  A message that passed is handed to the component (``Handler.store``). The component stores it
  and returns; only then the connector marks the id as seen, sends the receipt if the sender
  asked for one and acknowledges the envelope. If ``store`` raises, the envelope stays in the
  inbox and the id is not marked, so the next ``poll`` hands the message over again.
- A repetition (an id seen already) is not handed over again, but acknowledged. If it asks for a
  receipt, the receipt is sent once more.
- A message sent with ``receipt`` waits in the database with its deadline until the receipt, a
  notice ``relay.undeliverable`` or the deadline. The waiting survives a restart.

Marking the id as seen happens before the receipt is sent, not after it. If sending the receipt
fails, the envelope stays in the inbox, and the next ``poll`` finds it as a repetition: it sends
the receipt again without handing the message over a second time. Taking it the other way round
(receipt first, mark afterwards) would hand a message over twice whenever a receipt fails.

One connector belongs to one component; ``poll`` and ``send`` are not called at the same time
from several threads. The log (``logging``, name ``pipwerk_relaycore.connector``) names ids,
kind, addresses and reasons, never content, attachments or keys.
"""

import logging
from abc import ABC, abstractmethod
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from pathlib import Path
from types import TracebackType
from typing import Any, Self
from uuid import UUID, uuid4

import sqlalchemy as sa
from pydantic import JsonValue
from sqlalchemy.engine import Engine

from pipwerk_relaycore.address import Address, check_relay
from pipwerk_relaycore.contents import KIND_RECEIPT, KIND_UNDELIVERABLE, is_valid_content
from pipwerk_relaycore.envelope import Envelope, OpenedEnvelope, verify_attachments
from pipwerk_relaycore.errors import (
    EnvelopeRejected,
    RejectionReason,
    WayError,
    WayUnavailableError,
)
from pipwerk_relaycore.keys import ConnectionKey
from pipwerk_relaycore.loader import load_way
from pipwerk_relaycore.message import Attachment, Message
from pipwerk_relaycore.migrate import migrate_database
from pipwerk_relaycore.store import ConnectorStore, WaitingMessage
from pipwerk_relaycore.way import FaultyEnvelope, ReceivedEnvelope, Way

LOGGER = logging.getLogger("pipwerk_relaycore.connector")

DEFAULT_SEEN_FOR = timedelta(days=7)
"""How long a message id counts as seen (specification E4)."""
DEFAULT_RECEIPT_TIMEOUT = timedelta(hours=1)
"""How long a sender waits for a receipt if the component names no deadline (3.7)."""
DEFAULT_ATTACHMENT_GRACE = timedelta(minutes=5)
"""How long an envelope with a missing or wrong attachment is kept before it is dropped."""
DATABASE_BUSY_SECONDS = 30

_ATTACHMENT_REASONS = frozenset(
    {
        RejectionReason.ATTACHMENT_MISSING,
        RejectionReason.ATTACHMENT_SIZE,
        RejectionReason.ATTACHMENT_HASH,
    }
)
"""Reasons that can be a delay of the file system (technical documentation, annotation 3)."""


def _now() -> datetime:
    return datetime.now(UTC)


@dataclass(frozen=True, slots=True)
class WayConfig:
    """A way by its name with its own settings (specification 3.4).

    The settings are passed on unchanged; the way checks them itself.
    """

    name: str
    settings: Mapping[str, object] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class ConnectorConfig:
    """What a component says about its connection (specification 3.5).

    ``address``
        The own address of the running component.
    ``key``
        The key of the connection with the relay.
    ``target``
        Way and settings of the target: where the relay reads what the component sends.
    ``inbox``
        Way and settings of the inbox: where the relay puts what is meant for the component.
    ``database``
        The SQLite file with the seen message ids and the waiting receipts. The directory must
        exist.
    ``relay_link``
        The name of the relay side of the connection, ``<pipwerk network>.<relay>``. Without it
        the relay of the address.
    ``seen_for``, ``receipt_timeout``, ``attachment_grace``
        Periods, see ``DEFAULT_SEEN_FOR``, ``DEFAULT_RECEIPT_TIMEOUT`` and
        ``DEFAULT_ATTACHMENT_GRACE``.
    """

    address: Address
    key: ConnectionKey
    target: WayConfig
    inbox: WayConfig
    database: Path
    relay_link: str | None = None
    seen_for: timedelta = DEFAULT_SEEN_FOR
    receipt_timeout: timedelta = DEFAULT_RECEIPT_TIMEOUT
    attachment_grace: timedelta = DEFAULT_ATTACHMENT_GRACE

    def __post_init__(self) -> None:
        if self.relay_link is not None:
            check_relay(self.relay_link)
        for name in ("seen_for", "receipt_timeout", "attachment_grace"):
            if getattr(self, name) <= timedelta(0):
                raise ValueError(f"{name} must be positive")

    @property
    def component(self) -> str:
        """The name of the component side of the connection."""
        return self.address.component

    @property
    def relay(self) -> str:
        """The name of the relay side of the connection."""
        return self.relay_link or self.address.relay_name


@dataclass(frozen=True, slots=True)
class ReceivedMessage:
    """A message that passed every check, with its attachments (in the order of the message)."""

    message: Message
    hops: tuple[str, ...]
    attachments: tuple[bytes, ...]

    @property
    def files(self) -> dict[str, bytes]:
        """The attachments by name."""
        return {
            attachment.name: content
            for attachment, content in zip(self.message.attachments, self.attachments, strict=True)
        }


@dataclass(frozen=True, slots=True)
class ReceiptArrived:
    """The receipt of a message that was sent with ``receipt``."""

    message_id: UUID
    kind: str
    recipient: str


@dataclass(frozen=True, slots=True)
class ReceiptMissing:
    """A message sent with ``receipt`` whose deadline passed without a receipt (3.7)."""

    message_id: UUID
    kind: str
    recipient: str
    sent_at: datetime
    deadline: datetime


class Handler(ABC):
    """What the component does with what ``Connector.poll`` finds."""

    @abstractmethod
    def store(self, received: ReceivedMessage) -> None:
        """Store the message. Returning means "stored"; raising means "not stored".

        A notice ``relay.undeliverable`` comes through here like every other message
        (req-relay-008); the connector ends the waiting for the message it names afterwards.
        A receipt does not come through here.
        """

    def receipt_arrived(self, arrived: ReceiptArrived) -> None:  # noqa: B027 - optional hook
        """The receipt of a message has arrived. Optional."""

    def receipt_missing(self, missing: ReceiptMissing) -> None:  # noqa: B027 - optional hook
        """The deadline of a receipt has passed. The component tells the user. Optional."""


@dataclass(frozen=True, slots=True)
class PollResult:
    """What one ``poll`` did, as numbers.

    ``available`` is false if the inbox could not be reached.
    """

    available: bool = True
    delivered: int = 0
    repeated: int = 0
    dropped: int = 0
    postponed: int = 0
    failed: int = 0
    receipts: int = 0
    missing_receipts: int = 0


class _Counts:
    def __init__(self) -> None:
        self.available = True
        self.delivered = 0
        self.repeated = 0
        self.dropped = 0
        self.postponed = 0
        self.failed = 0
        self.receipts = 0
        self.missing_receipts = 0

    def result(self) -> PollResult:
        return PollResult(**vars(self))


def _create_engine(database: Path) -> Engine:
    url = sa.URL.create("sqlite", database=str(database))
    return sa.create_engine(url, connect_args={"timeout": DATABASE_BUSY_SECONDS})


class Connector:
    """The connection of one component to its relay."""

    def __init__(self, config: ConnectorConfig, *, clock: Callable[[], datetime] = _now) -> None:
        self._config = config
        self._clock = clock
        self._keys = {config.relay: config.key}
        self._target: Way[Any] = load_way(config.target.name, config.target.settings)
        self._inbox: Way[Any] = load_way(config.inbox.name, config.inbox.settings)
        self._engine = _create_engine(config.database)
        try:
            migrate_database(self._engine)
        except BaseException:
            self._engine.dispose()
            raise
        self._store = ConnectorStore(self._engine)

    def close(self) -> None:
        """Release the database."""
        self._engine.dispose()

    def __enter__(self) -> Self:
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        self.close()

    @property
    def address(self) -> Address:
        return self._config.address

    @property
    def waiting_count(self) -> int:
        """The number of messages that wait for a receipt."""
        return self._store.waiting_count()

    # sending ------------------------------------------------------------------------------

    def send(
        self,
        recipient: str,
        kind: str,
        content: Mapping[str, JsonValue],
        *,
        attachments: Sequence[tuple[str, bytes]] = (),
        priority: str = "normal",
        reference_id: UUID | None = None,
        receipt: bool = False,
        receipt_timeout: timedelta | None = None,
    ) -> Message:
        """Send a message with attachments (name and content) and return it.

        With ``receipt`` the connector waits for the receipt: ``receipt_timeout`` (default of
        the configuration) is the time until ``Handler.receipt_missing`` is called. Raises
        ``pydantic.ValidationError`` for an invalid message, ``ValueError`` for a content that
        does not fit a known kind or a deadline without ``receipt``, and the errors of the way
        (``WayUnavailableError``, ``WayTooLargeError``, ``WayRefusedError``) if the target does
        not take the envelope; then nothing waits.
        """
        if receipt_timeout is not None and (not receipt or receipt_timeout <= timedelta(0)):
            raise ValueError("a deadline needs a receipt and must be positive")
        if not is_valid_content(kind, content):
            raise ValueError("the content does not fit the kind of the message")
        now = self._clock()
        message = Message(
            id=uuid4(),
            sender=str(self._config.address),
            recipient=recipient,
            priority=priority,
            kind=kind,
            content=dict(content),
            reference_id=reference_id,
            created_at=now,
            attachments=tuple(Attachment.of(name, data) for name, data in attachments),
            receipt=receipt,
        )
        contents = [data for _, data in attachments]
        if not receipt:
            self._hand_over(message, contents)
            return message
        entry = WaitingMessage(
            message_id=message.id,
            kind=kind,
            recipient=recipient,
            sent_at=now,
            deadline=now + (receipt_timeout or self._config.receipt_timeout),
        )
        # The entry is written first: a receipt that arrives at once finds it.
        self._store.add_waiting(entry)
        try:
            self._hand_over(message, contents)
        except BaseException:
            self._store.remove_waiting(message.id)
            raise
        return message

    def _hand_over(self, message: Message, contents: Sequence[bytes]) -> None:
        envelope = Envelope.create(
            message,
            hops=(),
            sender=self._config.component,
            recipient=self._config.relay,
            key=self._config.key,
        )
        self._target.send(envelope, contents)
        LOGGER.info(
            "sent message=%s kind=%s sender=%s recipient=%s",
            message.id,
            message.kind,
            message.sender,
            message.recipient,
        )

    # receiving ----------------------------------------------------------------------------

    def poll(self, handler: Handler, *, limit: int = 100) -> PollResult:
        """Read the inbox once, hand over what is new and report receipts that are missing.

        An inbox that cannot be reached is noted in the log and reported in the result
        (``available``); the next call tries again.
        """
        now = self._clock()
        counts = _Counts()
        self._store.purge_seen(now - self._config.seen_for)
        try:
            items = self._inbox.read(limit)
        except WayUnavailableError as error:
            LOGGER.warning("the inbox is not available: %s", error)
            counts.available = False
            items = []
        for item in items:
            if isinstance(item, FaultyEnvelope):
                self._process_faulty(item, now, counts)
            else:
                self._process(item, handler, now, counts)
        self._report_missing(handler, now, counts)
        return counts.result()

    def _process_faulty(self, item: FaultyEnvelope, now: datetime, counts: _Counts) -> None:
        if item.reason in _ATTACHMENT_REASONS and now - item.modified_at < (
            self._config.attachment_grace
        ):
            counts.postponed += 1  # may be a delay of the file system: read it again later
            return
        self._drop(item.token, item.reason, counts)

    def _process(
        self, item: ReceivedEnvelope, handler: Handler, now: datetime, counts: _Counts
    ) -> None:
        try:
            opened = self._check(item)
        except EnvelopeRejected as error:
            self._drop(item.token, error.reason, counts)
            return
        message = opened.message
        not_before = now - self._config.seen_for
        if self._store.is_seen(message.id, not_before):
            self._repeat(item.token, message, counts)
        elif message.kind == KIND_RECEIPT:
            self._receive_receipt(item.token, message, handler, now, counts)
        else:
            self._deliver(item, opened, handler, now, counts)

    def _check(self, item: ReceivedEnvelope) -> OpenedEnvelope:
        opened = item.envelope.open(self._keys, recipient=self._config.component)
        message = opened.message
        verify_attachments(message, item.attachments)
        if message.recipient != str(self._config.address):
            raise EnvelopeRejected(RejectionReason.WRONG_RECIPIENT)
        if not is_valid_content(message.kind, message.content):
            raise EnvelopeRejected(RejectionReason.BAD_CONTENT)
        return opened

    def _repeat(self, token: str, message: Message, counts: _Counts) -> None:
        LOGGER.info(
            "repetition message=%s kind=%s sender=%s recipient=%s",
            message.id,
            message.kind,
            message.sender,
            message.recipient,
        )
        if message.receipt and not self._send_receipt(message):
            counts.failed += 1
            return  # stays in the inbox; the next poll tries again
        self._acknowledge(token)
        counts.repeated += 1

    def _deliver(
        self,
        item: ReceivedEnvelope,
        opened: OpenedEnvelope,
        handler: Handler,
        now: datetime,
        counts: _Counts,
    ) -> None:
        message = opened.message
        try:
            handler.store(ReceivedMessage(message, opened.hops, item.attachments))
        except Exception as error:
            LOGGER.error(
                "the component did not store message=%s kind=%s sender=%s (%s); "
                "the envelope stays in the inbox",
                message.id,
                message.kind,
                message.sender,
                type(error).__name__,
            )
            counts.failed += 1
            return
        if (
            message.kind == KIND_UNDELIVERABLE
            and message.reference_id is not None
            and self._store.remove_waiting(message.reference_id)
        ):
            LOGGER.info(
                "waiting ended by notice message=%s notice=%s", message.reference_id, message.id
            )
        self._store.mark_seen(message.id, now, now - self._config.seen_for)
        if message.receipt and not self._send_receipt(message):
            counts.failed += 1
            return  # stays in the inbox; the next poll finds a repetition and sends it again
        self._acknowledge(item.token)
        counts.delivered += 1
        LOGGER.info(
            "delivered message=%s kind=%s sender=%s recipient=%s",
            message.id,
            message.kind,
            message.sender,
            message.recipient,
        )

    def _send_receipt(self, message: Message) -> bool:
        """Send ``relay.receipt`` for the message; ``False`` if the target does not take it."""
        receipt = Message(
            id=uuid4(),
            sender=str(self._config.address),
            recipient=message.sender,
            priority=message.priority,
            kind=KIND_RECEIPT,
            content={},
            reference_id=message.id,
            created_at=self._clock(),
            receipt=False,
        )
        try:
            self._hand_over(receipt, ())
        except WayError as error:
            LOGGER.warning(
                "the receipt for message=%s could not be sent (%s)",
                message.id,
                type(error).__name__,
            )
            return False
        return True

    def _receive_receipt(
        self, token: str, message: Message, handler: Handler, now: datetime, counts: _Counts
    ) -> None:
        entry = (
            None if message.reference_id is None else self._store.get_waiting(message.reference_id)
        )
        if entry is None or entry.recipient != message.sender:
            LOGGER.info(
                "receipt dropped message=%s sender=%s (nothing waits for it from this sender, "
                "or it is late)",
                message.id,
                message.sender,
            )
            self._finish(token, message, now)
            counts.dropped += 1
            return
        try:
            handler.receipt_arrived(ReceiptArrived(entry.message_id, entry.kind, entry.recipient))
        except Exception as error:
            LOGGER.error(
                "the component did not accept the receipt of message=%s (%s)",
                entry.message_id,
                type(error).__name__,
            )
            counts.failed += 1
            return
        self._store.remove_waiting(entry.message_id)
        self._finish(token, message, now)
        counts.receipts += 1
        LOGGER.info(
            "receipt arrived message=%s kind=%s recipient=%s",
            entry.message_id,
            entry.kind,
            entry.recipient,
        )

    def _finish(self, token: str, message: Message, now: datetime) -> None:
        self._store.mark_seen(message.id, now, now - self._config.seen_for)
        self._acknowledge(token)

    def _report_missing(self, handler: Handler, now: datetime, counts: _Counts) -> None:
        for entry in self._store.expired(now):
            missing = ReceiptMissing(
                entry.message_id, entry.kind, entry.recipient, entry.sent_at, entry.deadline
            )
            try:
                handler.receipt_missing(missing)
            except Exception as error:
                LOGGER.error(
                    "the component did not accept the missing receipt of message=%s (%s)",
                    entry.message_id,
                    type(error).__name__,
                )
                counts.failed += 1
                continue  # the entry stays; the next poll reports it again
            self._store.remove_waiting(entry.message_id)
            counts.missing_receipts += 1
            LOGGER.warning(
                "receipt missing message=%s kind=%s recipient=%s deadline=%s",
                entry.message_id,
                entry.kind,
                entry.recipient,
                entry.deadline.isoformat(),
            )

    # helpers ------------------------------------------------------------------------------

    def _drop(self, token: str, reason: RejectionReason, counts: _Counts) -> None:
        """Drop an envelope: note it in the log without content and remove it from the inbox."""
        LOGGER.warning("envelope dropped token=%s reason=%s", token, reason.value)
        self._acknowledge(token)
        counts.dropped += 1

    def _acknowledge(self, token: str) -> None:
        try:
            self._inbox.acknowledge(token)
        except WayError as error:
            # The envelope stays; the next poll finds it as a repetition or drops it again.
            LOGGER.warning(
                "the envelope %s could not be acknowledged (%s)", token, type(error).__name__
            )


__all__ = [
    "DEFAULT_ATTACHMENT_GRACE",
    "DEFAULT_RECEIPT_TIMEOUT",
    "DEFAULT_SEEN_FOR",
    "Connector",
    "ConnectorConfig",
    "Handler",
    "PollResult",
    "ReceiptArrived",
    "ReceiptMissing",
    "ReceivedMessage",
    "WayConfig",
]
