"""Tests of the description of the public web API under ``contracts/api/``.

The description is generated from the application and limited to the paths below
``/api/v1/``. The file in the repository equals the generated one; the command that generates
it works and writes the same text.
"""

import json
import subprocess
import sys
from pathlib import Path

from fastapi.testclient import TestClient
from pipwerk_domain.documents import DOCUMENT_MODELS
from web_api_support import CONTRACT_FILE

from pipwerk_studio import contract
from pipwerk_studio.app import create_app
from pipwerk_studio.web_api import ART_OF_KIND

NAME = "pipwerk Studio"


def stored() -> dict[str, object]:
    return json.loads(CONTRACT_FILE.read_text(encoding="utf-8"))  # type: ignore[no-any-return]


def test_the_generated_description_equals_the_file_under_contracts() -> None:
    assert CONTRACT_FILE.is_file()
    assert contract.generate() == CONTRACT_FILE.read_text(encoding="utf-8")


def test_the_file_is_what_the_application_describes_below_the_public_prefix(
    tmp_path: Path,
) -> None:
    app = create_app(f"sqlite:///{tmp_path / 'studio.db'}")
    live = TestClient(app).get("/openapi.json").json()
    description = stored()
    paths = description["paths"]
    assert isinstance(paths, dict)
    assert {path for path in live["paths"] if path.startswith("/api/v1/")} == set(paths)
    for path, operations in paths.items():
        assert operations == live["paths"][path], path


def test_the_description_names_the_public_endpoints_of_the_specification() -> None:
    paths = stored()["paths"]
    assert isinstance(paths, dict)
    expected: dict[str, set[str]] = {
        "/api/v1/element-types": {"get"},
        "/api/v1/check": {"post"},
        "/api/v1/expressions": {"post"},
        "/api/v1/keys": {"post"},
    }
    for art in ART_OF_KIND.values():
        expected[f"/api/v1/{art}"] = {"get", "post"}
        expected[f"/api/v1/{art}/{{id}}"] = {"get", "put", "delete"}
        expected[f"/api/v1/{art}/{{id}}/usages"] = {"get"}
    assert {path: set(operations) for path, operations in paths.items()} == expected


def test_the_internal_endpoints_are_not_in_the_file_but_stay_in_docs(tmp_path: Path) -> None:
    description = stored()
    assert all(path.startswith("/api/v1/") for path in description["paths"])  # type: ignore[attr-defined]
    text = CONTRACT_FILE.read_text(encoding="utf-8")
    for internal in (
        "/api/health",
        "/api/studio",
        "StudioLanguage",
        "HealthStatus",
        "ObjectDirectory",
    ):
        assert internal not in text
    live = TestClient(create_app(f"sqlite:///{tmp_path / 'studio.db'}")).get("/openapi.json").json()
    assert "/api/health" in live["paths"]
    assert "/api/studio/settings/language" in live["paths"]
    assert "/api/studio/settings/object-directory" in live["paths"]
    assert "/api/studio/revision" in live["paths"]


def test_only_the_schemas_that_the_public_paths_use_are_in_the_file() -> None:
    description = stored()
    schemas = description["components"]["schemas"]  # type: ignore[index]
    text = json.dumps(description["paths"])
    for name in schemas:
        reachable = f"#/components/schemas/{name}" in text or any(
            f"#/components/schemas/{name}" in json.dumps(other) for other in schemas.values()
        )
        assert reachable, name
    for model in DOCUMENT_MODELS.values():
        assert model.__name__ in schemas
    assert "ElementTypesResponse" in schemas
    assert "CheckResponse" in schemas
    for name in (
        "ExpressionsRequest",
        "ExpressionsResponse",
        "BlockModel",
        "KeyRequest",
        "KeyResponse",
    ):
        assert name in schemas, name


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
    assert found > 50


def test_the_operation_identifiers_are_unique() -> None:
    paths = stored()["paths"]
    identifiers = [
        operation["operationId"]
        for operations in paths.values()  # type: ignore[attr-defined]
        for operation in operations.values()
    ]
    assert len(identifiers) == len(set(identifiers)) == 4 + 5 * 6


def test_title_and_texts_spell_the_name() -> None:
    description = stored()
    assert description["info"]["title"] == NAME  # type: ignore[index]
    assert description["info"]["version"] == contract.CONTRACT_VERSION  # type: ignore[index]
    assert NAME in description["info"]["description"]  # type: ignore[index]


def test_each_document_has_the_schema_of_its_model() -> None:
    schemas = stored()["components"]["schemas"]  # type: ignore[index]
    for model in DOCUMENT_MODELS.values():
        assert schemas[model.__name__]["properties"]["format"]["const"].startswith("pipwerk.")
        assert schemas[model.__name__]["additionalProperties"] is False


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
        [sys.executable, "-I", "-m", "pipwerk_studio.contract", str(target)],
        capture_output=True,
        text=True,
        check=False,
        cwd=tmp_path,
        timeout=120,
    )
    assert result.returncode == 0, result.stderr
    assert target.read_text(encoding="utf-8") == CONTRACT_FILE.read_text(encoding="utf-8")
    checked = subprocess.run(  # noqa: S603
        [sys.executable, "-I", "-m", "pipwerk_studio.contract", "--check", str(CONTRACT_FILE)],
        capture_output=True,
        text=True,
        check=False,
        cwd=tmp_path,
        timeout=120,
    )
    assert checked.returncode == 0, checked.stderr
