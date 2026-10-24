"""Message and attachment (specification 3.2, schema ``message.schema.json``).

The models are strict: no implicit conversion, additional fields are rejected. A message is read
from JSON text with ``Message.from_json`` or built from Python objects (``UUID``, ``datetime``).
"""

import hashlib
from datetime import UTC, datetime
from typing import Annotated, Self
from uuid import UUID

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, JsonValue, model_validator

from pipwerk_relaycore.address import ADDRESS_REGEX, Address

ATTACHMENT_NAME_REGEX = r"^[A-Za-z0-9_#+-][A-Za-z0-9._#+-]{0,127}$"
"""1 to 128 letters, digits and ``. _ # + -``, not starting with a dot (specification 3.2)."""

PRIORITY_REGEX = r"^[a-z0-9_-]{1,32}$"
KIND_REGEX = r"^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$"
SHA256_REGEX = r"^[0-9a-f]{64}$"

MAX_ATTACHMENTS = 256
MAX_KIND_LENGTH = 64


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, frozen=True)


def _utc(value: datetime) -> datetime:
    if value.tzinfo is None or value.utcoffset() != UTC.utcoffset(None):
        raise ValueError("the time must be in UTC")
    return value


def _address(value: str) -> str:
    Address.parse(value)
    return value


class Attachment(_Strict):
    """A file that belongs to a message: name, size in bytes and SHA-256 (hexadecimal)."""

    name: Annotated[str, Field(pattern=ATTACHMENT_NAME_REGEX)]
    size: Annotated[int, Field(ge=0)]
    sha256: Annotated[str, Field(pattern=SHA256_REGEX)]

    @classmethod
    def of(cls, name: str, content: bytes) -> Self:
        """Describe a file by its content."""
        return cls(name=name, size=len(content), sha256=hashlib.sha256(content).hexdigest())


NOTICE_KINDS = ("relay.receipt", "relay.undeliverable")
"""Kinds that never ask for a receipt (specification 3.7, "Ausnahmen")."""


class Message(_Strict):
    """A message with the fields of req-grund-004.

    A message of the kind ``relay.receipt`` or ``relay.undeliverable`` with ``receipt`` set is
    invalid (specification 3.7): otherwise receipts of receipts would arise.
    """

    model_config = ConfigDict(
        json_schema_extra={
            "allOf": [
                {
                    "if": {
                        "properties": {"kind": {"enum": list(NOTICE_KINDS)}},
                        "required": ["kind"],
                    },
                    "then": {"properties": {"receipt": {"const": False}}},
                }
            ]
        }
    )

    id: UUID
    sender: Annotated[str, Field(pattern=ADDRESS_REGEX), AfterValidator(_address)]
    recipient: Annotated[str, Field(pattern=ADDRESS_REGEX), AfterValidator(_address)]
    priority: Annotated[str, Field(pattern=PRIORITY_REGEX)]
    kind: Annotated[str, Field(pattern=KIND_REGEX, max_length=MAX_KIND_LENGTH)]
    content: dict[str, JsonValue]
    reference_id: UUID | None = None
    created_at: Annotated[datetime, AfterValidator(_utc)]
    attachments: Annotated[tuple[Attachment, ...], Field(max_length=MAX_ATTACHMENTS)] = ()
    receipt: bool = False

    @model_validator(mode="after")
    def _names_of_attachments_differ(self) -> Self:
        names = [attachment.name for attachment in self.attachments]
        if len(set(names)) != len(names):
            raise ValueError("the names of the attachments must differ")
        return self

    @model_validator(mode="after")
    def _a_notice_asks_for_no_receipt(self) -> Self:
        if self.receipt and self.kind in NOTICE_KINDS:
            raise ValueError("a message of this kind asks for no receipt")
        return self

    @classmethod
    def from_json(cls, text: str | bytes) -> Self:
        """Read a message from JSON text; raises ``pydantic.ValidationError``."""
        return cls.model_validate_json(text)

    def to_json(self) -> str:
        """The JSON text of the message; an absent optional field is written as ``null``."""
        return self.model_dump_json()

    @property
    def sender_address(self) -> Address:
        return Address.parse(self.sender)

    @property
    def recipient_address(self) -> Address:
        return Address.parse(self.recipient)
