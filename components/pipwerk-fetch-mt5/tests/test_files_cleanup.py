"""Tests of the cleanup of temporary files: after an interruption, after an error, and at the
start of the next call (req-system-028, order 19)."""

import os
import signal
from pathlib import Path

import pytest
from test_cli import archive, config_file, names, run

from pipwerk_fetch_mt5.errors import FetchError
from pipwerk_fetch_mt5.files import TEMPORARY_PATTERN, remove_stale_temporaries, write_file

CALL = ("--from", "2026-01-05", "--to", "2026-01-06", "-u", "H1", "EURUSD")


# --- write_file ---------------------------------------------------------------------------------


def test_an_interruption_while_writing_leaves_no_temporary_file_and_keeps_the_old_file(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    (tmp_path / "a.json").write_bytes(b"old")

    def interrupt(_descriptor: int) -> None:
        raise KeyboardInterrupt

    monkeypatch.setattr(os, "fsync", interrupt)
    with pytest.raises(KeyboardInterrupt):
        write_file(tmp_path, "a.json", b"new")
    assert [item.name for item in tmp_path.iterdir()] == ["a.json"]
    assert (tmp_path / "a.json").read_bytes() == b"old"


def test_an_interruption_without_an_old_file_leaves_the_directory_empty(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    def interrupt(self: Path, target: object) -> Path:
        raise KeyboardInterrupt

    monkeypatch.setattr(Path, "replace", interrupt)
    with pytest.raises(KeyboardInterrupt):
        write_file(tmp_path, "a.json", b"new")
    assert list(tmp_path.iterdir()) == []


def test_the_temporary_file_has_the_name_of_the_pattern(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    seen: list[str] = []

    def look(self: Path, target: object) -> Path:
        seen.extend(item.name for item in self.parent.iterdir())
        raise OSError("stop")

    monkeypatch.setattr(Path, "replace", look)
    with pytest.raises(FetchError):
        write_file(tmp_path, "a.json", b"new")
    assert len(seen) == 1
    assert TEMPORARY_PATTERN.fullmatch(seen[0]) is not None


# --- remove_stale_temporaries -------------------------------------------------------------------


def test_stale_temporary_files_are_removed_and_nothing_else(tmp_path: Path) -> None:
    stale = [".pipwerk-fetch-mt5-abcd1234.tmp", ".pipwerk-fetch-mt5-a_9z0000.tmp"]
    kept = [
        "EURUSD_H1_20260105_20260201.json",
        "notes.tmp",
        ".abcd1234.tmp",
        ".pipwerk-fetch-mt5-abcd1234.tmp.bak",
        ".pipwerk-fetch-mt5-ABCD1234.tmp",
        ".pipwerk-fetch-mt5-abc.tmp",
        "x.pipwerk-fetch-mt5-abcd1234.tmp",
    ]
    for name in (*stale, *kept):
        (tmp_path / name).write_bytes(b"x")
    (tmp_path / ".pipwerk-fetch-mt5-dir00000.tmp").mkdir()
    assert remove_stale_temporaries(tmp_path) == 2
    assert sorted(item.name for item in tmp_path.iterdir()) == sorted(
        [*kept, ".pipwerk-fetch-mt5-dir00000.tmp"]
    )


def test_a_link_with_the_pattern_is_not_followed_or_removed(tmp_path: Path) -> None:
    outside = tmp_path / "outside.json"
    outside.write_bytes(b"x")
    directory = tmp_path / "out"
    directory.mkdir()
    link = directory / ".pipwerk-fetch-mt5-link0000.tmp"
    try:
        link.symlink_to(outside)
    except OSError:
        pytest.skip("no symbolic links here")
    assert remove_stale_temporaries(directory) == 0
    assert link.is_symlink()
    assert outside.read_bytes() == b"x"


def test_nothing_to_remove_gives_zero_and_a_missing_directory_too(tmp_path: Path) -> None:
    assert remove_stale_temporaries(tmp_path) == 0
    assert remove_stale_temporaries(tmp_path / "missing") == 0


# --- the call -----------------------------------------------------------------------------------


def test_ctrl_c_while_writing_leaves_only_finished_files(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch
) -> None:
    target = tmp_path / "out"
    target.mkdir()
    old = "EURUSD_H1_20260105_20260106.json"
    (target / old).write_bytes(b"old")
    calls = 0
    real_fsync = os.fsync

    def interrupt_second(descriptor: int) -> None:
        nonlocal calls
        calls += 1
        if calls == 2:  # the first file (CONTRACT) is finished, the second is cut off
            raise KeyboardInterrupt
        real_fsync(descriptor)

    monkeypatch.setattr(os, "fsync", interrupt_second)
    result = run(capsys, archive(), config_file(tmp_path), "-o", str(target), *CALL)
    assert result.code == 130
    assert "Abgebrochen" in result.err
    assert names(target) == ["EURUSD_CONTRACT_20260105_20260106.json", old]
    assert (target / old).read_bytes() == b"old"  # complete and unchanged


@pytest.mark.skipif(not hasattr(signal, "SIGTERM"), reason="no SIGTERM")
def test_a_request_to_end_is_handled_like_ctrl_c(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch
) -> None:
    target = tmp_path / "out"
    target.mkdir()
    real_fsync = os.fsync

    def terminate(descriptor: int) -> None:
        os.kill(os.getpid(), signal.SIGTERM)
        real_fsync(descriptor)

    before = signal.getsignal(signal.SIGTERM)
    monkeypatch.setattr(os, "fsync", terminate)
    result = run(capsys, archive(), config_file(tmp_path), "-o", str(target), *CALL)
    assert result.code == 130
    assert names(target) == []
    assert signal.getsignal(signal.SIGTERM) == before  # the handler is put back


def test_an_error_while_writing_leaves_no_temporary_file(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch
) -> None:
    target = tmp_path / "out"
    target.mkdir()

    def refuse(_descriptor: int) -> None:
        raise OSError("disk full")

    monkeypatch.setattr(os, "fsync", refuse)
    result = run(capsys, archive(), config_file(tmp_path), "-o", str(target), *CALL)
    assert result.code == 1
    assert names(target) == []


def test_the_next_call_removes_stale_temporary_files_and_only_those(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    target = tmp_path / "out"
    target.mkdir()
    (target / ".pipwerk-fetch-mt5-abcd1234.tmp").write_bytes(b"half")
    (target / "other.tmp").write_bytes(b"mine")
    (target / "mine.json").write_bytes(b"{}")
    result = run(capsys, archive(), config_file(tmp_path), "-o", str(target), *CALL)
    assert result.code == 0, result.err
    assert "Zwischendateien eines früheren Abbruchs entfernt: 1" in result.out
    assert names(target) == [
        "EURUSD_CONTRACT_20260105_20260106.json",
        "EURUSD_H1_20260105_20260106.json",
        "mine.json",
        "other.tmp",
    ]


def test_nothing_to_remove_says_nothing_about_it(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    target = tmp_path / "out"
    result = run(capsys, archive(), config_file(tmp_path), "-o", str(target), *CALL)
    assert result.code == 0, result.err
    assert "Zwischendateien" not in result.out
