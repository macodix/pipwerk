"""Tests of the description of the data stock in ``contracts/api/pipwerk-replay/v1/openapi.json``
against the code and the library.

That the file equals the application is tested in ``test_contract.py``; here the content is
compared with what it must say. There is no description of an acquisition: pipwerk replay
acquires nothing (specification 5.4). The description carries everything the user interface needs
for the import in processes and for deleting; it must not rely on anything else (Auftrag 15).
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
    DeletionErrorCode,
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
PROCESSES = "/api/v1/market-data/import-processes"
FILES = f"{PROCESSES}/{{id}}/files"
PREVIEW = "/api/v1/market-data/import-preview"
DELETIONS = "/api/v1/market-data/deletions"


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
    assert schemas["DeletionErrorCode"]["enum"] == [item.value for item in DeletionErrorCode]
    assert schemas["MissingReason"]["enum"] == [item.value for item in MissingReason]
    assert schemas["Weekday"]["enum"] == [item.value for item in Weekday]
    assert "BatchErrorCode" not in schemas  # no refusal of a whole import any more


def test_there_is_nothing_of_an_acquisition_or_a_source_in_the_description(
    description: dict[str, Any],
) -> None:
    # "acquired_at" is a field of the instrument data (the moment they were obtained), part of
    # the data format of ``contracts/market-data/v1/``; it is no acquisition by pipwerk replay.
    text = json.dumps(description).lower().replace("acquired_at", "").replace("acquired at", "")

    for word in ("acquisition", "acquire", "fetch", "source", "default_source"):
        assert word not in text, word
    assert not [path for path in description["paths"] if "acquisition" in path]


def test_there_is_no_limit_for_the_files_of_a_process_in_the_description(
    description: dict[str, Any],
) -> None:
    text = json.dumps(description)

    # The names are joined from their words, so that a search for the removed names finds none.
    for words in (
        ["max", "files", "per", "import"],
        ["max", "import", "bytes"],
        ["too", "many", "files"],
        ["batch", "too", "large"],
    ):
        assert "_".join(words) not in text, words
    assert "max_upload_bytes" in text
    assert "max_rows" in text


def test_a_file_of_a_process_is_a_form_with_one_file_and_the_settings_of_the_process(
    description: dict[str, Any],
) -> None:
    body = description["paths"][FILES]["post"]["requestBody"]
    schema = body["content"]["multipart/form-data"]["schema"]

    assert body["required"] is True
    assert list(body["content"]) == ["multipart/form-data"]
    assert schema["additionalProperties"] is False
    assert set(schema["properties"]) == {"broker", "timezone", "file", "instrument", "data"}
    assert set(schema["required"]) == {"broker", "file"}
    assert schema["properties"]["file"]["type"] == "string"
    assert schema["properties"]["file"]["format"] == "binary"


def test_the_preview_takes_the_file_only(description: dict[str, Any]) -> None:
    body = description["paths"][PREVIEW]["post"]["requestBody"]
    schema = body["content"]["multipart/form-data"]["schema"]

    assert set(schema["properties"]) == {"file", "instrument", "data"}
    assert schema["required"] == ["file"]


def test_the_requests_that_begin_and_end_a_process_have_an_empty_json_body(
    description: dict[str, Any],
) -> None:
    for path in (PROCESSES, f"{PROCESSES}/{{id}}/finish", f"{PROCESSES}/{{id}}/abort"):
        body = description["paths"][path]["post"]["requestBody"]
        schema = body["content"]["application/json"]["schema"]
        assert schema.get("properties", {}) == {}, path
        assert schema["additionalProperties"] is False, path


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


def test_the_import_of_a_file_answers_with_a_result_and_names_its_errors(
    description: dict[str, Any],
) -> None:
    operation = description["paths"][FILES]["post"]

    assert [code for code in operation["responses"] if code.startswith("2")] == ["200"]
    assert {"403", "404", "413", "415", "422", "429"} <= set(operation["responses"])
    for word in ("max_upload_bytes", "max_rows", "idle", "refused", "FileTooLarge"):
        assert word in operation["description"], word


def test_the_process_is_described_with_its_idle_time_and_the_ban_on_deleting(
    description: dict[str, Any],
) -> None:
    begin = description["paths"][PROCESSES]["post"]

    assert list(begin["responses"]).count("201") == 1
    assert "idle_timeout_seconds" in begin["description"]
    assert "import_idle_timeout_seconds" in begin["description"]
    assert "409" in begin["description"]
    for path in (f"{PROCESSES}/{{id}}/finish", f"{PROCESSES}/{{id}}/abort"):
        assert {"200", "404"} <= set(description["paths"][path]["post"]["responses"])


def test_every_deletion_has_a_preview_through_confirm_and_names_its_errors(
    description: dict[str, Any],
) -> None:
    for kind in ("series", "period", "contract", "broker"):
        operation = description["paths"][f"{DELETIONS}/{kind}"]["post"]
        body = operation["requestBody"]["content"]["application/json"]["schema"]
        assert "confirm" in body["properties"], kind
        assert "confirm" in body["required"], kind  # never assumed: a deletion says what it wants
        assert body["additionalProperties"] is False, kind
        assert {"200", "404", "409", "422"} <= set(operation["responses"]), kind
        assert "confirm" in operation["description"], kind
    assert (
        "test_run_broker_reset"
        in description["paths"][f"{DELETIONS}/broker"]["post"]["description"]
    )


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
        PROCESSES: {"post"},
        FILES: {"post"},
        f"{PROCESSES}/{{id}}/finish": {"post"},
        f"{PROCESSES}/{{id}}/abort": {"post"},
        PREVIEW: {"post"},
        f"{DELETIONS}/series": {"post"},
        f"{DELETIONS}/period": {"post"},
        f"{DELETIONS}/contract": {"post"},
        f"{DELETIONS}/broker": {"post"},
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
        (PROCESSES, "post", "201", models.ImportProcess),
        (FILES, "post", "200", models.FileOutcome),
        (FILES, "post", "413", models.FileTooLarge),
        (f"{PROCESSES}/{{id}}/finish", "post", "200", models.ImportProcessEnd),
        (f"{PROCESSES}/{{id}}/abort", "post", "200", models.ImportProcessEnd),
        (PREVIEW, "post", "200", models.FileHint),
        (PREVIEW, "post", "413", models.FileTooLarge),
        (f"{DELETIONS}/series", "post", "200", models.DeletionResult),
        (f"{DELETIONS}/series", "post", "404", models.DeletionRefused),
        (f"{DELETIONS}/series", "post", "409", models.DeletionBlocked),
        (f"{DELETIONS}/period", "post", "200", models.DeletionResult),
        (f"{DELETIONS}/contract", "post", "200", models.DeletionResult),
        (f"{DELETIONS}/broker", "post", "200", models.DeletionResult),
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


def test_the_example_of_a_deletion_of_a_broker_shows_the_setting_after_it(
    description: dict[str, Any],
) -> None:
    found = examples_of(description, f"{DELETIONS}/broker", "post", "200")

    preview = models.DeletionResult.model_validate(found["preview"]["value"])
    deleted = models.DeletionResult.model_validate(found["deleted"]["value"])
    assert (preview.deleted, deleted.deleted) == (False, True)
    assert preview.test_run_broker_reset is deleted.test_run_broker_reset is True
    assert preview.test_run_broker.chosen is True  # the preview shows the current setting
    assert deleted.test_run_broker.chosen is False  # afterwards no broker is chosen


@pytest.mark.parametrize("path", [FILES, PREVIEW])
def test_the_example_of_the_form_names_every_field_of_the_form(
    description: dict[str, Any], path: str
) -> None:
    content = description["paths"][path]["post"]["requestBody"]["content"]["multipart/form-data"]
    schema = content["schema"]

    value = content["examples"]["form"]["value"]
    if path == FILES:
        assert set(value) == set(schema["properties"])
    else:
        assert set(value) <= set(schema["properties"])
        assert "file" in value
    assert isinstance(value["file"], str)
