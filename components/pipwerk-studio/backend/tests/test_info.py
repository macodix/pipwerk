import tomllib
from importlib.metadata import PackageNotFoundError
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from pipwerk_studio import app as app_module
from pipwerk_studio.app import (
    APPLICATION_NAME,
    UNKNOWN_VERSION,
    application_version,
    create_app,
)

PYPROJECT = Path(__file__).resolve().parents[1] / "pyproject.toml"


def make_client() -> TestClient:
    return TestClient(create_app())


def declared_version() -> str:
    with PYPROJECT.open("rb") as handle:
        project = tomllib.load(handle)["project"]
    version = project["version"]
    assert isinstance(version, str)
    return version


def test_info_reports_name_and_version() -> None:
    response = make_client().get("/api/info")

    assert response.status_code == 200
    assert response.json() == {"name": APPLICATION_NAME, "version": declared_version()}


def test_info_version_comes_from_pyproject() -> None:
    assert application_version() == declared_version()


def test_info_response_has_no_additional_fields() -> None:
    body = make_client().get("/api/info").json()

    assert isinstance(body, dict)
    assert sorted(body) == ["name", "version"]


def test_info_rejects_write_methods() -> None:
    response = make_client().post("/api/info")

    assert response.status_code == 405


def test_info_falls_back_without_package_metadata(monkeypatch: pytest.MonkeyPatch) -> None:
    def raise_not_found(name: str) -> str:
        raise PackageNotFoundError(name)

    monkeypatch.setattr(app_module, "version", raise_not_found)

    response = make_client().get("/api/info")

    assert response.status_code == 200
    assert response.json() == {"name": APPLICATION_NAME, "version": UNKNOWN_VERSION}
