"""Tests of the description of the web API under ``contracts/api/``.

The description is generated from the application and limited to the paths below
``/api/v1/``. The file in the repository equals the generated one; the command that generates
it works and writes the same text. A deviation between backend and file fails the first test.
"""

import json
import subprocess
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from pipwerk_replay import contract
from pipwerk_replay.app import create_app

REPOSITORY = Path(__file__).resolve().parents[4]
CONTRACT_FILE = REPOSITORY / "contracts" / "api" / "pipwerk-replay" / "v1" / "openapi.json"
COMMAND = (
    "uv run --frozen python -m pipwerk_replay.contract "
    "../../../contracts/api/pipwerk-replay/v1/openapi.json"
)
NAME = "pipwerk replay"


def stored() -> dict[str, object]:
    return json.loads(CONTRACT_FILE.read_text(encoding="utf-8"))  # type: ignore[no-any-return]


def test_the_generated_description_equals_the_file_under_contracts() -> None:
    assert CONTRACT_FILE.is_file()
    assert contract.generate() == CONTRACT_FILE.read_text(encoding="utf-8"), (
        f"openapi.json is out of date; generate it again with: {COMMAND}"
    )


def test_a_change_of_the_file_is_found_by_the_check(tmp_path: Path) -> None:
    changed = tmp_path / "openapi.json"
    changed.write_text(
        CONTRACT_FILE.read_text(encoding="utf-8").replace("Create a test account", "Make one"),
        encoding="utf-8",
    )
    assert changed.read_text(encoding="utf-8") != CONTRACT_FILE.read_text(encoding="utf-8")

    assert contract.main(["--check", str(changed)]) == 1


def test_a_change_of_the_backend_is_found_by_the_comparison(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A change of the code that reaches the description makes it differ from the file."""
    monkeypatch.setattr(contract, "CONTRACT_VERSION", "9.9.9")

    assert contract.generate() != CONTRACT_FILE.read_text(encoding="utf-8")


def test_the_file_is_what_the_application_describes_below_the_public_prefix(
    database_url: str,
) -> None:
    live = TestClient(create_app(database_url)).get("/openapi.json").json()
    paths = stored()["paths"]
    assert isinstance(paths, dict)
    assert {path for path in live["paths"] if path.startswith("/api/v1/")} == set(paths)
    for path, operations in paths.items():
        assert operations == live["paths"][path], path


def test_the_description_names_the_endpoints_of_this_order() -> None:
    paths = stored()["paths"]
    assert isinstance(paths, dict)
    assert {path: set(operations) for path, operations in paths.items()} == {
        "/api/v1/accounts": {"get", "post"},
        "/api/v1/accounts/{id}": {"get", "put", "delete"},
        "/api/v1/market-data/series": {"get"},
        "/api/v1/market-data/series/details": {"get"},
        "/api/v1/market-data/brokers": {"get"},
        "/api/v1/market-data/instrument": {"get"},
        "/api/v1/market-data/imports": {"post"},
        "/api/v1/market-data/imports/preview": {"post"},
        "/api/v1/market-data/completeness": {"post"},
    }
    assert "/api/v1/settings" not in paths
    # no acquisition, no overview and no import of a single file any more
    assert not [path for path in paths if "acquisition" in path or "overview" in path]
    assert "/api/v1/market-data/imports/json" not in paths
    assert "/api/v1/market-data/imports/csv" not in paths


def test_the_technical_endpoint_is_not_in_the_file_but_stays_in_docs(database_url: str) -> None:
    description = stored()
    assert "/api/health" not in description["paths"]  # type: ignore[operator]
    assert "HealthStatus" not in description["components"]["schemas"]  # type: ignore[index]
    live = TestClient(create_app(database_url)).get("/openapi.json").json()
    assert "/api/health" in live["paths"]


def test_only_the_schemas_that_the_public_paths_use_are_in_the_file() -> None:
    description = stored()
    schemas = description["components"]["schemas"]  # type: ignore[index]
    text = json.dumps(description["paths"])
    for name in schemas:
        reachable = f"#/components/schemas/{name}" in text or any(
            f"#/components/schemas/{name}" in json.dumps(other) for other in schemas.values()
        )
        assert reachable, name
    assert {
        "Account",
        "AccountList",
        "ApiError",
        "InvalidRequest",
        "SeriesPage",
        "SeriesDetails",
        "Brokers",
        "ImportOutcome",
        "ImportPreview",
        "ImportRefused",
        "ImportResult",
        "Completeness",
    } <= set(schemas)
    assert not {"Overview", "FileRefused", "Acquisition", "AcquisitionRefused"} & set(schemas)
    # the internal endpoints have no place in the description
    assert not {
        "Settings",
        "ReplayLanguage",
        "DefaultSource",
        "ReplayBrokerForTestRuns",
        "ReplayRevision",
    } & set(schemas)


def test_every_reference_is_resolved() -> None:
    description = stored()
    schemas = description["components"]["schemas"]  # type: ignore[index]
    text = json.dumps(description)
    marker = "#/components/schemas/"
    position = 0
    found = 0
    while (position := text.find(marker, position)) != -1:
        name = text[position + len(marker) :].split('"', 1)[0]
        assert name in schemas, name
        position += len(marker)
        found += 1
    assert found > 5


def test_the_operation_identifiers_are_unique() -> None:
    paths = stored()["paths"]
    identifiers = [
        operation["operationId"]
        for operations in paths.values()  # type: ignore[attr-defined]
        for operation in operations.values()
    ]
    assert len(identifiers) == len(set(identifiers)) == 12  # 5 of the test accounts, 7 of the data


def test_the_request_bodies_are_described_with_the_strict_schemas() -> None:
    paths = stored()["paths"]
    body = paths["/api/v1/accounts"]["post"]["requestBody"]  # type: ignore[index]
    schema = body["content"]["application/json"]["schema"]
    assert schema["additionalProperties"] is False
    assert set(schema["required"]) == {
        "name",
        "initial_capital",
        "currency",
        "leverage",
        "spread_mode",
        "spread_points",
        "commission_per_lot_side",
    }
    assert "id" not in schema["properties"]
    put = paths["/api/v1/accounts/{id}"]["put"]["requestBody"]  # type: ignore[index]
    assert put["content"] == body["content"]


def test_title_and_texts_spell_the_name() -> None:
    description = stored()
    assert description["info"]["title"] == NAME  # type: ignore[index]
    assert description["info"]["version"] == contract.CONTRACT_VERSION  # type: ignore[index]
    assert NAME in description["info"]["description"]  # type: ignore[index]
    assert "Studio" not in CONTRACT_FILE.read_text(encoding="utf-8")


def test_the_command_writes_the_same_text_and_checks_it(tmp_path: Path) -> None:
    target = tmp_path / "below" / "openapi.json"
    assert contract.main([str(target)]) == 0
    assert target.read_text(encoding="utf-8") == CONTRACT_FILE.read_text(encoding="utf-8")
    assert contract.main(["--check", str(target)]) == 0
    target.write_text("{}\n", encoding="utf-8")
    assert contract.main(["--check", str(target)]) == 1
    assert target.read_text(encoding="utf-8") == "{}\n"  # --check writes nothing
    assert contract.main(["--check", str(tmp_path / "missing.json")]) == 1


def test_the_command_runs_as_a_module(tmp_path: Path) -> None:
    target = tmp_path / "openapi.json"
    result = subprocess.run(  # noqa: S603
        [sys.executable, "-I", "-m", "pipwerk_replay.contract", str(target)],
        capture_output=True,
        text=True,
        check=False,
        cwd=tmp_path,
        timeout=120,
    )
    assert result.returncode == 0, result.stderr
    assert target.read_text(encoding="utf-8") == CONTRACT_FILE.read_text(encoding="utf-8")
    checked = subprocess.run(  # noqa: S603
        [sys.executable, "-I", "-m", "pipwerk_replay.contract", "--check", str(CONTRACT_FILE)],
        capture_output=True,
        text=True,
        check=False,
        cwd=tmp_path,
        timeout=120,
    )
    assert checked.returncode == 0, checked.stderr
