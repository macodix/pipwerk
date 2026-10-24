"""Tests of the return of the free space of the database after deleting and replacing (5.6)."""

from __future__ import annotations

import sqlite3
from pathlib import Path

from datastock import BROKER, SERIES_URL, begin, candles_json, end, import_json_file, make_app
from fastapi.testclient import TestClient

from pipwerk_replay.app import create_app

DELETE_SERIES = "/api/v1/market-data/deletions/series"
BIG = 20_000  # M1 candles, about 14 days: a few MiB in the database


def size(tmp_path: Path) -> int:
    return (tmp_path / "replay.db").stat().st_size


def pragma(tmp_path: Path, name: str) -> int:
    with sqlite3.connect(tmp_path / "replay.db") as connection:
        return int(connection.execute(f"PRAGMA {name}").fetchone()[0])


def test_a_new_database_is_made_able_to_return_space(tmp_path: Path) -> None:
    make_app(tmp_path)

    assert pragma(tmp_path, "auto_vacuum") == 2  # INCREMENTAL


def test_the_file_becomes_smaller_after_deleting_a_large_series(tmp_path: Path) -> None:
    client = TestClient(make_app(tmp_path))
    import_json_file(client, candles_json(BIG, instrument="BIG"))
    import_json_file(client, candles_json(10, instrument="SMALL"))
    full = size(tmp_path)
    assert full > 1_000_000

    response = client.post(
        DELETE_SERIES,
        json={"broker": BROKER, "instrument": "BIG", "data": "m1", "confirm": True},
    )

    assert response.status_code == 200, response.text
    assert size(tmp_path) < full / 2
    assert pragma(tmp_path, "freelist_count") == 0
    remaining = client.get(SERIES_URL).json()["items"]
    assert [item["instrument"] for item in remaining] == ["SMALL"]


def test_a_check_without_confirmation_does_not_change_the_file(tmp_path: Path) -> None:
    client = TestClient(make_app(tmp_path))
    import_json_file(client, candles_json(2000, instrument="BIG"))
    full = size(tmp_path)

    response = client.post(
        DELETE_SERIES,
        json={"broker": BROKER, "instrument": "BIG", "data": "m1", "confirm": False},
    )

    assert response.status_code == 200
    assert size(tmp_path) == full


def test_replacing_leaves_no_free_pages_in_the_file(tmp_path: Path) -> None:
    client = TestClient(make_app(tmp_path))
    import_json_file(client, candles_json(BIG, instrument="BIG"))
    full = size(tmp_path)

    # the same series again, now with 10 candles: they replace the rows of their period
    process = begin(client)
    response = client.post(
        f"/api/v1/market-data/import-processes/{process}/files",
        data={"broker": BROKER},
        files=[("file", ("again.json", candles_json(10, instrument="BIG"), "application/json"))],
    )
    end(client, process)

    assert response.status_code == 200, response.text
    assert pragma(tmp_path, "freelist_count") == 0
    assert size(tmp_path) <= full


def test_an_existing_database_of_the_old_kind_is_converted_once_at_the_start(
    tmp_path: Path,
) -> None:
    first = TestClient(make_app(tmp_path))
    import_json_file(first, candles_json(500, instrument="KEEP"))
    with sqlite3.connect(tmp_path / "replay.db") as connection:
        connection.execute("PRAGMA auto_vacuum = NONE")
        connection.execute("VACUUM")
    assert pragma(tmp_path, "auto_vacuum") == 0

    second = TestClient(create_app(f"sqlite:///{tmp_path / 'replay.db'}"))

    assert pragma(tmp_path, "auto_vacuum") == 2
    assert [item["instrument"] for item in second.get(SERIES_URL).json()["items"]] == ["KEEP"]
