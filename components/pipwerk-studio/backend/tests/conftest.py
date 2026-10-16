"""Fixtures shared by the tests of the public web API."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from pipwerk_studio.app import create_app


@pytest.fixture
def home(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    path = tmp_path / "home"
    monkeypatch.setenv("HOME", str(path))
    return path


@pytest.fixture
def objects(home: Path) -> Path:
    """The default object directory below the temporary home (it does not exist yet)."""
    return home / ".local" / "share" / "pipwerk" / "studio" / "objects"


@pytest.fixture
def client(tmp_path: Path, home: Path) -> TestClient:
    return TestClient(create_app(f"sqlite:///{tmp_path / 'studio.db'}"))
