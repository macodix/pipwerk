"""The JSON schemas under contracts/strategies/v2/ (format 2.0) and v1/ (format 1.0, which the
library only reads) are generated from the models."""

import json
import subprocess
import sys
from pathlib import Path
from typing import Any

import pytest
from jsonschema import Draft202012Validator, ValidationError

from pipwerk_domain import catalog
from pipwerk_domain.documents import read_document, write_document
from pipwerk_domain.documents.schemas import (
    SCHEMA_MODELS,
    SCHEMA_MODELS_BY_VERSION,
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
from tests.paths import EXAMPLE_DIRECTORY, SCHEMA_DIRECTORY, SCHEMA_DIRECTORY_V1


def test_there_is_a_schema_for_each_format() -> None:
    assert set(SCHEMA_MODELS) == {"strategy", "indicator", "trend", "rule", "ruleset"}
    assert set(SCHEMA_MODELS_BY_VERSION) == {1, 2}
    assert SCHEMA_MODELS is SCHEMA_MODELS_BY_VERSION[2]
    assert schema_file_name("strategy") == "strategy.schema.json"


@pytest.mark.parametrize("name", sorted(SCHEMA_MODELS))
def test_the_generated_schema_equals_the_file_in_the_contracts(name: str) -> None:
    path = SCHEMA_DIRECTORY / schema_file_name(name)
    assert path.is_file(), path
    assert path.read_text(encoding="utf-8") == render_schema(name)


@pytest.mark.parametrize("name", sorted(SCHEMA_MODELS))
def test_the_schemas_of_the_format_one_are_unchanged(name: str) -> None:
    path = SCHEMA_DIRECTORY_V1 / schema_file_name(name)
    assert path.read_text(encoding="utf-8") == render_schema(name, 1)


def test_no_schema_differs() -> None:
    assert differing_schemas(SCHEMA_DIRECTORY) == []
    assert differing_schemas(SCHEMA_DIRECTORY_V1, 1) == []


def test_the_two_formats_differ() -> None:
    assert differing_schemas(SCHEMA_DIRECTORY_V1) == sorted(
        SCHEMA_MODELS, key=list(SCHEMA_MODELS).index
    )


def test_no_other_file_in_the_directory_than_schemas_test_cases_and_examples() -> None:
    names = sorted(item.name for item in SCHEMA_DIRECTORY.iterdir())
    expected = [schema_file_name(name) for name in SCHEMA_MODELS] + ["testcases", "examples"]
    assert names == sorted(expected)


EXAMPLES = sorted(EXAMPLE_DIRECTORY.iterdir())


def test_there_are_examples() -> None:
    assert len(EXAMPLES) == 9


@pytest.mark.parametrize("path", EXAMPLES, ids=[item.name for item in EXAMPLES])
def test_the_examples_are_valid_against_their_schema_and_in_the_written_form(path: Path) -> None:
    """The examples of the technical documentation are documents in the form of the library."""
    text = path.read_text(encoding="utf-8")
    data = json.loads(text)
    name = data["format"].removeprefix("pipwerk.")
    assert path.name.endswith(f".{name}.json")
    assert data["format_version"] == "2.0"
    validator(name).validate(data)
    assert write_document(read_document(text)) == text


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
            Strategy(id=uid(900), name="t", rules=[risk_per_trade_instance("risiko")])
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
        validator("rule").validate({**data, "format_version": "1.0"})
    with pytest.raises(ValidationError):
        validator("rule").validate({**data, "format_version": "3.0"})
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
    assert '"maxLength": 200' in text  # names and keys
    assert '"maxItems": 50' in text  # inputs of an element


def test_the_schema_names_the_fields_of_the_format_two() -> None:
    schema: Any = generate_schema("strategy")
    properties = schema["properties"]
    assert {"name", "sections", "orientation", "collapsed_managements"} <= set(properties)
    assert "title" not in properties
    definitions = schema["$defs"]
    assert {"key", "name", "datatype"} <= set(
        definitions["StrategyParameterDocument"]["properties"]
    )
    assert {"inputs", "position", "key"} <= set(definitions["ElementDocument"]["properties"])
    assert {"id", "name", "flow", "elements", "collapsed"} == set(
        definitions["SectionDocument"]["properties"]
    )
    assert "connection" in json.dumps(definitions["BindingDocument"])


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


def test_command_checks_the_format_one(tmp_path: Path) -> None:
    assert main(["--check", "--format-version", "1", str(SCHEMA_DIRECTORY_V1)]) == 0
    assert main(["--check", str(SCHEMA_DIRECTORY_V1)]) == 1
    assert main(["--format-version", "1", str(tmp_path)]) == 0
    assert differing_schemas(tmp_path, 1) == []


@pytest.mark.parametrize(
    ("directory", "arguments"),
    [(SCHEMA_DIRECTORY, []), (SCHEMA_DIRECTORY_V1, ["--format-version", "1"])],
)
def test_command_as_a_module(directory: Path, arguments: list[str]) -> None:
    result = subprocess.run(  # noqa: S603 - the interpreter of the test and fixed arguments
        [
            sys.executable,
            "-m",
            "pipwerk_domain.documents.schemas",
            "--check",
            *arguments,
            str(directory),
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr
