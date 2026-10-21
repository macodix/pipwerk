"""Tests of the setting of the language (req-ui-008) on ``/api/replay/settings/language``.

Covers: default German when nothing is stored yet, reading and writing German and English,
rejection of invalid language values, unknown fields and bodies that are no JSON object,
wrong methods (405), an invalid stored value (HTTP 503, repaired by a valid write),
persistence across real backend process restarts, and independence between separate
database files.
"""

import json
import socket
import sqlite3
import subprocess
import sys
import time
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from typing import cast
from urllib.error import URLError
from urllib.request import Request, urlopen

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from pipwerk_replay.app import create_app
from pipwerk_replay.settings_service import SettingsService, StoredLanguageInvalidError
from pipwerk_replay.storage import (
    SETTINGS_SINGLETON_ID,
    SettingsRecord,
    create_replay_engine,
    create_session_factory,
)

JSON = {"content-type": "application/json"}
URL = "/api/replay/settings/language"


def make_client(database_url: str) -> TestClient:
    return TestClient(create_app(database_url))


def find_free_port() -> int:
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        return int(listener.getsockname()[1])


@contextmanager
def running_backend(config_path: Path, port: int) -> Iterator[str]:
    process = subprocess.Popen(  # noqa: S603 - fixed interpreter and module
        [
            sys.executable,
            "-m",
            "pipwerk_replay.cli",
            "-c",
            str(config_path),
            "--host",
            "127.0.0.1",
            "--port",
            str(port),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    base_url = f"http://127.0.0.1:{port}"
    deadline = time.monotonic() + 15
    try:
        while time.monotonic() < deadline:
            if process.poll() is not None:
                raise RuntimeError("pipwerk replay backend exited during startup")
            try:
                with urlopen(f"{base_url}/api/health", timeout=0.2) as response:  # noqa: S310
                    if response.status == 200:
                        break
            except URLError, TimeoutError:
                time.sleep(0.05)
        else:
            raise RuntimeError("pipwerk replay backend did not become ready")
        yield base_url
    finally:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=5)


def request_json(
    url: str, method: str = "GET", body: dict[str, str] | None = None
) -> dict[str, str]:
    data = json.dumps(body).encode() if body is not None else None
    request = Request(  # noqa: S310 - loopback component test URL
        url, data=data, method=method, headers={"Content-Type": "application/json"}
    )
    with urlopen(request, timeout=2) as response:  # noqa: S310 - loopback component test URL
        return cast(dict[str, str], json.loads(response.read()))


def test_default_language_is_german_when_nothing_stored(client: TestClient) -> None:
    response = client.get(URL)

    assert response.status_code == 200
    assert response.json() == {"language": "de"}


def test_can_set_and_read_english_and_switch_back(client: TestClient) -> None:
    written = client.put(URL, json={"language": "en"})
    assert written.status_code == 200
    assert written.json() == {"language": "en"}
    assert client.get(URL).json() == {"language": "en"}

    back = client.put(URL, json={"language": "de"})
    assert back.status_code == 200
    assert client.get(URL).json() == {"language": "de"}


@pytest.mark.parametrize(
    "body",
    [
        {"language": "fr"},
        {"language": ""},
        {"language": "DE"},
        {"language": "de "},
        {"language": None},
        {"language": 1},
        {"language": ["de"]},
        {},
        {"language": "de", "other": 1},
        {"lang": "de"},
    ],
)
def test_an_invalid_body_is_422_and_changes_nothing(client: TestClient, body: object) -> None:
    client.put(URL, json={"language": "en"})

    response = client.put(URL, json=body)

    assert response.status_code == 422
    assert response.json()["detail"] == "The request body does not fit the schema."
    assert isinstance(response.json()["errors"], list)
    assert client.get(URL).json() == {"language": "en"}


@pytest.mark.parametrize(
    "content",
    [b"", b"not json", b"[]", b'"de"', b"null", b"1", b'{"language": "de"} x', b"\xff"],
)
def test_a_body_that_is_no_json_object_is_422(client: TestClient, content: bytes) -> None:
    response = client.put(URL, content=content, headers=JSON)

    assert response.status_code == 422
    assert response.json()["detail"] == "The request body does not fit the schema."


def test_a_duplicate_key_and_nan_are_422_and_the_value_is_not_repeated(
    client: TestClient,
) -> None:
    duplicate = client.put(URL, content=b'{"language": "de", "language": "en"}', headers=JSON)
    constant = client.put(URL, content=b'{"language": NaN}', headers=JSON)
    secret = client.put(URL, json={"language": "secret-value"})

    assert duplicate.status_code == 422
    assert duplicate.json()["errors"] == [{"location": [], "type": "json_invalid"}]
    assert constant.status_code == 422
    assert secret.status_code == 422
    assert "secret-value" not in secret.text
    assert client.get(URL).json() == {"language": "de"}


def test_the_media_type_must_be_json(client: TestClient) -> None:
    for headers in (
        {},
        {"content-type": "text/plain"},
        {"content-type": "application/x-www-form-urlencoded"},
    ):
        response = client.put(URL, content=b'{"language": "en"}', headers=headers)
        assert response.status_code == 415, headers
        assert response.json() == {
            "detail": "The request body must be JSON (Content-Type: application/json)."
        }
    ok = client.put(
        URL,
        content=b'{"language": "en"}',
        headers={"content-type": "Application/JSON; charset=utf-8"},
    )
    assert ok.status_code == 200


def test_other_methods_are_405(client: TestClient) -> None:
    assert client.post(URL, json={"language": "en"}).status_code == 405
    assert client.delete(URL).status_code == 405
    assert client.patch(URL, json={"language": "en"}).status_code == 405


def test_the_setting_is_no_part_of_the_public_web_api(client: TestClient) -> None:
    for method in ("get", "put"):
        response = client.request(method, "/api/v1/settings", json={"language": "en"})
        assert response.status_code == 404, method
    assert "/api/v1/settings" not in client.get("/openapi.json").json()["paths"]


def test_an_invalid_stored_value_is_503_and_a_valid_write_repairs_it(
    tmp_path: Path, database_url: str
) -> None:
    client = make_client(database_url)
    client.put(URL, json={"language": "en"})
    with sqlite3.connect(tmp_path / "replay.db") as connection:
        connection.execute("UPDATE replay_settings SET language = 'xx'")

    response = client.get(URL)

    assert response.status_code == 503
    assert response.json() == {"detail": "The stored pipwerk replay language is invalid."}
    assert client.put(URL, json={"language": "de"}).status_code == 200
    assert client.get(URL).json() == {"language": "de"}


def test_the_service_raises_for_an_invalid_stored_value(database_url: str) -> None:
    engine = create_replay_engine(database_url)
    factory = create_session_factory(engine)
    with factory() as session:
        session.add(SettingsRecord(id=SETTINGS_SINGLETON_ID, language="xx"))
        session.commit()

    with pytest.raises(StoredLanguageInvalidError):
        SettingsService(factory).get_language()


def test_at_most_one_row_is_kept(tmp_path: Path, database_url: str) -> None:
    client = make_client(database_url)

    for language in ("en", "de", "en"):
        client.put(URL, json={"language": language})

    with Session(create_replay_engine(database_url)) as session:
        rows = session.query(SettingsRecord).all()
    assert [(row.id, row.language) for row in rows] == [(SETTINGS_SINGLETON_ID, "en")]


def test_the_language_survives_a_new_application_on_the_same_database(database_url: str) -> None:
    make_client(database_url).put(URL, json={"language": "en"})

    assert make_client(database_url).get(URL).json() == {"language": "en"}


def test_separate_databases_are_independent(tmp_path: Path) -> None:
    first = make_client(f"sqlite:///{tmp_path / 'first.db'}")
    second = make_client(f"sqlite:///{tmp_path / 'second.db'}")

    first.put(URL, json={"language": "en"})

    assert first.get(URL).json() == {"language": "en"}
    assert second.get(URL).json() == {"language": "de"}


def test_the_language_survives_a_restart_of_the_backend_process(tmp_path: Path) -> None:
    config_path = tmp_path / "pipwerk-replay.ini"
    config_path.write_text(
        f"[database]\nurl = sqlite:///{tmp_path / 'replay.db'}\n", encoding="utf-8"
    )

    with running_backend(config_path, find_free_port()) as base_url:
        assert request_json(f"{base_url}{URL}") == {"language": "de"}
        assert request_json(f"{base_url}{URL}", "PUT", {"language": "en"}) == {"language": "en"}

    with running_backend(config_path, find_free_port()) as base_url:
        assert request_json(f"{base_url}{URL}") == {"language": "en"}
