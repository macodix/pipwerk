"""Tests of the description of the interface under ``contracts/api/pipwerk-fetch/v1/``.

The description is generated from the program. The file in the repository equals the generated
one; the command that generates it works and writes the same text. The examples of requests
and answers are what the program answers over HTTP.
"""

import json
import subprocess
import sys
from pathlib import Path
from typing import Any

import jsonschema
import pytest
from fastapi.testclient import TestClient
from support import LOCAL

from pipwerk_fetch_mt5 import contract
from pipwerk_fetch_mt5.errors import ERRORS
from pipwerk_fetch_mt5.fake_source import FAKE_SHARED_KEY, FakeGateway, create_fake_source_app
from pipwerk_fetch_mt5.gateway import TIME_UNIT_MINUTES

CONTRACT_DIRECTORY = (
    Path(__file__).resolve().parents[3] / "contracts" / "api" / "pipwerk-fetch" / "v1"
)
CONTRACT_FILE = CONTRACT_DIRECTORY / "openapi.json"
EXAMPLES = CONTRACT_DIRECTORY / "examples"


def stored() -> dict[str, Any]:
    return json.loads(CONTRACT_FILE.read_text(encoding="utf-8"))  # type: ignore[no-any-return]


def test_the_generated_description_equals_the_file_under_contracts() -> None:
    assert CONTRACT_FILE.is_file()
    assert contract.generate() == CONTRACT_FILE.read_text(encoding="utf-8")


def test_the_program_offers_exactly_the_paths_of_the_description() -> None:
    app = create_fake_source_app()
    live = app.openapi()
    paths = stored()["paths"]
    assert set(live["paths"]) == set(paths) == {"/api/v1/fetch", "/api/v1/health"}
    assert {path: set(operations) for path, operations in paths.items()} == {
        "/api/v1/fetch": {"post"},
        "/api/v1/health": {"get"},
    }
    routes = {
        (route.path, method)  # type: ignore[attr-defined]
        for route in app.routes
        for method in getattr(route, "methods", ())
        if route.path.startswith("/api/")  # type: ignore[attr-defined]
    }
    assert routes == {("/api/v1/fetch", "POST"), ("/api/v1/health", "GET")}


def test_the_program_has_no_page_of_its_own_for_the_description() -> None:
    app = create_fake_source_app()
    assert app.openapi_url is None
    assert app.docs_url is None
    assert app.redoc_url is None


def test_every_reference_is_resolved_and_every_schema_is_used() -> None:
    description = stored()
    schemas = description["components"]["schemas"]
    text = json.dumps(description)
    marker = "#/components/schemas/"
    position = 0
    found: set[str] = set()
    while (position := text.find(marker, position)) != -1:
        name = text[position + len(marker) :].split('"', 1)[0]
        assert name in schemas, name
        found.add(name)
        position += len(marker)
    assert found == set(schemas)


def test_every_schema_refuses_additional_fields() -> None:
    for name, schema in stored()["components"]["schemas"].items():
        if schema.get("type") == "object":
            assert schema.get("additionalProperties") is False, name


def test_the_three_kinds_are_requests_and_answers() -> None:
    description = stored()
    request = description["paths"]["/api/v1/fetch"]["post"]["requestBody"]["content"][
        "application/json"
    ]["schema"]
    assert request["discriminator"]["propertyName"] == "kind"
    assert set(request["discriminator"]["mapping"]) == {"candles", "ticks", "instrument"}
    schemas = description["components"]["schemas"]
    assert {"CandlesRequest", "TicksRequest", "InstrumentRequest"} <= set(schemas)
    assert {"CandleSeriesResponse", "TickSeriesResponse", "InstrumentResponse"} <= set(schemas)
    assert {"CandleSeriesDocument", "TickSeriesDocument", "InstrumentDocument"} <= set(schemas)
    assert schemas["CandlesRequest"]["properties"]["time_unit"]["enum"] == [
        "m1", "m2", "m3", "m4", "m5", "m6", "m10", "m12", "m15", "m20", "m30",
        "h1", "h2", "h3", "h4", "h6", "h8", "h12", "d1", "w1", "mn1",
    ]  # fmt: skip


def test_the_description_names_the_shared_key_and_every_error() -> None:
    description = stored()
    assert description["components"]["securitySchemes"]["sharedKey"] == {
        "type": "http",
        "scheme": "bearer",
        "description": description["components"]["securitySchemes"]["sharedKey"]["description"],
    }
    assert description["security"] == [{"sharedKey": []}]
    codes = set(description["components"]["schemas"]["ErrorDetail"]["properties"]["code"]["enum"])
    assert codes == set(ERRORS)
    statuses = {
        int(status) for status in description["paths"]["/api/v1/fetch"]["post"]["responses"]
    }
    assert statuses == {200, 400, 401, 404, 413, 422, 500, 502, 503}
    assert {status for status, _reason in ERRORS.values()} <= statuses | {404}


def test_title_version_and_operations() -> None:
    description = stored()
    assert description["info"]["title"] == "pipwerk-fetch"
    assert description["info"]["version"] == contract.CONTRACT_VERSION == "1.0.0"
    identifiers = [
        operation["operationId"]
        for operations in description["paths"].values()
        for operation in operations.values()
    ]
    assert sorted(identifiers) == ["fetch", "health"]


def test_the_command_writes_the_same_text_and_checks_it(tmp_path: Path) -> None:
    target = tmp_path / "below" / "openapi.json"
    assert contract.main([str(target)]) == 0
    assert target.read_text(encoding="utf-8") == CONTRACT_FILE.read_text(encoding="utf-8")
    assert contract.main(["--check", str(target)]) == 0
    target.write_text("{}\n", encoding="utf-8")
    assert contract.main(["--check", str(target)]) == 1
    assert target.read_text(encoding="utf-8") == "{}\n"  # --check writes nothing
    assert contract.main(["--check", str(tmp_path / "missing.json")]) == 1


def test_the_command_writes_and_checks_the_examples(tmp_path: Path) -> None:
    target = tmp_path / "openapi.json"
    directory = tmp_path / "examples"
    assert contract.main([str(target), "--examples", str(directory)]) == 0
    for name in contract.examples():
        assert (directory / name).read_text(encoding="utf-8") == (EXAMPLES / name).read_text(
            encoding="utf-8"
        )
    assert contract.main(["--check", str(target), "--examples", str(directory)]) == 0
    (directory / "request-candles.json").write_text("{}\n", encoding="utf-8")
    assert contract.main(["--check", str(target), "--examples", str(directory)]) == 1


def test_the_command_runs_as_a_module(tmp_path: Path) -> None:
    target = tmp_path / "openapi.json"
    result = subprocess.run(  # noqa: S603
        [sys.executable, "-I", "-m", "pipwerk_fetch_mt5.contract", str(target)],
        capture_output=True,
        text=True,
        check=False,
        cwd=tmp_path,
        timeout=120,
    )
    assert result.returncode == 0, result.stderr
    assert target.read_text(encoding="utf-8") == CONTRACT_FILE.read_text(encoding="utf-8")
    checked = subprocess.run(  # noqa: S603
        [
            sys.executable,
            "-I",
            "-m",
            "pipwerk_fetch_mt5.contract",
            "--check",
            str(CONTRACT_FILE),
            "--examples",
            str(EXAMPLES),
        ],
        capture_output=True,
        text=True,
        check=False,
        cwd=tmp_path,
        timeout=120,
    )
    assert checked.returncode == 0, checked.stderr


# --- the examples are what the program answers --------------------------------------------------


def example(name: str) -> Any:
    return json.loads((EXAMPLES / name).read_text(encoding="utf-8"))


@pytest.fixture
def example_client() -> TestClient:
    from datetime import UTC, datetime

    app = create_fake_source_app(gateway=FakeGateway(), clock=lambda: contract.EXAMPLE_CLOCK)
    assert datetime(2026, 1, 5, 8, 0, tzinfo=UTC) == contract.EXAMPLE_CLOCK
    return TestClient(app, base_url=LOCAL, headers={"Authorization": f"Bearer {FAKE_SHARED_KEY}"})


@pytest.mark.parametrize("kind", ["candles", "ticks", "instrument"])
def test_the_examples_of_answers_are_what_the_program_answers_over_http(
    example_client: TestClient, kind: str
) -> None:
    response = example_client.post("/api/v1/fetch", json=example(f"request-{kind}.json"))
    assert response.status_code == 200
    assert response.json() == example(f"response-{kind}.json")


def test_the_examples_of_errors_are_what_the_program_answers_over_http(
    example_client: TestClient,
) -> None:
    request = {**example("request-candles.json"), "instrument": "XXXYYY"}
    response = example_client.post("/api/v1/fetch", json=request)
    assert response.status_code == 404
    assert response.json() == example("error-symbol-unknown.json")
    bare = TestClient(example_client.app, base_url=LOCAL)
    response = bare.post("/api/v1/fetch", json=request)
    assert response.status_code == 401
    assert response.json() == example("error-unauthorized.json")


def test_the_examples_of_requests_are_valid_for_the_schema() -> None:
    schemas = stored()["components"]["schemas"]
    for name, schema in (
        ("request-candles.json", schemas["CandlesRequest"]),
        ("request-ticks.json", schemas["TicksRequest"]),
        ("request-instrument.json", schemas["InstrumentRequest"]),
    ):
        body = example(name)
        assert set(body) <= set(schema["properties"]), name
        assert set(schema["required"]) <= set(body), name


# --- the files are the files of the import -------------------------------------------------------

IMPORT_SCHEMAS = CONTRACT_DIRECTORY.parents[2] / "market-data" / "v1"


@pytest.mark.skipif(
    not IMPORT_SCHEMAS.is_dir(),
    reason="contracts/market-data/v1 (order 02) is not in this working directory",
)
@pytest.mark.parametrize(
    ("example_name", "schema_name"),
    [
        ("response-candles.json", "candles.schema.json"),
        ("response-ticks.json", "ticks.schema.json"),
        ("response-instrument.json", "instrument.schema.json"),
    ],
)
def test_the_file_of_every_example_answer_is_valid_for_the_schema_of_the_import(
    example_name: str, schema_name: str
) -> None:
    schema = json.loads((IMPORT_SCHEMAS / schema_name).read_text(encoding="utf-8"))
    document = example(example_name)["file"]
    jsonschema.Draft202012Validator(schema).validate(document)


@pytest.mark.skipif(
    not IMPORT_SCHEMAS.is_dir(),
    reason="contracts/market-data/v1 (order 02) is not in this working directory",
)
def test_the_files_of_the_replica_are_valid_for_the_schema_of_the_import_for_every_time_unit(
    fake_client: TestClient,
) -> None:
    schema = json.loads((IMPORT_SCHEMAS / "candles.schema.json").read_text(encoding="utf-8"))
    validator = jsonschema.Draft202012Validator(schema)
    for time_unit in TIME_UNIT_MINUTES:
        request = {**example("request-candles.json"), "time_unit": time_unit}
        request["end"] = (
            "2026-03-05T00:00:00Z" if TIME_UNIT_MINUTES[time_unit] > 60 else "2026-01-09T00:00:00Z"
        )
        response = fake_client.post("/api/v1/fetch", json=request)
        assert response.status_code == 200, time_unit
        validator.validate(response.json()["file"])
