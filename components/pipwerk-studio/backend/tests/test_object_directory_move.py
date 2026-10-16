"""Tests for changing the object directory with and without moving the files.

Covered (specification 4.1, req-ablauf-009): moving all files by the pattern and
saving the setting afterwards, not moving, a conflict (nothing is moved), a
failure on the way (the files are brought back, the old setting stays), a failure
of bringing them back (both directories and the files are named), no file is ever
overwritten, also not one that comes into being between check and moving, and
the lock against concurrent changes and writes of the object store.
"""

import errno
import os
import stat
import threading
from collections.abc import Callable
from pathlib import Path

import pytest
from sqlalchemy.exc import OperationalError

from pipwerk_studio import object_store
from pipwerk_studio.object_store import (
    ObjectConflictError,
    ObjectMoveError,
    ObjectMoveRollbackError,
)
from pipwerk_studio.settings_service import SettingsService
from pipwerk_studio.storage import create_session_factory, create_studio_engine

IDS = [
    "11111111-1111-4111-8111-111111111111",
    "22222222-2222-4222-8222-222222222222",
    "33333333-3333-4333-8333-333333333333",
]
KINDS = ["strategy", "indicator", "rule"]


class Setup:
    """A service with the default directory below ``home`` and three object files."""

    def __init__(self, tmp_path: Path) -> None:
        self.home = tmp_path / "home"
        self.new = tmp_path / "new" / "objects"
        engine = create_studio_engine(f"sqlite:///{tmp_path / 'studio.db'}")
        self.service = SettingsService(
            create_session_factory(engine),
            "user",
            windows=False,
            environ={"HOME": str(self.home)},
        )
        self.old = self.home / ".local" / "share" / "pipwerk" / "studio" / "objects"
        self.old.mkdir(parents=True)
        self.names = sorted(
            f"{object_id}.{kind}.json" for object_id, kind in zip(IDS, KINDS, strict=True)
        )
        for name in self.names:
            (self.old / name).write_text(f"content of {name}", encoding="utf-8")

    def old_names(self) -> list[str]:
        return sorted(item.name for item in self.old.iterdir())

    def new_names(self) -> list[str]:
        return sorted(item.name for item in self.new.iterdir()) if self.new.exists() else []


@pytest.fixture
def setup(tmp_path: Path) -> Setup:
    return Setup(tmp_path)


def fail_when(
    predicate: Callable[[Path, Path, int], bool],
) -> Callable[[Path, Path], None]:
    """A replacement for the move of one file that fails when ``predicate`` says so."""
    real = object_store._move_file
    calls = {"count": 0}

    def move(source: Path, target: Path) -> None:
        calls["count"] += 1
        if predicate(source, target, calls["count"]):
            raise OSError("failure with a secret detail")
        real(source, target)

    return move


# --- moving and not moving ----------------------------------------------------


def test_moving_moves_all_files_and_saves_the_setting_afterwards(
    setup: Setup, monkeypatch: pytest.MonkeyPatch
) -> None:
    (setup.old / "README.txt").write_text("foreign", encoding="utf-8")
    (setup.old / f"{IDS[0]}.strategy.json.tmp").write_text("temporary", encoding="utf-8")
    before = {name: (setup.old / name).stat().st_mtime_ns for name in setup.names}
    seen_setting: list[bool] = []
    real = object_store._move_file

    def move(source: Path, target: Path) -> None:
        # While moving, the setting still names the old directory.
        seen_setting.append(setup.service.get_object_directory().is_default)
        real(source, target)

    monkeypatch.setattr(object_store, "_move_file", move)

    result = setup.service.set_object_directory(str(setup.new), move=True)

    assert seen_setting == [True, True, True]
    assert result.path == setup.new
    assert result.is_default is False
    assert setup.new_names() == setup.names
    assert setup.old_names() == [f"{IDS[0]}.strategy.json.tmp", "README.txt"]
    for name in setup.names:
        assert (setup.new / name).read_text(encoding="utf-8") == f"content of {name}"
        assert (setup.new / name).stat().st_mtime_ns == before[name]
    assert (setup.old / "README.txt").read_text(encoding="utf-8") == "foreign"
    if os.name != "nt":
        assert stat.S_IMODE(setup.new.stat().st_mode) == 0o700


def test_after_moving_the_object_store_uses_the_new_directory(setup: Setup) -> None:
    setup.service.set_object_directory(str(setup.new), move=True)

    object_id = setup.service.object_store.create("trend", "{}")

    assert (setup.new / f"{object_id}.trend.json").is_file()
    assert [entry.object_id for entry in setup.service.object_store.list_objects("strategy")] == [
        IDS[0]
    ]
    assert setup.old_names() == []


def test_not_moving_only_saves_the_setting(setup: Setup) -> None:
    result = setup.service.set_object_directory(str(setup.new), move=False)

    assert result.path == setup.new
    assert result.is_default is False
    assert setup.old_names() == setup.names
    assert not setup.new.exists()
    assert setup.service.object_store.list_objects("strategy") == []


def test_moving_without_an_old_directory_only_saves_the_setting(setup: Setup) -> None:
    for name in setup.names:
        (setup.old / name).unlink()
    setup.old.rmdir()

    result = setup.service.set_object_directory(str(setup.new), move=True)

    assert result.path == setup.new
    assert not setup.new.exists()


def test_moving_without_any_default_directory_only_saves_the_setting(tmp_path: Path) -> None:
    engine = create_studio_engine(f"sqlite:///{tmp_path / 'studio.db'}")
    service = SettingsService(create_session_factory(engine), "user", windows=False, environ={})

    result = service.set_object_directory(str(tmp_path / "new"), move=True)

    assert result.path == tmp_path / "new"


def test_moving_from_a_stored_directory(setup: Setup, tmp_path: Path) -> None:
    setup.service.set_object_directory(str(setup.new), move=True)
    third = tmp_path / "third"

    setup.service.set_object_directory(str(third), move=True)

    assert sorted(item.name for item in third.iterdir()) == setup.names
    assert setup.new_names() == []
    assert setup.service.get_object_directory().path == third


@pytest.mark.skipif(os.name == "nt", reason="symbolic links need extra rights on Windows")
def test_moving_to_the_same_directory_by_another_name_changes_nothing(
    setup: Setup, tmp_path: Path
) -> None:
    alias = tmp_path / "alias"
    alias.symlink_to(setup.old, target_is_directory=True)

    result = setup.service.set_object_directory(str(alias), move=True)

    assert result.path == alias
    assert setup.old_names() == setup.names


@pytest.mark.skipif(os.name == "nt", reason="symbolic links need extra rights on Windows")
def test_a_symbolic_link_in_the_old_directory_is_not_moved(setup: Setup, tmp_path: Path) -> None:
    outside = tmp_path / "outside.json"
    outside.write_text("outside", encoding="utf-8")
    link = f"{IDS[0]}.ruleset.json"
    (setup.old / link).symlink_to(outside)

    setup.service.set_object_directory(str(setup.new), move=True)

    assert (setup.old / link).is_symlink()
    assert link not in setup.new_names()
    assert outside.read_text(encoding="utf-8") == "outside"


def test_moving_into_an_existing_empty_directory(setup: Setup) -> None:
    setup.new.mkdir(parents=True)

    setup.service.set_object_directory(str(setup.new), move=True)

    assert setup.new_names() == setup.names


def test_other_files_in_the_new_directory_are_left_alone(setup: Setup) -> None:
    setup.new.mkdir(parents=True)
    (setup.new / "other.txt").write_text("other", encoding="utf-8")

    setup.service.set_object_directory(str(setup.new), move=True)

    assert (setup.new / "other.txt").read_text(encoding="utf-8") == "other"
    assert setup.new_names() == sorted([*setup.names, "other.txt"])


# --- conflict --------------------------------------------------------------------


def test_a_file_of_the_same_name_in_the_new_directory_rejects_the_change(setup: Setup) -> None:
    setup.new.mkdir(parents=True)
    (setup.new / setup.names[1]).write_text("existing content", encoding="utf-8")

    with pytest.raises(ObjectConflictError) as caught:
        setup.service.set_object_directory(str(setup.new), move=True)

    assert caught.value.names == [setup.names[1]]
    assert setup.old_names() == setup.names
    assert setup.new_names() == [setup.names[1]]
    assert (setup.new / setup.names[1]).read_text(encoding="utf-8") == "existing content"
    assert setup.service.get_object_directory().is_default is True


def test_a_conflict_does_not_matter_without_moving(setup: Setup) -> None:
    setup.new.mkdir(parents=True)
    (setup.new / setup.names[1]).write_text("existing content", encoding="utf-8")

    result = setup.service.set_object_directory(str(setup.new), move=False)

    assert result.path == setup.new
    assert (setup.new / setup.names[1]).read_text(encoding="utf-8") == "existing content"
    assert setup.old_names() == setup.names


@pytest.mark.skipif(os.name == "nt", reason="symbolic links need extra rights on Windows")
def test_a_symbolic_link_with_the_name_in_the_new_directory_is_a_conflict(
    setup: Setup, tmp_path: Path
) -> None:
    setup.new.mkdir(parents=True)
    (setup.new / setup.names[0]).symlink_to(tmp_path / "does-not-exist")

    with pytest.raises(ObjectConflictError):
        setup.service.set_object_directory(str(setup.new), move=True)

    assert setup.old_names() == setup.names


def test_a_file_that_comes_into_being_after_the_check_is_never_overwritten(
    setup: Setup, monkeypatch: pytest.MonkeyPatch
) -> None:
    real = object_store._move_file

    def move(source: Path, target: Path) -> None:
        if source.name == setup.names[1]:
            target.write_text("created in between", encoding="utf-8")
        real(source, target)

    monkeypatch.setattr(object_store, "_move_file", move)

    with pytest.raises(ObjectMoveError):
        setup.service.set_object_directory(str(setup.new), move=True)

    assert (setup.new / setup.names[1]).read_text(encoding="utf-8") == "created in between"
    assert setup.old_names() == setup.names
    assert setup.new_names() == [setup.names[1]]
    assert setup.service.get_object_directory().is_default is True


def test_a_file_that_comes_into_being_after_the_check_is_never_overwritten_by_the_copy(
    setup: Setup, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The same race when linking is not possible and the file is copied."""
    real_link = os.link

    def link(source: str | os.PathLike[str], target: str | os.PathLike[str]) -> None:
        if Path(source).parent == setup.old:
            raise OSError(errno.EXDEV, "cross-device link")
        real_link(source, target)

    real_copy = object_store._copy_file

    def copy(source: Path, target: Path) -> None:
        if source.name == setup.names[1]:
            target.write_text("created in between", encoding="utf-8")
        real_copy(source, target)

    monkeypatch.setattr(os, "link", link)
    monkeypatch.setattr(object_store, "_copy_file", copy)

    with pytest.raises(ObjectMoveError):
        setup.service.set_object_directory(str(setup.new), move=True)

    assert (setup.new / setup.names[1]).read_text(encoding="utf-8") == "created in between"
    assert setup.old_names() == setup.names
    assert setup.new_names() == [setup.names[1]]
    assert setup.service.get_object_directory().is_default is True


def test_files_are_copied_if_linking_is_not_possible(
    setup: Setup, monkeypatch: pytest.MonkeyPatch
) -> None:
    real_link = os.link

    def link(source: str | os.PathLike[str], target: str | os.PathLike[str]) -> None:
        if Path(source).parent == setup.old:
            raise OSError(errno.EXDEV, "cross-device link")
        real_link(source, target)

    monkeypatch.setattr(os, "link", link)

    setup.service.set_object_directory(str(setup.new), move=True)

    assert setup.new_names() == setup.names
    assert setup.old_names() == []
    for name in setup.names:
        assert (setup.new / name).read_text(encoding="utf-8") == f"content of {name}"


# --- failure on the way -----------------------------------------------------------


def test_a_failure_on_the_way_brings_the_files_back_and_keeps_the_old_setting(
    setup: Setup, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(
        object_store, "_move_file", fail_when(lambda source, target, count: count == 3)
    )

    with pytest.raises(ObjectMoveError) as caught:
        setup.service.set_object_directory(str(setup.new), move=True)

    assert "secret" not in str(caught.value)
    assert setup.old_names() == setup.names
    assert setup.new_names() == []
    for name in setup.names:
        assert (setup.old / name).read_text(encoding="utf-8") == f"content of {name}"
    assert setup.service.get_object_directory().is_default is True
    assert setup.service.get_object_directory().path == setup.old


def test_a_failure_with_the_first_file_leaves_everything_as_it_was(
    setup: Setup, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(object_store, "_move_file", fail_when(lambda *_: True))

    with pytest.raises(ObjectMoveError):
        setup.service.set_object_directory(str(setup.new), move=True)

    assert setup.old_names() == setup.names
    assert setup.service.get_object_directory().is_default is True


def test_a_target_directory_that_cannot_be_created_moves_nothing(
    setup: Setup, tmp_path: Path
) -> None:
    blocker = tmp_path / "blocker"
    blocker.write_text("a file", encoding="utf-8")

    with pytest.raises(ObjectMoveError):
        setup.service.set_object_directory(str(blocker / "objects"), move=True)

    assert setup.old_names() == setup.names
    assert setup.service.get_object_directory().is_default is True


def test_a_failure_to_save_the_setting_after_moving_brings_the_files_back(
    setup: Setup, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fail(_apply: object) -> None:
        raise OperationalError("statement", {}, Exception("database detail"))

    monkeypatch.setattr(setup.service, "_update_record", fail)

    with pytest.raises(ObjectMoveError) as caught:
        setup.service.set_object_directory(str(setup.new), move=True)

    assert "database detail" not in str(caught.value)
    assert setup.old_names() == setup.names
    assert setup.new_names() == []


def test_a_failure_to_save_the_setting_without_moving_is_raised_as_it_is(
    setup: Setup, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fail(_apply: object) -> None:
        raise OperationalError("statement", {}, Exception("database detail"))

    monkeypatch.setattr(setup.service, "_update_record", fail)

    with pytest.raises(OperationalError):
        setup.service.set_object_directory(str(setup.new), move=False)

    assert setup.old_names() == setup.names


# --- failure of bringing the files back ---------------------------------------------


def test_a_failure_of_bringing_the_files_back_names_both_directories_and_the_files(
    setup: Setup, monkeypatch: pytest.MonkeyPatch
) -> None:
    second = setup.names[1]

    def predicate(source: Path, target: Path, count: int) -> bool:
        moving_forward = source.parent == setup.old
        return (moving_forward and count == 3) or (not moving_forward and source.name == second)

    monkeypatch.setattr(object_store, "_move_file", fail_when(predicate))

    with pytest.raises(ObjectMoveRollbackError) as caught:
        setup.service.set_object_directory(str(setup.new), move=True)

    assert caught.value.source == setup.old
    assert caught.value.target == setup.new
    assert caught.value.names == [second]
    assert "secret" not in str(caught.value)
    assert setup.old_names() == [setup.names[0], setup.names[2]]
    assert setup.new_names() == [second]
    assert (setup.new / second).read_text(encoding="utf-8") == f"content of {second}"
    assert setup.service.get_object_directory().is_default is True


def test_all_files_that_cannot_be_brought_back_are_named(
    setup: Setup, monkeypatch: pytest.MonkeyPatch
) -> None:
    def predicate(source: Path, target: Path, count: int) -> bool:
        return count >= 3 or source.parent == setup.new

    monkeypatch.setattr(object_store, "_move_file", fail_when(predicate))

    with pytest.raises(ObjectMoveRollbackError) as caught:
        setup.service.set_object_directory(str(setup.new), move=True)

    assert caught.value.names == setup.names[:2]
    assert setup.old_names() == [setup.names[2]]
    assert setup.new_names() == setup.names[:2]


def test_a_failure_to_save_and_to_bring_the_files_back_names_the_files(
    setup: Setup, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fail(_apply: object) -> None:
        raise OperationalError("statement", {}, Exception("database detail"))

    monkeypatch.setattr(setup.service, "_update_record", fail)
    monkeypatch.setattr(
        object_store,
        "_move_file",
        fail_when(lambda source, target, count: source.parent == setup.new),
    )

    with pytest.raises(ObjectMoveRollbackError) as caught:
        setup.service.set_object_directory(str(setup.new), move=True)

    assert caught.value.names == setup.names
    assert setup.new_names() == setup.names


# --- locking -------------------------------------------------------------------------


def test_writes_of_the_object_store_wait_for_a_change_of_the_directory(
    setup: Setup, monkeypatch: pytest.MonkeyPatch
) -> None:
    moving = threading.Event()
    proceed = threading.Event()
    real = object_store._move_file

    def slow_move(source: Path, target: Path) -> None:
        moving.set()
        assert proceed.wait(timeout=10)
        real(source, target)

    monkeypatch.setattr(object_store, "_move_file", slow_move)
    changer = threading.Thread(
        target=lambda: setup.service.set_object_directory(str(setup.new), move=True)
    )
    written: list[str] = []
    writer = threading.Thread(
        target=lambda: written.append(setup.service.object_store.create("rule", "{}"))
    )

    changer.start()
    assert moving.wait(timeout=10)
    writer.start()
    writer.join(timeout=0.5)
    still_waiting = writer.is_alive()
    proceed.set()
    changer.join(timeout=10)
    writer.join(timeout=10)

    assert still_waiting
    assert len(written) == 1
    # The write happened after the change: the new object is in the new directory.
    assert (setup.new / f"{written[0]}.rule.json").is_file()
    assert setup.old_names() == []


def test_two_changes_of_the_directory_are_locked_against_each_other(
    setup: Setup, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    moving = threading.Event()
    proceed = threading.Event()
    real = object_store._move_file
    first_call = {"done": False}

    def slow_move(source: Path, target: Path) -> None:
        if not first_call["done"]:
            first_call["done"] = True
            moving.set()
            assert proceed.wait(timeout=10)
        real(source, target)

    monkeypatch.setattr(object_store, "_move_file", slow_move)
    third = tmp_path / "third"
    first = threading.Thread(
        target=lambda: setup.service.set_object_directory(str(setup.new), move=True)
    )
    second_finished = threading.Event()

    def second_change() -> None:
        setup.service.set_object_directory(str(third), move=True)
        second_finished.set()

    second = threading.Thread(target=second_change)

    first.start()
    assert moving.wait(timeout=10)
    second.start()
    assert not second_finished.wait(timeout=0.5)
    proceed.set()
    first.join(timeout=10)
    second.join(timeout=10)

    assert second_finished.is_set()
    assert sorted(item.name for item in third.iterdir()) == setup.names
    assert setup.old_names() == []
    assert setup.new_names() == []
    assert setup.service.get_object_directory().path == third
