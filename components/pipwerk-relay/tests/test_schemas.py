"""The schema of the operating configuration agrees with the model and the examples."""

import json
from copy import deepcopy
from pathlib import Path
from typing import Any

import pytest
from jsonschema import Draft202012Validator
from pydantic import ValidationError

from pipwerk_relay.operating import RelayConfig
from pipwerk_relay.schemas import (
    SCHEMA_FILE_NAME,
    generate_schema,
    main,
    schema_differs,
    write_schema,
)

CONTRACT_DIRECTORY = Path(__file__).resolve().parents[3] / "contracts" / "messages" / "v1"
VALID_EXAMPLE = CONTRACT_DIRECTORY / "examples" / "relay-config.json"
INVALID_EXAMPLES = sorted((CONTRACT_DIRECTORY / "examples" / "invalid").glob("relay-config-*.json"))

VALIDATOR = Draft202012Validator(generate_schema())


def schema_accepts(document: Any) -> bool:
    return VALIDATOR.is_valid(document)


def model_accepts(document: Any) -> bool:
    try:
        RelayConfig.model_validate_json(json.dumps(document))
    except ValidationError:
        return False
    return True


def test_the_schema_file_is_exactly_what_the_model_generates() -> None:
    assert not schema_differs(CONTRACT_DIRECTORY)
    written = (CONTRACT_DIRECTORY / SCHEMA_FILE_NAME).read_text(encoding="utf-8")
    assert json.loads(written) == generate_schema()


def test_the_schema_is_a_valid_json_schema() -> None:
    Draft202012Validator.check_schema(generate_schema())


def test_the_schema_tool_writes_and_checks(tmp_path: Path) -> None:
    assert main([str(tmp_path), "--check"]) == 1  # no file yet
    assert main([str(tmp_path)]) == 0
    assert main([str(tmp_path), "--check"]) == 0
    (tmp_path / SCHEMA_FILE_NAME).write_text("{}", encoding="utf-8")
    assert main([str(tmp_path), "--check"]) == 1
    assert write_schema(tmp_path).read_text(encoding="utf-8").endswith("}\n")


def test_the_valid_example_passes_schema_and_model_and_is_the_whole_configuration() -> None:
    document = json.loads(VALID_EXAMPLE.read_text(encoding="utf-8"))
    assert schema_accepts(document)
    config = RelayConfig.model_validate_json(VALID_EXAMPLE.read_text(encoding="utf-8"))
    assert json.loads(config.model_dump_json()) == document  # every default is written down


def test_there_are_invalid_examples() -> None:
    assert len(INVALID_EXAMPLES) >= 5


@pytest.mark.parametrize("path", INVALID_EXAMPLES, ids=lambda path: path.name)
def test_an_invalid_example_fails_schema_and_model(path: Path) -> None:
    document = json.loads(path.read_text(encoding="utf-8"))
    assert not schema_accepts(document)
    assert not model_accepts(document)


VALID = json.loads(VALID_EXAMPLE.read_text(encoding="utf-8"))


def without(document: dict[str, Any], *path: str) -> dict[str, Any]:
    result = deepcopy(document)
    target = result
    for part in path[:-1]:
        target = target[part] if isinstance(target, dict) else target[int(part)]
    del target[path[-1]]
    return result


def with_value(document: dict[str, Any], value: Any, *path: str) -> dict[str, Any]:
    result = deepcopy(document)
    target: Any = result
    for part in path[:-1]:
        target = target[part] if isinstance(target, dict) else target[int(part)]
    target[path[-1]] = value
    return result


BORDER_CASES = [
    {"network": "n", "name": "r"},
    without(VALID, "network"),
    without(VALID, "name"),
    with_value(VALID, "a" * 63, "name"),
    with_value(VALID, "a" * 64, "name"),
    with_value(VALID, "", "name"),
    with_value(VALID, "_a", "name"),
    with_value(VALID, 5, "name"),
    with_value(VALID, "x", "extra"),
    with_value(VALID, [], "inputs"),
    with_value(VALID, {}, "inputs"),
    without(VALID, "inputs", "0", "way"),
    without(VALID, "inputs", "0", "settings"),
    with_value(VALID, {"anything": [1, {"deep": None}]}, "inputs", "0", "settings"),
    with_value(VALID, [], "inputs", "0", "settings"),
    with_value(VALID, "Files", "inputs", "0", "way"),
    with_value(VALID, "f" * 32, "inputs", "0", "way"),
    with_value(VALID, "f" * 33, "inputs", "0", "way"),
    without(VALID, "components", "0", "key_file"),
    with_value(VALID, "a/b", "components", "0", "key_file"),
    with_value(VALID, "k" * 128, "components", "0", "key_file"),
    with_value(VALID, "k" * 129, "components", "0", "key_file"),
    with_value(VALID, "yes", "address_book", "0", "standard"),
    with_value(VALID, False, "address_book", "0", "standard"),
    with_value(VALID, 0.5, "periods", "read_interval_seconds"),
    with_value(VALID, 0, "periods", "read_interval_seconds"),
    with_value(VALID, -1, "periods", "retry_first_seconds"),
    with_value(VALID, "5", "periods", "read_interval_seconds"),
    with_value(VALID, 1, "limits", "max_hops"),
    with_value(VALID, 63, "limits", "max_hops"),
    with_value(VALID, 64, "limits", "max_hops"),
    with_value(VALID, 1000, "limits", "read_batch"),
    with_value(VALID, 1001, "limits", "read_batch"),
    with_value(VALID, 1, "limits", "max_queue_messages"),
    with_value(VALID, 0, "limits", "max_queue_messages"),
    with_value(VALID, True, "limits", "max_queue_messages"),
]


@pytest.mark.parametrize("document", BORDER_CASES)
def test_schema_and_model_judge_border_cases_alike(document: Any) -> None:
    assert schema_accepts(document) == model_accepts(document)


def test_rules_only_the_model_checks() -> None:
    reserved = with_value(VALID, "relay", "components", "0", "name")
    assert schema_accepts(reserved) and not model_accepts(reserved)  # 'relay' is reserved
    twice = with_value(VALID, VALID["components"][0]["name"], "components", "1", "name")
    assert schema_accepts(twice) and not model_accepts(twice)  # names must differ
    pauses = with_value(VALID, 1, "periods", "retry_max_seconds")
    assert schema_accepts(pauses) and not model_accepts(pauses)  # retry_max >= retry_first
