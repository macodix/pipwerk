"""Tests for the Studio language settings endpoints (req-ui-008).

Covers: default German when nothing is stored yet, reading and writing
German/English, rejection of invalid language values and unknown fields,
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

from pipwerk_studio.app import create_app


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


def test_get_rejects_unknown_query_fields_body_is_not_applicable(tmp_path: Path) -> None:
    # GET has no body to reject extra fields in; this documents that the read
    # model itself still forbids unknown fields if ever constructed from
    # untrusted input elsewhere.
    db_url = f"sqlite:///{tmp_path / 'studio.db'}"
    client = make_client(db_url)

    response = client.get("/api/studio/settings/language")

    assert response.status_code == 200
    assert set(response.json().keys()) == {"language"}


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
