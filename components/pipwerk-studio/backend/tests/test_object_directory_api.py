"""Tests for the internal endpoints of the setting "object directory".

Covered: ``GET`` and ``PUT /api/studio/settings/object-directory`` with success
and error cases: invalid body, additional fields, wrong types, relative paths
(HTTP 422), conflict (HTTP 409), failed moving with bringing back (HTTP 500) and
a failure of bringing back with both directories and the files in the answer;
error texts are fixed and name no exception text; other methods are rejected;
the existing endpoints behave as before.
"""

import sqlite3
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from pipwerk_studio import object_store
from pipwerk_studio.app import create_app

ENDPOINT = "/api/studio/settings/object-directory"
FIRST_ID = "11111111-1111-4111-8111-111111111111"
SECOND_ID = "22222222-2222-4222-8222-222222222222"
THIRD_ID = "33333333-3333-4333-8333-333333333333"
NAMES = [f"{FIRST_ID}.strategy.json", f"{SECOND_ID}.indicator.json", f"{THIRD_ID}.rule.json"]


@pytest.fixture
def home(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    path = tmp_path / "home"
    monkeypatch.setenv("HOME", str(path))
    return path


@pytest.fixture
def default_directory(home: Path) -> Path:
    return home / ".local" / "share" / "pipwerk" / "studio" / "objects"


@pytest.fixture
def client(tmp_path: Path, home: Path) -> TestClient:
    return TestClient(create_app(f"sqlite:///{tmp_path / 'studio.db'}"))


def put_files(directory: Path) -> None:
    directory.mkdir(parents=True, exist_ok=True)
    for name in NAMES:
        (directory / name).write_text(f"content of {name}", encoding="utf-8")


def names_in(directory: Path) -> list[str]:
    return sorted(item.name for item in directory.iterdir()) if directory.exists() else []


# --- reading ---------------------------------------------------------------------


def test_get_returns_the_default_and_that_it_is_the_default(
    client: TestClient, default_directory: Path
) -> None:
    response = client.get(ENDPOINT)

    assert response.status_code == 200
    assert response.json() == {"path": str(default_directory), "is_default": True}


def test_get_returns_null_if_the_directory_is_not_set(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("HOME", raising=False)
    client = TestClient(create_app(f"sqlite:///{tmp_path / 'studio.db'}"))

    response = client.get(ENDPOINT)

    assert response.status_code == 200
    assert response.json() == {"path": None, "is_default": True}


def test_get_returns_the_stored_path(client: TestClient, tmp_path: Path) -> None:
    client.put(ENDPOINT, json={"path": str(tmp_path / "chosen"), "move": False})

    response = client.get(ENDPOINT)

    assert response.status_code == 200
    assert response.json() == {"path": str(tmp_path / "chosen"), "is_default": False}


def test_get_reports_a_stored_value_that_is_not_absolute_with_503(
    client: TestClient, tmp_path: Path
) -> None:
    client.put("/api/studio/settings/language", json={"language": "en"})
    with sqlite3.connect(tmp_path / "studio.db") as connection:
        connection.execute("UPDATE studio_settings SET object_directory = 'relative/secret'")

    response = client.get(ENDPOINT)

    assert response.status_code == 503
    assert response.json() == {
        "detail": "The stored pipwerk Studio object directory is invalid.",
        "code": "object_directory.stored_invalid",
        "params": {},
    }
    assert (
        client.put(ENDPOINT, json={"path": str(tmp_path / "ok"), "move": False}).status_code == 200
    )
    assert client.get(ENDPOINT).json() == {"path": str(tmp_path / "ok"), "is_default": False}


# --- writing: success ----------------------------------------------------------------


def test_put_without_moving_only_saves_the_setting(
    client: TestClient, default_directory: Path, tmp_path: Path
) -> None:
    put_files(default_directory)
    new = tmp_path / "new"

    response = client.put(ENDPOINT, json={"path": str(new), "move": False})

    assert response.status_code == 200
    assert response.json() == {"path": str(new), "is_default": False}
    assert names_in(default_directory) == sorted(NAMES)
    assert not new.exists()


def test_put_with_moving_moves_the_files_and_saves_the_setting(
    client: TestClient, default_directory: Path, tmp_path: Path
) -> None:
    put_files(default_directory)
    new = tmp_path / "new" / "objects"

    response = client.put(ENDPOINT, json={"path": str(new), "move": True})

    assert response.status_code == 200
    assert response.json() == {"path": str(new), "is_default": False}
    assert names_in(new) == sorted(NAMES)
    assert names_in(default_directory) == []
    assert client.get(ENDPOINT).json() == {"path": str(new), "is_default": False}


def test_put_with_moving_moves_the_files_of_the_stored_directory(
    client: TestClient, tmp_path: Path
) -> None:
    first, second = tmp_path / "first", tmp_path / "second"
    client.put(ENDPOINT, json={"path": str(first), "move": False})
    put_files(first)

    response = client.put(ENDPOINT, json={"path": str(second), "move": True})

    assert response.status_code == 200
    assert names_in(second) == sorted(NAMES)
    assert names_in(first) == []


def test_put_persists_across_a_new_application(client: TestClient, tmp_path: Path) -> None:
    client.put(ENDPOINT, json={"path": str(tmp_path / "chosen"), "move": False})

    again = TestClient(create_app(f"sqlite:///{tmp_path / 'studio.db'}"))

    assert again.get(ENDPOINT).json() == {"path": str(tmp_path / "chosen"), "is_default": False}


# --- writing: invalid input (422) ----------------------------------------------------------


@pytest.mark.parametrize(
    "path",
    ["relative/secret-path", "secret-path", "./secret-path", "", "~/secret-path", "/a\x00secret"],
)
def test_put_rejects_a_path_that_is_not_absolute_with_a_fixed_text(
    client: TestClient, default_directory: Path, path: str
) -> None:
    put_files(default_directory)

    response = client.put(ENDPOINT, json={"path": path, "move": True})

    assert response.status_code == 422
    assert response.json() == {
        "detail": "The object directory must be an absolute path.",
        "code": "object_directory.not_absolute",
        "params": {},
    }
    assert "secret" not in response.text
    assert names_in(default_directory) == sorted(NAMES)
    assert client.get(ENDPOINT).json()["is_default"] is True


@pytest.mark.parametrize(
    "body",
    [
        {},
        {"path": "/absolute/path"},
        {"move": True},
        {"path": "/absolute/path", "move": True, "extra": "secret-field"},
        {"path": "/absolute/path", "move": "true"},
        {"path": "/absolute/path", "move": 1},
        {"path": "/absolute/path", "move": None},
        {"path": 5, "move": True},
        {"path": None, "move": True},
        {"path": ["/absolute/path"], "move": True},
        {"path": "/" + "a" * 5000, "move": True},
        [],
        "secret-text",
        None,
    ],
)
def test_put_rejects_an_invalid_body_with_a_fixed_text(client: TestClient, body: object) -> None:
    response = client.put(ENDPOINT, json=body)

    assert response.status_code == 422
    assert response.json() == {
        "detail": (
            "The request body must be a JSON object with the fields path (text) and move "
            "(true or false)."
        ),
        "code": "object_directory.invalid_body",
        "params": {},
    }
    assert "secret" not in response.text
    assert client.get(ENDPOINT).json()["is_default"] is True


def test_put_rejects_a_body_that_is_not_json_and_a_missing_body(client: TestClient) -> None:
    not_json = client.put(ENDPOINT, content="secret", headers={"Content-Type": "application/json"})
    missing = client.put(ENDPOINT)

    assert not_json.status_code == 422
    assert "secret" not in not_json.text
    assert missing.status_code == 422


def test_other_methods_are_rejected_with_405(client: TestClient) -> None:
    assert client.post(ENDPOINT, json={"path": "/absolute/path", "move": False}).status_code == 405
    assert client.delete(ENDPOINT).status_code == 405
    assert client.patch(ENDPOINT, json={}).status_code == 405
    assert client.get(ENDPOINT).json()["is_default"] is True


# --- writing: conflict and failures ------------------------------------------------------------


def test_put_rejects_a_conflict_with_409_and_moves_nothing(
    client: TestClient, default_directory: Path, tmp_path: Path
) -> None:
    put_files(default_directory)
    new = tmp_path / "new"
    new.mkdir()
    (new / NAMES[1]).write_text("existing content", encoding="utf-8")

    response = client.put(ENDPOINT, json={"path": str(new), "move": True})

    assert response.status_code == 409
    assert response.json() == {
        "detail": (
            "The new object directory already contains files with the same names. "
            "Nothing was moved."
        ),
        "code": "object_directory.conflict",
        "params": {},
    }
    assert str(new) not in response.text
    assert names_in(default_directory) == sorted(NAMES)
    assert names_in(new) == [NAMES[1]]
    assert (new / NAMES[1]).read_text(encoding="utf-8") == "existing content"
    assert client.get(ENDPOINT).json()["is_default"] is True


def test_put_reports_a_failed_move_with_500_after_bringing_the_files_back(
    client: TestClient,
    default_directory: Path,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    put_files(default_directory)
    real = object_store._move_file
    calls = {"count": 0}

    def move(source: Path, target: Path) -> None:
        calls["count"] += 1
        if calls["count"] == 2:
            raise OSError("disk exploded at /secret/place")
        real(source, target)

    monkeypatch.setattr(object_store, "_move_file", move)
    new = tmp_path / "new"

    response = client.put(ENDPOINT, json={"path": str(new), "move": True})

    assert response.status_code == 500
    assert response.json() == {
        "detail": (
            "Moving the object files failed. The files were brought back and the object "
            "directory is unchanged."
        ),
        "code": "object_directory.move_failed",
        "params": {},
    }
    assert "secret" not in response.text
    assert "exploded" not in response.text
    assert names_in(default_directory) == sorted(NAMES)
    assert names_in(new) == []
    assert client.get(ENDPOINT).json() == {"path": str(default_directory), "is_default": True}


def test_put_names_both_directories_and_the_files_if_bringing_back_fails(
    client: TestClient,
    default_directory: Path,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    put_files(default_directory)
    real = object_store._move_file
    new = tmp_path / "new"
    sorted_names = sorted(NAMES)

    def move(source: Path, target: Path) -> None:
        forward = source.parent == default_directory
        if (forward and source.name == sorted_names[2]) or (
            not forward and source.name == sorted_names[0]
        ):
            raise OSError("disk exploded at /secret/place")
        real(source, target)

    monkeypatch.setattr(object_store, "_move_file", move)

    response = client.put(ENDPOINT, json={"path": str(new), "move": True})

    assert response.status_code == 500
    assert response.json() == {
        "detail": (
            "Moving the object files failed and some files could not be brought back. "
            "The object directory is unchanged."
        ),
        "code": "object_directory.move_not_restored",
        "params": {
            "source_directory": str(default_directory),
            "target_directory": str(new),
            "files": [sorted_names[0]],
        },
        "source_directory": str(default_directory),
        "target_directory": str(new),
        "files": [sorted_names[0]],
    }
    assert "secret" not in response.text
    assert names_in(new) == [sorted_names[0]]
    assert client.get(ENDPOINT).json() == {"path": str(default_directory), "is_default": True}


def test_put_with_moving_rejects_a_stored_value_that_is_not_absolute_with_409(
    client: TestClient, tmp_path: Path
) -> None:
    client.put("/api/studio/settings/language", json={"language": "en"})
    with sqlite3.connect(tmp_path / "studio.db") as connection:
        connection.execute("UPDATE studio_settings SET object_directory = 'relative/secret'")
    new = tmp_path / "new"

    response = client.put(ENDPOINT, json={"path": str(new), "move": True})

    assert response.status_code == 409
    assert response.json() == {
        "detail": (
            "The stored pipwerk Studio object directory is invalid, so no files can be moved. "
            "Save the object directory without moving files to repair it."
        ),
        "code": "object_directory.stored_invalid_no_move",
        "params": {},
    }
    assert "secret" not in response.text
    assert not new.exists()
    assert client.get(ENDPOINT).status_code == 503
    # Saving without moving repairs the setting.
    repaired = client.put(ENDPOINT, json={"path": str(new), "move": False})
    assert repaired.status_code == 200
    assert client.get(ENDPOINT).json() == {"path": str(new), "is_default": False}
    assert client.get("/api/studio/settings/language").json() == {"language": "en"}


def test_put_says_that_the_new_directory_could_not_be_created_and_not_that_files_came_back(
    client: TestClient, default_directory: Path, tmp_path: Path
) -> None:
    put_files(default_directory)
    blocker = tmp_path / "blocker"
    blocker.write_text("a file", encoding="utf-8")

    response = client.put(ENDPOINT, json={"path": str(blocker / "objects"), "move": True})

    assert response.status_code == 500
    assert response.json() == {
        "detail": (
            "The new object directory could not be created. Nothing was moved and the object "
            "directory is unchanged."
        ),
        "code": "object_directory.target_not_creatable",
        "params": {},
    }
    assert "brought back" not in response.text
    assert names_in(default_directory) == sorted(NAMES)
    assert client.get(ENDPOINT).json() == {"path": str(default_directory), "is_default": True}


# --- the contract and the existing endpoints ----------------------------------------------


def test_the_description_lists_both_operations(client: TestClient) -> None:
    operations = client.get("/openapi.json").json()["paths"][ENDPOINT]

    assert sorted(operations) == ["get", "put"]
    assert {"409", "422", "500"} <= set(operations["put"]["responses"])
    assert "503" in operations["get"]["responses"]


def test_the_existing_endpoints_behave_as_before(client: TestClient) -> None:
    assert client.get("/api/health").json() == {"status": "ok"}
    assert client.get("/api/studio/settings/language").json() == {"language": "de"}
    assert client.put("/api/studio/settings/language", json={"language": "en"}).json() == {
        "language": "en"
    }
    rejected = client.put("/api/studio/settings/language", json={"language": "fr"})
    assert rejected.status_code == 422
    assert rejected.json() == {
        "detail": "The request is invalid.",
        "code": "request.invalid",
        "params": {},
        "errors": [{"location": ["body", "language"], "type": "literal_error"}],
    }
    assert set(client.get("/api/studio/revision").json()) == {"revision", "commit", "committed_at"}
