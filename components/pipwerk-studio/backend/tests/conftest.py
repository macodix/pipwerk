"""Fixtures shared by the tests of the backend."""

from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from pipwerk_studio.app import create_app

LOCAL_BASE_URL = "http://127.0.0.1"


@pytest.fixture(autouse=True)
def _address_the_backend_as_127_0_0_1(monkeypatch: pytest.MonkeyPatch) -> None:
    """The test client sends the header ``Host: testserver`` by default. The backend allows
    only the names on its list (``host_check.py``), so the tests address it as
    ``127.0.0.1``, as a user does. Tests of the check give ``base_url`` or the header."""
    original = TestClient.__init__

    def init(self: TestClient, app: Any, *args: Any, **kwargs: Any) -> None:
        if not args:
            kwargs.setdefault("base_url", LOCAL_BASE_URL)
        original(self, app, *args, **kwargs)

    monkeypatch.setattr(TestClient, "__init__", init)


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
