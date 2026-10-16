"""The JSON schemas under contracts/strategies/v1/ are generated from the models."""

import json
import subprocess
import sys
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator, ValidationError

from pipwerk_domain import catalog
from pipwerk_domain.documents import write_document
from pipwerk_domain.documents.schemas import (
    SCHEMA_MODELS,
    differing_schemas,
    generate_schema,
    main,
    render_schema,
    schema_file_name,
    write_schemas,
)
from pipwerk_domain.model import Strategy
from pipwerk_domain.risk_rule import risk_per_trade_instance, risk_per_trade_template
from tests.helpers import rule, ruleset, template, uid
from tests.paths import SCHEMA_DIRECTORY


def test_there_is_a_schema_for_each_format() -> None:
    assert set(SCHEMA_MODELS) == {"strategy", "indicator", "trend", "rule", "ruleset"}
    assert schema_file_name("strategy") == "strategy.schema.json"


@pytest.mark.parametrize("name", sorted(SCHEMA_MODELS))
def test_the_generated_schema_equals_the_file_in_the_contracts(name: str) -> None:
    path = SCHEMA_DIRECTORY / schema_file_name(name)
    assert path.is_file(), path
    assert path.read_text(encoding="utf-8") == render_schema(name)


def test_no_schema_differs() -> None:
    assert differing_schemas(SCHEMA_DIRECTORY) == []


def test_no_other_file_in_the_directory_than_schemas_and_test_cases() -> None:
    names = sorted(item.name for item in SCHEMA_DIRECTORY.iterdir())
    assert names == sorted([schema_file_name(name) for name in SCHEMA_MODELS] + ["testcases"])


@pytest.mark.parametrize("name", sorted(SCHEMA_MODELS))
def test_the_schemas_are_valid_json_schemas(name: str) -> None:
    schema = generate_schema(name)
    Draft202012Validator.check_schema(schema)
    assert schema["$schema"] == "https://json-schema.org/draft/2020-12/schema"


def validator(name: str) -> Draft202012Validator:
    return Draft202012Validator(generate_schema(name))


def test_written_documents_are_valid_against_the_schemas() -> None:
    documents = {
        "strategy": write_document(
            Strategy(id=uid(900), title="t", rules=[risk_per_trade_instance("risiko")])
        ),
        "rule": write_document(risk_per_trade_template()),
        "ruleset": write_document(template(catalog.TYPE_RULESET, rules=[rule("a", "TRUE()")])),
        "trend": write_document(template(catalog.TYPE_TREND)),
        "indicator": write_document(template(catalog.TYPE_INDICATOR, rules=[ruleset("w", [])])),
    }
    for name, text in documents.items():
        validator(name).validate(json.loads(text))


def test_the_schemas_reject_additional_fields_and_wrong_formats() -> None:
    data = json.loads(write_document(risk_per_trade_template()))
    validator("rule").validate(data)
    with pytest.raises(ValidationError):
        validator("rule").validate({**data, "extra": 1})
    with pytest.raises(ValidationError):
        validator("rule").validate({**data, "format": "pipwerk.trend"})
    with pytest.raises(ValidationError):
        validator("rule").validate({**data, "format_version": "2.0"})
    nested = json.loads(json.dumps(data))
    nested["parameters"][0]["extra"] = 1
    with pytest.raises(ValidationError):
        validator("rule").validate(nested)


def test_the_limits_are_in_the_schema() -> None:
    schema = generate_schema("strategy")
    properties = schema["properties"]
    assert properties["elements"]["maxItems"] == 1000  # type: ignore[index]
    assert properties["connections"]["maxItems"] == 4000  # type: ignore[index]
    assert properties["parameters"]["maxItems"] == 200  # type: ignore[index]
    assert properties["rules"]["maxItems"] == 200  # type: ignore[index]
    text = json.dumps(schema)
    assert '"maxLength": 4096' in text


def test_write_schemas_creates_the_files(tmp_path: Path) -> None:
    written = write_schemas(tmp_path / "neu")
    assert sorted(item.name for item in written) == sorted(
        schema_file_name(name) for name in SCHEMA_MODELS
    )
    assert differing_schemas(tmp_path / "neu") == []


def test_command_writes_and_checks(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    assert main([str(tmp_path)]) == 0
    assert "strategy.schema.json" in capsys.readouterr().out
    assert main(["--check", str(tmp_path)]) == 0
    (tmp_path / "rule.schema.json").write_text("{}\n", encoding="utf-8")
    (tmp_path / "trend.schema.json").unlink()
    assert main(["--check", str(tmp_path)]) == 1
    errors = capsys.readouterr().err
    assert "rule" in errors
    assert "trend" in errors
    assert differing_schemas(tmp_path) == ["trend", "rule"]


def test_command_as_a_module() -> None:
    result = subprocess.run(  # noqa: S603 - the interpreter of the test and fixed arguments
        [
            sys.executable,
            "-m",
            "pipwerk_domain.documents.schemas",
            "--check",
            str(SCHEMA_DIRECTORY),
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr
