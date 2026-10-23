"""Tests of the description of the data stock in ``contracts/api/pipwerk-replay/v1/openapi.json``
against the code and the library.

That the file equals the application is tested in ``test_contract.py``; here the content is
compared with what it must say. There is no description of an acquisition: pipwerk replay
acquires nothing (specification 5.4).
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, get_args

import pytest
from pipwerk_marketdata import (
    CONTRACT,
    TICKS,
    TIME_UNITS,
    BatchErrorCode,
    FileErrorCode,
    MissingReason,
    RejectReason,
    Weekday,
)
from pydantic import TypeAdapter

from pipwerk_replay import marketdata_models as models
from pipwerk_replay.marketdata_models import DATA_IDENTIFIERS, TimeUnitName

CONTRACT_FILE = (
    Path(__file__).resolve().parents[4]
    / "contracts"
    / "api"
    / "pipwerk-replay"
    / "v1"
    / "openapi.json"
)
IMPORT = "/api/v1/market-data/imports"


@pytest.fixture(scope="module")
def description() -> dict[str, Any]:
    return json.loads(CONTRACT_FILE.read_text(encoding="utf-8"))  # type: ignore[no-any-return]


def test_the_time_units_are_those_of_the_library() -> None:
    assert get_args(TimeUnitName) == tuple(TIME_UNITS)
    assert set(DATA_IDENTIFIERS) == {*TIME_UNITS, TICKS, CONTRACT}


def test_the_enumerations_of_the_schemas_are_those_of_the_library(
    description: dict[str, Any],
) -> None:
    schemas = description["components"]["schemas"]

    assert schemas["RejectReason"]["enum"] == [item.value for item in RejectReason]
    assert schemas["FileErrorCode"]["enum"] == [item.value for item in FileErrorCode]
    assert schemas["BatchErrorCode"]["enum"] == [item.value for item in BatchErrorCode]
    assert schemas["MissingReason"]["enum"] == [item.value for item in MissingReason]
    assert schemas["Weekday"]["enum"] == [item.value for item in Weekday]


def test_there_is_nothing_of_an_acquisition_or_a_source_in_the_description(
    description: dict[str, Any],
) -> None:
    # "acquired_at" is a field of the instrument data (the moment they were obtained), part of
    # the data format of ``contracts/market-data/v1/``; it is no acquisition by pipwerk replay.
    text = json.dumps(description).lower().replace("acquired_at", "").replace("acquired at", "")

    for word in ("acquisition", "acquire", "fetch", "source", "default_source"):
        assert word not in text, word
    assert not [path for path in description["paths"] if "acquisition" in path]


def test_the_import_is_a_form_with_the_files_and_the_settings_of_the_process(
    description: dict[str, Any],
) -> None:
    body = description["paths"][IMPORT]["post"]["requestBody"]
    schema = body["content"]["multipart/form-data"]["schema"]

    assert body["required"] is True
    assert list(body["content"]) == ["multipart/form-data"]
    assert schema["additionalProperties"] is False
    assert set(schema["properties"]) == {"broker", "timezone", "file", "instrument", "data"}
    assert set(schema["required"]) == {"broker", "file"}
    assert schema["properties"]["file"]["items"] == {"type": "string", "format": "binary"}


def test_the_preview_takes_the_files_only(description: dict[str, Any]) -> None:
    body = description["paths"][f"{IMPORT}/preview"]["post"]["requestBody"]
    schema = body["content"]["multipart/form-data"]["schema"]

    assert set(schema["properties"]) == {"file", "instrument", "data"}
    assert schema["required"] == ["file"]


def test_the_parts_are_one_of_three_forms_selected_by_the_kind(description: dict[str, Any]) -> None:
    body = description["paths"]["/api/v1/market-data/completeness"]["post"]["requestBody"]
    part = body["content"]["application/json"]["schema"]["properties"]["parts"]["items"]

    assert part["discriminator"]["propertyName"] == "kind"
    assert set(part["discriminator"]["mapping"]) == {"candles", "ticks", "instrument"}
    schemas = description["components"]["schemas"]
    for name in ("CandlesPart", "TicksPart", "InstrumentPart"):
        assert schemas[name]["additionalProperties"] is False


def test_every_model_of_a_request_or_an_answer_rejects_additional_fields(
    description: dict[str, Any],
) -> None:
    for name, schema in description["components"]["schemas"].items():
        if schema.get("type") == "object" and "properties" in schema:
            assert schema.get("additionalProperties") is False, name


def test_the_import_answers_with_a_result_per_file_and_names_its_errors(
    description: dict[str, Any],
) -> None:
    operation = description["paths"][IMPORT]["post"]

    assert [code for code in operation["responses"] if code.startswith("2")] == ["200"]
    assert {"413", "415", "422", "429"} <= set(operation["responses"])
    assert "max_files_per_import" in operation["description"]
    assert "max_import_bytes" in operation["description"]
    assert "max_upload_bytes" in operation["description"]
    assert "max_rows" in operation["description"]


def test_every_operation_has_a_summary_a_description_and_a_tag(description: dict[str, Any]) -> None:
    for path, operations in description["paths"].items():
        for method, operation in operations.items():
            assert operation["summary"], (method, path)
            assert operation["description"], (method, path)
            assert operation["tags"], (method, path)


def test_the_limits_are_named_in_the_descriptions(description: dict[str, Any]) -> None:
    paths = description["paths"]

    assert "max_listed_items" in paths["/api/v1/market-data/series"]["get"]["description"]
    assert "max_listed_items" in paths["/api/v1/market-data/series/details"]["get"]["description"]
    assert (
        "max_parts_per_request" in paths["/api/v1/market-data/completeness"]["post"]["description"]
    )


def test_the_endpoints_of_the_data_stock_are_those_of_the_order(
    description: dict[str, Any],
) -> None:
    paths = {
        path: set(operations)
        for path, operations in description["paths"].items()
        if path.startswith("/api/v1/market-data/")
    }

    assert paths == {
        "/api/v1/market-data/series": {"get"},
        "/api/v1/market-data/series/details": {"get"},
        "/api/v1/market-data/brokers": {"get"},
        "/api/v1/market-data/instrument": {"get"},
        "/api/v1/market-data/imports": {"post"},
        "/api/v1/market-data/imports/preview": {"post"},
        "/api/v1/market-data/completeness": {"post"},
    }


def examples_of(description: dict[str, Any], path: str, method: str, status: str) -> dict[str, Any]:
    content = description["paths"][path][method]["responses"][status]["content"]
    found: dict[str, Any] = content["application/json"]["examples"]
    return found


@pytest.mark.parametrize(
    ("path", "method", "status", "model"),
    [
        ("/api/v1/market-data/series", "get", "200", models.SeriesPage),
        ("/api/v1/market-data/series/details", "get", "200", models.SeriesDetails),
        ("/api/v1/market-data/brokers", "get", "200", models.Brokers),
        (IMPORT, "post", "200", models.ImportOutcome),
        (f"{IMPORT}/preview", "post", "200", models.ImportPreview),
    ],
)
def test_the_examples_of_the_answers_fit_their_models(
    description: dict[str, Any], path: str, method: str, status: str, model: Any
) -> None:
    found = examples_of(description, path, method, status)

    assert found
    for name, item in found.items():
        assert item["summary"], name
        TypeAdapter(model).validate_python(item["value"])


def test_the_examples_of_a_refused_import_fit_the_models(description: dict[str, Any]) -> None:
    refused = examples_of(description, IMPORT, "post", "413")["too_many_files"]["value"]
    no_files = examples_of(description, IMPORT, "post", "422")["no_files"]["value"]

    assert models.ImportRefused.model_validate(refused).code is BatchErrorCode.TOO_MANY_FILES
    assert models.ImportRefused.model_validate(no_files).code is BatchErrorCode.NO_FILES


def test_the_example_of_the_form_names_every_field_of_the_form(description: dict[str, Any]) -> None:
    content = description["paths"][IMPORT]["post"]["requestBody"]["content"]["multipart/form-data"]
    schema = content["schema"]

    value = content["examples"]["form"]["value"]
    assert set(value) == set(schema["properties"])
    assert len(value["file"]) == len(value["instrument"]) == len(value["data"])
