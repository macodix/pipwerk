"""The directory for attachments (specification E6, Abschnitt 7)."""

import os
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import uuid4

import pytest

from pipwerk_relay.attachments import AttachmentStore
from pipwerk_relay.errors import AttachmentLost


@pytest.fixture
def store(tmp_path: Path) -> AttachmentStore:
    result = AttachmentStore(tmp_path / "attachments")
    result.ensure_directory()
    return result


def files(store: AttachmentStore) -> set[str]:
    return {path.name for path in store._directory.iterdir()}


def test_the_attachments_of_an_entry_are_written_read_and_removed(store: AttachmentStore) -> None:
    key = str(uuid4())
    store.write(key, [b"one", b"", b"three"])
    assert files(store) == {f"{key}.0.att", f"{key}.1.att", f"{key}.2.att"}
    assert store.read(key, 3) == [b"one", b"", b"three"]
    store.remove(key)
    assert files(store) == set()
    store.remove(key)  # repeatable


def test_removing_an_entry_leaves_the_files_of_others(store: AttachmentStore) -> None:
    first, second = str(uuid4()), str(uuid4())
    store.write(first, [b"1"])
    store.write(second, [b"2"])
    store.remove(first)
    assert store.read(second, 1) == [b"2"]


def test_a_missing_attachment_is_reported_without_a_path(store: AttachmentStore) -> None:
    key = str(uuid4())
    store.write(key, [b"one"])
    with pytest.raises(AttachmentLost) as error:
        store.read(key, 2)
    assert str(store._directory) not in str(error.value)


@pytest.mark.skipif(sys.platform == "win32", reason="links of POSIX systems")
def test_a_link_in_place_of_an_attachment_is_not_followed(store: AttachmentStore) -> None:
    key = str(uuid4())
    target = store._directory.parent / "secret.txt"
    target.write_bytes(b"SECRET")
    (store._directory / f"{key}.0.att").symlink_to(target)
    with pytest.raises(AttachmentLost):
        store.read(key, 1)


@pytest.mark.parametrize("key", ["", "../x", "a", str(uuid4()).upper(), f"{uuid4()}\n", "x/y"])
def test_a_key_that_is_no_key_of_an_entry_is_refused(store: AttachmentStore, key: str) -> None:
    for call in (
        lambda: store.write(key, [b"x"]),
        lambda: store.read(key, 1),
        lambda: store.remove(key),
    ):
        with pytest.raises(ValueError, match="not a key"):
            call()
    assert files(store) == set()


def test_a_failure_while_writing_leaves_nothing_behind(
    store: AttachmentStore, monkeypatch: pytest.MonkeyPatch
) -> None:
    key = str(uuid4())
    original = os.replace
    calls = {"count": 0}

    def fail_on_the_second(source: str | Path, target: str | Path) -> None:
        calls["count"] += 1
        if calls["count"] == 2:
            raise OSError("disk full")
        original(source, target)

    monkeypatch.setattr(os, "replace", fail_on_the_second)
    with pytest.raises(OSError, match="disk full"):
        store.write(key, [b"one", b"two", b"three"])
    assert files(store) == set()


def test_the_directory_is_created_for_the_owner_only(tmp_path: Path) -> None:
    directory = tmp_path / "deep" / "attachments"
    AttachmentStore(directory).ensure_directory()
    AttachmentStore(directory).ensure_directory()  # repeatable
    assert directory.is_dir()
    if sys.platform != "win32":
        assert directory.stat().st_mode & 0o077 == 0


def old(path: Path, seconds: float = 7200) -> None:
    moment = datetime.now(UTC).timestamp() - seconds
    os.utime(path, (moment, moment))


def test_orphans_and_unfinished_files_are_removed_when_old(store: AttachmentStore) -> None:
    known, lost = str(uuid4()), str(uuid4())
    store.write(known, [b"x"])
    store.write(lost, [b"y"])
    unfinished = store._directory / f"{uuid4()}.0.att.0123456789abcdef.part"
    unfinished.write_bytes(b"z")
    foreign = store._directory / "notes.txt"
    foreign.write_bytes(b"n")
    for path in store._directory.iterdir():
        old(path)
    young = str(uuid4())
    store.write(young, [b"w"])
    removed = store.clean_orphans({known}, timedelta(hours=1), datetime.now(UTC))
    assert removed == 2  # the orphan and the unfinished file
    assert files(store) == {f"{known}.0.att", f"{young}.0.att", "notes.txt"}


def test_cleaning_a_directory_that_is_gone_is_not_an_error(tmp_path: Path) -> None:
    gone = AttachmentStore(tmp_path / "gone")
    assert gone.clean_orphans(set(), timedelta(hours=1), datetime.now(UTC)) == 0
    gone.remove(str(uuid4()))
