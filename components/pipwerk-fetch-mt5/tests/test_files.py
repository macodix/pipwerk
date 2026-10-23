"""Tests of the names of the files and of writing them (specification 5.4 and 11)."""

from datetime import UTC, datetime, timedelta, timezone
from pathlib import Path

import pytest

from pipwerk_fetch_mt5.errors import FetchError
from pipwerk_fetch_mt5.files import file_name, stamp, write_file

START = datetime(2026, 1, 5, tzinfo=UTC)
END = datetime(2026, 2, 1, tzinfo=UTC)


# --- names ------------------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("instrument", "data", "expected"),
    [
        ("EURUSD", "M1", "EURUSD_M1_20260105_20260201.json"),
        ("EURUSD", "H1", "EURUSD_H1_20260105_20260201.json"),
        ("EURUSD", "MN1", "EURUSD_MN1_20260105_20260201.json"),
        ("EURUSD", "TICKS", "EURUSD_TICKS_20260105_20260201.json"),
        ("EURUSD", "CONTRACT", "EURUSD_CONTRACT_20260105_20260201.json"),
        ("GER40.cash", "H1", "GER40.cash_H1_20260105_20260201.json"),
        ("US_30#2", "D1", "US_30#2_D1_20260105_20260201.json"),
    ],
)
def test_the_name_is_instrument_data_from_to(instrument: str, data: str, expected: str) -> None:
    assert file_name(instrument, data, START, END) == expected


def test_a_moment_that_is_not_midnight_carries_the_time_and_is_in_utc() -> None:
    start = datetime(2026, 1, 5, 10, 30, tzinfo=timezone(timedelta(hours=2)))
    assert stamp(start) == "20260105T083000"
    assert file_name("EURUSD", "M1", start, END) == "EURUSD_M1_20260105T083000_20260201.json"


@pytest.mark.parametrize(
    "instrument",
    ["", "../x", "a/b", "a\\b", ".x", "-x", "a b", "a\nb", "a\x00b", "ü", "A" * 65, "a:b", "a*b"],
)
def test_a_designation_with_a_path_or_unusual_characters_gives_no_name(instrument: str) -> None:
    with pytest.raises(ValueError, match="not allowed"):
        file_name(instrument, "H1", START, END)


@pytest.mark.parametrize("data", ["", "h1", "H 1", "../H1", "H1/x", "TOOLONGDATA1"])
def test_data_that_is_no_time_unit_ticks_or_contract_gives_no_name(data: str) -> None:
    with pytest.raises(ValueError, match="not allowed"):
        file_name("EURUSD", data, START, END)


def test_the_name_has_no_path_part_for_any_allowed_designation() -> None:
    for instrument in ("EURUSD", "a..b", "x.y.z", "A_B_C"):
        name = file_name(instrument, "H1", START, END)
        assert name == Path(name).name  # one component, no separator


# --- writing ----------------------------------------------------------------------------------


def test_a_file_is_written_into_the_directory(tmp_path: Path) -> None:
    path = write_file(tmp_path, "a.json", b'{"x": 1}')
    assert path == tmp_path / "a.json"
    assert path.read_bytes() == b'{"x": 1}'
    assert [item.name for item in tmp_path.iterdir()] == ["a.json"]  # no temporary file left


def test_a_file_of_the_same_name_is_replaced(tmp_path: Path) -> None:
    (tmp_path / "a.json").write_bytes(b"old")
    write_file(tmp_path, "a.json", b"new")
    assert (tmp_path / "a.json").read_bytes() == b"new"
    assert [item.name for item in tmp_path.iterdir()] == ["a.json"]


def test_a_failed_replacement_keeps_the_old_file_and_leaves_no_temporary_file(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    (tmp_path / "a.json").write_bytes(b"old")

    def refuse(self: Path, target: object) -> Path:
        raise OSError("disk full")

    monkeypatch.setattr(Path, "replace", refuse)
    with pytest.raises(FetchError) as error:
        write_file(tmp_path, "a.json", b"new")
    assert error.value.code == "write_failed"
    assert (tmp_path / "a.json").read_bytes() == b"old"
    assert [item.name for item in tmp_path.iterdir()] == ["a.json"]


def test_a_failure_while_writing_leaves_no_half_file(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    import os

    def refuse(_descriptor: int) -> None:
        raise OSError("disk full")

    monkeypatch.setattr(os, "fsync", refuse)
    with pytest.raises(FetchError):
        write_file(tmp_path, "a.json", b"new")
    assert list(tmp_path.iterdir()) == []


def test_a_missing_directory_is_a_failed_part(tmp_path: Path) -> None:
    with pytest.raises(FetchError) as error:
        write_file(tmp_path / "missing", "a.json", b"x")
    assert error.value.code == "write_failed"


def test_a_directory_in_the_place_of_the_file_is_a_failed_part_and_stays(tmp_path: Path) -> None:
    (tmp_path / "a.json").mkdir()
    with pytest.raises(FetchError):
        write_file(tmp_path, "a.json", b"x")
    assert (tmp_path / "a.json").is_dir()
    assert [item.name for item in tmp_path.iterdir()] == ["a.json"]


@pytest.mark.parametrize("name", ["", ".", "..", "../a.json", "sub/a.json", "a\\b/c", "a\x00.json"])
def test_a_name_with_a_path_is_never_written(tmp_path: Path, name: str) -> None:
    with pytest.raises(ValueError, match="plain file name"):
        write_file(tmp_path, name, b"x")
    assert list(tmp_path.iterdir()) == []
