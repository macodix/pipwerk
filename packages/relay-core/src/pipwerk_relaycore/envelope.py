"""Envelope with check value (specification 3.3, E5, schema ``envelope.schema.json``).

An envelope lies on every transmission way:

- ``format``: ``pipwerk-relay/1``
- ``body``: text with the JSON of the body (message, ``hops``, optional ``stored``)
- ``link``: ``from`` and ``to`` (the two sides of the connection) and ``mac``

``mac`` is HMAC-SHA256 with the key of the connection ``from``, in hexadecimal, over the UTF-8
bytes of ``from``, a line feed, ``to``, a line feed and ``body``. The line feeds keep the three
parts apart (a name cannot contain a line feed, so ``a``/``bc`` and ``ab``/``c`` differ). The
check value is formed over the text, not over a re-ordered JSON: a receiver needs no copy of the
JSON spelling of this library.

``stored`` (files that go over a way for files, specification 3.6) is a field of the body that
this version of the library only passes on: an envelope in which it is set is rejected.
"""

import hashlib
import hmac
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Annotated, Literal, Self

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from pipwerk_relaycore.address import LINK_NAME_REGEX, RELAY_REGEX
from pipwerk_relaycore.errors import EnvelopeRejected, RejectionReason
from pipwerk_relaycore.keys import ConnectionKey
from pipwerk_relaycore.message import ATTACHMENT_NAME_REGEX, Message

FORMAT: Literal["pipwerk-relay/1"] = "pipwerk-relay/1"
MAX_HOPS = 64
MAC_REGEX = r"^[0-9a-f]{64}$"
WAY_NAME_REGEX = r"^[a-z][a-z0-9_-]{0,31}$"
MAX_LOCATION_LENGTH = 256


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, frozen=True)


class StoredAttachment(_Strict):
    """An attachment that goes over a way for files: name, way for files and place."""

    name: Annotated[str, Field(pattern=ATTACHMENT_NAME_REGEX)]
    way: Annotated[str, Field(pattern=WAY_NAME_REGEX)]
    location: Annotated[str, Field(min_length=1, max_length=MAX_LOCATION_LENGTH)]


class EnvelopeBody(_Strict):
    """The text in ``body``: the message, the relays it passed and the stored attachments."""

    message: Message
    hops: Annotated[
        tuple[Annotated[str, Field(pattern=RELAY_REGEX)], ...], Field(max_length=MAX_HOPS)
    ]
    stored: Annotated[
        tuple[StoredAttachment, ...] | None,
        Field(
            description=(
                "Attachments that go over a way for files. Reserved: this version of the "
                "library passes the field on but rejects an envelope in which it is set."
            )
        ),
    ] = None


class Link(BaseModel):
    """One connection: the sending side, the receiving side and the check value."""

    model_config = ConfigDict(
        extra="forbid",
        strict=True,
        frozen=True,
        validate_by_name=True,
        validate_by_alias=True,
        serialize_by_alias=True,
    )

    from_: Annotated[str, Field(alias="from", pattern=LINK_NAME_REGEX)]
    to: Annotated[str, Field(pattern=LINK_NAME_REGEX)]
    mac: Annotated[str, Field(pattern=MAC_REGEX)]


@dataclass(frozen=True, slots=True)
class OpenedEnvelope:
    """An envelope whose check value is correct."""

    message: Message
    hops: tuple[str, ...]
    sender: str
    recipient: str


def compute_mac(key: ConnectionKey, sender: str, recipient: str, body: str) -> str:
    """The check value over the bytes of ``from``, ``to`` and ``body`` (hexadecimal)."""
    data = f"{sender}\n{recipient}\n{body}".encode()
    return key.hmac_sha256(data).hex()


class Envelope(BaseModel):
    """The envelope as it lies on a transmission way."""

    model_config = ConfigDict(extra="forbid", strict=True, frozen=True, serialize_by_alias=True)

    format: Literal["pipwerk-relay/1"]
    body: Annotated[
        str,
        Field(
            description=(
                "Text with the JSON of the body, as defined in '#/$defs/Body'. The check value "
                "is formed over this text, so the text is kept as it is."
            )
        ),
    ]
    link: Link

    @classmethod
    def create(
        cls,
        message: Message,
        *,
        hops: Sequence[str],
        sender: str,
        recipient: str,
        key: ConnectionKey,
    ) -> Self:
        """Pack a message for the connection ``sender`` to ``recipient`` and protect it."""
        body = EnvelopeBody(message=message, hops=tuple(hops)).model_dump_json()
        link = Link.model_validate(
            {
                "from": sender,
                "to": recipient,
                "mac": compute_mac(key, sender, recipient, body),
            }
        )
        return cls(format=FORMAT, body=body, link=link)

    @classmethod
    def from_json(cls, text: str | bytes, *, max_bytes: int | None = None) -> Self:
        """Read an envelope from text; raises ``EnvelopeRejected``."""
        if max_bytes is not None:
            size = len(text) if isinstance(text, bytes) else len(text.encode("utf-8", "replace"))
            if size > max_bytes:
                raise EnvelopeRejected(RejectionReason.TOO_LARGE)
        try:
            return cls.model_validate_json(text)
        except ValidationError as error:
            if any(item["loc"] == ("format",) for item in error.errors()):
                raise EnvelopeRejected(RejectionReason.UNSUPPORTED_FORMAT) from None
            raise EnvelopeRejected(RejectionReason.MALFORMED) from None

    def to_json(self) -> str:
        return self.model_dump_json()

    def unverified_body(self) -> EnvelopeBody:
        """The body without checking the check value.

        Only for the structure (for example how many attachments belong to the envelope). The
        content is not trusted until ``open`` has checked the check value.
        """
        try:
            body = EnvelopeBody.model_validate_json(self.body)
        except ValidationError:
            raise EnvelopeRejected(RejectionReason.BAD_BODY) from None
        if body.stored is not None:
            raise EnvelopeRejected(RejectionReason.STORED_NOT_SUPPORTED)
        return body

    def open(
        self, keys: Mapping[str, ConnectionKey], *, recipient: str | None = None
    ) -> OpenedEnvelope:
        """Check the check value with the key of the connection and return the content.

        ``keys`` maps the name of the sending side to the key of the connection. With
        ``recipient`` the envelope must be meant for this receiving side. Raises
        ``EnvelopeRejected``; the content is not read before the check value is correct.
        """
        key = keys.get(self.link.from_)
        if key is None:
            raise EnvelopeRejected(RejectionReason.UNKNOWN_LINK)
        expected = compute_mac(key, self.link.from_, self.link.to, self.body)
        if not hmac.compare_digest(expected.encode("ascii"), self.link.mac.encode("ascii")):
            raise EnvelopeRejected(RejectionReason.BAD_MAC)
        if recipient is not None and self.link.to != recipient:
            raise EnvelopeRejected(RejectionReason.WRONG_RECIPIENT)
        body = self.unverified_body()
        return OpenedEnvelope(
            message=body.message,
            hops=body.hops,
            sender=self.link.from_,
            recipient=self.link.to,
        )


def verify_attachments(message: Message, contents: Sequence[bytes]) -> None:
    """Check size and SHA-256 of the attachments against the message (req-relay-010).

    ``contents`` holds the files in the order of ``message.attachments``. Raises
    ``EnvelopeRejected`` for a missing or an additional file, a wrong size or a wrong hash.
    """
    declared = message.attachments
    if len(contents) < len(declared):
        raise EnvelopeRejected(RejectionReason.ATTACHMENT_MISSING)
    if len(contents) > len(declared):
        raise EnvelopeRejected(RejectionReason.ATTACHMENT_UNEXPECTED)
    for attachment, content in zip(declared, contents, strict=True):
        if len(content) != attachment.size:
            raise EnvelopeRejected(RejectionReason.ATTACHMENT_SIZE)
        digest = hashlib.sha256(content).hexdigest()
        if not hmac.compare_digest(digest.encode("ascii"), attachment.sha256.encode("ascii")):
            raise EnvelopeRejected(RejectionReason.ATTACHMENT_HASH)
