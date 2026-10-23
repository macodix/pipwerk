"""Tests of the import of several files (``POST /api/v1/market-data/imports``) and of its preview
(``.../imports/preview``): specification 5.3, 11 and the order of the web API.

The data stock is the real one (SQLite in the tests); the results are read back through the list
of series, as a user sees them.
"""

from __future__ import annotations

import json
import threading
from datetime import timedelta
from pathlib import Path
from typing import Any

import pytest
from datastock import (
    BROKER,
    CANDLE_HEADER,
    EXAMPLE_BROKER,
    FIRST_MINUTE,
    IMPORT_URL,
    PREVIEW_URL,
    SERIES_URL,
    TICK_HEADER,
    candle_entry,
    candle_row,
    candles_document,
    candles_json,
    csv_file,
    example,
    make_app,
    raw_form,
    tick_row,
    upload,
)
from fastapi.testclient import TestClient
from pipwerk_marketdata import MarketDataStore

from pipwerk_replay.config import MarketDataSettings

BODY_INVALID = "The request body does not fit the schema."
BODY_TOO_LARGE = {"detail": "The request body is larger than the limit."}

CANDLES_CSV = csv_file(CANDLE_HEADER, candle_row("10:00:00"), candle_row("10:01:00"))
TICKS_CSV = csv_file(TICK_HEADER, tick_row("10:00:00.250"), tick_row("10:00:01.500"))


def make_client(tmp_path: Path, **settings: Any) -> TestClient:
    marketdata = MarketDataSettings(**settings) if settings else None
    return TestClient(make_app(tmp_path, marketdata=marketdata))


@pytest.fixture
def client(tmp_path: Path) -> TestClient:
    return make_client(tmp_path)


def series(client: TestClient) -> list[tuple[str, str, str]]:
    items = client.get(SERIES_URL).json()["items"]
    return [(item["broker"], item["instrument"], item["data"]) for item in items]


def outcome(response: Any, index: int = 0) -> dict[str, Any]:
    assert response.status_code == 200, response.text
    file: dict[str, Any] = response.json()["files"][index]
    return file


# --- one import of several files -----------------------------------------------------------------


def test_several_files_are_imported_in_one_process_with_a_result_per_file(
    client: TestClient,
) -> None:
    files = [
        ("candles.json", example("candles.json")),
        ("ticks.json", example("ticks.json")),
        ("instrument.json", example("instrument.json")),
        ("EURUSD_M1_202401021000_202401021001.csv", CANDLES_CSV),
        ("EURUSD,TICKS.csv", TICKS_CSV),
    ]

    response = upload(
        client,
        files,
        broker="Live-Server",
        timezone="Europe/Athens",
        instruments=["", "", "", "GBPUSD", "GBPUSD"],
        datas=["", "", "", "m1", "ticks"],
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert (body["imported_count"], body["refused_count"]) == (5, 0)
    assert [item["name"] for item in body["files"]] == [name for name, _ in files]
    assert [item["refused"] for item in body["files"]] == [False] * 5
    kinds = [item["result"]["kind"] for item in body["files"]]
    assert kinds == ["candles", "ticks", "instrument", "candles", "ticks"]
    # the broker of the process also replaces the broker named in a JSON file
    assert {item["result"]["broker"] for item in body["files"]} == {"Live-Server"}
    csv_candles = body["files"][3]["result"]
    assert (csv_candles["instrument"], csv_candles["unit"]) == ("GBPUSD", "m1")
    assert csv_candles["accepted"] == 2
    assert csv_candles["period_start"] == "2024-01-02T08:00:00Z"  # Athens is UTC+2 in January
    assert series(client) == [
        ("Live-Server", "EURUSD", "m1"),
        ("Live-Server", "EURUSD", "ticks"),
        ("Live-Server", "GBPUSD", "m1"),
        ("Live-Server", "GBPUSD", "ticks"),
    ]


def test_a_refused_file_does_not_stop_the_others(client: TestClient) -> None:
    files = [
        ("first.json", candles_json(2, instrument="AAA")),
        ("broken.json", b"this is not json"),
        ("second.json", candles_json(3, instrument="CCC")),
    ]

    response = upload(client, files)

    assert response.status_code == 200
    body = response.json()
    assert (body["imported_count"], body["refused_count"]) == (2, 1)
    first, broken, second = body["files"]
    assert (first["refused"], first["result"]["accepted"]) == (False, 2)
    assert broken == {
        "name": "broken.json",
        "refused": True,
        "result": None,
        "error": "json_invalid",
        "message": broken["message"],
    }
    assert isinstance(broken["message"], str)
    assert (second["refused"], second["result"]["accepted"]) == (False, 3)
    assert series(client) == [(BROKER, "AAA", "m1"), (BROKER, "CCC", "m1")]


def test_only_the_file_to_correct_is_imported_again(client: TestClient) -> None:
    first = upload(client, [("a.json", candles_json(2)), ("b.json", b"{}")])
    assert [item["refused"] for item in first.json()["files"]] == [False, True]

    again = upload(client, [("b.json", candles_json(2, instrument="BBB"))])

    assert again.json()["imported_count"] == 1
    assert series(client) == [(BROKER, "BBB", "m1"), (BROKER, "EURUSD", "m1")]


@pytest.mark.parametrize(
    ("content", "code"),
    [
        (b"this is not json", "json_invalid"),
        (b"\xff\xfe\x00", "not_decodable"),
        (b"[]", "document_invalid"),
        (b'{"version": 1}', "document_invalid"),
        (b'{"version": 2, "kind": "candles"}', "document_invalid"),
    ],
)
def test_a_json_file_that_is_refused_as_a_whole_changes_nothing(
    client: TestClient, content: bytes, code: str
) -> None:
    file = outcome(upload(client, [("f.json", content)]))

    assert file["refused"] is True
    assert file["error"] == code
    assert series(client) == []


def test_the_text_of_a_refusal_does_not_repeat_the_content_of_the_file(client: TestClient) -> None:
    response = upload(client, [("f.json", b'{"version": 1, "kind": "secret-content-9"}')])

    assert response.status_code == 200
    assert "secret-content-9" not in response.text


def test_rows_that_fail_the_checks_are_rejected_with_their_reason(client: TestClient) -> None:
    entries = [
        candle_entry(FIRST_MINUTE),
        candle_entry(FIRST_MINUTE + timedelta(minutes=1), high=1.0, low=1.0, close=1.0),
        candle_entry(FIRST_MINUTE + timedelta(minutes=2)),
        candle_entry(FIRST_MINUTE + timedelta(minutes=2)),
    ]

    result = outcome(upload(client, [("f.json", candles_document(entries))]))["result"]

    assert result["accepted"] == 2
    assert result["rejected_count"] == 2
    assert result["rejected"] == [
        {"row": 2, "reason": "high_below_open"},
        {"row": 4, "reason": "time_duplicate"},
    ]


def test_csv_rows_are_rejected_with_their_line_and_reason(client: TestClient) -> None:
    data = csv_file(
        CANDLE_HEADER,
        candle_row("10:00:00"),
        candle_row("10:01:00", prices="1.10\tabc\t1.09\t1.11"),
        candle_row("09:59:00"),
        candle_row("03:30:00", date="2024.03.31"),
    )

    result = outcome(
        upload(
            client,
            [("EURUSD,M1.csv", data)],
            timezone="Europe/Athens",
            instruments=["EURUSD"],
            datas=["m1"],
        )
    )["result"]

    assert result["accepted"] == 1
    assert result["rejected"] == [
        {"row": 3, "reason": "value_invalid"},
        {"row": 4, "reason": "time_not_ascending"},
        {"row": 5, "reason": "local_time_not_existing"},
    ]


def test_importing_the_same_files_again_replaces_the_rows(client: TestClient) -> None:
    files = [("c.json", example("candles.json")), ("EURUSD,M5.csv", CANDLES_CSV)]
    kwargs: dict[str, Any] = {"timezone": "UTC", "instruments": ["", "EURUSD"], "datas": ["", "m5"]}
    upload(client, files, **kwargs)

    again = upload(client, files, **kwargs).json()

    assert [item["result"]["replaced"] for item in again["files"]] == [5, 2]
    items = client.get(SERIES_URL).json()["items"]
    assert [item["data"] for item in items] == ["m1", "m5"]


def test_the_number_of_listed_rejections_is_limited_and_all_are_counted(tmp_path: Path) -> None:
    client = make_client(tmp_path, max_reported_rejections=2)
    entries = [candle_entry(FIRST_MINUTE, open=-1.0)] * 5

    result = outcome(upload(client, [("f.json", candles_document(entries))]))["result"]

    assert (result["accepted"], result["rejected_count"], len(result["rejected"])) == (0, 5, 2)


# --- what the caller says about a file -----------------------------------------------------------


def test_instrument_and_data_of_a_json_file_come_from_its_content_and_can_be_changed_by_instrument(
    client: TestClient,
) -> None:
    same = outcome(
        upload(client, [("f.json", candles_json(2))], instruments=["GBPUSD"], datas=["m1"])
    )

    assert same["result"]["instrument"] == "GBPUSD"
    assert same["result"]["unit"] == "m1"


def test_data_of_a_json_file_cannot_be_changed(client: TestClient) -> None:
    file = outcome(upload(client, [("f.json", candles_json(2))], datas=["h1"]))

    assert file["refused"] is True
    assert file["error"] == "series_invalid"
    assert series(client) == []


@pytest.mark.parametrize("data", ["H1", "M1", "xyz", "Kerzen H1", "contract", "ticks h1"])
def test_data_that_is_unknown_for_a_csv_file_refuses_the_file_and_not_the_process(
    client: TestClient, data: str
) -> None:
    response = upload(
        client,
        [("a.csv", CANDLES_CSV), ("b.json", candles_json(2))],
        timezone="UTC",
        instruments=["EURUSD", ""],
        datas=[data, ""],
    )

    assert response.status_code == 200, response.text
    csv_file_outcome, json_file_outcome = response.json()["files"]
    assert (csv_file_outcome["refused"], csv_file_outcome["error"]) == (True, "series_invalid")
    assert json_file_outcome["refused"] is False
    assert series(client) == [(BROKER, "EURUSD", "m1")]


def test_a_csv_file_needs_instrument_and_data_and_the_time_zone(client: TestClient) -> None:
    no_instrument = outcome(upload(client, [("a.csv", CANDLES_CSV)], timezone="UTC", datas=["m1"]))
    no_data = outcome(upload(client, [("a.csv", CANDLES_CSV)], timezone="UTC", instruments=["I"]))
    no_zone = outcome(upload(client, [("a.csv", CANDLES_CSV)], instruments=["I"], datas=["m1"]))
    wrong_zone = outcome(
        upload(
            client,
            [("a.csv", CANDLES_CSV)],
            timezone="Nowhere/Land",
            instruments=["I"],
            datas=["m1"],
        )
    )

    assert [no_instrument["error"], no_data["error"]] == ["series_invalid", "series_invalid"]
    assert [no_zone["error"], wrong_zone["error"]] == ["timezone_unknown", "timezone_unknown"]
    assert series(client) == []


def test_the_time_zone_is_only_needed_for_csv_files(client: TestClient) -> None:
    response = upload(client, [("f.json", candles_json(2))], timezone=None)

    assert outcome(response)["refused"] is False


def test_a_csv_file_with_a_wrong_header_or_without_rows_is_refused(client: TestClient) -> None:
    files = [
        ("a.csv", csv_file("A\tB\tC", "1\t2\t3")),
        ("b.csv", b""),
        ("c.csv", csv_file(CANDLE_HEADER)),
    ]

    response = upload(
        client, files, timezone="UTC", instruments=["I", "I", "I"], datas=["m1", "m1", "m1"]
    )

    assert [item["error"] for item in response.json()["files"]] == [
        "header_invalid",
        "no_rows",
        "no_rows",
    ]


def test_the_format_follows_the_extension_and_else_the_content(client: TestClient) -> None:
    response = upload(
        client,
        [
            ("a.JSON", candles_json(2, instrument="AAA")),
            ("b.txt", CANDLES_CSV),
            ("c", candles_json(2, instrument="CCC")),  # no extension: JSON by its first character
            ("d.dat", CANDLES_CSV),  # no known extension: CSV
        ],
        timezone="UTC",
        instruments=["", "BBB", "", "DDD"],
        datas=["", "m1", "", "m1"],
    )

    assert [item["refused"] for item in response.json()["files"]] == [False] * 4
    assert [row[1] for row in series(client)] == ["AAA", "BBB", "CCC", "DDD"]


# --- limits --------------------------------------------------------------------------------------


def test_a_file_with_too_many_rows_is_refused_and_the_others_are_not(tmp_path: Path) -> None:
    client = make_client(tmp_path, max_rows=3)

    response = upload(client, [("a.json", candles_json(3)), ("b.json", candles_json(4))])

    first, second = response.json()["files"]
    assert first["refused"] is False
    assert (second["refused"], second["error"]) == (True, "too_many_rows")


def test_a_file_above_the_limit_of_a_file_is_refused_and_the_others_are_not(
    tmp_path: Path,
) -> None:
    client = make_client(tmp_path, max_upload_bytes=1024, max_import_bytes=4096)
    big = candles_json(30)
    assert len(big) > 1024

    response = upload(client, [("big.json", big), ("small.json", candles_json(1))])

    first, second = response.json()["files"]
    assert (first["refused"], first["error"]) == (True, "too_large")
    assert second["refused"] is False


def test_the_files_together_above_the_limit_of_an_import_refuse_the_whole_import(
    tmp_path: Path,
) -> None:
    client = make_client(tmp_path, max_upload_bytes=1024, max_import_bytes=1024)
    files = [(f"{n}.json", candles_json(2, instrument=f"I{n}")) for n in range(4)]
    assert max(len(content) for _, content in files) <= 1024
    assert 1024 < sum(len(content) for _, content in files) < 4096

    response = upload(client, files)

    assert response.status_code == 413
    body = response.json()
    assert body["code"] == "batch_too_large"
    assert body["detail"] == "The import is refused as a whole."
    assert series(client) == []


def test_more_files_than_allowed_refuse_the_whole_import(tmp_path: Path) -> None:
    client = make_client(tmp_path, max_files_per_import=2)
    files = [(f"{n}.json", candles_json(2, instrument=f"I{n}")) for n in range(3)]

    response = upload(client, files)

    assert response.status_code == 413
    assert response.json()["code"] == "too_many_files"
    assert series(client) == []
    assert upload(client, files[:2]).status_code == 200  # exactly the number allowed


def test_a_great_many_files_are_refused_the_same_way(tmp_path: Path) -> None:
    client = make_client(tmp_path, max_files_per_import=2)
    files = [(f"{n}.json", b"{}") for n in range(40)]

    response = upload(client, files)

    assert response.status_code == 413
    assert response.json()["code"] == "too_many_files"


def test_no_file_is_422(client: TestClient) -> None:
    response = client.post(IMPORT_URL, **raw_form([("broker", None, b"B")]))

    assert response.status_code == 422
    assert response.json()["code"] == "no_files"
    assert response.json()["detail"] == "The import is refused as a whole."


def test_a_request_body_above_the_limit_of_the_import_is_413_before_it_is_read(
    tmp_path: Path,
) -> None:
    client = make_client(
        tmp_path, max_upload_bytes=1024, max_import_bytes=1024, max_files_per_import=1
    )

    response = upload(client, [("big.json", b"x" * 100_000)])

    assert response.status_code == 413
    assert response.json() == BODY_TOO_LARGE
    assert series(client) == []


def test_the_limit_of_the_body_fits_the_total_size_of_the_files(tmp_path: Path) -> None:
    """The files together at the limit of the import are not stopped by the limit of the body,
    which adds the envelope of the form."""
    content = candles_json(2)
    client = make_client(tmp_path, max_upload_bytes=len(content), max_import_bytes=2 * len(content))

    response = upload(
        client,
        [("a.json", content), ("b.json", candles_json(2, instrument="BBB"))],
    )

    assert response.status_code == 200
    assert response.json()["imported_count"] == 2


def test_the_import_has_its_own_limit_larger_than_the_body_of_a_json_request(
    client: TestClient,
) -> None:
    """A JSON request body is limited to 2 MiB; the files of an import to 256 MiB together."""
    data = candles_json(20_000)
    assert len(data) > 2 * 1024 * 1024

    result = outcome(upload(client, [("big.json", data)]))["result"]

    assert result["accepted"] == 20_000
    too_large = client.post(
        "/api/v1/market-data/completeness",
        content=b" " * (2 * 1024 * 1024 + 1),
        headers={"content-type": "application/json"},
    )
    assert too_large.status_code == 413


def test_the_next_import_is_refused_while_the_imports_that_may_run_are_running(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    client = make_client(tmp_path, max_concurrent_imports=1)
    entered = threading.Event()
    release = threading.Event()
    real = MarketDataStore.import_files

    def slow(self: MarketDataStore, *args: Any, **kwargs: Any) -> Any:
        entered.set()
        assert release.wait(30)
        return real(self, *args, **kwargs)

    monkeypatch.setattr(MarketDataStore, "import_files", slow)
    results: list[Any] = []
    worker = threading.Thread(
        target=lambda: results.append(upload(client, [("a.json", candles_json(2))]))
    )
    worker.start()
    try:
        assert entered.wait(30)
        refused = upload(client, [("b.json", candles_json(2))])
        refused_preview = upload(
            client, [("b.json", candles_json(2))], broker=None, url=PREVIEW_URL
        )
    finally:
        release.set()
        worker.join(30)

    for response in (refused, refused_preview):
        assert response.status_code == 429
        assert response.json() == {"detail": "Too many imports are running. Try again later."}
    assert results[0].status_code == 200
    assert upload(client, [("c.json", candles_json(2))]).status_code == 200  # the place is free


def test_a_failure_of_the_database_refuses_the_file_without_detail(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from pipwerk_marketdata import MarketDataStoreError

    def fail(*_args: Any, **_kwargs: Any) -> Any:
        raise MarketDataStoreError("The database operation failed. The data store was not changed.")

    monkeypatch.setattr(MarketDataStore, "_write", fail)

    file = outcome(upload(client, [("f.json", candles_json(2))]))

    assert (file["refused"], file["error"]) == (True, "store_failed")
    assert "Traceback" not in json.dumps(file)


# --- the form ------------------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("kwargs", "place", "kind"),
    [
        ({"broker": None}, ["broker"], "missing"),
        ({"broker": ""}, ["broker"], "value_error"),
        ({"broker": " lead"}, ["broker"], "value_error"),
        ({"broker": "x" * 129}, ["broker"], "value_error"),
        ({"timezone": "x" * 65}, ["timezone"], "string_too_long"),
        ({"instruments": ["a", "b"]}, ["instrument"], "length_mismatch"),
        ({"other": "1"}, ["other"], "extra_forbidden"),
    ],
)
def test_a_wrong_form_is_422_with_the_place_of_the_error(
    client: TestClient, kwargs: dict[str, Any], place: list[str], kind: str
) -> None:
    response = upload(client, [("a.json", candles_json(2))], **kwargs)

    assert response.status_code == 422
    assert response.json()["detail"] == BODY_INVALID
    assert response.json()["errors"] == [{"location": place, "type": kind}]
    assert series(client) == []


def test_the_broker_may_be_given_only_once(client: TestClient) -> None:
    response = client.post(
        IMPORT_URL,
        data={"broker": ["A", "B"]},
        files=[("file", ("a.json", candles_json(2), "application/json"))],
    )

    assert response.status_code == 422
    assert response.json()["errors"] == [{"location": ["broker"], "type": "too_long"}]


def test_a_text_in_the_place_of_a_file_is_422(client: TestClient) -> None:
    response = client.post(
        IMPORT_URL, **raw_form([("broker", None, b"B"), ("file", None, b"just text")])
    )

    assert response.status_code == 422
    assert response.json()["errors"] == [{"location": ["file"], "type": "extra_forbidden"}]


def test_a_file_in_another_field_is_422(client: TestClient) -> None:
    response = client.post(
        IMPORT_URL,
        data={"broker": "B"},
        files=[("document", ("a.json", candles_json(2), "application/json"))],
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "The form of the request is invalid."
    assert series(client) == []


@pytest.mark.parametrize(
    "headers",
    [
        {},
        {"content-type": "application/json"},
        {"content-type": "text/csv"},
        {"content-type": "application/x-www-form-urlencoded"},
        {"content-type": "x/y"},
    ],
)
def test_the_body_must_be_a_form_with_files(client: TestClient, headers: dict[str, str]) -> None:
    for url in (IMPORT_URL, PREVIEW_URL):
        response = client.post(url, content=candles_json(2), headers=headers)

        assert response.status_code == 415, (url, headers)
        assert response.json() == {
            "detail": "The request body must be a form with files "
            "(Content-Type: multipart/form-data)."
        }
    assert series(client) == []


def test_a_form_without_a_boundary_or_with_a_broken_body_is_422(client: TestClient) -> None:
    no_boundary = client.post(
        IMPORT_URL, content=b"x", headers={"content-type": "multipart/form-data"}
    )
    broken = client.post(
        IMPORT_URL,
        content=b"--abc\r\nContent-Disposition: form-data; name=broker\r\n\r\nB",
        headers={"content-type": "multipart/form-data; boundary=abc"},
    )

    assert no_boundary.status_code == 422
    assert no_boundary.json()["detail"] == "The form of the request is invalid."
    assert broken.status_code == 422  # the form ends before the part is complete: no broker
    assert series(client) == []


@pytest.mark.parametrize(
    "origin",
    [
        "http://evil.example",
        "http://127.0.0.1:9999",
        "http://localhost",
        "null",
        "",
    ],
)
def test_a_form_from_a_web_page_of_another_origin_is_403_and_changes_nothing(
    client: TestClient, origin: str
) -> None:
    """A form with files needs no preflight request, so the origin of the page is checked."""
    for url in (IMPORT_URL, PREVIEW_URL):
        response = upload(
            client,
            [("a.json", candles_json(2))],
            broker=BROKER if url == IMPORT_URL else None,
            url=url,
            headers={"origin": origin},
        )

        assert response.status_code == 403, (url, origin)
        assert response.json() == {"detail": "The request comes from a web page of another origin."}
    assert series(client) == []


def test_a_form_from_the_own_origin_or_from_a_program_is_served(client: TestClient) -> None:
    own = upload(client, [("a.json", candles_json(2))], headers={"origin": "http://127.0.0.1"})
    program = upload(client, [("b.json", candles_json(2, instrument="BBB"))])

    assert own.status_code == 200
    assert program.status_code == 200
    assert len(series(client)) == 2


def test_the_import_only_answers_post(client: TestClient) -> None:
    for url in (IMPORT_URL, PREVIEW_URL):
        assert client.get(url).status_code == 405
        assert client.put(url, json={}).status_code == 405
        assert client.delete(url).status_code == 405


def test_the_old_endpoints_of_one_file_and_of_the_overview_no_longer_exist(
    client: TestClient,
) -> None:
    for method, path in (
        ("post", "/api/v1/market-data/imports/json"),
        ("post", "/api/v1/market-data/imports/csv"),
        ("get", "/api/v1/market-data/overview"),
        ("post", "/api/v1/market-data/acquisitions"),
        ("get", "/api/v1/market-data/acquisitions/00000000-0000-0000-0000-000000000000"),
    ):
        assert client.request(method, path).status_code == 404, path


# --- file names are only read --------------------------------------------------------------------


@pytest.mark.parametrize(
    ("sent", "reported"),
    [
        ("../../outside.json", "outside.json"),
        ("/etc/passwd.json", "passwd.json"),
        ("..\\..\\outside.json", "outside.json"),
        ("C:\\Users\\x\\data.json", "data.json"),
        ("dir/sub/../name.json", "name.json"),
        ("a\x01b\x7fc.json", "abc.json"),
        ("x" * 300 + ".json", "x" * 255),
        ("", "file-1"),
        ("/", "file-1"),
        ("..", ".."),
        ("  ", "file-1"),
    ],
)
def test_a_file_name_is_reported_without_directory_and_never_used_as_a_path(
    tmp_path: Path, client: TestClient, sent: str, reported: str
) -> None:
    """The name arrives as the client wrote it (the form is written by hand, so that nothing
    encodes it); the answer has the last part of it, and no file is created anywhere."""
    before = sorted(path.relative_to(tmp_path.parent) for path in tmp_path.parent.rglob("*"))
    form = raw_form([("broker", None, b"B"), ("file", sent, candles_json(2))])

    response = client.post(IMPORT_URL, **form)

    assert response.status_code == 200, response.text
    assert response.json()["files"][0]["name"] == reported
    after = sorted(path.relative_to(tmp_path.parent) for path in tmp_path.parent.rglob("*"))
    assert after == before  # nothing was created anywhere, near the data or above it


def test_a_file_name_does_not_decide_what_is_imported_unless_it_names_instrument_and_data(
    client: TestClient,
) -> None:
    """The name is read for the preview only; the import takes what the caller says."""
    response = upload(client, [("GBPUSD_H1_20240101_20240102.csv", CANDLES_CSV)], timezone="UTC")

    assert outcome(response)["error"] == "series_invalid"  # the caller gave neither


# --- the preview ---------------------------------------------------------------------------------


def preview(client: TestClient, files: list[tuple[str, bytes]]) -> dict[str, Any]:
    response = upload(client, files, broker=None, url=PREVIEW_URL)
    assert response.status_code == 200, response.text
    body: dict[str, Any] = response.json()
    return body


def test_the_preview_reads_instrument_and_data_from_the_names_of_csv_files(
    client: TestClient,
) -> None:
    body = preview(
        client,
        [
            ("EURUSD_H1_202301020000_202312292300.csv", b""),
            ("gbpusd,m15.csv", b""),
            ("USDJPY_TICKS_20240101_20240131.csv", b""),
            ("EURUSD CONTRACT.txt", b""),
            ("random-name.csv", b""),
        ],
    )

    assert [
        (item["format"], item["broker"], item["instrument"], item["data"]) for item in body["files"]
    ] == [
        ("csv", None, "EURUSD", "h1"),
        ("csv", None, "gbpusd", "m15"),
        ("csv", None, "USDJPY", "ticks"),
        ("csv", None, "EURUSD", "contract"),
        ("csv", None, None, None),
    ]
    assert all(item["error"] is None for item in body["files"])
    assert body["broker"] is None


def test_the_preview_reads_broker_instrument_and_data_from_the_content_of_json_files(
    client: TestClient,
) -> None:
    body = preview(
        client,
        [
            ("candles.json", example("candles.json")),
            ("ticks.json", example("ticks.json")),
            ("instrument.json", example("instrument.json")),
        ],
    )

    assert [(item["instrument"], item["data"]) for item in body["files"]] == [
        ("EURUSD", "m1"),
        ("EURUSD", "ticks"),
        ("EURUSD", "contract"),
    ]
    assert {item["broker"] for item in body["files"]} == {EXAMPLE_BROKER}
    assert body["broker"] == EXAMPLE_BROKER  # all JSON files name the same broker


def test_the_preview_proposes_no_broker_if_the_json_files_name_different_or_no_ones(
    client: TestClient,
) -> None:
    different = preview(
        client,
        [("a.json", candles_json(2, broker="A")), ("b.json", candles_json(2, broker="B"))],
    )
    one_without = preview(
        client, [("a.json", candles_json(2, broker="A")), ("b.json", b"not json")]
    )
    only_csv = preview(client, [("EURUSD,M1.csv", CANDLES_CSV)])

    assert different["broker"] is None
    assert one_without["broker"] is None
    assert only_csv["broker"] is None
    assert [item["broker"] for item in different["files"]] == ["A", "B"]


def test_the_preview_takes_the_instrument_of_the_name_if_a_json_file_has_none(
    client: TestClient,
) -> None:
    document = json.loads(candles_json(2))
    del document["instrument"]

    body = preview(client, [("GBPUSD_M1_2024_2025.json", json.dumps(document).encode())])

    item = body["files"][0]
    assert (item["instrument"], item["data"], item["broker"]) == ("GBPUSD", "m1", BROKER)


def test_the_preview_names_a_json_file_that_cannot_be_read(client: TestClient) -> None:
    body = preview(client, [("a.json", b"not json"), ("b.json", b"[]"), ("c.json", b"\xff")])

    assert [item["error"] for item in body["files"]] == [
        "json_invalid",
        "document_invalid",
        "not_decodable",
    ]
    assert all(item["instrument"] is None and item["data"] is None for item in body["files"])


def test_the_preview_imports_nothing(client: TestClient, tmp_path: Path) -> None:
    preview(client, [("candles.json", example("candles.json")), ("EURUSD,M1.csv", CANDLES_CSV)])

    assert series(client) == []
    assert client.get("/api/v1/market-data/brokers").json() == {"items": []}


def test_the_preview_accepts_no_setting_of_the_import(client: TestClient) -> None:
    response = upload(client, [("a.json", candles_json(2))], broker=BROKER, url=PREVIEW_URL)

    assert response.status_code == 422
    assert response.json()["errors"] == [{"location": ["broker"], "type": "extra_forbidden"}]


def test_the_preview_follows_the_limit_of_the_files_of_an_import(tmp_path: Path) -> None:
    client = make_client(tmp_path, max_files_per_import=1)

    response = upload(
        client,
        [("a.json", b"{}"), ("b.json", b"{}"), ("c.json", b"{}")],
        broker=None,
        url=PREVIEW_URL,
    )

    assert response.status_code == 413
    assert response.json()["code"] == "too_many_files"


def test_the_preview_of_a_file_that_is_too_large_names_the_reason(tmp_path: Path) -> None:
    client = make_client(tmp_path, max_upload_bytes=1024, max_import_bytes=4096)

    body = preview(client, [("big.json", candles_json(30))])

    assert body["files"][0]["error"] == "too_large"


def test_a_candle_file_can_be_imported_after_the_preview_with_what_it_said(
    client: TestClient,
) -> None:
    files = [("EURUSD_M1_202401021000_202401021001.csv", CANDLES_CSV)]
    hint = preview(client, files)["files"][0]

    imported = upload(
        client,
        files,
        broker="Live",
        timezone="UTC",
        instruments=[hint["instrument"]],
        datas=[hint["data"]],
    )

    assert outcome(imported)["result"]["accepted"] == 2
