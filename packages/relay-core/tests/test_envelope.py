"""Envelope and check value (specification 3.3, E5): forgeries are found."""

import hashlib
import hmac
import json
from typing import Any

import pytest

from pipwerk_relaycore import (
    ConnectionKey,
    Envelope,
    EnvelopeBody,
    EnvelopeRejected,
    KeyFileError,
    Link,
    RejectionReason,
    compute_mac,
    verify_attachments,
)
from tests.helpers import (
    EXAMPLE_KEY,
    RECIPIENT_LINK,
    SENDER_LINK,
    make_envelope,
    make_message,
)

KEYS = {SENDER_LINK: EXAMPLE_KEY}


def reasons(call: Any) -> RejectionReason:
    with pytest.raises(EnvelopeRejected) as raised:
        call()
    return raised.value.reason


def test_an_envelope_is_opened_with_the_key_of_the_connection() -> None:
    message = make_message()
    envelope = make_envelope(message, hops=["net1.relay0"])
    opened = envelope.open(KEYS, recipient=RECIPIENT_LINK)
    assert opened.message == message
    assert opened.hops == ("net1.relay0",)
    assert (opened.sender, opened.recipient) == (SENDER_LINK, RECIPIENT_LINK)


def test_an_envelope_survives_writing_and_reading() -> None:
    envelope = make_envelope()
    again = Envelope.from_json(envelope.to_json())
    assert again == envelope
    assert again.open(KEYS)


def test_the_envelope_has_the_documented_shape() -> None:
    data = json.loads(make_envelope().to_json())
    assert set(data) == {"format", "body", "link"}
    assert data["format"] == "pipwerk-relay/1"
    assert set(data["link"]) == {"from", "to", "mac"}
    assert isinstance(data["body"], str)
    assert set(json.loads(data["body"])) == {"message", "hops", "stored"}


def test_the_check_value_is_hmac_sha256_over_from_to_and_body() -> None:
    envelope = make_envelope()
    data = f"{SENDER_LINK}\n{RECIPIENT_LINK}\n{envelope.body}".encode()
    expected = hmac.new(bytes(range(32)), data, hashlib.sha256).hexdigest()
    assert envelope.link.mac == expected
    assert len(envelope.link.mac) == 64


def test_the_test_vector_of_the_documentation() -> None:
    mac = compute_mac(EXAMPLE_KEY, "app-a", "net1.relay1", "{}")
    assert mac == "e0e7f9f8af085df155f63c5ae69761d8dee65e349c2d9cf044ff44e107ee90a2"


def test_the_check_value_is_compared_in_constant_time(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[tuple[bytes, bytes]] = []
    real = hmac.compare_digest

    def spy(first: bytes, second: bytes) -> bool:
        calls.append((first, second))
        return real(first, second)

    monkeypatch.setattr(hmac, "compare_digest", spy)
    make_envelope().open(KEYS)
    assert len(calls) == 1


def test_a_changed_message_is_found() -> None:
    envelope = make_envelope()
    changed = envelope.body.replace("hello", "hellp")
    assert changed != envelope.body
    forged = Envelope(format=envelope.format, body=changed, link=envelope.link)
    assert reasons(lambda: forged.open(KEYS)) is RejectionReason.BAD_MAC


@pytest.mark.parametrize("what", ["from", "to"])
def test_a_changed_side_of_the_connection_is_found(what: str) -> None:
    envelope = make_envelope()
    link = envelope.link.model_dump()
    link[what] = "other"
    forged = Envelope(format=envelope.format, body=envelope.body, link=Link.model_validate(link))
    keys = {SENDER_LINK: EXAMPLE_KEY, "other": EXAMPLE_KEY}
    assert reasons(lambda: forged.open(keys)) is RejectionReason.BAD_MAC


def test_a_changed_check_value_is_found() -> None:
    envelope = make_envelope()
    mac = envelope.link.mac
    flipped = ("0" if mac[0] != "0" else "1") + mac[1:]
    forged = Envelope(
        format=envelope.format,
        body=envelope.body,
        link=Link.model_validate({**envelope.link.model_dump(by_alias=True), "mac": flipped}),
    )
    assert reasons(lambda: forged.open(KEYS)) is RejectionReason.BAD_MAC


def test_a_wrong_key_is_found() -> None:
    envelope = make_envelope(key=ConnectionKey.generate())
    assert reasons(lambda: envelope.open(KEYS)) is RejectionReason.BAD_MAC


def test_an_unknown_connection_is_found() -> None:
    envelope = make_envelope()
    assert reasons(lambda: envelope.open({"somebody-else": EXAMPLE_KEY})) is (
        RejectionReason.UNKNOWN_LINK
    )
    assert reasons(lambda: envelope.open({})) is RejectionReason.UNKNOWN_LINK


def test_an_envelope_for_another_receiver_is_found() -> None:
    envelope = make_envelope()
    assert reasons(lambda: envelope.open(KEYS, recipient="net9.relay9")) is (
        RejectionReason.WRONG_RECIPIENT
    )


def test_the_parts_of_the_check_value_cannot_be_shifted() -> None:
    message = make_message()
    first = Envelope.create(message, hops=[], sender="a", recipient="bc", key=EXAMPLE_KEY)
    second = Envelope.create(message, hops=[], sender="ab", recipient="c", key=EXAMPLE_KEY)
    assert first.link.mac != second.link.mac
    assert compute_mac(EXAMPLE_KEY, "a", "bc", "x") != compute_mac(EXAMPLE_KEY, "ab", "c", "x")


def test_the_check_value_is_formed_over_the_text_not_over_a_re_ordered_json() -> None:
    envelope = make_envelope()
    reordered = json.dumps(json.loads(envelope.body), indent=1, sort_keys=True)
    forged = Envelope(format=envelope.format, body=reordered, link=envelope.link)
    assert reasons(lambda: forged.open(KEYS)) is RejectionReason.BAD_MAC


def test_a_body_that_is_no_body_is_found_after_the_check_value() -> None:
    for text in ("not json", "{}", '{"message": 1, "hops": []}', "[]"):
        link = Link.model_validate(
            {
                "from": SENDER_LINK,
                "to": RECIPIENT_LINK,
                "mac": compute_mac(EXAMPLE_KEY, SENDER_LINK, RECIPIENT_LINK, text),
            }
        )
        envelope = Envelope(format="pipwerk-relay/1", body=text, link=link)
        assert reasons(lambda e=envelope: e.open(KEYS)) is RejectionReason.BAD_BODY


def test_the_body_is_not_read_before_the_check_value_is_right() -> None:
    link = Link.model_validate({"from": SENDER_LINK, "to": RECIPIENT_LINK, "mac": "0" * 64})
    envelope = Envelope(format="pipwerk-relay/1", body="not json", link=link)
    assert reasons(lambda: envelope.open(KEYS)) is RejectionReason.BAD_MAC


def test_an_envelope_with_stored_set_is_rejected() -> None:
    message = make_message()
    stored = [{"name": "a.csv", "way": "filestore", "location": "x"}]
    body = json.dumps({"message": json.loads(message.to_json()), "hops": [], "stored": stored})
    link = Link.model_validate(
        {
            "from": SENDER_LINK,
            "to": RECIPIENT_LINK,
            "mac": compute_mac(EXAMPLE_KEY, SENDER_LINK, RECIPIENT_LINK, body),
        }
    )
    envelope = Envelope(format="pipwerk-relay/1", body=body, link=link)
    assert EnvelopeBody.model_validate_json(body).stored is not None  # the model passes it on
    assert reasons(lambda: envelope.open(KEYS)) is RejectionReason.STORED_NOT_SUPPORTED
    assert reasons(envelope.unverified_body) is RejectionReason.STORED_NOT_SUPPORTED


def test_the_relays_passed_are_checked() -> None:
    message = json.loads(make_message().to_json())
    for hops in (["no-dot"], ["a.b.c"], ["a b.c"], ["x.y"] * 65):
        body = json.dumps({"message": message, "hops": hops})
        with pytest.raises(ValueError, match="hops"):
            EnvelopeBody.model_validate_json(body)


@pytest.mark.parametrize(
    ("change", "reason"),
    [
        ({"format": "pipwerk-relay/2"}, RejectionReason.UNSUPPORTED_FORMAT),
        ({"format": 1}, RejectionReason.UNSUPPORTED_FORMAT),
        ({"extra": 1}, RejectionReason.MALFORMED),
        ({"body": 5}, RejectionReason.MALFORMED),
        ({"link": "x"}, RejectionReason.MALFORMED),
    ],
)
def test_a_malformed_envelope_is_rejected(change: dict[str, Any], reason: RejectionReason) -> None:
    data = json.loads(make_envelope().to_json())
    data.update(change)
    assert reasons(lambda: Envelope.from_json(json.dumps(data))) is reason


@pytest.mark.parametrize("text", ["", "not json", "[]", "null", '{"format": "pipwerk-relay/1"}'])
def test_text_that_is_no_envelope_is_rejected(text: str) -> None:
    assert reasons(lambda: Envelope.from_json(text)) in (
        RejectionReason.MALFORMED,
        RejectionReason.UNSUPPORTED_FORMAT,
    )


@pytest.mark.parametrize("mac", ["A" * 64, "0" * 63, "0" * 65, "0" * 64 + "\n", "g" * 64, ""])
def test_a_check_value_of_the_wrong_form_is_rejected(mac: str) -> None:
    data = json.loads(make_envelope().to_json())
    data["link"]["mac"] = mac
    assert reasons(lambda: Envelope.from_json(json.dumps(data))) is RejectionReason.MALFORMED


@pytest.mark.parametrize("name", ["", "a.b.c", "a b", "a/b", "a\n", "../x"])
def test_a_side_of_the_connection_with_a_wrong_name_is_rejected(name: str) -> None:
    for side in ("from", "to"):
        data = json.loads(make_envelope().to_json())
        data["link"][side] = name
        assert reasons(lambda d=data: Envelope.from_json(json.dumps(d))) is (
            RejectionReason.MALFORMED
        )


def test_the_size_of_an_envelope_is_limited_on_reading() -> None:
    text = make_envelope().to_json()
    assert Envelope.from_json(text, max_bytes=len(text.encode()))
    assert reasons(lambda: Envelope.from_json(text, max_bytes=len(text.encode()) - 1)) is (
        RejectionReason.TOO_LARGE
    )
    assert reasons(lambda: Envelope.from_json(text.encode(), max_bytes=10)) is (
        RejectionReason.TOO_LARGE
    )


def test_a_short_key_is_refused() -> None:
    with pytest.raises(KeyFileError, match="at least"):
        ConnectionKey(b"short")


def test_a_rejection_never_contains_content() -> None:
    envelope = make_envelope(message=make_message())
    forged = Envelope(
        format=envelope.format, body=envelope.body.replace("hello", "hellp"), link=envelope.link
    )
    with pytest.raises(EnvelopeRejected) as raised:
        forged.open(KEYS)
    assert "hello" not in str(raised.value)
    assert "hellp" not in str(raised.value)


# Attachments ---------------------------------------------------------------------------------


def test_good_attachments_pass() -> None:
    message = make_message([("a.csv", b"one"), ("b.csv", b"")])
    verify_attachments(message, [b"one", b""])


def test_a_changed_attachment_is_found() -> None:
    message = make_message([("a.csv", b"one")])
    assert reasons(lambda: verify_attachments(message, [b"oNe"])) is (
        RejectionReason.ATTACHMENT_HASH
    )


def test_an_attachment_of_another_size_is_found() -> None:
    message = make_message([("a.csv", b"one")])
    assert reasons(lambda: verify_attachments(message, [b"one!"])) is (
        RejectionReason.ATTACHMENT_SIZE
    )


def test_a_missing_and_an_additional_attachment_are_found() -> None:
    message = make_message([("a.csv", b"one"), ("b.csv", b"two")])
    assert reasons(lambda: verify_attachments(message, [b"one"])) is (
        RejectionReason.ATTACHMENT_MISSING
    )
    assert reasons(lambda: verify_attachments(message, [b"one", b"two", b"x"])) is (
        RejectionReason.ATTACHMENT_UNEXPECTED
    )


def test_the_order_of_the_attachments_counts() -> None:
    message = make_message([("a.csv", b"one"), ("b.csv", b"two")])
    assert reasons(lambda: verify_attachments(message, [b"two", b"one"])) is (
        RejectionReason.ATTACHMENT_HASH
    )


def test_a_changed_attachment_is_found_even_if_the_message_is_signed() -> None:
    # The size and the hash are in the protected part, so a changed file cannot be hidden by
    # changing the description in the message either.
    message = make_message([("a.csv", b"one")])
    envelope = make_envelope(message)
    opened = envelope.open(KEYS)
    assert reasons(lambda: verify_attachments(opened.message, [b"two"])) is (
        RejectionReason.ATTACHMENT_HASH
    )
    forged_body = envelope.body.replace(message.attachments[0].sha256, "0" * 64)
    forged = Envelope(format=envelope.format, body=forged_body, link=envelope.link)
    assert reasons(lambda: forged.open(KEYS)) is RejectionReason.BAD_MAC
