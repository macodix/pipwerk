"""Contents of the kinds the library knows: models, schemas and examples agree."""

import json
from pathlib import Path
from typing import Any

import pytest
from jsonschema import Draft202012Validator
from pydantic import ValidationError

from pipwerk_relaycore import (
    KIND_PROBE,
    KIND_RECEIPT,
    KIND_UNDELIVERABLE,
    Message,
    ProbeContent,
    ReceiptContent,
    UndeliverableContent,
    UndeliverableReason,
)
from pipwerk_relaycore.contents import CONTENT_MODELS, is_valid_content
from tests.helpers import CONTRACT_DIRECTORY, EXAMPLE_DIRECTORY

KINDS = (KIND_RECEIPT, KIND_UNDELIVERABLE, KIND_PROBE)
EXAMPLE_NAMES = {
    KIND_RECEIPT: "relay-receipt",
    KIND_UNDELIVERABLE: "relay-undeliverable",
    KIND_PROBE: "probe-message",
}
MESSAGE_EXAMPLES = {
    KIND_RECEIPT: "receipt",
    KIND_UNDELIVERABLE: "undeliverable",
    KIND_PROBE: "probe",
}


def load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def validator(kind: str) -> Draft202012Validator:
    schema = load(CONTRACT_DIRECTORY / f"{kind}.schema.json")
    return Draft202012Validator(schema, format_checker=Draft202012Validator.FORMAT_CHECKER)


def test_the_library_knows_the_three_kinds() -> None:
    assert set(CONTENT_MODELS) == set(KINDS)
    assert KIND_RECEIPT == "relay.receipt"
    assert KIND_UNDELIVERABLE == "relay.undeliverable"
    assert KIND_PROBE == "probe.message"


@pytest.mark.parametrize("kind", KINDS)
def test_the_valid_example_of_a_content_fits_schema_and_model(kind: str) -> None:
    data = load(EXAMPLE_DIRECTORY / f"content-{EXAMPLE_NAMES[kind]}.json")
    validator(kind).validate(data)
    CONTENT_MODELS[kind].model_validate_json(json.dumps(data))
    assert is_valid_content(kind, data)


@pytest.mark.parametrize("kind", KINDS)
def test_the_invalid_example_of_a_content_is_refused_by_schema_and_model(kind: str) -> None:
    (path,) = (EXAMPLE_DIRECTORY / "invalid").glob(f"content-{EXAMPLE_NAMES[kind]}-*.json")
    data = load(path)
    assert not validator(kind).is_valid(data)
    with pytest.raises(ValidationError):
        CONTENT_MODELS[kind].model_validate_json(json.dumps(data))
    assert not is_valid_content(kind, data)


@pytest.mark.parametrize("kind", KINDS)
def test_the_example_message_of_a_kind_has_a_fitting_content(kind: str) -> None:
    data = load(EXAMPLE_DIRECTORY / f"message-{MESSAGE_EXAMPLES[kind]}.json")
    assert data["kind"] == kind
    validator(kind).validate(data["content"])
    message = Message.from_json(json.dumps(data))
    assert is_valid_content(message.kind, message.content)


def test_a_kind_that_the_library_does_not_know_accepts_any_content() -> None:
    assert is_valid_content("fetch.request", {"anything": [1, 2, 3]})


def test_the_receipt_has_no_content() -> None:
    assert ReceiptContent.model_validate_json("{}") == ReceiptContent()
    with pytest.raises(ValidationError):
        ReceiptContent.model_validate_json('{"a": 1}')


@pytest.mark.parametrize("reason", list(UndeliverableReason))
def test_every_reason_has_a_fixed_text_and_a_valid_content(reason: UndeliverableReason) -> None:
    content = UndeliverableContent.of(reason, "app-b.net2.relay2", "fetch.request")
    assert content.text == reason.text
    assert 0 < len(reason.text) <= 200
    data = content.to_content()
    validator(KIND_UNDELIVERABLE).validate(data)
    assert UndeliverableContent.model_validate_json(json.dumps(data)) == content


def test_the_reasons_are_the_ones_of_the_specification() -> None:
    assert {reason.value for reason in UndeliverableReason} == {
        "sender_invalid",
        "loop",
        "unknown_recipient",
        "unknown_relay",
        "relay_unreachable",
        "recipient_unreachable",
        "too_large",
    }


@pytest.mark.parametrize(
    "data",
    [
        {"reason": "loop", "text": "x", "recipient": "a.b", "kind": "k"},
        {"reason": "loop", "text": "x", "recipient": "a.b.c", "kind": "K"},
        {"reason": "loop", "text": "", "recipient": "a.b.c", "kind": "k"},
        {"reason": "loop", "text": "x", "recipient": "a.b.c"},
        {"reason": "loop", "text": "x", "recipient": "a.b.c", "kind": "k", "more": 1},
        {"reason": 1, "text": "x", "recipient": "a.b.c", "kind": "k"},
    ],
)
def test_an_invalid_notice_content_is_refused(data: dict[str, Any]) -> None:
    assert not is_valid_content(KIND_UNDELIVERABLE, data)
    assert not validator(KIND_UNDELIVERABLE).is_valid(data)


def test_the_text_of_the_probe_is_short() -> None:
    assert ProbeContent.model_validate_json('{"text": "x"}').text == "x"
    assert not is_valid_content(KIND_PROBE, {"text": "x" * 1001})
    assert is_valid_content(KIND_PROBE, {"text": "x" * 1000})
    assert not is_valid_content(KIND_PROBE, {})


@pytest.mark.parametrize("kind", [KIND_RECEIPT, KIND_UNDELIVERABLE])
def test_a_notice_that_asks_for_a_receipt_is_invalid_in_schema_and_model(kind: str) -> None:
    schema = Draft202012Validator(load(CONTRACT_DIRECTORY / "message.schema.json"))
    data = load(EXAMPLE_DIRECTORY / f"message-{MESSAGE_EXAMPLES[kind]}.json")
    assert schema.is_valid(data)
    data["receipt"] = True
    assert not schema.is_valid(data)
    with pytest.raises(ValidationError):
        Message.from_json(json.dumps(data))
    data["kind"] = "probe.message"  # other kinds may ask
    assert schema.is_valid(data)
