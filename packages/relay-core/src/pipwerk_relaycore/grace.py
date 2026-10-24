"""The grace period for an envelope whose attachments are missing or not as declared.

A missing or wrong attachment can be a delay of the file system, so the envelope is kept for a
grace period and dropped after it. The period is measured from the time the envelope arrived
(its change time) or from the first time the reader saw it, whichever is earlier. A change time
in the future (set by whoever writes into the directory) therefore does not stop the period
from running out.
"""

from datetime import datetime, timedelta

_PRUNE_ABOVE = 1024


class GraceClock:
    """Remembers when an envelope was seen first and tells when its grace period is over."""

    def __init__(self) -> None:
        self._first_seen: dict[str, datetime] = {}

    def over(self, token: str, arrived: datetime, now: datetime, grace: timedelta) -> bool:
        """Whether the grace period of the envelope behind ``token`` is over at ``now``."""
        first = self._first_seen.setdefault(token, now)
        if len(self._first_seen) > _PRUNE_ABOVE:
            self._prune(now, grace)
        return now - min(arrived, first) >= grace

    def forget(self, token: str) -> None:
        """The envelope is gone (dropped or taken over)."""
        self._first_seen.pop(token, None)

    def _prune(self, now: datetime, grace: timedelta) -> None:
        # Envelopes that vanished without a word would stay here for ever otherwise.
        limit = now - 2 * grace
        for token in [key for key, seen in self._first_seen.items() if seen < limit]:
            del self._first_seen[token]
