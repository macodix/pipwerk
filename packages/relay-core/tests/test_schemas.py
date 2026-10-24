"""The schemas under ``contracts/messages/v1`` agree with the models (specification 5)."""

import copy
import json
from pathlib import Path
from typing import Any
from uuid import uuid4

import pytest
from jsonschema import Draft202012Validator
from pydantic import ValidationError

from pipwerk_relaycore import Envelope, EnvelopeBody, EnvelopeRejected, Message
from pipwerk_relaycore.schemas import SCHEMA_NAMES, differing_schemas, main, render_schema
from tests.helpers import CONTRACT_DIRECTORY, EXAMPLE_DIRECTORY, EXAMPLE_KEY


def load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


MESSAGE_SCHEMA = load(CONTRACT_DIRECTORY / "message.schema.json")
ENVELOPE_SCHEMA = load(CONTRACT_DIRECTORY / "envelope.schema.json")
FORMATS = Draft202012Validator.FORMAT_CHECKER  # "format": "uuid" is only checked with this
MESSAGE_VALIDATOR = Draft202012Validator(MESSAGE_SCHEMA, format_checker=FORMATS)
ENVELOPE_VALIDATOR = Draft202012Validator(ENVELOPE_SCHEMA, format_checker=FORMATS)
BODY_VALIDATOR = Draft202012Validator(
    {"$ref": "#/$defs/Body", "$defs": ENVELOPE_SCHEMA["$defs"]}, format_checker=FORMATS
)

VALID_MESSAGES = sorted(EXAMPLE_DIRECTORY.glob("message-*.json"))
INVALID_MESSAGES = sorted((EXAMPLE_DIRECTORY / "invalid").glob("message-*.json"))
VALID_ENVELOPES = sorted(EXAMPLE_DIRECTORY.glob("envelope*.json"))
INVALID_ENVELOPES = sorted((EXAMPLE_DIRECTORY / "invalid").glob("envelope-*.json"))


def model_accepts_message(data: Any) -> bool:
    try:
        Message.from_json(json.dumps(data))
    except ValidationError:
        return False
    return True


def model_accepts_envelope(data: Any) -> bool:
    try:
        Envelope.from_json(json.dumps(data))
    except EnvelopeRejected:
        return False
    return True


def model_accepts_body(text: str) -> bool:
    try:
        EnvelopeBody.model_validate_json(text)
    except ValidationError:
        return False
    return True


def test_the_schema_files_are_written_by_the_models() -> None:
    assert differing_schemas(CONTRACT_DIRECTORY) == []
    for name in SCHEMA_NAMES:
        text = (CONTRACT_DIRECTORY / f"{name}.schema.json").read_text(encoding="utf-8")
        assert text == render_schema(name)


def test_the_tool_reports_a_schema_that_differs(tmp_path: Path) -> None:
    assert main([str(tmp_path / "out")]) == 0
    assert main(["--check", str(tmp_path / "out")]) == 0
    (tmp_path / "out" / "message.schema.json").write_text("{}\n", encoding="utf-8")
    assert main(["--check", str(tmp_path / "out")]) == 1
    assert differing_schemas(tmp_path / "empty") == list(SCHEMA_NAMES)


def test_the_schemas_are_valid_schemas() -> None:
    Draft202012Validator.check_schema(MESSAGE_SCHEMA)
    Draft202012Validator.check_schema(ENVELOPE_SCHEMA)


def test_there_are_examples() -> None:
    assert len(VALID_MESSAGES) >= 2
    assert len(INVALID_MESSAGES) >= 3
    assert len(VALID_ENVELOPES) >= 1
    assert len(INVALID_ENVELOPES) >= 3


@pytest.mark.parametrize("path", VALID_MESSAGES, ids=lambda path: path.name)
def test_a_valid_example_of_a_message_passes_schema_and_model(path: Path) -> None:
    data = load(path)
    assert MESSAGE_VALIDATOR.is_valid(data)
    assert model_accepts_message(data)


@pytest.mark.parametrize("path", INVALID_MESSAGES, ids=lambda path: path.name)
def test_an_invalid_example_of_a_message_fails_schema_and_model(path: Path) -> None:
    data = load(path)
    assert not MESSAGE_VALIDATOR.is_valid(data)
    assert not model_accepts_message(data)


@pytest.mark.parametrize("path", VALID_ENVELOPES, ids=lambda path: path.name)
def test_a_valid_example_of_an_envelope_passes_schema_and_model(path: Path) -> None:
    data = load(path)
    assert ENVELOPE_VALIDATOR.is_valid(data)
    assert model_accepts_envelope(data)
    assert BODY_VALIDATOR.is_valid(json.loads(data["body"]))


@pytest.mark.parametrize("path", VALID_ENVELOPES, ids=lambda path: path.name)
def test_the_check_value_of_an_example_is_correct_for_the_example_key(path: Path) -> None:
    envelope = Envelope.from_json(path.read_text(encoding="utf-8"))
    opened = envelope.open({envelope.link.from_: EXAMPLE_KEY}, recipient=envelope.link.to)
    assert opened.message.kind


@pytest.mark.parametrize("path", INVALID_ENVELOPES, ids=lambda path: path.name)
def test_an_invalid_example_of_an_envelope_fails_schema_and_model(path: Path) -> None:
    data = load(path)
    assert not ENVELOPE_VALIDATOR.is_valid(data)
    assert not model_accepts_envelope(data)


def good_message() -> dict[str, Any]:
    data = load(EXAMPLE_DIRECTORY / "message-with-attachment.json")
    assert isinstance(data, dict)
    return data


def changed(**changes: Any) -> dict[str, Any]:
    data = good_message()
    data.update(changes)
    return data


def without(field: str) -> dict[str, Any]:
    data = good_message()
    del data[field]
    return data


def attachment(**changes: Any) -> dict[str, Any]:
    data = copy.deepcopy(good_message())
    data["attachments"][0].update(changes)
    return data


MESSAGE_CASES: list[tuple[str, dict[str, Any]]] = [
    ("good", good_message()),
    ("extra field", changed(extra=1)),
    *[
        (f"without {field}", without(field))
        for field in ("id", "sender", "recipient", "priority", "kind", "content", "created_at")
    ],
    (
        "without optional fields",
        {
            k: v
            for k, v in good_message().items()
            if k not in ("reference_id", "attachments", "receipt")
        },
    ),
    ("id no uuid", changed(id="x")),
    ("id number", changed(id=5)),
    ("sender short", changed(sender="a.b")),
    ("sender long", changed(sender="a.b.c.d")),
    ("sender dash first", changed(sender="-a.b.c")),
    ("sender empty part", changed(sender="a..c")),
    ("sender 64 chars", changed(sender="a" * 64 + ".b.c")),
    ("sender 63 chars", changed(sender="a" * 63 + ".b.c")),
    ("recipient space", changed(recipient="a b.c.d")),
    ("priority capitals", changed(priority="Normal")),
    ("priority empty", changed(priority="")),
    ("priority 32", changed(priority="a" * 32)),
    ("priority 33", changed(priority="a" * 33)),
    ("kind capitals", changed(kind="Example")),
    ("kind double dot", changed(kind="a..b")),
    ("kind 64", changed(kind="a" * 64)),
    ("kind 65", changed(kind="a" * 65)),
    ("content string", changed(content="x")),
    ("content array", changed(content=[1])),
    ("content nested", changed(content={"a": {"b": [1, None, "x", 2.5]}})),
    ("reference null", changed(reference_id=None)),
    ("reference bad", changed(reference_id="no")),
    ("receipt string", changed(receipt="yes")),
    ("receipt number", changed(receipt=1)),
    ("created_at number", changed(created_at=5)),
    ("attachments null", changed(attachments=None)),
    ("attachments string", changed(attachments="a")),
    ("attachments empty", changed(attachments=[])),
    ("attachment extra", attachment(extra=1)),
    ("attachment name path", attachment(name="../a")),
    ("attachment name dot", attachment(name=".a")),
    ("attachment name 128", attachment(name="a" * 128)),
    ("attachment name 129", attachment(name="a" * 129)),
    ("attachment name hash plus", attachment(name="#a+b-c._d")),
    ("attachment name space", attachment(name="a b")),
    ("attachment size negative", attachment(size=-1)),
    ("attachment size text", attachment(size="1")),
    ("attachment size float", attachment(size=1.5)),
    ("attachment hash capitals", attachment(sha256="A" * 64)),
    ("attachment hash short", attachment(sha256="a" * 63)),
    (
        "attachments 256",
        changed(attachments=[{"name": f"f{n}", "size": 0, "sha256": "0" * 64} for n in range(256)]),
    ),
    (
        "attachments 257",
        changed(attachments=[{"name": f"f{n}", "size": 0, "sha256": "0" * 64} for n in range(257)]),
    ),
]


@pytest.mark.parametrize(("case", "data"), MESSAGE_CASES, ids=[case for case, _ in MESSAGE_CASES])
def test_schema_and_model_agree_on_a_message(case: str, data: dict[str, Any]) -> None:
    assert MESSAGE_VALIDATOR.is_valid(data) == model_accepts_message(data), case


def test_the_schema_and_model_cases_contain_both_verdicts() -> None:
    verdicts = {model_accepts_message(data) for _, data in MESSAGE_CASES}
    assert verdicts == {True, False}


def test_the_rules_that_a_schema_cannot_state_are_enforced_by_the_model() -> None:
    # The names of the attachments differ and the time is UTC: the model checks both.
    duplicate = changed(attachments=[good_message()["attachments"][0]] * 2)
    assert MESSAGE_VALIDATOR.is_valid(duplicate)
    assert not model_accepts_message(duplicate)
    offset = changed(created_at="2026-10-24T14:00:00+02:00")
    assert MESSAGE_VALIDATOR.is_valid(offset)
    assert not model_accepts_message(offset)


def good_envelope() -> dict[str, Any]:
    data = load(EXAMPLE_DIRECTORY / "envelope.json")
    assert isinstance(data, dict)
    return data


def envelope_changed(**changes: Any) -> dict[str, Any]:
    data = good_envelope()
    data.update(changes)
    return data


def link_changed(**changes: Any) -> dict[str, Any]:
    data = good_envelope()
    data["link"].update(changes)
    return data


ENVELOPE_CASES: list[tuple[str, dict[str, Any]]] = [
    ("good", good_envelope()),
    ("format 2", envelope_changed(format="pipwerk-relay/2")),
    ("extra", envelope_changed(extra=1)),
    ("body number", envelope_changed(body=5)),
    ("body object", envelope_changed(body={})),
    ("link string", envelope_changed(link="x")),
    ("link extra", link_changed(extra=1)),
    ("from component", link_changed(**{"from": "app-a"})),
    ("from three parts", link_changed(**{"from": "a.b.c"})),
    ("from space", link_changed(**{"from": "a b"})),
    ("to empty", link_changed(to="")),
    ("mac capitals", link_changed(mac="A" * 64)),
    ("mac short", link_changed(mac="a" * 63)),
    ("mac long", link_changed(mac="a" * 65)),
    ("mac not hex", link_changed(mac="g" * 64)),
]


@pytest.mark.parametrize(("case", "data"), ENVELOPE_CASES, ids=[case for case, _ in ENVELOPE_CASES])
def test_schema_and_model_agree_on_an_envelope(case: str, data: dict[str, Any]) -> None:
    assert ENVELOPE_VALIDATOR.is_valid(data) == model_accepts_envelope(data), case


def body_with(**changes: Any) -> str:
    body = json.loads(good_envelope()["body"])
    body.update(changes)
    return json.dumps(body)


BODY_CASES: list[tuple[str, str]] = [
    ("good", body_with()),
    ("hops empty", body_with(hops=[])),
    ("hops component", body_with(hops=["a"])),
    ("hops three parts", body_with(hops=["a.b.c"])),
    ("hops 64", body_with(hops=["a.b"] * 64)),
    ("hops 65", body_with(hops=["a.b"] * 65)),
    ("stored null", body_with(stored=None)),
    ("stored set", body_with(stored=[{"name": "a", "way": "w", "location": "l"}])),
    ("stored bad way", body_with(stored=[{"name": "a", "way": "W", "location": "l"}])),
    ("stored empty location", body_with(stored=[{"name": "a", "way": "w", "location": ""}])),
    ("extra", body_with(extra=1)),
    ("message string", body_with(message="x")),
    ("id", body_with(message={"id": str(uuid4())})),
]


@pytest.mark.parametrize(("case", "text"), BODY_CASES, ids=[case for case, _ in BODY_CASES])
def test_schema_and_model_agree_on_a_body(case: str, text: str) -> None:
    assert BODY_VALIDATOR.is_valid(json.loads(text)) == model_accepts_body(text), case
