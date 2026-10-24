"""Tests of the import directory, of keeping files and of leaving nothing behind (5.3, 5.6)."""

from __future__ import annotations

import hashlib
import os
import sys
from pathlib import Path
from typing import Any

import pytest
from datastock import (
    API,
    BROKER,
    CANDLE_HEADER,
    begin,
    candle_row,
    candles_json,
    csv_file,
    end,
    file_url,
    raw_form,
    upload_file,
)
from fastapi.testclient import TestClient

from pipwerk_replay.app import create_app
from pipwerk_replay.file_keeping import TEMPORARY_PREFIX, TEMPORARY_SUFFIX

CANDLES_CSV_NAME = "EURUSD_M1_202401021000_202401021001.csv"
CANDLES_CSV = csv_file(CANDLE_HEADER, candle_row("10:00:00"), candle_row("10:01:00"))

SETTINGS = "/api/replay/settings/files"
LISTING = f"{API}/import-directory"
DIRECTORY_PREVIEW = f"{API}/import-directory/preview"
SERIES = f"{API}/series"


class Env:
    """A backend with a storage and an import directory below ``root``."""

    def __init__(self, root: Path) -> None:
        self.root = root
        self.storage = root / "storage"
        self.imports = root / "import"
        self.imports.mkdir()
        self.client = TestClient(create_app(f"sqlite:///{root / 'replay.db'}"))
        response = self.client.put(
            SETTINGS,
            json={
                "keep_imported_files": False,
                "storage_directory": str(self.storage),
                "import_directory": str(self.imports),
                "export_directory": None,
            },
        )
        assert response.status_code == 200, response.text

    def put(self, name: str, content: bytes) -> Path:
        path = self.imports / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
        return path

    def import_path(self, process: str, path: str, **fields: Any) -> Any:
        return self.client.post(
            f"{API}/import-processes/{process}/directory-files",
            json={"path": path, "broker": BROKER, **fields},
        )

    def stored_names(self) -> list[str]:
        return sorted(item.name for item in self.storage.iterdir()) if self.storage.exists() else []

    def series(self) -> list[Any]:
        return list(self.client.get(SERIES).json()["items"])


@pytest.fixture
def env(tmp_path: Path) -> Env:
    return Env(tmp_path)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def snapshot(root: Path) -> dict[str, tuple[str, int]]:
    """Name, content digest and modification time of everything below ``root``."""
    found: dict[str, tuple[str, int]] = {}
    for path in sorted(root.rglob("*")):
        if path.is_file():
            found[str(path.relative_to(root))] = (digest(path), path.stat().st_mtime_ns)
        else:
            found[str(path.relative_to(root)) + "/"] = ("", 0)
    return found


# --- listing --------------------------------------------------------------------------------


def test_the_listing_shows_directories_first_then_files_with_size_and_time(env: Env) -> None:
    env.put("b.json", b"12345")
    env.put("A.csv", b"1")
    (env.imports / "zeta").mkdir()
    (env.imports / "Alpha").mkdir()

    response = env.client.get(LISTING)

    assert response.status_code == 200, response.text
    page = response.json()
    assert [(item["name"], item["kind"], item["size"]) for item in page["items"]] == [
        ("Alpha", "directory", None),
        ("zeta", "directory", None),
        ("A.csv", "file", 1),
        ("b.json", "file", 5),
    ]
    assert page["total"] == 4
    assert all(item["modified_at"].endswith("Z") for item in page["items"])


def test_the_listing_goes_into_a_subdirectory(env: Env) -> None:
    env.put("sub/deeper/x.json", b"{}")

    response = env.client.get(LISTING, params={"path": "sub/deeper"})

    assert [item["name"] for item in response.json()["items"]] == ["x.json"]


def test_the_listing_is_a_page_with_a_limited_number_of_entries(env: Env) -> None:
    for number in range(5):
        env.put(f"f{number}.json", b"{}")

    first = env.client.get(LISTING, params={"limit": 2}).json()
    second = env.client.get(LISTING, params={"limit": 2, "offset": 2}).json()

    assert [item["name"] for item in first["items"]] == ["f0.json", "f1.json"]
    assert [item["name"] for item in second["items"]] == ["f2.json", "f3.json"]
    assert first["total"] == 5


def test_the_listing_refuses_a_limit_above_the_maximum(env: Env) -> None:
    response = env.client.get(LISTING, params={"limit": 1_000_000})

    assert response.status_code == 422


def test_the_listing_does_not_show_intermediate_files_of_the_backend(env: Env) -> None:
    env.put("a.json", b"{}")
    env.put(f"{TEMPORARY_PREFIX}abc{TEMPORARY_SUFFIX}", b"x")

    names = [item["name"] for item in env.client.get(LISTING).json()["items"]]

    assert names == ["a.json"]


@pytest.mark.parametrize(
    ("path", "problem"),
    [
        ("..", "path_invalid"),
        ("../x", "path_invalid"),
        ("a/../..", "path_invalid"),
        ("/etc", "path_invalid"),
        ("a//b", "path_invalid"),
        ("a\x00b", "path_invalid"),
    ],
)
def test_the_listing_refuses_a_path_that_is_not_plain_relative(
    env: Env, path: str, problem: str
) -> None:
    response = env.client.get(LISTING, params={"path": path})

    assert response.status_code == 422, response.text
    assert response.json()["errors"][0]["type"] == problem


def test_the_listing_refuses_a_file_and_reports_a_missing_directory(env: Env) -> None:
    env.put("a.json", b"{}")

    file = env.client.get(LISTING, params={"path": "a.json"})
    missing = env.client.get(LISTING, params={"path": "nothing"})

    assert file.status_code == 422
    assert file.json()["errors"][0]["type"] == "not_a_directory"
    assert missing.status_code == 404


@pytest.mark.skipif(sys.platform == "win32", reason="symbolic links need rights on Windows")
def test_the_listing_never_goes_above_the_import_directory_by_a_link(env: Env) -> None:
    outside = env.root / "outside"
    outside.mkdir()
    (outside / "secret.json").write_bytes(b"{}")
    (env.imports / "away").symlink_to(outside, target_is_directory=True)
    (env.imports / "leak.json").symlink_to(outside / "secret.json")
    env.put("inside.json", b"{}")
    (env.imports / "ok.json").symlink_to(env.imports / "inside.json")

    listing = env.client.get(LISTING)
    through = env.client.get(LISTING, params={"path": "away"})

    assert [item["name"] for item in listing.json()["items"]] == ["inside.json", "ok.json"]
    assert through.status_code == 422
    assert through.json()["errors"][0]["type"] == "outside_import_directory"


def test_the_listing_without_an_import_directory_is_a_conflict(tmp_path: Path) -> None:
    client = TestClient(
        create_app(f"sqlite:///{tmp_path / 'replay.db'}", environ={}, config_origin="user")
    )

    assert client.get(LISTING).status_code == 409


def test_the_listing_of_a_missing_import_directory_is_a_conflict(env: Env) -> None:
    env.imports.rmdir()

    assert env.client.get(LISTING).status_code == 409


# --- import ---------------------------------------------------------------------------------


def test_a_file_of_the_import_directory_is_imported_and_stays_unchanged(env: Env) -> None:
    path = env.put("sub/data.json", candles_json(3))
    before = snapshot(env.imports)
    process = begin(env.client)

    response = env.import_path(process, "sub/data.json")

    assert response.status_code == 200, response.text
    outcome = response.json()
    assert (outcome["name"], outcome["refused"], outcome["result"]["accepted"]) == (
        "data.json",
        False,
        3,
    )
    assert outcome["kept"] is False
    assert end(env.client, process).json()["imported_count"] == 1
    assert snapshot(env.imports) == before
    assert path.is_file()
    assert env.stored_names() == []


def test_a_json_file_of_the_directory_names_instrument_and_data_itself(env: Env) -> None:
    env.put("data.json", candles_json(2, instrument="XYZ"))
    process = begin(env.client)

    assert env.import_path(process, "data.json").status_code == 200

    end(env.client, process)
    assert [(item["broker"], item["instrument"]) for item in env.series()] == [(BROKER, "XYZ")]


def test_a_csv_file_of_the_directory_takes_instrument_and_data_from_its_name(env: Env) -> None:
    env.put(CANDLES_CSV_NAME, CANDLES_CSV)
    process = begin(env.client)

    response = env.import_path(process, CANDLES_CSV_NAME, timezone="UTC")

    assert response.status_code == 200, response.text
    assert response.json()["refused"] is False, response.text
    end(env.client, process)
    assert len(env.series()) == 1


def test_the_preview_of_a_file_of_the_directory_names_what_it_says_of_itself(env: Env) -> None:
    env.put("data.json", candles_json(2, instrument="XYZ", broker="Other"))
    env.put(CANDLES_CSV_NAME, CANDLES_CSV)

    json_hint = env.client.post(DIRECTORY_PREVIEW, json={"path": "data.json"})
    csv_hint = env.client.post(DIRECTORY_PREVIEW, json={"path": CANDLES_CSV_NAME})

    assert json_hint.status_code == 200, json_hint.text
    assert (json_hint.json()["format"], json_hint.json()["broker"]) == ("json", "Other")
    assert json_hint.json()["instrument"] == "XYZ"
    assert csv_hint.json()["format"] == "csv"
    assert csv_hint.json()["instrument"] is not None


def test_uploaded_and_directory_files_are_imported_in_the_same_process(env: Env) -> None:
    env.put("dir.json", candles_json(2, instrument="DDD"))
    process = begin(env.client)

    uploaded = upload_file(env.client, process, "up.json", candles_json(2, instrument="UUU"))
    directory = env.import_path(process, "dir.json")
    finished = end(env.client, process).json()

    assert uploaded.status_code == directory.status_code == 200
    assert finished["imported_count"] == 2
    assert sorted(item["instrument"] for item in env.series()) == ["DDD", "UUU"]


def test_a_refused_directory_file_does_not_stop_the_process(env: Env) -> None:
    env.put("bad.json", b"this is not json")
    env.put("good.json", candles_json(2))
    process = begin(env.client)

    bad = env.import_path(process, "bad.json")
    good = env.import_path(process, "good.json")
    finished = end(env.client, process).json()

    assert bad.status_code == 200 and bad.json()["refused"] is True
    assert good.json()["refused"] is False
    assert (finished["imported_count"], finished["refused_count"]) == (1, 1)


def test_an_abort_keeps_what_was_taken_over_and_leaves_the_directory_alone(env: Env) -> None:
    env.put("a.json", candles_json(2))
    before = snapshot(env.imports)
    process = begin(env.client)
    env.import_path(process, "a.json")

    aborted = end(env.client, process, "abort")

    assert aborted.status_code == 200
    assert len(env.series()) == 1
    assert snapshot(env.imports) == before


@pytest.mark.parametrize(
    ("path", "problem"),
    [
        ("../outside.json", "path_invalid"),
        ("sub/../../outside.json", "path_invalid"),
        ("/etc/passwd", "path_invalid"),
        ("..", "path_invalid"),
        ("", None),
        ("sub", "not_a_file"),
    ],
)
def test_a_wrong_path_is_refused_and_nothing_is_read(
    env: Env, path: str, problem: str | None
) -> None:
    (env.imports / "sub").mkdir()
    (env.root / "outside.json").write_bytes(candles_json(2))
    process = begin(env.client)

    response = env.import_path(process, path)

    assert response.status_code == 422, response.text
    if problem is not None:
        assert response.json()["errors"][0]["type"] == problem
    assert env.series() == []


@pytest.mark.skipif(sys.platform == "win32", reason="symbolic links need rights on Windows")
def test_a_link_to_the_outside_is_refused(env: Env) -> None:
    (env.root / "outside.json").write_bytes(candles_json(2))
    (env.imports / "link.json").symlink_to(env.root / "outside.json")
    outside_dir = env.root / "outdir"
    outside_dir.mkdir()
    (outside_dir / "in.json").write_bytes(candles_json(2))
    (env.imports / "dirlink").symlink_to(outside_dir, target_is_directory=True)
    process = begin(env.client)

    file_link = env.import_path(process, "link.json")
    directory_link = env.import_path(process, "dirlink/in.json")

    for response in (file_link, directory_link):
        assert response.status_code == 422, response.text
        assert response.json()["errors"][0]["type"] == "outside_import_directory"
    assert env.series() == []


def test_a_missing_file_is_not_found_and_a_process_that_is_gone_too(env: Env) -> None:
    process = begin(env.client)

    assert env.import_path(process, "missing.json").status_code == 404
    end(env.client, process)
    env.put("a.json", candles_json(2))
    assert env.import_path(process, "a.json").status_code == 404


def test_an_intermediate_name_of_the_backend_cannot_be_named(env: Env) -> None:
    env.put(f"{TEMPORARY_PREFIX}x{TEMPORARY_SUFFIX}", candles_json(2))
    process = begin(env.client)

    response = env.import_path(process, f"{TEMPORARY_PREFIX}x{TEMPORARY_SUFFIX}")

    assert response.status_code == 404


def test_a_file_over_the_limit_per_file_is_refused_as_a_whole(tmp_path: Path) -> None:
    from pipwerk_replay.config import MarketDataSettings

    settings = MarketDataSettings(max_upload_bytes=1000)
    env = Env.__new__(Env)
    env.root, env.storage, env.imports = tmp_path, tmp_path / "storage", tmp_path / "import"
    env.imports.mkdir()
    env.client = TestClient(create_app(f"sqlite:///{tmp_path / 'replay.db'}", marketdata=settings))
    env.client.put(
        SETTINGS,
        json={
            "keep_imported_files": False,
            "storage_directory": str(env.storage),
            "import_directory": str(env.imports),
            "export_directory": None,
        },
    )
    env.put("big.json", candles_json(200))
    process = begin(env.client)

    response = env.import_path(process, "big.json")

    assert response.status_code in (200, 413), response.text
    assert env.series() == []
    if response.status_code == 200:
        assert response.json()["refused"] is True


@pytest.mark.skipif(
    sys.platform == "win32" or (hasattr(os, "geteuid") and os.geteuid() == 0),
    reason="permissions are not enforced for this user",
)
def test_a_file_that_cannot_be_read_is_refused_as_a_whole(env: Env) -> None:
    path = env.put("locked.json", candles_json(2))
    path.chmod(0o000)
    process = begin(env.client)
    try:
        response = env.import_path(process, "locked.json")
    finally:
        path.chmod(0o600)

    assert response.status_code == 200, response.text
    assert (response.json()["refused"], response.json()["error"]) == (True, "not_readable")
    assert env.series() == []


# --- keeping files --------------------------------------------------------------------------


def test_with_the_box_an_uploaded_file_is_written_unchanged_to_the_storage_directory(
    env: Env,
) -> None:
    content = candles_json(3)
    process = begin(env.client)

    response = upload_file(env.client, process, "kept.json", content, keep="true")

    assert response.status_code == 200, response.text
    assert response.json()["kept"] is True
    assert (env.storage / "kept.json").read_bytes() == content
    assert env.stored_names() == ["kept.json"]


def test_without_the_box_nothing_is_written_to_the_storage_directory(env: Env) -> None:
    process = begin(env.client)

    plain = upload_file(env.client, process, "x.json", candles_json(2))
    unticked = upload_file(env.client, process, "x.json", candles_json(2), keep="false")
    assert plain.json()["kept"] is unticked.json()["kept"] is False

    assert env.stored_names() == []


def test_a_refused_file_is_kept_too(env: Env) -> None:
    process = begin(env.client)

    response = upload_file(env.client, process, "broken.json", b"not json", keep="true")

    assert response.status_code == 200
    assert response.json()["refused"] is True and response.json()["kept"] is True
    assert (env.storage / "broken.json").read_bytes() == b"not json"


def test_after_an_abort_the_files_up_to_then_are_kept(env: Env) -> None:
    process = begin(env.client)
    upload_file(env.client, process, "one.json", candles_json(2), keep="true")
    upload_file(env.client, process, "two.json", candles_json(3, instrument="B"), keep="true")

    end(env.client, process, "abort")

    assert env.stored_names() == ["one.json", "two.json"]


def test_a_file_of_the_same_name_is_replaced(env: Env) -> None:
    process = begin(env.client)
    upload_file(env.client, process, "same.json", b"first", keep="true")

    upload_file(env.client, process, "same.json", candles_json(2), keep="true")

    assert (env.storage / "same.json").read_bytes() == candles_json(2)
    assert env.stored_names() == ["same.json"]


@pytest.mark.parametrize(
    ("sent", "kept_as"),
    [
        ("../../escape.json", "escape.json"),
        ("/etc/abs.json", "abs.json"),
        ("..\\..\\win.json", "win.json"),
        ("..", "file-1"),
    ],
)
def test_a_kept_file_lies_directly_in_the_storage_directory_under_the_cleaned_name(
    env: Env, sent: str, kept_as: str
) -> None:
    process = begin(env.client)
    form = raw_form(
        [("broker", None, BROKER.encode()), ("keep", None, b"true"), ("file", sent, b"{}")]
    )

    response = env.client.post(file_url(process), **form)

    assert response.status_code == 200, response.text
    assert env.stored_names() == [kept_as]
    assert not (env.root / "escape.json").exists()


def test_a_value_other_than_true_or_false_is_refused(env: Env) -> None:
    process = begin(env.client)

    response = upload_file(env.client, process, "x.json", b"{}", keep="yes")

    assert response.status_code == 422
    assert env.stored_names() == []


def test_a_directory_file_is_never_copied_into_the_storage_directory(env: Env) -> None:
    path = env.put("a.json", candles_json(2))
    before = snapshot(env.imports)
    settings = env.client.get(SETTINGS).json()
    settings["keep_imported_files"] = True
    for kind in ("storage_directory", "import_directory", "export_directory"):
        settings[kind] = settings[kind]["path"]
    assert env.client.put(SETTINGS, json=settings).status_code == 200
    process = begin(env.client)

    response = env.import_path(process, "a.json")

    assert response.status_code == 200
    assert response.json()["kept"] is False
    assert env.stored_names() == []
    assert snapshot(env.imports) == before
    assert path.read_bytes() == candles_json(2)


def test_without_a_storage_directory_the_file_is_not_imported(tmp_path: Path) -> None:
    client = TestClient(
        create_app(f"sqlite:///{tmp_path / 'replay.db'}", environ={}, config_origin="user")
    )
    process = begin(client)

    response = upload_file(client, process, "x.json", candles_json(2), keep="true")

    assert response.status_code == 409
    assert client.get(SERIES).json()["items"] == []


@pytest.mark.skipif(
    sys.platform == "win32" or (hasattr(os, "geteuid") and os.geteuid() == 0),
    reason="permissions are not enforced for this user",
)
def test_a_file_that_cannot_be_kept_is_not_imported_and_leaves_no_intermediate_file(
    env: Env,
) -> None:
    env.storage.mkdir(exist_ok=True)
    env.storage.chmod(0o500)
    process = begin(env.client)
    try:
        response = upload_file(env.client, process, "x.json", candles_json(2), keep="true")
        names = list(env.storage.iterdir())
    finally:
        env.storage.chmod(0o700)

    assert response.status_code == 503
    assert names == []
    assert env.series() == []


def test_a_failure_while_writing_removes_the_intermediate_file_at_once(
    env: Env, monkeypatch: pytest.MonkeyPatch
) -> None:
    def failing(source: Any, target: Any) -> None:
        raise OSError("disk full")

    monkeypatch.setattr("pipwerk_replay.file_keeping.os.replace", failing)
    process = begin(env.client)

    response = upload_file(env.client, process, "x.json", candles_json(2), keep="true")

    assert response.status_code == 503
    assert env.stored_names() == []


def test_intermediate_files_of_a_crash_are_removed_at_the_next_start(env: Env) -> None:
    env.storage.mkdir(exist_ok=True)
    leftover = env.storage / f"{TEMPORARY_PREFIX}crash{TEMPORARY_SUFFIX}"
    leftover.write_bytes(b"part")
    own_file = env.storage / "mine.part"
    own_file.write_bytes(b"not ours")
    other = env.storage / f"{TEMPORARY_PREFIX}x.txt"
    other.write_bytes(b"not ours either")

    create_app(f"sqlite:///{env.root / 'replay.db'}")

    assert not leftover.exists()
    assert own_file.exists() and other.exists()


def test_a_kept_file_is_never_removed_by_the_start(env: Env) -> None:
    process = begin(env.client)
    upload_file(env.client, process, "kept.json", candles_json(2), keep="true")

    create_app(f"sqlite:///{env.root / 'replay.db'}")

    assert env.stored_names() == ["kept.json"]


# --- nothing is left behind -----------------------------------------------------------------


def tree(*roots: Path) -> set[str]:
    found: set[str] = set()
    for root in roots:
        found.update(str(path) for path in root.rglob("*"))
    return found


@pytest.fixture
def temporary(tmp_path_factory: pytest.TempPathFactory, monkeypatch: pytest.MonkeyPatch) -> Path:
    directory = tmp_path_factory.mktemp("temporary")
    monkeypatch.setattr("tempfile.tempdir", str(directory))
    return directory


def test_without_the_box_nothing_of_a_file_is_left_in_the_file_system(
    env: Env, temporary: Path
) -> None:
    content = candles_json(2000)  # large enough to be spooled to disk by the form parser
    before = tree(env.root, temporary) - tree(env.imports)
    process = begin(env.client)

    ended = upload_file(env.client, process, "big.json", content)
    refused = upload_file(env.client, process, "bad.json", b"x" * 2_000_000)
    end(env.client, process)
    process = begin(env.client)
    upload_file(env.client, process, "again.json", content)
    end(env.client, process, "abort")

    assert ended.status_code == 200 and refused.status_code == 200
    after = tree(env.root, temporary)
    leftovers = {
        path for path in after - before if not path.endswith(("replay.db", "replay.db-journal"))
    }
    assert leftovers == set()
    assert env.stored_names() == []
    assert list(temporary.iterdir()) == []


def test_a_form_that_fails_leaves_nothing_behind(env: Env, temporary: Path) -> None:
    process = begin(env.client)
    form = raw_form(
        [
            ("broker", None, BROKER.encode()),
            ("bogus", None, b"1"),
            ("file", "a.json", b"x" * 3_000_000),
        ]
    )

    response = env.client.post(file_url(process), **form)

    assert response.status_code == 422
    assert list(temporary.iterdir()) == []
    assert env.stored_names() == []


def test_the_database_has_no_rest_file_after_the_work(env: Env) -> None:
    process = begin(env.client)
    upload_file(env.client, process, "a.json", candles_json(50))
    end(env.client, process)

    names = {item.name for item in env.root.iterdir()}

    assert names <= {"replay.db", "import", "storage"}
