"""The way of a message through the relay (specification 4.1, 4.4, 4.5, E4).

``Relay.cycle`` is one round of work:

1. take over a new operating configuration, if one was loaded,
2. read the inboxes (``_read_inbox``): every envelope is checked, a handover that was seen
   before is dropped, the message is stored in the queue together with the mark "seen" in one
   transaction, and only then the envelope is acknowledged (E4),
3. hand over what is due (``_deliver_due``): to a connected component, a relay of the address
   book or the standard relay; a message that cannot be handed over is tried again with growing
   pauses until its period ends, then the sender receives a notice ``relay.undeliverable``,
4. clean up from time to time (``_maintain``).

Nothing is lost when the process ends at any point: a message is accepted when it is stored, and
it leaves the queue when the next way has confirmed the handover. A handover that happens twice
is recognised by the receiver by the id of the message and the number of entries in ``hops``.

The log (``logging``, name ``pipwerk_relay.relay``) names ids, kind, addresses, way and result,
never content, attachments or keys.
"""

import logging
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from enum import Enum, auto
from typing import Any
from uuid import uuid4

import sqlalchemy as sa
from pipwerk_relaycore import (
    KIND_UNDELIVERABLE,
    Address,
    Envelope,
    EnvelopeRejected,
    FaultyEnvelope,
    Message,
    ReceivedEnvelope,
    RejectionReason,
    SecretsDirectory,
    UndeliverableReason,
    Way,
    WayTooLargeError,
    WayUnavailableError,
    verify_attachments,
)
from pipwerk_relaycore.contents import UndeliverableContent, is_valid_content
from pydantic import ValidationError

from pipwerk_relay.attachments import AttachmentStore
from pipwerk_relay.errors import AttachmentLost, ConfigRejected, NotConfigured
from pipwerk_relay.operating import RESERVED_COMPONENT_NAME, parse_config
from pipwerk_relay.runtime import Connection, Inbox, Runtime, build_runtime
from pipwerk_relay.store import NewEntry, QueueEntry, RelayStore

LOGGER = logging.getLogger("pipwerk_relay.relay")

DEFAULT_PAUSE_SECONDS = 5.0
"""The pause between two rounds before an operating configuration is loaded."""
MAX_READ_GROWTH = 16
"""How many times the batch an inbox is read in one round, when old faulty envelopes block it."""
MAX_DELIVERIES_PER_BATCH = 10
"""How many batches of due entries one round hands over at most."""

_ATTACHMENT_REASONS = frozenset(
    {
        RejectionReason.ATTACHMENT_MISSING,
        RejectionReason.ATTACHMENT_SIZE,
        RejectionReason.ATTACHMENT_HASH,
    }
)
"""Reasons that can be a delay of the file system (they get the grace period)."""


def _now() -> datetime:
    return datetime.now(UTC)


class _Outcome(Enum):
    CONSUMED = auto()
    LEFT = auto()
    STOP = auto()


@dataclass
class CycleResult:
    """What one round did, as numbers."""

    accepted: int = 0
    repeated: int = 0
    dropped: int = 0
    postponed: int = 0
    delivered: int = 0
    retried: int = 0
    notices: int = 0
    full: bool = False
    unavailable_inboxes: list[str] = field(default_factory=list)


@dataclass
class _Intake:
    """The state of the queue while an inbox is read."""

    messages: int
    attachment_bytes: int


class Relay:
    """The relay: reads inboxes, keeps the queue, hands messages over."""

    def __init__(
        self,
        store: RelayStore,
        attachments: AttachmentStore,
        secrets: SecretsDirectory,
        *,
        clock: Callable[[], datetime] = _now,
    ) -> None:
        self._store = store
        self._attachments = attachments
        self._secrets = secrets
        self._clock = clock
        self._runtime: Runtime | None = None
        self._failed_version: int | None = None
        self._last_cleanup: datetime | None = None

    # configuration --------------------------------------------------------------------------

    @property
    def pause_seconds(self) -> float:
        """The pause between two rounds, from the configuration in use."""
        if self._runtime is None:
            return DEFAULT_PAUSE_SECONDS
        return self._runtime.config.periods.read_interval_seconds

    def _current_runtime(self) -> Runtime:
        """The runtime of the newest operating configuration that can be built.

        A configuration that was loaded but cannot be built (a key file is gone, a way is not
        installed) does not stop a relay that works already: it keeps the configuration in use
        and notes the problem once.
        """
        version = self._store.config_version()
        if version is None:
            raise NotConfigured("no operating configuration is loaded")
        runtime = self._runtime
        if runtime is not None and runtime.version == version:
            return runtime
        if version != self._failed_version:
            stored = self._store.get_config()
            if stored is not None:
                try:
                    config = parse_config(stored.document)
                    fresh = build_runtime(config, stored.version, self._secrets)
                except ConfigRejected as error:
                    self._failed_version = stored.version
                    LOGGER.error(
                        "the operating configuration %d cannot be used: %s",
                        stored.version,
                        "; ".join(error.problems),
                    )
                    if runtime is None:
                        raise
                else:
                    self._runtime = fresh
                    self._failed_version = None
                    LOGGER.info("operating configuration %d taken over", stored.version)
                    return fresh
        if runtime is None:
            raise NotConfigured("the operating configuration cannot be used")
        return runtime

    # one round ----------------------------------------------------------------------------

    def cycle(self) -> CycleResult:
        """Do one round of work; raises ``NotConfigured`` without an operating configuration."""
        runtime = self._current_runtime()
        now = self._clock()
        result = CycleResult()
        for inbox in runtime.inboxes:
            self._read_inbox(runtime, inbox, now, result)
        self._deliver_due(runtime, now, result)
        self._maintain(runtime, now)
        return result

    # reading ------------------------------------------------------------------------------

    def _read_inbox(
        self, runtime: Runtime, inbox: Inbox, now: datetime, result: CycleResult
    ) -> None:
        limits = runtime.config.limits
        totals = self._store.totals()
        intake = _Intake(totals.messages, totals.attachment_bytes)
        room = limits.max_queue_messages - intake.messages
        if room <= 0:
            self._note_full(inbox, result, "the queue is full")
            return
        size = min(limits.read_batch, room)
        largest = min(room, limits.read_batch * MAX_READ_GROWTH)
        while True:
            try:
                items = inbox.way.read(size)
            except WayUnavailableError as error:
                LOGGER.warning("inbox %s is not available: %s", inbox.name, error)
                result.unavailable_inboxes.append(inbox.name)
                return
            except Exception as error:  # a way from another package may fail in any way
                LOGGER.error("inbox %s cannot be read (%s)", inbox.name, type(error).__name__)
                result.unavailable_inboxes.append(inbox.name)
                return
            consumed = left = 0
            for item in items:
                outcome = self._handle(runtime, inbox, item, intake, now, result)
                if outcome is _Outcome.CONSUMED:
                    consumed += 1
                elif outcome is _Outcome.LEFT:
                    left += 1
                else:
                    return
            # Envelopes that lie there and wait (grace period) must not block newer ones.
            blocked = bool(items) and consumed == 0 and left == len(items) == size
            if not blocked or size >= largest:
                return
            size = min(size * 2, largest)

    def _note_full(self, inbox: Inbox, result: CycleResult, why: str) -> None:
        result.full = True
        LOGGER.warning(
            "inbox %s is not read: %s; the envelopes stay where they are", inbox.name, why
        )

    def _handle(
        self,
        runtime: Runtime,
        inbox: Inbox,
        item: ReceivedEnvelope | FaultyEnvelope,
        intake: _Intake,
        now: datetime,
        result: CycleResult,
    ) -> _Outcome:
        if isinstance(item, FaultyEnvelope):
            grace = timedelta(seconds=runtime.config.periods.attachment_grace_seconds)
            if item.reason in _ATTACHMENT_REASONS and now - item.modified_at < grace:
                result.postponed += 1  # may be a delay of the file system: read it again later
                return _Outcome.LEFT
            self._drop(inbox, item.token, item.reason, result)
            return _Outcome.CONSUMED
        try:
            opened = item.envelope.open(runtime.keys, recipient=runtime.own)
            verify_attachments(opened.message, item.attachments)
            message = opened.message
            if not is_valid_content(message.kind, message.content):
                raise EnvelopeRejected(RejectionReason.BAD_CONTENT)
        except EnvelopeRejected as error:
            self._drop(inbox, item.token, error.reason, result)
            return _Outcome.CONSUMED
        # From here on the envelope is genuine: it carries the key of a known connection.
        hops = opened.hops
        not_before = now - timedelta(seconds=runtime.config.periods.seen_for_seconds)
        if self._store.is_seen(message.id, len(hops), not_before):
            self._log("repetition", message, inbox.name)
            self._acknowledge(inbox, item.token)
            result.repeated += 1
            return _Outcome.CONSUMED
        size = sum(len(content) for content in item.attachments)
        limits = runtime.config.limits
        if size > limits.max_attachment_storage_bytes:
            self._drop(inbox, item.token, RejectionReason.TOO_LARGE, result)
            return _Outcome.CONSUMED
        if intake.messages >= limits.max_queue_messages:
            self._note_full(inbox, result, "the queue is full")
            return _Outcome.STOP
        if intake.attachment_bytes + size > limits.max_attachment_storage_bytes:
            self._note_full(inbox, result, "the space for attachments is used up")
            return _Outcome.STOP
        entries, reason = self._decide(runtime, opened.sender, message, hops, item, now)
        keys = [entry.entry_key for entry in entries]
        try:
            for entry in entries:
                if entry.attachment_count:
                    self._attachments.write(entry.entry_key, item.attachments)
            accepted = self._store.accept(message.id, len(hops), now, not_before, entries)
        except (sa.exc.SQLAlchemyError, OSError) as error:
            for key in keys:
                self._attachments.remove(key)
            LOGGER.error(
                "message=%s could not be stored (%s); the envelope stays in the inbox",
                message.id,
                type(error).__name__,
            )
            return _Outcome.LEFT
        if not accepted:
            for key in keys:
                self._attachments.remove(key)
        self._acknowledge(inbox, item.token)
        if not accepted:
            result.repeated += 1
            return _Outcome.CONSUMED
        self._log_accepted(inbox, message, reason, entries)
        intake.messages += len(entries)
        intake.attachment_bytes += sum(entry.attachment_bytes for entry in entries)
        result.accepted += 1
        if reason is not None and entries:
            result.notices += 1
        return _Outcome.CONSUMED

    def _decide(
        self,
        runtime: Runtime,
        link_from: str,
        message: Message,
        hops: tuple[str, ...],
        item: ReceivedEnvelope,
        now: datetime,
    ) -> tuple[list[NewEntry], UndeliverableReason | None]:
        """The entries to store for an envelope that passed the checks (steps 2 and 3)."""
        reason: UndeliverableReason | None = None
        notice_to: str | None = None
        if link_from in runtime.components:
            expected = f"{link_from}.{runtime.config.network}.{runtime.config.name}"
            if message.sender != expected:
                reason, notice_to = UndeliverableReason.SENDER_INVALID, expected
        if reason is None and (runtime.own in hops or len(hops) >= runtime.config.limits.max_hops):
            reason, notice_to = UndeliverableReason.LOOP, message.sender
        if reason is None:
            entry = NewEntry(
                entry_key=str(uuid4()),
                message=message,
                hops=hops,
                attachment_count=len(item.attachments),
                attachment_bytes=sum(len(content) for content in item.attachments),
                created_at=now,
                next_attempt_at=now,
            )
            return [entry], None
        if message.kind == KIND_UNDELIVERABLE or notice_to is None:
            return [], reason  # a notice about a notice is dropped (specification 4.4)
        return [self._notice(runtime, message, reason, notice_to, now)], reason

    def _notice(
        self,
        runtime: Runtime,
        message: Message,
        reason: UndeliverableReason,
        recipient: str,
        now: datetime,
    ) -> NewEntry:
        """The notice ``relay.undeliverable`` for a message (specification 4.4)."""
        notice = Message(
            id=uuid4(),
            sender=f"{RESERVED_COMPONENT_NAME}.{runtime.config.network}.{runtime.config.name}",
            recipient=recipient,
            priority=message.priority,
            kind=KIND_UNDELIVERABLE,
            content=UndeliverableContent.of(reason, message.recipient, message.kind).to_content(),
            reference_id=message.id,
            created_at=now,
            receipt=False,
        )
        return NewEntry(
            entry_key=str(uuid4()),
            message=notice,
            hops=(),
            attachment_count=0,
            attachment_bytes=0,
            created_at=now,
            next_attempt_at=now,
        )

    def _drop(self, inbox: Inbox, token: str, reason: RejectionReason, result: CycleResult) -> None:
        """Drop an envelope: note it in the log without content and remove it from the inbox."""
        LOGGER.warning(
            "envelope dropped inbox=%s token=%s reason=%s", inbox.name, token, reason.value
        )
        self._acknowledge(inbox, token)
        result.dropped += 1

    def _acknowledge(self, inbox: Inbox, token: str) -> None:
        try:
            inbox.way.acknowledge(token)
        except Exception as error:  # a way from another package may fail in any way
            # The envelope stays; the next round finds it as a repetition or drops it again.
            LOGGER.warning(
                "inbox %s: the envelope %s could not be acknowledged (%s)",
                inbox.name,
                token,
                type(error).__name__,
            )

    # handing over -------------------------------------------------------------------------

    def _deliver_due(self, runtime: Runtime, now: datetime, result: CycleResult) -> None:
        batch = runtime.config.limits.read_batch
        for _ in range(MAX_DELIVERIES_PER_BATCH):
            entries = self._store.due(now, batch)
            if not entries:
                return
            for entry in entries:
                self._deliver(runtime, entry, now, result)

    def _deliver(
        self, runtime: Runtime, entry: QueueEntry, now: datetime, result: CycleResult
    ) -> None:
        try:
            message = Message.from_json(entry.message_json)
        except ValidationError:
            LOGGER.error("queue entry %d is damaged and removed", entry.seq)
            self._finish(entry)
            return
        route = self._route(runtime, message)
        if isinstance(route, UndeliverableReason):
            self._fail(runtime, entry, message, route, now, result)
            return
        reason_if_late = (
            UndeliverableReason.RECIPIENT_UNREACHABLE
            if route.name in runtime.components
            else UndeliverableReason.RELAY_UNREACHABLE
        )
        try:
            contents = self._attachments.read(entry.entry_key, entry.attachment_count)
            verify_attachments(message, contents)
        except AttachmentLost, EnvelopeRejected:
            LOGGER.error(
                "message=%s: the attachments in the queue are damaged; the message is removed",
                message.id,
            )
            self._finish(entry)
            return
        try:
            envelope = Envelope.create(
                message,
                hops=(*entry.hops, runtime.own),
                sender=runtime.own,
                recipient=route.name,
                key=route.key,
            )
        except ValidationError:
            self._fail(runtime, entry, message, UndeliverableReason.LOOP, now, result)
            return
        try:
            route.way.send(envelope, contents)
        except WayTooLargeError:
            self._fail(runtime, entry, message, UndeliverableReason.TOO_LARGE, now, result)
            return
        except Exception as error:  # a way from another package may fail in any way
            self._retry(runtime, entry, message, reason_if_late, type(error).__name__, now, result)
            return
        self._finish(entry)
        result.delivered += 1
        self._log("forwarded", message, route.way_name, peer=route.name)

    def _route(self, runtime: Runtime, message: Message) -> Connection | UndeliverableReason:
        """Where the message goes next (specification 4.1 step 6)."""
        address = Address.parse(message.recipient)
        config = runtime.config
        if address.network == config.network and address.relay == config.name:
            component = runtime.components.get(address.component)
            return component or UndeliverableReason.UNKNOWN_RECIPIENT
        relay = runtime.relays.get(address.relay_name)
        if relay is None and runtime.standard_relay is not None:
            relay = runtime.relays[runtime.standard_relay]
        return relay or UndeliverableReason.UNKNOWN_RELAY

    def _retry(
        self,
        runtime: Runtime,
        entry: QueueEntry,
        message: Message,
        late_reason: UndeliverableReason,
        error: str,
        now: datetime,
        result: CycleResult,
    ) -> None:
        periods = runtime.config.periods
        if now >= entry.created_at + timedelta(seconds=periods.delivery_deadline_seconds):
            self._fail(runtime, entry, message, late_reason, now, result)
            return
        pause = min(
            periods.retry_max_seconds, periods.retry_first_seconds * 2 ** min(entry.attempts, 30)
        )
        self._store.reschedule(entry.seq, entry.attempts + 1, now + timedelta(seconds=pause), error)
        result.retried += 1
        LOGGER.warning(
            "message=%s kind=%s recipient=%s not handed over (%s); attempt %d, next in %.0f s",
            message.id,
            message.kind,
            message.recipient,
            error,
            entry.attempts + 1,
            pause,
        )

    def _fail(
        self,
        runtime: Runtime,
        entry: QueueEntry,
        message: Message,
        reason: UndeliverableReason,
        now: datetime,
        result: CycleResult,
    ) -> None:
        """The message is undeliverable: replace it by a notice to its sender (4.4)."""
        notice: NewEntry | None = None
        if message.kind == KIND_UNDELIVERABLE:
            LOGGER.warning(
                "notice=%s kind=%s recipient=%s undeliverable (%s); dropped, no new notice",
                message.id,
                message.kind,
                message.recipient,
                reason.value,
            )
        else:
            notice = self._notice(runtime, message, reason, message.sender, now)
            result.notices += 1
            self._log("undeliverable", message, reason.value)
        self._store.replace(entry.seq, notice)
        self._attachments.remove(entry.entry_key)

    def _finish(self, entry: QueueEntry) -> None:
        """Take a message out of the queue; its files go after the entry."""
        self._store.replace(entry.seq, None)
        self._attachments.remove(entry.entry_key)

    # maintenance --------------------------------------------------------------------------

    def _maintain(self, runtime: Runtime, now: datetime) -> None:
        periods = runtime.config.periods
        if self._last_cleanup is not None and now - self._last_cleanup < timedelta(
            seconds=periods.cleanup_interval_seconds
        ):
            return
        self._last_cleanup = now
        removed = self._store.purge_seen(now - timedelta(seconds=periods.seen_for_seconds))
        leftover = timedelta(seconds=periods.leftover_after_seconds)
        files = 0
        for way in runtime.ways:
            files += self._clean_up(way, leftover, now)
        try:
            files += self._attachments.clean_orphans(self._store.entry_keys(), leftover, now)
        except OSError as error:
            LOGGER.warning(
                "the directory for attachments cannot be cleaned (%s)", type(error).__name__
            )
        LOGGER.info("cleaned up: %d seen handovers and %d leftover files removed", removed, files)

    def _clean_up(self, way: Way[Any], leftover: timedelta, now: datetime) -> int:
        try:
            return way.clean_up(leftover, now)
        except Exception as error:  # a way from another package may fail in any way
            LOGGER.warning("a way cannot be cleaned up (%s)", type(error).__name__)
            return 0

    # log ----------------------------------------------------------------------------------

    def _log(self, what: str, message: Message, where: str, *, peer: str | None = None) -> None:
        LOGGER.info(
            "%s message=%s kind=%s sender=%s recipient=%s via=%s%s",
            what,
            message.id,
            message.kind,
            message.sender,
            message.recipient,
            where,
            "" if peer is None else f" peer={peer}",
        )

    def _log_accepted(
        self,
        inbox: Inbox,
        message: Message,
        reason: UndeliverableReason | None,
        entries: list[NewEntry],
    ) -> None:
        if reason is None:
            self._log("accepted", message, inbox.name)
            return
        outcome = "notice queued" if entries else "dropped without a notice"
        LOGGER.info(
            "undeliverable message=%s kind=%s sender=%s recipient=%s via=%s reason=%s (%s)",
            message.id,
            message.kind,
            message.sender,
            message.recipient,
            inbox.name,
            reason.value,
            outcome,
        )
