"""Message and attachment (specification 3.2)."""

import json
from typing import Any
from uuid import uuid4

import pytest
from pydantic import ValidationError

from pipwerk_relaycore import Attachment, Message
from tests.helpers import RECIPIENT, SENDER, make_message


def message_data(**changes: Any) -> dict[str, Any]:
    data: dict[str, Any] = {
        "id": str(uuid4()),
        "sender": SENDER,
        "recipient": RECIPIENT,
        "priority": "normal",
        "kind": "example.request",
        "content": {"text": "hello"},
        "created_at": "2026-10-24T12:00:00Z",
    }
    data.update(changes)
    return data


def read(**changes: Any) -> Message:
    return Message.from_json(json.dumps(message_data(**changes)))


def test_a_valid_message_is_read_with_defaults() -> None:
    message = read()
    assert message.attachments == ()
    assert message.receipt is False
    assert message.reference_id is None
    assert str(message.sender_address) == SENDER
    assert str(message.recipient_address) == RECIPIENT


def test_a_message_survives_writing_and_reading() -> None:
    message = make_message([("a.csv", b"1,2\n")])
    assert Message.from_json(message.to_json()) == message


def test_the_reference_and_the_receipt_are_kept() -> None:
    reference = str(uuid4())
    message = read(reference_id=reference, receipt=True)
    assert str(message.reference_id) == reference
    assert message.receipt is True


@pytest.mark.parametrize(
    "changes",
    [
        {"extra": 1},
        {"sender": "a.b"},
        {"sender": "a.b.c.d"},
        {"recipient": "a b.c.d"},
        {"recipient": ""},
        {"id": "not-a-uuid"},
        {"id": 5},
        {"priority": ""},
        {"priority": "Normal"},
        {"priority": "x" * 33},
        {"kind": "Fetch.request"},
        {"kind": "fetch..request"},
        {"kind": "x" * 65},
        {"kind": ""},
        {"content": "text"},
        {"content": [1]},
        {"content": None},
        {"reference_id": "no"},
        {"created_at": "2026-10-24T12:00:00"},  # no time zone
        {"created_at": "2026-10-24T14:00:00+02:00"},  # not UTC
        {"created_at": 1750000000},
        {"created_at": "yesterday"},
        {"receipt": "yes"},
        {"receipt": 1},
        {"attachments": "a"},
    ],
)
def test_an_invalid_message_is_rejected(changes: dict[str, Any]) -> None:
    with pytest.raises(ValidationError):
        read(**changes)


@pytest.mark.parametrize("missing", ["id", "sender", "recipient", "priority", "kind", "content"])
def test_every_required_field_is_required(missing: str) -> None:
    data = message_data()
    del data[missing]
    with pytest.raises(ValidationError):
        Message.from_json(json.dumps(data))


def test_a_time_with_offset_zero_is_utc() -> None:
    message = read(created_at="2026-10-24T12:00:00+00:00")
    assert message.created_at.utcoffset() is not None


def test_a_field_with_a_wrong_type_is_not_converted() -> None:
    attachment = {"name": "a.csv", "size": "5", "sha256": "0" * 64}
    with pytest.raises(ValidationError):
        read(attachments=[attachment])


def good_attachment(**changes: Any) -> dict[str, Any]:
    data: dict[str, Any] = {"name": "a.csv", "size": 5, "sha256": "0" * 64}
    data.update(changes)
    return data


@pytest.mark.parametrize("name", ["a.csv", "EURUSD_H1.csv", "#a+b-c.d", "0", "a" * 128, "x.y.z"])
def test_a_valid_attachment_name_is_accepted(name: str) -> None:
    assert read(attachments=[good_attachment(name=name)]).attachments[0].name == name


@pytest.mark.parametrize(
    "name",
    [
        "",
        ".hidden",
        "..",
        "../x",
        "a/b",
        "a\\b",
        "a b",
        "a\n",
        "a:b",
        "a" * 129,
        "ä.csv",
        "a\x00b",
        "~root",
        "a*b",
    ],
)
def test_an_invalid_attachment_name_is_rejected(name: str) -> None:
    with pytest.raises(ValidationError):
        read(attachments=[good_attachment(name=name)])


@pytest.mark.parametrize(
    "changes",
    [
        {"size": -1},
        {"size": 1.5},
        {"sha256": "A" * 64},
        {"sha256": "0" * 63},
        {"sha256": "0" * 64 + "\n"},
        {"extra": 1},
    ],
)
def test_an_invalid_attachment_is_rejected(changes: dict[str, Any]) -> None:
    with pytest.raises(ValidationError):
        read(attachments=[good_attachment(**changes)])


def test_the_names_of_the_attachments_must_differ() -> None:
    with pytest.raises(ValidationError):
        read(attachments=[good_attachment(), good_attachment()])


def test_the_number_of_attachments_is_limited() -> None:
    many = [good_attachment(name=f"f{number}.csv") for number in range(257)]
    with pytest.raises(ValidationError):
        read(attachments=many)
    assert len(read(attachments=many[:256]).attachments) == 256


def test_an_attachment_describes_a_file_by_size_and_hash() -> None:
    attachment = Attachment.of("a.csv", b"abc")
    assert attachment.size == 3
    assert attachment.sha256 == "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"


def test_a_message_cannot_be_changed() -> None:
    message = make_message()
    with pytest.raises(ValidationError):
        message.priority = "high"
