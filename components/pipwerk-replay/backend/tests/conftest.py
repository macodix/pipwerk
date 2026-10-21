"""Fixtures shared by the tests of the backend."""

from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from pipwerk_replay.app import create_app

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
def database_url(tmp_path: Path) -> str:
    return f"sqlite:///{tmp_path / 'replay.db'}"


@pytest.fixture
def client(database_url: str) -> TestClient:
    return TestClient(create_app(database_url))
