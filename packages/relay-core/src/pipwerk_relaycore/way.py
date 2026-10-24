"""Interface "Way" (specification 3.4), version 1.

A transmission way is an extension: a package registers a subclass of ``Way`` under its name in
the entry point group ``pipwerk_relay.ways``; library, relay and components load it by the
name that the configuration names (``pipwerk_relaycore.loader``). The interface is versioned
(``WAY_API_VERSION``). A change that breaks existing ways is a new version next to the old one.

A way has a target (where it hands envelopes to) and an inbox (where it reads envelopes from);
both are described by the own settings of the way. The settings are a block that library, relay
and component pass on unchanged. The way checks them strictly with its own model
(``Way.settings_model``) and rejects unknown entries; an error names the entry, never its value.

Calls:

``send``
    Hand an envelope with its attachments over. Returning is the confirmation that the way has
    taken the envelope over completely. Raises ``WayUnavailableError`` (repeat later),
    ``WayTooLargeError`` or ``WayRefusedError``.
``read``
    Read the envelopes that have arrived, each with its attachments. An envelope that cannot be
    delivered whole (unreadable, attachment missing or not as declared) comes back as
    ``FaultyEnvelope``, not as ``ReceivedEnvelope``. Dropping it is the step of the connection
    of a component and of the relay (``acknowledge`` removes it from the inbox).
``acknowledge``
    Tell the way that the envelope behind a token is stored (or dropped); the way removes it from
    the inbox. The call is repeatable.
"""

from abc import ABC, abstractmethod
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from datetime import datetime
from typing import Annotated, ClassVar, Self

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from pipwerk_relaycore.envelope import Envelope
from pipwerk_relaycore.errors import RejectionReason, WaySettingsError

WAY_API_VERSION = 1
DEFAULT_MAX_ENVELOPE_BYTES = 1024 * 1024
DEFAULT_MAX_ATTACHMENT_BYTES = 256 * 1024 * 1024


class WaySettings(BaseModel):
    """Base of the own settings of a way. Unknown entries are rejected.

    The values may come from a file in INI format (text), so numbers are converted from text.
    """

    model_config = ConfigDict(extra="forbid", frozen=True)

    max_envelope_bytes: Annotated[int, Field(ge=1)] = DEFAULT_MAX_ENVELOPE_BYTES
    max_attachment_bytes: Annotated[int, Field(ge=0)] = DEFAULT_MAX_ATTACHMENT_BYTES


@dataclass(frozen=True, slots=True)
class ReceivedEnvelope:
    """An envelope with all its attachments, in the order of ``message.attachments``."""

    token: str
    envelope: Envelope
    attachments: tuple[bytes, ...]
    modified_at: datetime


@dataclass(frozen=True, slots=True)
class FaultyEnvelope:
    """An envelope that cannot be delivered whole.

    ``modified_at`` (UTC) is the time the envelope arrived. A missing attachment can be a
    delay of the file system, so a caller drops that case only after a grace period.
    """

    token: str
    reason: RejectionReason
    modified_at: datetime


Incoming = ReceivedEnvelope | FaultyEnvelope


class Way[S: WaySettings](ABC):
    """A transmission way. Subclasses are registered in the group ``pipwerk_relay.ways``."""

    api_version: ClassVar[int] = WAY_API_VERSION
    settings_model: ClassVar[type[WaySettings]] = WaySettings

    def __init__(self, settings: S) -> None:
        self.settings = settings

    @classmethod
    def from_settings(cls, name: str, settings: Mapping[str, object]) -> Self:
        """Create the way from its own settings; raises ``WaySettingsError``.

        The error names the entries (``loc`` of the errors), never the values.
        """
        try:
            validated = cls.settings_model.model_validate(dict(settings))
        except ValidationError as error:
            entries = tuple(
                dict.fromkeys(
                    ".".join(str(part) for part in item["loc"]) or "(settings)"
                    for item in error.errors()
                )
            )
            raise WaySettingsError(name, entries) from None
        return cls(validated)  # type: ignore[arg-type]  # settings_model is the S of the class

    @abstractmethod
    def send(self, envelope: Envelope, attachments: Sequence[bytes]) -> None:
        """Hand an envelope with its attachments over (see the module text)."""

    @abstractmethod
    def read(self, limit: int = 100) -> list[Incoming]:
        """Read up to ``limit`` envelopes that have arrived."""

    @abstractmethod
    def acknowledge(self, token: str) -> None:
        """Remove the envelope behind ``token`` from the inbox."""
