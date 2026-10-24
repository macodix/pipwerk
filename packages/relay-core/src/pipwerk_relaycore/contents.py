"""Contents of the kinds of messages that the library itself knows (specification 4.4, 5).

``relay.receipt`` (the receipt, specification 3.7), ``relay.undeliverable`` (the notice that a
message cannot be delivered, req-relay-008) and ``probe.message`` (the message of the test
component). Every content is a JSON object with a model that rejects additional fields; the
schemas under ``contracts/messages/v1/`` are generated from these models.
"""

import json
from collections.abc import Mapping
from enum import StrEnum
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, JsonValue

from pipwerk_relaycore.address import ADDRESS_REGEX, Address
from pipwerk_relaycore.message import KIND_REGEX, MAX_KIND_LENGTH

KIND_RECEIPT = "relay.receipt"
KIND_UNDELIVERABLE = "relay.undeliverable"
KIND_PROBE = "probe.message"

MAX_NOTICE_TEXT_LENGTH = 200
MAX_PROBE_TEXT_LENGTH = 1000


class UndeliverableReason(StrEnum):
    """Why a message cannot be delivered (specification 4.4)."""

    SENDER_INVALID = "sender_invalid"
    LOOP = "loop"
    UNKNOWN_RECIPIENT = "unknown_recipient"
    UNKNOWN_RELAY = "unknown_relay"
    RELAY_UNREACHABLE = "relay_unreachable"
    RECIPIENT_UNREACHABLE = "recipient_unreachable"
    TOO_LARGE = "too_large"

    @property
    def text(self) -> str:
        """The fixed text that belongs to the reason."""
        return UNDELIVERABLE_TEXTS[self]


UNDELIVERABLE_TEXTS: Mapping[UndeliverableReason, str] = {
    UndeliverableReason.SENDER_INVALID: (
        "The sender address does not belong to the component that sent the message."
    ),
    UndeliverableReason.LOOP: "The message went around in a circle between relays.",
    UndeliverableReason.UNKNOWN_RECIPIENT: (
        "No component with the name of the recipient is connected to the responsible relay."
    ),
    UndeliverableReason.UNKNOWN_RELAY: (
        "The responsible relay of the recipient is unknown and no standard relay is set."
    ),
    UndeliverableReason.RELAY_UNREACHABLE: "The next relay could not be reached in time.",
    UndeliverableReason.RECIPIENT_UNREACHABLE: "The recipient could not be reached in time.",
    UndeliverableReason.TOO_LARGE: "The message or an attachment is too large for a way.",
}


def _address(value: str) -> str:
    Address.parse(value)
    return value


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, frozen=True)


class ReceiptContent(_Strict):
    """Content of ``relay.receipt``: empty. The reference of the message names the confirmed one."""


class UndeliverableContent(_Strict):
    """Content of ``relay.undeliverable``: reason, recipient and kind of the lost message."""

    reason: UndeliverableReason
    text: Annotated[str, Field(min_length=1, max_length=MAX_NOTICE_TEXT_LENGTH)]
    recipient: Annotated[str, Field(pattern=ADDRESS_REGEX), AfterValidator(_address)]
    kind: Annotated[str, Field(pattern=KIND_REGEX, max_length=MAX_KIND_LENGTH)]

    @classmethod
    def of(cls, reason: UndeliverableReason, recipient: str, kind: str) -> UndeliverableContent:
        """The content for a reason, with its fixed text."""
        return cls(reason=reason, text=reason.text, recipient=recipient, kind=kind)

    def to_content(self) -> dict[str, JsonValue]:
        """The content as the JSON object of a message."""
        return {
            "reason": self.reason.value,
            "text": self.text,
            "recipient": self.recipient,
            "kind": self.kind,
        }


class ProbeContent(_Strict):
    """Content of ``probe.message``: a short text."""

    text: Annotated[str, Field(min_length=1, max_length=MAX_PROBE_TEXT_LENGTH)]


CONTENT_MODELS: Mapping[str, type[BaseModel]] = {
    KIND_RECEIPT: ReceiptContent,
    KIND_UNDELIVERABLE: UndeliverableContent,
    KIND_PROBE: ProbeContent,
}
"""The model of the content by kind, for the kinds that the library knows."""


def is_valid_content(kind: str, content: Mapping[str, JsonValue]) -> bool:
    """Whether the content fits its kind; a kind that the library does not know always fits."""
    model = CONTENT_MODELS.get(kind)
    if model is None:
        return True
    try:
        model.model_validate_json(json.dumps(dict(content), ensure_ascii=False))
    except ValueError:
        return False
    return True
