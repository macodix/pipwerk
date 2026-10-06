"""Tests for the Studio language settings endpoints (req-ui-008).

Covers: default German when nothing is stored yet, reading and writing
German/English, rejection of invalid language values and unknown fields, wrong methods (405),
an invalid stored value (HTTP 503, repaired by a valid write),
persistence across real backend process restarts, and independence between
separate database files.
"""

import json
import socket
import subprocess
import sys
import time
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from typing import cast
from urllib.error import URLError
from urllib.request import Request, urlopen

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from pipwerk_studio.app import create_app
from pipwerk_studio.storage import (
    SETTINGS_SINGLETON_ID,
    StudioSettingsRecord,
    create_studio_engine,
)


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
            "pipwerk_studio.cli",
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
    deadline = time.monotonic() + 10
    try:
        while time.monotonic() < deadline:
            if process.poll() is not None:
                raise RuntimeError("Pipwerk Studio backend exited during startup")
            try:
                with urlopen(f"{base_url}/api/health", timeout=0.2) as response:  # noqa: S310
                    if response.status == 200:
                        break
            except URLError, TimeoutError:
                time.sleep(0.05)
        else:
            raise RuntimeError("Pipwerk Studio backend did not become ready")
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
        url,
        data=data,
        method=method,
        headers={"Content-Type": "application/json"},
    )
    with urlopen(request, timeout=2) as response:  # noqa: S310 - loopback component test URL
        return cast(dict[str, str], json.loads(response.read()))


def test_default_language_is_german_when_nothing_stored(tmp_path: Path) -> None:
    db_url = f"sqlite:///{tmp_path / 'studio.db'}"
    client = make_client(db_url)

    response = client.get("/api/studio/settings/language")

    assert response.status_code == 200
    assert response.json() == {"language": "de"}


def test_can_set_and_read_english(tmp_path: Path) -> None:
    db_url = f"sqlite:///{tmp_path / 'studio.db'}"
    client = make_client(db_url)

    put_response = client.put("/api/studio/settings/language", json={"language": "en"})
    assert put_response.status_code == 200
    assert put_response.json() == {"language": "en"}

    get_response = client.get("/api/studio/settings/language")
    assert get_response.status_code == 200
    assert get_response.json() == {"language": "en"}


def test_can_switch_back_to_german(tmp_path: Path) -> None:
    db_url = f"sqlite:///{tmp_path / 'studio.db'}"
    client = make_client(db_url)

    client.put("/api/studio/settings/language", json={"language": "en"})
    put_response = client.put("/api/studio/settings/language", json={"language": "de"})
    assert put_response.status_code == 200
    assert put_response.json() == {"language": "de"}

    get_response = client.get("/api/studio/settings/language")
    assert get_response.json() == {"language": "de"}


def test_rejects_unsupported_language(tmp_path: Path) -> None:
    db_url = f"sqlite:///{tmp_path / 'studio.db'}"
    client = make_client(db_url)

    response = client.put("/api/studio/settings/language", json={"language": "fr"})

    assert response.status_code == 422


def test_rejects_unknown_fields(tmp_path: Path) -> None:
    db_url = f"sqlite:///{tmp_path / 'studio.db'}"
    client = make_client(db_url)

    response = client.put(
        "/api/studio/settings/language",
        json={"language": "en", "unexpected": "value"},
    )

    assert response.status_code == 422


def test_rejects_wrong_value_type_and_non_json_body(tmp_path: Path) -> None:
    client = make_client(f"sqlite:///{tmp_path / 'studio.db'}")

    wrong_type = client.put("/api/studio/settings/language", json={"language": 1})
    missing_field = client.put("/api/studio/settings/language", json={})
    not_json = client.put(
        "/api/studio/settings/language",
        content="de",
        headers={"Content-Type": "application/json"},
    )

    assert wrong_type.status_code == 422
    assert missing_field.status_code == 422
    assert not_json.status_code == 422
    assert client.get("/api/studio/settings/language").json() == {"language": "de"}


def test_other_methods_are_rejected_with_405(tmp_path: Path) -> None:
    client = make_client(f"sqlite:///{tmp_path / 'studio.db'}")

    assert client.post("/api/studio/settings/language", json={"language": "en"}).status_code == 405
    assert client.delete("/api/studio/settings/language").status_code == 405
    assert client.post("/api/health").status_code == 405
    assert client.put("/api/health", json={"status": "ok"}).status_code == 405
    assert client.get("/api/studio/settings/language").json() == {"language": "de"}


def store_raw_language(database_url: str, value: str) -> None:
    engine = create_studio_engine(database_url)
    with Session(engine) as session:
        session.add(StudioSettingsRecord(id=SETTINGS_SINGLETON_ID, language=value))
        session.commit()
    engine.dispose()


def test_invalid_stored_value_is_reported_as_503_not_500(tmp_path: Path) -> None:
    db_url = f"sqlite:///{tmp_path / 'studio.db'}"
    store_raw_language(db_url, "fr")
    client = make_client(db_url)

    response = client.get("/api/studio/settings/language")

    assert response.status_code == 503
    assert response.json() == {"detail": "The stored Studio language is invalid."}


def test_writing_a_valid_language_repairs_an_invalid_stored_value(tmp_path: Path) -> None:
    db_url = f"sqlite:///{tmp_path / 'studio.db'}"
    store_raw_language(db_url, "fr")
    client = make_client(db_url)

    put_response = client.put("/api/studio/settings/language", json={"language": "en"})

    assert put_response.status_code == 200
    assert client.get("/api/studio/settings/language").json() == {"language": "en"}


def test_language_persists_across_real_backend_process_restarts(tmp_path: Path) -> None:
    config_path = tmp_path / "pipwerk-studio.ini"
    config_path.write_text(
        f"[database]\nurl = sqlite:///{tmp_path / 'studio.db'}\n",
        encoding="utf-8",
    )
    port = find_free_port()

    with running_backend(config_path, port) as base_url:
        assert request_json(
            f"{base_url}/api/studio/settings/language",
            "PUT",
            {"language": "en"},
        ) == {"language": "en"}

    with running_backend(config_path, port) as base_url:
        assert request_json(f"{base_url}/api/studio/settings/language") == {"language": "en"}
        assert request_json(
            f"{base_url}/api/studio/settings/language",
            "PUT",
            {"language": "de"},
        ) == {"language": "de"}

    with running_backend(config_path, port) as base_url:
        assert request_json(f"{base_url}/api/studio/settings/language") == {"language": "de"}


def test_separate_databases_do_not_share_language(tmp_path: Path) -> None:
    first_db_url = f"sqlite:///{tmp_path / 'studio-a.db'}"
    second_db_url = f"sqlite:///{tmp_path / 'studio-b.db'}"

    first_client = make_client(first_db_url)
    first_client.put("/api/studio/settings/language", json={"language": "en"})

    second_client = make_client(second_db_url)
    response = second_client.get("/api/studio/settings/language")

    assert response.json() == {"language": "de"}
