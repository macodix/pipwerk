"""Persistence of the relay: queue, seen handovers and operating configuration.

Every call is one transaction. The calls that belong together for the safety of a message are
single calls: ``accept`` marks a handover as seen and stores the queue entries in one transaction
(specification E4: a message is accepted when it is stored, and a handover that comes again is
recognised), and ``replace`` removes an entry and stores its notice in one transaction.
"""

import json
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

import sqlalchemy as sa
from pipwerk_relaycore import Message
from sqlalchemy.exc import IntegrityError

from pipwerk_relay.tables import config, queue, seen


@dataclass(frozen=True, slots=True)
class NewEntry:
    """A message for the queue."""

    entry_key: str
    message: Message
    hops: tuple[str, ...]
    attachment_count: int
    attachment_bytes: int
    created_at: datetime
    next_attempt_at: datetime


@dataclass(frozen=True, slots=True)
class QueueEntry:
    """A message in the queue."""

    seq: int
    entry_key: str
    message_id: UUID
    kind: str
    sender: str
    recipient: str
    message_json: str
    hops: tuple[str, ...]
    attachment_count: int
    attachment_bytes: int
    created_at: datetime
    attempts: int
    next_attempt_at: datetime
    last_error: str | None

    @property
    def state(self) -> str:
        """``new`` before the first attempt to hand the message over, ``retrying`` after it."""
        return "new" if self.attempts == 0 else "retrying"


@dataclass(frozen=True, slots=True)
class StoredConfig:
    """The operating configuration as stored."""

    version: int
    document: str
    loaded_at: datetime


@dataclass(frozen=True, slots=True)
class QueueTotals:
    messages: int
    attachment_bytes: int


class RelayStore:
    """Reads and writes the tables of the relay."""

    def __init__(self, engine: sa.Engine) -> None:
        self._engine = engine

    # seen handovers -----------------------------------------------------------------------

    def is_seen(self, message_id: UUID, hops: int, not_before: datetime) -> bool:
        """Whether the handover was marked at ``not_before`` or later."""
        query = sa.select(seen.c.message_id).where(
            seen.c.message_id == str(message_id),
            seen.c.hops == hops,
            seen.c.seen_at >= not_before,
        )
        with self._engine.connect() as connection:
            return connection.execute(query).first() is not None

    def accept(
        self,
        message_id: UUID,
        hops: int,
        now: datetime,
        not_before: datetime,
        entries: Sequence[NewEntry],
    ) -> bool:
        """Mark the handover as seen and store the entries; all or nothing.

        ``False`` (and nothing stored) if the handover was marked already.
        """
        try:
            with self._engine.begin() as connection:
                connection.execute(
                    sa.delete(seen).where(
                        seen.c.message_id == str(message_id),
                        seen.c.hops == hops,
                        seen.c.seen_at < not_before,
                    )
                )
                connection.execute(
                    sa.insert(seen).values(message_id=str(message_id), hops=hops, seen_at=now)
                )
                for entry in entries:
                    connection.execute(sa.insert(queue).values(**_row(entry)))
        except IntegrityError:
            return False
        return True

    def purge_seen(self, not_before: datetime) -> int:
        """Remove the handovers marked before ``not_before``; the number removed."""
        with self._engine.begin() as connection:
            return connection.execute(sa.delete(seen).where(seen.c.seen_at < not_before)).rowcount

    # queue --------------------------------------------------------------------------------

    def totals(self) -> QueueTotals:
        query = sa.select(
            sa.func.count(),
            sa.func.coalesce(sa.func.sum(queue.c.attachment_bytes), 0),
        ).select_from(queue)
        with self._engine.connect() as connection:
            count, size = connection.execute(query).one()
        return QueueTotals(messages=int(count), attachment_bytes=int(size))

    def due(self, now: datetime, limit: int) -> list[QueueEntry]:
        """The entries whose next attempt is due, oldest first."""
        query = (
            sa.select(queue)
            .where(queue.c.next_attempt_at <= now)
            .order_by(queue.c.seq)
            .limit(limit)
        )
        with self._engine.connect() as connection:
            return [_entry(row) for row in connection.execute(query)]

    def all_entries(self) -> list[QueueEntry]:
        with self._engine.connect() as connection:
            return [
                _entry(row) for row in connection.execute(sa.select(queue).order_by(queue.c.seq))
            ]

    def entry_keys(self) -> set[str]:
        with self._engine.connect() as connection:
            return {row.entry_key for row in connection.execute(sa.select(queue.c.entry_key))}

    def replace(self, seq: int, notice: NewEntry | None) -> None:
        """Remove an entry and, in the same transaction, store its replacement (a notice)."""
        with self._engine.begin() as connection:
            connection.execute(sa.delete(queue).where(queue.c.seq == seq))
            if notice is not None:
                connection.execute(sa.insert(queue).values(**_row(notice)))

    def reschedule(self, seq: int, attempts: int, next_attempt_at: datetime, error: str) -> None:
        with self._engine.begin() as connection:
            connection.execute(
                sa.update(queue)
                .where(queue.c.seq == seq)
                .values(attempts=attempts, next_attempt_at=next_attempt_at, last_error=error)
            )

    # operating configuration ----------------------------------------------------------------

    def config_version(self) -> int | None:
        with self._engine.connect() as connection:
            return connection.execute(sa.select(config.c.version).where(config.c.id == 1)).scalar()

    def get_config(self) -> StoredConfig | None:
        with self._engine.connect() as connection:
            row = connection.execute(sa.select(config).where(config.c.id == 1)).first()
        if row is None:
            return None
        return StoredConfig(version=row.version, document=row.document, loaded_at=row.loaded_at)

    def put_config(self, document: str, now: datetime) -> int:
        """Store a new operating configuration; the new version number."""
        with self._engine.begin() as connection:
            version = connection.execute(
                sa.select(config.c.version).where(config.c.id == 1)
            ).scalar()
            if version is None:
                connection.execute(
                    sa.insert(config).values(id=1, version=1, document=document, loaded_at=now)
                )
                return 1
            connection.execute(
                sa.update(config)
                .where(config.c.id == 1)
                .values(version=version + 1, document=document, loaded_at=now)
            )
            return int(version) + 1


def _row(entry: NewEntry) -> dict[str, object]:
    message = entry.message
    return {
        "entry_key": entry.entry_key,
        "message_id": str(message.id),
        "kind": message.kind,
        "sender": message.sender,
        "recipient": message.recipient,
        "message_json": message.to_json(),
        "hops_json": json.dumps(list(entry.hops)),
        "attachment_count": entry.attachment_count,
        "attachment_bytes": entry.attachment_bytes,
        "created_at": entry.created_at,
        "attempts": 0,
        "next_attempt_at": entry.next_attempt_at,
        "last_error": None,
    }


def _entry(row: sa.Row[tuple[object, ...]]) -> QueueEntry:
    return QueueEntry(
        seq=row.seq,
        entry_key=row.entry_key,
        message_id=UUID(row.message_id),
        kind=row.kind,
        sender=row.sender,
        recipient=row.recipient,
        message_json=row.message_json,
        hops=tuple(json.loads(row.hops_json)),
        attachment_count=row.attachment_count,
        attachment_bytes=row.attachment_bytes,
        created_at=row.created_at,
        attempts=row.attempts,
        next_attempt_at=row.next_attempt_at,
        last_error=row.last_error,
    )
