"""Tests for the object store: one file per object in the object directory.

Covered: file name only from a checked UUID and a fixed kind, rejection of an
invalid UUID or kind, writing through a temporary file (an aborted write leaves
the old file unchanged), the directory being created at the first write with
permissions for the user only, listing per kind with the time of the last
change, foreign files and symbolic links being neither listed nor changed, and
reading a file that cannot be read without an exception, and the limit of the size
of a file that is read.
"""

import os
import stat
import uuid
from datetime import UTC, datetime
from pathlib import Path

import pytest

from pipwerk_studio.object_store import (
    OBJECT_KINDS,
    InvalidObjectIdError,
    InvalidObjectKindError,
    ObjectDirectoryNotSetError,
    ObjectStore,
    ObjectWriteError,
    object_file_name,
)

SOME_ID = "0b0f3a54-6a7e-4c1e-9a52-2a3c5f1f9d10"
OTHER_ID = "7d444840-9dc0-41e5-8d5b-7c5b6a1c0c2e"


@pytest.fixture
def directory(tmp_path: Path) -> Path:
    return tmp_path / "objects"


@pytest.fixture
def store(directory: Path) -> ObjectStore:
    return ObjectStore(lambda: directory)


def test_create_writes_a_file_named_from_a_new_uuid_and_the_kind(
    store: ObjectStore, directory: Path
) -> None:
    for kind in OBJECT_KINDS:
        object_id = store.create(kind, f'{{"kind": "{kind}"}}')

        assert str(uuid.UUID(object_id)) == object_id
        assert (directory / f"{object_id}.{kind}.json").read_text(encoding="utf-8") == (
            f'{{"kind": "{kind}"}}'
        )
    assert len(list(directory.iterdir())) == len(OBJECT_KINDS)


def test_create_uses_a_new_uuid_each_time(store: ObjectStore) -> None:
    assert len({store.create("strategy", "{}") for _ in range(20)}) == 20


@pytest.mark.parametrize(
    "object_id",
    [
        "",
        "../" + SOME_ID,
        SOME_ID + "/..",
        SOME_ID.upper(),
        SOME_ID.replace("-", ""),
        "{" + SOME_ID + "}",
        "urn:uuid:" + SOME_ID,
        SOME_ID + "\n",
        " " + SOME_ID,
        SOME_ID[:-1],
        SOME_ID + "0",
        "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz",
        "a/b",
        "..",
        "\x00",
    ],
)
def test_an_invalid_uuid_is_rejected_by_every_function(
    store: ObjectStore, directory: Path, object_id: str
) -> None:
    with pytest.raises(InvalidObjectIdError):
        store.write("strategy", object_id, "{}")
    with pytest.raises(InvalidObjectIdError):
        store.read_bytes("strategy", object_id)
    with pytest.raises(InvalidObjectIdError):
        store.read_text("strategy", object_id)
    with pytest.raises(InvalidObjectIdError):
        store.delete("strategy", object_id)
    with pytest.raises(InvalidObjectIdError):
        object_file_name("strategy", object_id)
    assert not directory.exists()


@pytest.mark.parametrize(
    "kind",
    ["", "strategies", "Strategy", "strategy ", "../strategy", "strategy.json", "other", "\x00"],
)
def test_an_invalid_kind_is_rejected_by_every_function(
    store: ObjectStore, directory: Path, kind: str
) -> None:
    with pytest.raises(InvalidObjectKindError):
        store.create(kind, "{}")
    with pytest.raises(InvalidObjectKindError):
        store.write(kind, SOME_ID, "{}")
    with pytest.raises(InvalidObjectKindError):
        store.read_bytes(kind, SOME_ID)
    with pytest.raises(InvalidObjectKindError):
        store.delete(kind, SOME_ID)
    with pytest.raises(InvalidObjectKindError):
        store.list_objects(kind)
    assert not directory.exists()


def test_the_file_name_consists_of_uuid_kind_and_json() -> None:
    assert object_file_name("ruleset", SOME_ID) == f"{SOME_ID}.ruleset.json"


def test_write_creates_and_replaces_and_read_returns_the_content(
    store: ObjectStore, directory: Path
) -> None:
    store.write("rule", SOME_ID, b'{"a": 1}')
    first = store.read_bytes("rule", SOME_ID)
    store.write("rule", SOME_ID, '{"a": "ä"}')

    assert first.status == "ok"
    assert first.value == b'{"a": 1}'
    text = store.read_text("rule", SOME_ID)
    assert text.status == "ok"
    assert text.value == '{"a": "ä"}'
    assert [item.name for item in directory.iterdir()] == [f"{SOME_ID}.rule.json"]


def test_reading_a_missing_object_reports_missing_without_an_exception(
    store: ObjectStore, directory: Path
) -> None:
    assert store.read_bytes("trend", SOME_ID).status == "missing"
    assert store.read_text("trend", SOME_ID).status == "missing"
    assert store.list_objects("trend") == []
    assert store.delete("trend", SOME_ID) is False
    assert not directory.exists()


def test_a_file_that_is_not_utf8_text_is_reported_as_unreadable_as_text(
    store: ObjectStore, directory: Path
) -> None:
    store.write("indicator", SOME_ID, b"\xff\xfe\x00")

    as_text = store.read_text("indicator", SOME_ID)
    as_bytes = store.read_bytes("indicator", SOME_ID)

    assert as_text.status == "unreadable"
    assert as_text.value is None
    assert as_bytes.status == "ok"
    assert as_bytes.value == b"\xff\xfe\x00"


@pytest.mark.skipif(
    os.name == "nt" or os.geteuid() == 0, reason="needs file permissions that are enforced"
)
def test_a_file_that_cannot_be_read_is_reported_without_an_exception(
    store: ObjectStore, directory: Path
) -> None:
    store.write("indicator", SOME_ID, "{}")
    path = directory / f"{SOME_ID}.indicator.json"
    path.chmod(0)
    try:
        result = store.read_text("indicator", SOME_ID)
        listed = store.list_objects("indicator")
    finally:
        path.chmod(0o600)

    assert result.status == "unreadable"
    assert result.value is None
    assert [entry.object_id for entry in listed] == [SOME_ID]


def test_a_directory_with_the_name_of_an_object_file_is_not_an_object(
    store: ObjectStore, directory: Path
) -> None:
    (directory / f"{SOME_ID}.strategy.json").mkdir(parents=True)

    assert store.read_bytes("strategy", SOME_ID).status == "missing"
    assert store.list_objects("strategy") == []
    assert store.delete("strategy", SOME_ID) is False
    with pytest.raises(ObjectWriteError):
        store.write("strategy", SOME_ID, "{}")
    assert (directory / f"{SOME_ID}.strategy.json").is_dir()


def test_the_directory_is_created_at_the_first_write_with_permissions_for_the_user_only(
    tmp_path: Path,
) -> None:
    directory = tmp_path / "a" / "b" / "objects"
    store = ObjectStore(lambda: directory)
    assert store.list_objects("strategy") == []
    assert store.read_bytes("strategy", SOME_ID).status == "missing"
    assert not directory.exists()

    store.write("strategy", SOME_ID, "{}")

    assert directory.is_dir()
    if os.name != "nt":
        assert stat.S_IMODE(directory.stat().st_mode) == 0o700
        assert stat.S_IMODE((directory / f"{SOME_ID}.strategy.json").stat().st_mode) == 0o600


def test_an_existing_directory_keeps_its_permissions(tmp_path: Path) -> None:
    directory = tmp_path / "objects"
    directory.mkdir(mode=0o755)
    directory.chmod(0o755)
    store = ObjectStore(lambda: directory)

    store.write("strategy", SOME_ID, "{}")

    if os.name != "nt":
        assert stat.S_IMODE(directory.stat().st_mode) == 0o755


def test_without_an_object_directory_writing_fails_without_a_path_and_reading_finds_nothing() -> (
    None
):
    store = ObjectStore(lambda: None)

    with pytest.raises(ObjectDirectoryNotSetError) as caught:
        store.write("strategy", SOME_ID, "{}")
    with pytest.raises(ObjectDirectoryNotSetError):
        store.create("strategy", "{}")

    assert "/" not in str(caught.value)
    assert store.read_bytes("strategy", SOME_ID).status == "missing"
    assert store.list_objects("strategy") == []
    assert store.delete("strategy", SOME_ID) is False


def test_writing_goes_through_a_temporary_file_in_the_same_directory(
    store: ObjectStore, directory: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    store.write("rule", SOME_ID, "old")
    seen: list[tuple[str, str]] = []
    real_replace = os.replace

    def spy(source: os.PathLike[str], target: os.PathLike[str]) -> None:
        seen.append((str(source), str(target)))
        assert Path(source).read_text(encoding="utf-8") == "new"
        real_replace(source, target)

    monkeypatch.setattr("pipwerk_studio.object_store.os.replace", spy)

    store.write("rule", SOME_ID, "new")

    assert len(seen) == 1
    source, target = seen[0]
    assert Path(source).parent == directory
    assert Path(source).name != Path(target).name
    assert Path(target) == directory / f"{SOME_ID}.rule.json"
    assert [item.name for item in directory.iterdir()] == [f"{SOME_ID}.rule.json"]


def test_the_temporary_file_is_written_to_disk_before_renaming(
    store: ObjectStore, monkeypatch: pytest.MonkeyPatch
) -> None:
    events: list[str] = []
    real_fsync = os.fsync
    real_replace = os.replace

    def fsync(descriptor: int) -> None:
        events.append("fsync")
        real_fsync(descriptor)

    def replace(source: os.PathLike[str], target: os.PathLike[str]) -> None:
        events.append("replace")
        real_replace(source, target)

    monkeypatch.setattr("pipwerk_studio.object_store.os.fsync", fsync)
    monkeypatch.setattr("pipwerk_studio.object_store.os.replace", replace)

    store.write("rule", SOME_ID, "x")

    assert events[:2] == ["fsync", "replace"]


@pytest.mark.parametrize("failing", ["fsync", "replace"])
def test_an_aborted_write_leaves_the_old_file_unchanged_and_no_temporary_file(
    store: ObjectStore, directory: Path, monkeypatch: pytest.MonkeyPatch, failing: str
) -> None:
    store.write("rule", SOME_ID, "old content")
    before = (directory / f"{SOME_ID}.rule.json").stat()

    def fail(*_args: object) -> None:
        raise OSError("disk failure with a /secret/path")

    monkeypatch.setattr(f"pipwerk_studio.object_store.os.{failing}", fail)

    with pytest.raises(ObjectWriteError) as caught:
        store.write("rule", SOME_ID, "new content")

    assert "secret" not in str(caught.value)
    assert [item.name for item in directory.iterdir()] == [f"{SOME_ID}.rule.json"]
    assert (directory / f"{SOME_ID}.rule.json").read_text(encoding="utf-8") == "old content"
    assert (directory / f"{SOME_ID}.rule.json").stat().st_mtime_ns == before.st_mtime_ns


def test_an_aborted_first_write_creates_no_object(
    store: ObjectStore, directory: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fail(*_args: object) -> None:
        raise OSError

    monkeypatch.setattr("pipwerk_studio.object_store.os.replace", fail)

    with pytest.raises(ObjectWriteError):
        store.create("trend", "{}")

    assert store.list_objects("trend") == []
    assert list(directory.iterdir()) == []


def test_a_temporary_file_left_by_an_aborted_write_is_not_listed(
    store: ObjectStore, directory: Path
) -> None:
    store.write("rule", SOME_ID, "{}")
    leftovers = [".abc123.tmp", f".{OTHER_ID}.rule.json.tmp", f"{OTHER_ID}.rule.json.tmp"]
    for name in leftovers:
        (directory / name).write_text("half", encoding="utf-8")

    assert [entry.object_id for entry in store.list_objects("rule")] == [SOME_ID]
    for name in leftovers:
        assert (directory / name).read_text(encoding="utf-8") == "half"


def test_listing_returns_one_kind_with_the_time_of_the_last_change(
    store: ObjectStore, directory: Path
) -> None:
    store.write("strategy", SOME_ID, "{}")
    store.write("strategy", OTHER_ID, "{}")
    store.write("rule", SOME_ID, "{}")
    os.utime(directory / f"{SOME_ID}.strategy.json", (1_700_000_000, 1_700_000_000))
    os.utime(directory / f"{OTHER_ID}.strategy.json", (1_700_000_100, 1_700_000_100))

    entries = store.list_objects("strategy")

    assert [entry.object_id for entry in entries] == sorted([SOME_ID, OTHER_ID])
    by_id = {entry.object_id: entry.modified for entry in entries}
    assert by_id[SOME_ID] == datetime.fromtimestamp(1_700_000_000, UTC)
    assert by_id[OTHER_ID] == datetime.fromtimestamp(1_700_000_100, UTC)
    assert [entry.object_id for entry in store.list_objects("rule")] == [SOME_ID]
    assert store.list_objects("ruleset") == []


def test_foreign_files_are_neither_listed_nor_changed(store: ObjectStore, directory: Path) -> None:
    store.write("strategy", SOME_ID, "{}")
    foreign = {
        "README.txt": "text",
        f"{OTHER_ID}.strategy.json.bak": "backup",
        f"{OTHER_ID.upper()}.strategy.json": "upper case",
        f"{OTHER_ID}.strategies.json": "wrong kind",
        f"{OTHER_ID}.json": "no kind",
        f"x{OTHER_ID}.strategy.json": "prefix",
        "notes.strategy.json": "no uuid",
    }
    for name, content in foreign.items():
        (directory / name).write_text(content, encoding="utf-8")
    (directory / "subdirectory").mkdir()
    (directory / f"{OTHER_ID}.rule.json").mkdir()

    assert [entry.object_id for entry in store.list_objects("strategy")] == [SOME_ID]
    for kind in OBJECT_KINDS:
        assert all(entry.object_id == SOME_ID for entry in store.list_objects(kind))
    store.write("strategy", OTHER_ID, "{}")
    store.delete("strategy", SOME_ID)
    for name, content in foreign.items():
        assert (directory / name).read_text(encoding="utf-8") == content


@pytest.mark.skipif(os.name == "nt", reason="symbolic links need extra rights on Windows")
def test_symbolic_links_are_not_followed(
    store: ObjectStore, directory: Path, tmp_path: Path
) -> None:
    directory.mkdir()
    outside = tmp_path / "outside.json"
    outside.write_text("outside content", encoding="utf-8")
    (directory / f"{SOME_ID}.strategy.json").symlink_to(outside)
    (directory / f"{OTHER_ID}.strategy.json").symlink_to(tmp_path / "does-not-exist")

    assert store.list_objects("strategy") == []
    assert store.read_bytes("strategy", SOME_ID).status == "missing"
    assert store.read_text("strategy", SOME_ID).status == "missing"
    assert store.read_bytes("strategy", OTHER_ID).status == "missing"
    assert store.delete("strategy", SOME_ID) is False
    with pytest.raises(ObjectWriteError):
        store.write("strategy", SOME_ID, "overwritten")
    assert outside.read_text(encoding="utf-8") == "outside content"
    assert (directory / f"{SOME_ID}.strategy.json").is_symlink()


def test_delete_removes_only_the_object(store: ObjectStore, directory: Path) -> None:
    store.write("strategy", SOME_ID, "{}")
    store.write("strategy", OTHER_ID, "{}")
    store.write("rule", SOME_ID, "{}")

    assert store.delete("strategy", SOME_ID) is True
    assert store.delete("strategy", SOME_ID) is False

    assert sorted(item.name for item in directory.iterdir()) == sorted(
        [f"{OTHER_ID}.strategy.json", f"{SOME_ID}.rule.json"]
    )


def test_a_file_larger_than_the_given_limit_is_unreadable_and_not_read_whole(
    store: ObjectStore, directory: Path
) -> None:
    store.write("rule", SOME_ID, b"x" * 100)

    assert store.read_bytes("rule", SOME_ID, 100).value == b"x" * 100
    assert store.read_bytes("rule", SOME_ID, 100).status == "ok"
    assert store.read_bytes("rule", SOME_ID, 99).status == "unreadable"
    assert store.read_bytes("rule", SOME_ID, 99).value is None
    assert store.read_bytes("rule", SOME_ID, 0).status == "unreadable"
    assert store.read_bytes("rule", SOME_ID).status == "ok"  # no limit, as before
    assert store.read_text("rule", SOME_ID, 99).status == "unreadable"
    assert store.read_text("rule", SOME_ID, 100).value == "x" * 100
    assert store.read_bytes("rule", OTHER_ID, 5).status == "missing"
    store.write("rule", OTHER_ID, b"")
    assert store.read_bytes("rule", OTHER_ID, 0).status == "ok"


def test_the_store_follows_a_change_of_the_directory(tmp_path: Path) -> None:
    current = {"directory": tmp_path / "first"}
    store = ObjectStore(lambda: current["directory"])
    store.write("rule", SOME_ID, "{}")

    current["directory"] = tmp_path / "second"

    assert store.list_objects("rule") == []
    store.write("rule", SOME_ID, "{}")
    assert (tmp_path / "first" / f"{SOME_ID}.rule.json").is_file()
    assert (tmp_path / "second" / f"{SOME_ID}.rule.json").is_file()
