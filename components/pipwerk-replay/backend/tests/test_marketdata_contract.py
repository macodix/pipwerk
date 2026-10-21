"""Tests of the description of the data stock and the acquisition in
``contracts/api/pipwerk-replay/v1/openapi.json`` against the code and the library.

That the file equals the application is tested in ``test_contract.py``; here the content is
compared with what it must say.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, get_args

import pytest
from pipwerk_marketdata import (
    TIME_UNITS,
    FileErrorCode,
    MissingReason,
    RejectReason,
    Weekday,
)

from pipwerk_replay.acquisition import SOURCE_ERROR_CODES
from pipwerk_replay.marketdata_models import PartFailure, TimeUnitName

CONTRACT = (
    Path(__file__).resolve().parents[4]
    / "contracts"
    / "api"
    / "pipwerk-replay"
    / "v1"
    / "openapi.json"
)


@pytest.fixture(scope="module")
def description() -> dict[str, Any]:
    return json.loads(CONTRACT.read_text(encoding="utf-8"))  # type: ignore[no-any-return]


def test_the_time_units_are_those_of_the_library() -> None:
    assert get_args(TimeUnitName) == tuple(TIME_UNITS)


def test_the_enumerations_of_the_schemas_are_those_of_the_library(
    description: dict[str, Any],
) -> None:
    schemas = description["components"]["schemas"]

    assert schemas["RejectReason"]["enum"] == [item.value for item in RejectReason]
    assert schemas["FileErrorCode"]["enum"] == [item.value for item in FileErrorCode]
    assert schemas["MissingReason"]["enum"] == [item.value for item in MissingReason]
    assert schemas["Weekday"]["enum"] == [item.value for item in Weekday]


def test_the_failure_of_a_part_names_every_code_of_the_source() -> None:
    text = PartFailure.__doc__ or ""

    for code in SOURCE_ERROR_CODES:
        assert f"``{code}``" in text, code
    for code in (
        "source_unreachable",
        "source_response_invalid",
        "source_response_too_large",
        "import_refused",
        "data_store_error",
        "acquisition_failed",
    ):
        assert f"``{code}``" in text, code


def test_an_uploaded_file_is_described_as_the_body_with_its_media_type(
    description: dict[str, Any],
) -> None:
    paths = description["paths"]
    json_body = paths["/api/v1/market-data/imports/json"]["post"]["requestBody"]
    csv_body = paths["/api/v1/market-data/imports/csv"]["post"]["requestBody"]

    assert json_body["required"] is True
    assert list(json_body["content"]) == ["application/json"]
    assert list(csv_body["content"]) == ["text/csv"]
    assert csv_body["content"]["text/csv"]["schema"] == {"type": "string", "format": "binary"}


def test_the_parameters_of_the_csv_import_are_the_query_of_the_request(
    description: dict[str, Any],
) -> None:
    parameters = description["paths"]["/api/v1/market-data/imports/csv"]["post"]["parameters"]

    assert {item["name"]: item["required"] for item in parameters} == {
        "kind": True,
        "broker": True,
        "instrument": True,
        "time_unit": False,
        "timezone": True,
    }
    assert all(item["in"] == "query" for item in parameters)


def test_the_parts_are_one_of_three_forms_selected_by_the_kind(description: dict[str, Any]) -> None:
    body = description["paths"]["/api/v1/market-data/acquisitions"]["post"]["requestBody"]
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


def test_the_acquisition_is_started_with_202_and_has_no_other_success_status(
    description: dict[str, Any],
) -> None:
    operation = description["paths"]["/api/v1/market-data/acquisitions"]["post"]

    assert [code for code in operation["responses"] if code.startswith("2")] == ["202"]
    assert {"409", "413", "415", "422", "429"} <= set(operation["responses"])


def test_every_operation_has_a_summary_a_description_and_a_tag(description: dict[str, Any]) -> None:
    for path, operations in description["paths"].items():
        for method, operation in operations.items():
            assert operation["summary"], (method, path)
            assert operation["description"], (method, path)
            assert operation["tags"], (method, path)


def test_the_limits_are_named_in_the_descriptions(description: dict[str, Any]) -> None:
    paths = description["paths"]

    assert "max_upload_bytes" in paths["/api/v1/market-data/imports/json"]["post"]["description"]
    assert "max_rows" in paths["/api/v1/market-data/imports/json"]["post"]["description"]
    assert "max_listed_items" in paths["/api/v1/market-data/overview"]["get"]["description"]
    assert (
        "max_parts_per_request" in paths["/api/v1/market-data/completeness"]["post"]["description"]
    )
    assert (
        "max_kept_acquisitions"
        in paths["/api/v1/market-data/acquisitions/{id}"]["get"]["description"]
    )
