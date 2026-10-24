"""A test way from its own package: envelopes stay in memory, in boxes by name.

It registers itself under the name ``memory`` in the group ``pipwerk_relay.ways`` and has own
settings (``box``, ``refuse``) that the library does not know. The tests load it through its
entry point, without any change to the library.
"""

from collections.abc import Sequence
from datetime import UTC, datetime
from typing import Annotated, ClassVar

from pydantic import Field

from pipwerk_relaycore import (
    Envelope,
    Incoming,
    ReceivedEnvelope,
    Way,
    WayRefusedError,
    WaySettings,
)

BOXES: dict[str, dict[str, tuple[Envelope, tuple[bytes, ...]]]] = {}
"""The boxes of all instances: name of the box, then token."""


class MemorySettings(WaySettings):
    box: Annotated[str, Field(pattern=r"^[a-z][a-z0-9-]{0,31}$")]
    refuse: bool = False


class MemoryWay(Way[MemorySettings]):
    settings_model: ClassVar[type[WaySettings]] = MemorySettings

    def send(self, envelope: Envelope, attachments: Sequence[bytes]) -> None:
        if self.settings.refuse:
            raise WayRefusedError("the test way refuses every envelope")
        message = envelope.unverified_body().message
        BOXES.setdefault(self.settings.box, {})[str(message.id)] = (envelope, tuple(attachments))

    def read(self, limit: int = 100) -> list[Incoming]:
        now = datetime.now(UTC)
        box = BOXES.get(self.settings.box, {})
        return [
            ReceivedEnvelope(token, envelope, attachments, now)
            for token, (envelope, attachments) in list(box.items())[: max(limit, 0)]
        ]

    def acknowledge(self, token: str) -> None:
        BOXES.get(self.settings.box, {}).pop(token, None)
