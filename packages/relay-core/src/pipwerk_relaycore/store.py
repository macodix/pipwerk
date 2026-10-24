"""Persistence of the connector: seen message ids and messages that wait for a receipt.

The store uses one transaction per call and keeps no state besides the engine.
"""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

import sqlalchemy as sa
from sqlalchemy.engine import Engine
from sqlalchemy.exc import IntegrityError

from pipwerk_relaycore.tables import seen, waiting


@dataclass(frozen=True, slots=True)
class WaitingMessage:
    """A message that was sent with ``receipt`` and has no receipt yet."""

    message_id: UUID
    kind: str
    recipient: str
    sent_at: datetime
    deadline: datetime


class ConnectorStore:
    """Reads and writes the tables of the connector."""

    def __init__(self, engine: Engine) -> None:
        self._engine = engine

    # seen message ids ---------------------------------------------------------------------

    def is_seen(self, message_id: UUID, not_before: datetime) -> bool:
        """Whether the id was marked at ``not_before`` or later."""
        query = sa.select(seen.c.message_id).where(
            seen.c.message_id == str(message_id), seen.c.seen_at >= not_before
        )
        with self._engine.connect() as connection:
            return connection.execute(query).first() is not None

    def mark_seen(self, message_id: UUID, now: datetime, not_before: datetime) -> bool:
        """Mark the id as seen; ``False`` if it was marked already (at ``not_before`` or later).

        An entry older than ``not_before`` is replaced.
        """
        try:
            with self._engine.begin() as connection:
                connection.execute(
                    sa.delete(seen).where(
                        seen.c.message_id == str(message_id), seen.c.seen_at < not_before
                    )
                )
                connection.execute(sa.insert(seen).values(message_id=str(message_id), seen_at=now))
        except IntegrityError:
            return False
        return True

    def purge_seen(self, not_before: datetime) -> int:
        """Remove the ids marked before ``not_before``; the number of removed ids."""
        with self._engine.begin() as connection:
            return connection.execute(sa.delete(seen).where(seen.c.seen_at < not_before)).rowcount

    # messages that wait for a receipt -------------------------------------------------------

    def add_waiting(self, entry: WaitingMessage) -> None:
        with self._engine.begin() as connection:
            connection.execute(
                sa.insert(waiting).values(
                    message_id=str(entry.message_id),
                    kind=entry.kind,
                    recipient=entry.recipient,
                    sent_at=entry.sent_at,
                    deadline=entry.deadline,
                )
            )

    def get_waiting(self, message_id: UUID) -> WaitingMessage | None:
        query = sa.select(waiting).where(waiting.c.message_id == str(message_id))
        with self._engine.connect() as connection:
            row = connection.execute(query).first()
        return None if row is None else _entry(row)

    def remove_waiting(self, message_id: UUID) -> bool:
        """Remove an entry; ``False`` if there was none."""
        with self._engine.begin() as connection:
            result = connection.execute(
                sa.delete(waiting).where(waiting.c.message_id == str(message_id))
            )
        return result.rowcount > 0

    def expired(self, now: datetime) -> list[WaitingMessage]:
        """The entries whose deadline has passed, oldest deadline first."""
        query = sa.select(waiting).where(waiting.c.deadline <= now).order_by(waiting.c.deadline)
        with self._engine.connect() as connection:
            return [_entry(row) for row in connection.execute(query)]

    def waiting_count(self) -> int:
        with self._engine.connect() as connection:
            return connection.execute(sa.select(sa.func.count()).select_from(waiting)).scalar_one()


def _entry(row: sa.Row[tuple[str, str, str, datetime, datetime]]) -> WaitingMessage:
    return WaitingMessage(
        message_id=UUID(row.message_id),
        kind=row.kind,
        recipient=row.recipient,
        sent_at=row.sent_at,
        deadline=row.deadline,
    )
