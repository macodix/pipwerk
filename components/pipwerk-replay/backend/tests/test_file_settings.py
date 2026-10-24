"""Tests of the settings for files (specification 5.7): defaults, saving, reading, refusals."""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from pipwerk_replay.app import create_app
from pipwerk_replay.directories import default_directory

URL = "/api/replay/settings/files"


def new_client(tmp_path: Path, **options: Any) -> TestClient:
    return TestClient(create_app(f"sqlite:///{tmp_path / 'replay.db'}", **options))


def body(tmp_path: Path, **changes: Any) -> dict[str, Any]:
    values: dict[str, Any] = {
        "keep_imported_files": False,
        "storage_directory": str(tmp_path / "storage"),
        "import_directory": str(tmp_path / "import"),
        "export_directory": str(tmp_path / "export"),
    }
    values.update(changes)
    return values


def test_without_a_stored_value_the_defaults_of_the_system_apply(tmp_path: Path) -> None:
    home = tmp_path / "home"
    client = new_client(tmp_path, environ={"HOME": str(home)}, config_origin="user")

    response = client.get(URL)

    assert response.status_code == 200
    base = home / ".local" / "share" / "pipwerk" / "replay"
    assert response.json() == {
        "keep_imported_files": False,
        "storage_directory": {"path": str(base / "storage"), "is_default": True},
        "import_directory": {"path": str(base / "import"), "is_default": True},
        "export_directory": {"path": str(base / "export"), "is_default": True},
    }
    assert not home.exists()  # reading creates nothing


def test_the_default_of_a_system_wide_configuration_is_the_system_directory() -> None:
    assert default_directory("storage", "system", windows=False, environ={}) == Path(
        "/var/lib/pipwerk/replay/storage"
    )


@pytest.mark.skipif(sys.platform != "win32", reason="paths of Windows")
def test_the_defaults_on_windows_follow_where_the_configuration_was_found() -> None:
    environ = {"PROGRAMDATA": "C:\\ProgramData", "LOCALAPPDATA": "C:\\Users\\x\\AppData\\Local"}

    system = default_directory("import", "system", windows=True, environ=environ)
    user = default_directory("import", "user", windows=True, environ=environ)
    explicit = default_directory("export", "explicit", windows=True, environ=environ)

    assert system == Path("C:\\ProgramData") / "pipwerk" / "replay" / "import"
    assert user == Path("C:\\Users\\x\\AppData\\Local") / "pipwerk" / "replay" / "import"
    assert explicit == Path("C:\\Users\\x\\AppData\\Local") / "pipwerk" / "replay" / "export"


@pytest.mark.parametrize("origin", ["user", "explicit"])
def test_an_unset_or_relative_environment_variable_leaves_the_default_undetermined(
    origin: Any,
) -> None:
    assert default_directory("storage", origin, windows=False, environ={}) is None
    assert default_directory("storage", origin, windows=False, environ={"HOME": "rel"}) is None
    assert default_directory("storage", origin, windows=True, environ={"LOCALAPPDATA": ""}) is None


def test_an_undetermined_default_is_reported_as_null(tmp_path: Path) -> None:
    client = new_client(tmp_path, environ={}, config_origin="user")

    stored = client.get(URL).json()

    assert stored["storage_directory"] == {"path": None, "is_default": True}


def test_all_four_values_are_saved_and_read_again(tmp_path: Path) -> None:
    client = new_client(tmp_path)

    response = client.put(URL, json=body(tmp_path, keep_imported_files=True))

    assert response.status_code == 200, response.text
    expected = {
        "keep_imported_files": True,
        "storage_directory": {"path": str(tmp_path / "storage"), "is_default": False},
        "import_directory": {"path": str(tmp_path / "import"), "is_default": False},
        "export_directory": {"path": str(tmp_path / "export"), "is_default": False},
    }
    assert response.json() == expected
    assert client.get(URL).json() == expected
    assert client2(tmp_path).get(URL).json() == expected  # in the database, not in memory


def client2(tmp_path: Path) -> TestClient:
    return new_client(tmp_path)


def test_missing_directories_are_created(tmp_path: Path) -> None:
    client = new_client(tmp_path)
    deep = tmp_path / "a" / "b" / "c"

    response = client.put(URL, json=body(tmp_path, storage_directory=str(deep)))

    assert response.status_code == 200, response.text
    assert deep.is_dir()
    assert list(deep.iterdir()) == []  # the check leaves nothing behind


def test_null_removes_the_stored_directory_and_the_default_applies_again(tmp_path: Path) -> None:
    client = new_client(tmp_path, environ={"HOME": str(tmp_path / "h")}, config_origin="user")
    assert client.put(URL, json=body(tmp_path)).status_code == 200

    response = client.put(URL, json=body(tmp_path, import_directory=None))

    assert response.json()["import_directory"]["is_default"] is True
    assert response.json()["storage_directory"]["is_default"] is False


@pytest.mark.parametrize("path", ["relative/dir", ".", "~/x", "", "../x"])
def test_a_relative_directory_is_refused_with_its_place_and_nothing_is_saved(
    tmp_path: Path, path: str
) -> None:
    client = new_client(tmp_path)
    before = client.get(URL).json()

    response = client.put(URL, json=body(tmp_path, export_directory=path))

    assert response.status_code == 422
    assert response.json()["errors"] == [{"location": ["export_directory"], "type": "not_absolute"}]
    assert client.get(URL).json() == before


def test_all_refused_directories_are_named_together(tmp_path: Path) -> None:
    client = new_client(tmp_path)

    response = client.put(
        URL, json=body(tmp_path, storage_directory="rel", import_directory="rel2")
    )

    assert response.status_code == 422
    assert {(e["location"][0], e["type"]) for e in response.json()["errors"]} == {
        ("storage_directory", "not_absolute"),
        ("import_directory", "not_absolute"),
    }


def test_a_file_instead_of_a_directory_is_refused(tmp_path: Path) -> None:
    client = new_client(tmp_path)
    file = tmp_path / "plain.txt"
    file.write_text("x")

    response = client.put(URL, json=body(tmp_path, storage_directory=str(file)))

    assert response.status_code == 422
    assert response.json()["errors"] == [
        {"location": ["storage_directory"], "type": "not_a_directory"}
    ]


def test_a_directory_below_a_file_cannot_be_created(tmp_path: Path) -> None:
    client = new_client(tmp_path)
    file = tmp_path / "plain.txt"
    file.write_text("x")

    response = client.put(URL, json=body(tmp_path, export_directory=str(file / "sub")))

    assert response.status_code == 422
    assert response.json()["errors"] == [
        {"location": ["export_directory"], "type": "cannot_be_created"}
    ]


needs_permissions = pytest.mark.skipif(
    sys.platform == "win32" or (hasattr(os, "geteuid") and os.geteuid() == 0),
    reason="permissions are not enforced for this user",
)


@needs_permissions
@pytest.mark.parametrize("kind", ["storage_directory", "export_directory"])
def test_a_directory_that_is_not_writable_is_refused(tmp_path: Path, kind: str) -> None:
    client = new_client(tmp_path)
    locked = tmp_path / "locked"
    locked.mkdir()
    locked.chmod(0o500)
    try:
        response = client.put(URL, json=body(tmp_path, **{kind: str(locked)}))
    finally:
        locked.chmod(0o700)

    assert response.status_code == 422
    assert response.json()["errors"] == [{"location": [kind], "type": "not_writable"}]


@needs_permissions
def test_an_import_directory_that_is_not_readable_is_refused(tmp_path: Path) -> None:
    client = new_client(tmp_path)
    locked = tmp_path / "locked"
    locked.mkdir()
    locked.chmod(0o000)
    try:
        response = client.put(URL, json=body(tmp_path, import_directory=str(locked)))
    finally:
        locked.chmod(0o700)

    assert response.status_code == 422
    assert response.json()["errors"] == [{"location": ["import_directory"], "type": "not_readable"}]


@needs_permissions
def test_an_import_directory_that_is_only_readable_is_accepted_and_never_written(
    tmp_path: Path,
) -> None:
    client = new_client(tmp_path)
    readonly = tmp_path / "readonly"
    readonly.mkdir()
    readonly.chmod(0o500)
    try:
        response = client.put(URL, json=body(tmp_path, import_directory=str(readonly)))
        content = list(readonly.iterdir())
    finally:
        readonly.chmod(0o700)

    assert response.status_code == 200, response.text
    assert content == []


def test_the_body_is_checked(tmp_path: Path) -> None:
    client = new_client(tmp_path)

    for bad in (
        {**body(tmp_path), "keep_imported_files": "yes"},
        {**body(tmp_path), "extra": 1},
        {**body(tmp_path), "storage_directory": 5},
        {**body(tmp_path), "storage_directory": "/" + "x" * 5000},
    ):
        assert client.put(URL, json=bad).status_code == 422
    partial = body(tmp_path)
    del partial["export_directory"]
    assert client.put(URL, json=partial).status_code == 422


def test_a_stored_relative_directory_is_reported_and_repaired_by_a_valid_write(
    tmp_path: Path,
) -> None:
    import sqlite3

    client = new_client(tmp_path)
    assert client.put(URL, json=body(tmp_path)).status_code == 200
    with sqlite3.connect(tmp_path / "replay.db") as connection:
        connection.execute("UPDATE replay_settings SET storage_directory = 'relative'")

    broken = client.get(URL)

    assert broken.status_code == 503
    assert "relative" not in broken.text
    assert client.put(URL, json=body(tmp_path)).status_code == 200
    assert client.get(URL).status_code == 200


def test_the_language_and_the_broker_for_test_runs_stay_when_files_are_saved(
    tmp_path: Path,
) -> None:
    client = new_client(tmp_path)
    assert client.put("/api/replay/settings/language", json={"language": "en"}).status_code == 200

    assert client.put(URL, json=body(tmp_path)).status_code == 200

    assert client.get("/api/replay/settings/language").json() == {"language": "en"}
