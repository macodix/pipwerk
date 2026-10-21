"""Tests of the web API of the data stock under ``/api/v1/market-data/`` (overview, instrument
data, import of JSON and CSV files, completeness).

Every endpoint is tested with valid and invalid input. The acquisition from the source has its
own tests (``test_acquisition.py``).
"""

from __future__ import annotations

import json
import threading
from datetime import timedelta
from pathlib import Path
from typing import Any

import pytest
from datastock import (
    API,
    BROKER,
    CANDLE_HEADER,
    CSV,
    EXAMPLE_BROKER,
    FIRST_MINUTE,
    JSON,
    TICK_HEADER,
    candle_entry,
    candle_row,
    candles_document,
    candles_json,
    csv_file,
    example,
    make_app,
    tick_row,
)
from fastapi.testclient import TestClient
from pipwerk_marketdata import MarketDataStore

from pipwerk_replay.config import MarketDataSettings

BODY_INVALID = "The request body does not fit the schema."
REQUEST_INVALID = "The request is invalid."
FILE_REFUSED = "The file is refused."


def make_client(tmp_path: Path, **settings: Any) -> TestClient:
    marketdata = MarketDataSettings(**settings) if settings else None
    return TestClient(make_app(tmp_path, marketdata=marketdata))


@pytest.fixture
def client(tmp_path: Path) -> TestClient:
    return make_client(tmp_path)


def import_json(client: TestClient, data: bytes) -> Any:
    return client.post(f"{API}/imports/json", content=data, headers=JSON)


def import_csv(client: TestClient, data: bytes, **query: str) -> Any:
    return client.post(f"{API}/imports/csv", content=data, headers=CSV, params=query)


CANDLE_QUERY = {
    "kind": "candles",
    "broker": BROKER,
    "instrument": "EURUSD",
    "time_unit": "m1",
    "timezone": "UTC",
}
TICK_QUERY = {"kind": "ticks", "broker": BROKER, "instrument": "EURUSD", "timezone": "UTC"}


# --- import of JSON files -----------------------------------------------------------------------


def test_a_json_file_of_candles_is_imported_with_its_result(client: TestClient) -> None:
    response = import_json(client, example("candles.json"))

    assert response.status_code == 200
    assert response.json() == {
        "kind": "candles",
        "broker": EXAMPLE_BROKER,
        "instrument": "EURUSD",
        "unit": "m1",
        "accepted": 5,
        "replaced": 0,
        "period_start": "2024-01-02T10:00:00Z",
        "period_end": "2024-01-02T10:04:00Z",
        "rejected": [],
        "rejected_count": 0,
    }


def test_a_json_file_of_ticks_and_of_an_instrument_are_imported(client: TestClient) -> None:
    ticks = import_json(client, example("ticks.json"))
    instrument = import_json(client, example("instrument.json"))

    assert ticks.status_code == 200
    assert ticks.json()["kind"] == "ticks"
    assert ticks.json()["accepted"] == 4
    assert ticks.json()["period_end"] == "2024-01-02T10:00:42.500000Z"
    assert instrument.status_code == 200
    assert instrument.json()["kind"] == "instrument"
    assert instrument.json()["accepted"] == 1
    assert instrument.json()["period_start"] == "2024-01-02T09:30:00Z"


def test_importing_the_same_period_again_replaces_the_candles(client: TestClient) -> None:
    import_json(client, example("candles.json"))

    again = import_json(client, example("candles.json"))

    assert again.json()["accepted"] == 5
    assert again.json()["replaced"] == 5
    series = client.get(f"{API}/overview").json()["series"]
    assert [item["count"] for item in series] == [5]


def test_rows_that_fail_the_checks_are_rejected_with_their_reason(client: TestClient) -> None:
    entries = [
        candle_entry(FIRST_MINUTE),
        candle_entry(FIRST_MINUTE + timedelta(minutes=1), high=1.0, low=1.0, close=1.0),
        candle_entry(FIRST_MINUTE + timedelta(minutes=2)),
        candle_entry(FIRST_MINUTE + timedelta(minutes=2)),
    ]

    response = import_json(client, candles_document(entries))

    assert response.status_code == 200
    body = response.json()
    assert body["accepted"] == 2
    assert body["rejected_count"] == 2
    assert body["rejected"] == [
        {"row": 2, "reason": "high_below_open"},
        {"row": 4, "reason": "time_duplicate"},
    ]


def test_the_number_of_listed_rejections_is_limited_and_all_are_counted(tmp_path: Path) -> None:
    client = make_client(tmp_path, max_reported_rejections=2)
    entries = [candle_entry(FIRST_MINUTE, open=-1.0)] * 5

    body = import_json(client, candles_document(entries)).json()

    assert body["accepted"] == 0
    assert body["rejected_count"] == 5
    assert len(body["rejected"]) == 2


@pytest.mark.parametrize(
    ("data", "code"),
    [
        (b"this is not json", "json_invalid"),
        (b"\xff\xfe\x00", "not_decodable"),
        (b"[]", "document_invalid"),
        (b'{"version": 1}', "document_invalid"),
        (b'{"version": 2, "kind": "candles"}', "document_invalid"),
    ],
)
def test_a_file_that_is_refused_as_a_whole_changes_nothing(
    client: TestClient, data: bytes, code: str
) -> None:
    response = import_json(client, data)

    assert response.status_code == 422
    body = response.json()
    assert body["detail"] == FILE_REFUSED
    assert body["code"] == code
    assert isinstance(body["message"], str)
    assert client.get(f"{API}/overview").json()["series"] == []


def test_the_text_of_a_refusal_does_not_repeat_the_content_of_the_file(client: TestClient) -> None:
    response = import_json(client, b'{"version": 1, "kind": "secret-content-9"}')

    assert response.status_code == 422
    assert "secret-content-9" not in response.text


def test_a_file_with_too_many_rows_is_refused(tmp_path: Path) -> None:
    client = make_client(tmp_path, max_rows=3)

    assert import_json(client, candles_json(3)).status_code == 200
    response = import_json(client, candles_json(4))

    assert response.status_code == 422
    assert response.json()["code"] == "too_many_rows"
    assert [item["count"] for item in client.get(f"{API}/overview").json()["series"]] == [3]


def test_a_file_above_the_limit_of_the_upload_is_413_before_it_is_read(tmp_path: Path) -> None:
    client = make_client(tmp_path, max_upload_bytes=1024)
    data = candles_json(30)
    assert len(data) > 1024

    json_response = import_json(client, data)
    csv_response = import_csv(client, b"x" * 1025, **CANDLE_QUERY)

    for response in (json_response, csv_response):
        assert response.status_code == 413
        assert response.json() == {"detail": "The request body is larger than the limit."}
    assert client.get(f"{API}/overview").json()["series"] == []


def test_the_upload_has_its_own_limit_larger_than_the_body_of_a_json_request(
    client: TestClient,
) -> None:
    """A JSON request body is limited to 2 MiB; an uploaded file to 32 MiB (the defaults)."""
    data = candles_json(20_000)
    assert len(data) > 2 * 1024 * 1024

    response = import_json(client, data)

    assert response.status_code == 200
    assert response.json()["accepted"] == 20_000
    too_large = client.post(
        f"{API}/completeness", content=b" " * (2 * 1024 * 1024 + 1), headers=JSON
    )
    assert too_large.status_code == 413


@pytest.mark.parametrize(
    "headers",
    [{}, {"content-type": "text/csv"}, {"content-type": "text/plain"}, {"content-type": "x/y"}],
)
def test_a_json_file_needs_the_media_type_json(client: TestClient, headers: dict[str, str]) -> None:
    response = client.post(f"{API}/imports/json", content=candles_json(2), headers=headers)

    assert response.status_code == 415
    assert response.json() == {
        "detail": "The request body must be a file of the media type application/json."
    }
    assert client.get(f"{API}/overview").json()["series"] == []


def test_a_json_file_with_parameters_of_the_media_type_is_accepted(client: TestClient) -> None:
    response = client.post(
        f"{API}/imports/json",
        content=candles_json(2),
        headers={"content-type": "Application/JSON; charset=utf-8"},
    )

    assert response.status_code == 200


# --- import of CSV files ------------------------------------------------------------------------


def test_a_csv_file_of_candles_is_imported_in_the_time_zone_of_the_caller(
    client: TestClient,
) -> None:
    data = csv_file(CANDLE_HEADER, candle_row("10:00:00"), candle_row("10:01:00"))

    response = import_csv(client, data, **{**CANDLE_QUERY, "timezone": "Europe/Athens"})

    assert response.status_code == 200
    body = response.json()
    assert (body["kind"], body["broker"], body["instrument"], body["unit"]) == (
        "candles",
        BROKER,
        "EURUSD",
        "m1",
    )
    assert body["accepted"] == 2
    assert body["period_start"] == "2024-01-02T08:00:00Z"  # Athens is UTC+2 in January
    assert body["period_end"] == "2024-01-02T08:01:00Z"


def test_a_csv_file_of_ticks_is_imported(client: TestClient) -> None:
    data = csv_file(TICK_HEADER, tick_row("10:00:00.250"), tick_row("10:00:01.500"))

    response = import_csv(client, data, **TICK_QUERY)

    assert response.status_code == 200
    body = response.json()
    assert body["kind"] == "ticks"
    assert body["unit"] is None
    assert body["accepted"] == 2
    series = client.get(f"{API}/overview").json()["series"]
    assert [(item["unit"], item["count"]) for item in series] == [("ticks", 2)]


def test_importing_a_csv_file_again_replaces_its_rows(client: TestClient) -> None:
    data = csv_file(CANDLE_HEADER, candle_row("10:00:00"), candle_row("10:01:00"))
    import_csv(client, data, **CANDLE_QUERY)

    body = import_csv(client, data, **CANDLE_QUERY).json()

    assert (body["accepted"], body["replaced"]) == (2, 2)


def test_csv_rows_are_rejected_with_their_line_and_reason(client: TestClient) -> None:
    data = csv_file(
        CANDLE_HEADER,
        candle_row("10:00:00"),
        candle_row("10:01:00", prices="1.10\tabc\t1.09\t1.11"),
        candle_row("09:59:00"),
        candle_row("2:30:00", date="2024.03.31"),
    )

    response = import_csv(client, data, **{**CANDLE_QUERY, "timezone": "Europe/Athens"})

    assert response.status_code == 200
    body = response.json()
    assert body["accepted"] == 1
    assert body["rejected"] == [
        {"row": 3, "reason": "value_invalid"},
        {"row": 4, "reason": "time_not_ascending"},
        {"row": 5, "reason": "time_invalid"},
    ]


def test_a_local_time_that_does_not_exist_is_a_rejected_row(client: TestClient) -> None:
    data = csv_file(CANDLE_HEADER, candle_row("03:30:00", date="2024.03.31"))

    body = import_csv(client, data, **{**CANDLE_QUERY, "timezone": "Europe/Athens"}).json()

    assert body["rejected"] == [{"row": 2, "reason": "local_time_not_existing"}]


@pytest.mark.parametrize(
    ("query", "code"),
    [
        ({**CANDLE_QUERY, "timezone": "Nowhere/Land"}, "timezone_unknown"),
        ({k: v for k, v in CANDLE_QUERY.items() if k != "time_unit"}, "series_invalid"),
    ],
)
def test_a_csv_file_with_unusable_information_is_refused_as_a_whole(
    client: TestClient, query: dict[str, str], code: str
) -> None:
    data = csv_file(CANDLE_HEADER, candle_row("10:00:00"))

    response = import_csv(client, data, **query)

    assert response.status_code == 422
    assert response.json()["code"] == code
    assert response.json()["detail"] == FILE_REFUSED


def test_a_csv_file_with_a_wrong_header_or_without_rows_is_refused(client: TestClient) -> None:
    wrong_header = import_csv(client, csv_file("A\tB\tC", "1\t2\t3"), **CANDLE_QUERY)
    empty = import_csv(client, b"", **CANDLE_QUERY)
    only_header = import_csv(client, csv_file(CANDLE_HEADER), **CANDLE_QUERY)

    assert wrong_header.status_code == 422
    assert wrong_header.json()["code"] == "header_invalid"
    assert empty.status_code == 422
    assert empty.json()["code"] == "no_rows"
    assert only_header.status_code == 422
    assert only_header.json()["code"] == "no_rows"


@pytest.mark.parametrize(
    "query",
    [
        {},
        {k: v for k, v in CANDLE_QUERY.items() if k != "broker"},
        {k: v for k, v in CANDLE_QUERY.items() if k != "instrument"},
        {k: v for k, v in CANDLE_QUERY.items() if k != "timezone"},
        {k: v for k, v in CANDLE_QUERY.items() if k != "kind"},
        {**CANDLE_QUERY, "kind": "instrument"},
        {**CANDLE_QUERY, "time_unit": "m7"},
        {**CANDLE_QUERY, "time_unit": "M1"},
        {**CANDLE_QUERY, "broker": " leading"},
        {**CANDLE_QUERY, "broker": "trailing "},
        {**CANDLE_QUERY, "broker": ""},
        {**CANDLE_QUERY, "instrument": "x" * 129},
        {**CANDLE_QUERY, "timezone": "z" * 65},
        {**CANDLE_QUERY, "unknown": "1"},
    ],
)
def test_an_invalid_query_of_the_csv_import_is_422(
    client: TestClient, query: dict[str, str]
) -> None:
    response = import_csv(client, csv_file(CANDLE_HEADER, candle_row("10:00:00")), **query)

    assert response.status_code == 422
    body = response.json()
    assert body["detail"] == REQUEST_INVALID
    assert body["errors"]
    assert all(place["location"][0] == "query" for place in body["errors"])
    assert client.get(f"{API}/overview").json()["series"] == []


def test_the_error_of_a_query_does_not_repeat_the_value(client: TestClient) -> None:
    response = import_csv(
        client, b"x", **{**CANDLE_QUERY, "time_unit": "secret-unit-7", "extra-secret-3": "1"}
    )

    assert response.status_code == 422
    assert "secret-unit-7" not in response.text


@pytest.mark.parametrize(
    "headers",
    [{}, {"content-type": "application/json"}, {"content-type": "text/plain"}],
)
def test_a_csv_file_needs_the_media_type_csv(client: TestClient, headers: dict[str, str]) -> None:
    response = client.post(
        f"{API}/imports/csv",
        content=csv_file(CANDLE_HEADER, candle_row("10:00:00")),
        headers=headers,
        params=CANDLE_QUERY,
    )

    assert response.status_code == 415
    assert response.json() == {
        "detail": "The request body must be a file of the media type text/csv."
    }


def test_other_methods_on_the_import_paths_are_405(client: TestClient) -> None:
    for path in ("imports/json", "imports/csv"):
        assert client.get(f"{API}/{path}").status_code == 405
        assert client.put(f"{API}/{path}", content=b"").status_code == 405


# --- limit of the imports that run at the same time ----------------------------------------------


def test_the_next_import_is_refused_while_the_imports_that_may_run_are_running(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    client = make_client(tmp_path, max_concurrent_imports=1)
    entered = threading.Event()
    release = threading.Event()
    real = MarketDataStore.import_json

    def slow(self: MarketDataStore, *args: Any, **kwargs: Any) -> Any:
        entered.set()
        assert release.wait(30)
        return real(self, *args, **kwargs)

    monkeypatch.setattr(MarketDataStore, "import_json", slow)
    results: list[Any] = []
    worker = threading.Thread(target=lambda: results.append(import_json(client, candles_json(2))))
    worker.start()
    try:
        assert entered.wait(30)

        refused = import_csv(
            client, csv_file(CANDLE_HEADER, candle_row("10:00:00")), **CANDLE_QUERY
        )
        refused_json = import_json(client, candles_json(2))
    finally:
        release.set()
        worker.join(30)

    for response in (refused, refused_json):
        assert response.status_code == 429
        assert response.json() == {"detail": "Too many imports are running. Try again later."}
    assert results[0].status_code == 200
    # the place is free again
    assert import_json(client, candles_json(2)).status_code == 200


def test_the_limit_of_the_imports_counts_csv_imports_too(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    client = make_client(tmp_path, max_concurrent_imports=1)
    entered = threading.Event()
    release = threading.Event()
    real = MarketDataStore.import_csv

    def slow(self: MarketDataStore, *args: Any, **kwargs: Any) -> Any:
        entered.set()
        assert release.wait(30)
        return real(self, *args, **kwargs)

    monkeypatch.setattr(MarketDataStore, "import_csv", slow)
    data = csv_file(CANDLE_HEADER, candle_row("10:00:00"))
    worker = threading.Thread(target=lambda: import_csv(client, data, **CANDLE_QUERY))
    worker.start()
    try:
        assert entered.wait(30)
        refused = import_json(client, candles_json(2))
    finally:
        release.set()
        worker.join(30)

    assert refused.status_code == 429


# --- overview -----------------------------------------------------------------------------------


def test_the_overview_of_an_empty_data_stock(client: TestClient) -> None:
    response = client.get(f"{API}/overview")

    assert response.status_code == 200
    assert response.json() == {
        "series": [],
        "series_total": 0,
        "instruments": [],
        "instruments_total": 0,
        "offset": 0,
        "limit": 1000,
    }


def test_the_overview_shows_series_with_periods_and_instruments(client: TestClient) -> None:
    import_json(client, example("candles.json"))
    import_json(client, example("ticks.json"))
    import_json(client, example("instrument.json"))

    body = client.get(f"{API}/overview").json()

    assert body["series_total"] == 2
    candles, ticks = body["series"]
    assert candles == {
        "broker": EXAMPLE_BROKER,
        "instrument": "EURUSD",
        "unit": "m1",
        "count": 5,
        "first": "2024-01-02T10:00:00Z",
        "last": "2024-01-02T10:04:00Z",
        "covered": [{"start": "2024-01-02T10:00:00Z", "end": "2024-01-02T10:05:00Z"}],
        "covered_count": 1,
        "missing": [],
        "missing_count": 0,
        "has_trading_hours": True,
    }
    assert (ticks["unit"], ticks["count"], ticks["has_trading_hours"]) == ("ticks", 4, False)
    assert body["instruments"] == [
        {
            "broker": EXAMPLE_BROKER,
            "instrument": "EURUSD",
            "acquired_at": "2024-01-02T09:30:00Z",
        }
    ]
    assert body["instruments_total"] == 1


def _gappy(client: TestClient) -> None:
    """M1 candles at 10:00, 12:00, 14:00 and 16:00 inside the period 10:00 to 16:01: three gaps."""
    entries = [candle_entry(FIRST_MINUTE + timedelta(hours=2 * index)) for index in range(4)]
    period = {"start": "2024-01-02T10:00:00Z", "end": "2024-01-02T16:01:00Z"}
    assert import_json(client, candles_document(entries, period=period)).status_code == 200


def test_the_overview_names_the_gaps(client: TestClient) -> None:
    _gappy(client)

    series = client.get(f"{API}/overview").json()["series"][0]

    assert series["missing_count"] == 3
    assert [item["reason"] for item in series["missing"]] == ["gap", "gap", "gap"]
    assert series["missing"][0] == {
        "start": "2024-01-02T10:01:00Z",
        "end": "2024-01-02T12:00:00Z",
        "reason": "gap",
    }


def test_the_lists_of_periods_in_a_series_are_cut_and_counted(tmp_path: Path) -> None:
    client = make_client(tmp_path, max_listed_items=2)
    _gappy(client)

    series = client.get(f"{API}/overview").json()["series"][0]

    assert len(series["missing"]) == 2
    assert series["missing_count"] == 3
    assert len(series["covered"]) == series["covered_count"] == 1


def test_the_overview_is_cut_to_the_section_of_the_request(client: TestClient) -> None:
    for instrument in ("AAA", "BBB", "CCC"):
        import_json(client, candles_json(2, instrument=instrument))

    body = client.get(f"{API}/overview", params={"offset": 1, "limit": 1}).json()

    assert [item["instrument"] for item in body["series"]] == ["BBB"]
    assert body["series_total"] == 3
    assert (body["offset"], body["limit"]) == (1, 1)
    beyond = client.get(f"{API}/overview", params={"offset": 5}).json()
    assert beyond["series"] == []
    assert beyond["series_total"] == 3


def test_the_default_size_of_a_section_is_the_limit_of_the_configuration(tmp_path: Path) -> None:
    client = make_client(tmp_path, max_listed_items=2)
    for instrument in ("AAA", "BBB", "CCC"):
        import_json(client, candles_json(2, instrument=instrument))

    body = client.get(f"{API}/overview").json()

    assert [item["instrument"] for item in body["series"]] == ["AAA", "BBB"]
    assert (body["series_total"], body["limit"]) == (3, 2)
    exact = client.get(f"{API}/overview", params={"limit": 2})
    assert exact.status_code == 200


def test_a_section_above_the_limit_of_the_configuration_is_422(tmp_path: Path) -> None:
    client = make_client(tmp_path, max_listed_items=2)

    response = client.get(f"{API}/overview", params={"limit": 3})

    assert response.status_code == 422
    assert response.json()["errors"] == [
        {"location": ["query", "limit"], "type": "less_than_equal"}
    ]


@pytest.mark.parametrize(
    "params",
    [{"offset": -1}, {"limit": 0}, {"limit": -3}, {"offset": "x"}, {"limit": "1.5"}, {"foo": "1"}],
)
def test_an_invalid_query_of_the_overview_is_422(
    client: TestClient, params: dict[str, Any]
) -> None:
    response = client.get(f"{API}/overview", params=params)

    assert response.status_code == 422
    assert response.json()["detail"] == REQUEST_INVALID


def test_the_overview_only_answers_get(client: TestClient) -> None:
    assert client.post(f"{API}/overview", json={}).status_code == 405
    assert client.delete(f"{API}/overview").status_code == 405


# --- instrument data ----------------------------------------------------------------------------


def test_the_data_of_an_instrument_are_read(client: TestClient) -> None:
    import_json(client, example("instrument.json"))

    response = client.get(
        f"{API}/instrument", params={"broker": EXAMPLE_BROKER, "instrument": "EURUSD"}
    )

    assert response.status_code == 200
    assert response.json() == {
        "broker": EXAMPLE_BROKER,
        "instrument": "EURUSD",
        "acquired_at": "2024-01-02T09:30:00Z",
        "tick_size": 0.00001,
        "tick_value": 0.92,
        "tick_value_currency": "EUR",
        "point": 0.00001,
        "pip": 0.0001,
        "spread": 0.00008,
        "min_volume": 0.01,
        "volume_step": 0.01,
        "contract_size": 100000.0,
        "swap_long": -4.5,
        "swap_short": 1.2,
        "swap_triple_weekday": "wednesday",
        "margin_per_lot": 3650.0,
    }


def test_the_newest_data_not_after_a_moment_are_read(client: TestClient) -> None:
    older = json.loads(example("instrument.json"))
    newer = {**older, "acquired_at": "2024-02-01T09:30:00Z", "contract_size": 1000}
    import_json(client, json.dumps(older).encode())
    import_json(client, json.dumps(newer).encode())
    params = {"broker": EXAMPLE_BROKER, "instrument": "EURUSD"}

    latest = client.get(f"{API}/instrument", params=params).json()
    earlier = client.get(f"{API}/instrument", params={**params, "as_of": "2024-01-15T00:00:00Z"})
    too_early = client.get(f"{API}/instrument", params={**params, "as_of": "2023-01-01T00:00:00Z"})

    assert latest["contract_size"] == 1000
    assert earlier.json()["contract_size"] == 100000
    assert too_early.status_code == 404


def test_an_instrument_without_data_is_404(client: TestClient) -> None:
    response = client.get(f"{API}/instrument", params={"broker": "B", "instrument": "I"})

    assert response.status_code == 404
    assert response.json() == {"detail": "There are no data of this instrument."}


@pytest.mark.parametrize(
    "params",
    [
        {},
        {"broker": "B"},
        {"instrument": "I"},
        {"broker": "", "instrument": "I"},
        {"broker": " B", "instrument": "I"},
        {"broker": "B", "instrument": "I" * 129},
        {"broker": "B", "instrument": "I", "as_of": "2024-01-01"},
        {"broker": "B", "instrument": "I", "as_of": "2024-01-01T00:00:00"},
        {"broker": "B", "instrument": "I", "as_of": "1700000000"},
        {"broker": "B", "instrument": "I", "other": "1"},
    ],
)
def test_an_invalid_query_of_the_instrument_data_is_422(
    client: TestClient, params: dict[str, str]
) -> None:
    response = client.get(f"{API}/instrument", params=params)

    assert response.status_code == 422
    assert response.json()["detail"] == REQUEST_INVALID


# --- completeness -------------------------------------------------------------------------------


def candle_part(**changes: Any) -> dict[str, Any]:
    part = {
        "kind": "candles",
        "instrument": "EURUSD",
        "time_unit": "m1",
        "start": "2024-01-02T10:00:00Z",
        "end": "2024-01-02T10:10:00Z",
    }
    part.update(changes)
    return part


def set_default_source(client: TestClient, broker: str | None) -> None:
    response = client.put("/api/replay/settings/default-source", json={"broker": broker})
    assert response.status_code == 200


def check(client: TestClient, *parts: dict[str, Any], **changes: Any) -> Any:
    return client.post(f"{API}/completeness", json={"parts": list(parts), **changes})


def test_without_a_broker_and_without_a_default_source_the_check_is_409(client: TestClient) -> None:
    response = check(client, candle_part())

    assert response.status_code == 409
    assert response.json() == {"detail": "No broker is given and no default source is set."}


def test_needed_present_and_missing_of_a_part_of_candles(client: TestClient) -> None:
    import_json(client, example("candles.json"))
    set_default_source(client, EXAMPLE_BROKER)

    response = check(client, candle_part())

    assert response.status_code == 200
    body = response.json()
    assert body["broker"] == EXAMPLE_BROKER
    [result] = body["results"]
    assert result["needed"] == candle_part()
    assert result["complete"] is False
    assert result["present"] == [{"start": "2024-01-02T10:00:00Z", "end": "2024-01-02T10:05:00Z"}]
    assert result["present_count"] == 1
    assert result["missing"] == [
        {"start": "2024-01-02T10:05:00Z", "end": "2024-01-02T10:10:00Z", "reason": "not_covered"}
    ]
    assert result["missing_count"] == 1


def test_a_part_that_is_covered_is_complete(client: TestClient) -> None:
    import_json(client, example("candles.json"))
    set_default_source(client, EXAMPLE_BROKER)

    [result] = check(client, candle_part(end="2024-01-02T10:05:00Z")).json()["results"]

    assert result["complete"] is True
    assert result["missing"] == []
    assert result["missing_count"] == 0


def test_a_gap_inside_the_covered_period_is_reported_as_a_gap(client: TestClient) -> None:
    _gappy(client)

    [result] = check(client, candle_part(end="2024-01-02T16:01:00Z"), broker=BROKER).json()[
        "results"
    ]

    assert result["complete"] is False
    assert [item["reason"] for item in result["missing"]] == ["gap", "gap", "gap"]


def test_the_lists_of_a_part_are_cut_and_counted(tmp_path: Path) -> None:
    client = make_client(tmp_path, max_listed_items=2)
    _gappy(client)

    [result] = check(client, candle_part(end="2024-01-02T16:01:00Z"), broker=BROKER).json()[
        "results"
    ]

    assert len(result["missing"]) == 2
    assert result["missing_count"] == 3
    assert len(result["present"]) == 2
    assert result["present_count"] == 4


def test_ticks_and_an_instrument_are_checked_too(client: TestClient) -> None:
    import_json(client, example("ticks.json"))
    set_default_source(client, EXAMPLE_BROKER)
    ticks = {
        "kind": "ticks",
        "instrument": "EURUSD",
        "start": "2024-01-02T10:00:00Z",
        "end": "2024-01-02T10:01:00Z",
    }
    instrument = {"kind": "instrument", "instrument": "EURUSD"}

    before = check(client, ticks, instrument).json()["results"]
    import_json(client, example("instrument.json"))
    after = check(client, ticks, instrument).json()["results"]

    assert [item["complete"] for item in before] == [True, False]
    assert [item["complete"] for item in after] == [True, True]
    assert before[1]["present"] == before[1]["missing"] == []
    assert before[1]["needed"] == instrument


def test_nothing_is_present_for_a_series_that_does_not_exist(client: TestClient) -> None:
    set_default_source(client, "NoSuchBroker")

    [result] = check(client, candle_part()).json()["results"]

    assert result["complete"] is False
    assert result["present"] == []
    assert result["missing"] == [
        {"start": "2024-01-02T10:00:00Z", "end": "2024-01-02T10:10:00Z", "reason": "not_covered"}
    ]


def test_the_closed_market_counts_as_present(client: TestClient) -> None:
    set_default_source(client, "NoSuchBroker")
    saturday = candle_part(start="2024-01-06T10:00:00Z", end="2024-01-06T12:00:00Z")

    [result] = check(client, saturday).json()["results"]

    assert result["complete"] is True
    assert result["present"] == [{"start": "2024-01-06T10:00:00Z", "end": "2024-01-06T12:00:00Z"}]


def test_a_broker_in_the_request_replaces_the_default_source(client: TestClient) -> None:
    import_json(client, example("candles.json"))
    set_default_source(client, "NoSuchBroker")
    part = candle_part(end="2024-01-02T10:05:00Z")

    default = check(client, part).json()
    explicit = check(client, part, broker=EXAMPLE_BROKER).json()

    assert default["broker"] == "NoSuchBroker"
    assert default["results"][0]["complete"] is False
    assert explicit["broker"] == EXAMPLE_BROKER
    assert explicit["results"][0]["complete"] is True


def test_the_results_come_in_the_order_of_the_request(client: TestClient) -> None:
    set_default_source(client, BROKER)
    parts = [
        candle_part(instrument="CCC"),
        candle_part(
            instrument="AAA",
            time_unit="h1",
            start="2024-01-02T10:00:00Z",
            end="2024-01-02T12:00:00Z",
        ),
        {"kind": "instrument", "instrument": "BBB"},
    ]

    results = check(client, *parts).json()["results"]

    assert [item["needed"] for item in results] == parts


def test_a_moment_with_an_offset_is_kept_as_given_and_compared_in_utc(client: TestClient) -> None:
    import_json(client, example("candles.json"))
    set_default_source(client, EXAMPLE_BROKER)
    part = candle_part(start="2024-01-02T12:00:00+02:00", end="2024-01-02T12:05:00+02:00")

    [result] = check(client, part).json()["results"]

    assert result["needed"]["start"] == "2024-01-02T12:00:00+02:00"
    assert result["complete"] is True


def test_the_number_of_parts_is_limited(tmp_path: Path) -> None:
    client = make_client(tmp_path, max_parts_per_request=2)
    set_default_source(client, BROKER)

    ok = check(client, candle_part(), candle_part())
    too_many = check(client, candle_part(), candle_part(), candle_part())

    assert ok.status_code == 200
    assert too_many.status_code == 422
    assert too_many.json()["errors"] == [{"location": ["parts"], "type": "too_long"}]


@pytest.mark.parametrize(
    "body",
    [
        {},
        {"parts": []},
        {"parts": "x"},
        {"parts": [{}]},
        {"parts": [candle_part(kind="secret-kind-5")]},
        {"parts": [candle_part(time_unit="m7")]},
        {"parts": [candle_part(time_unit=None)]},
        {"parts": [candle_part(instrument="")]},
        {"parts": [candle_part(instrument=" EURUSD")]},
        {"parts": [candle_part(instrument="x" * 129)]},
        {"parts": [candle_part(start="2024-01-02T10:00:00")]},
        {"parts": [candle_part(start="2024-01-02")]},
        {"parts": [candle_part(start=1704189600)]},
        {"parts": [candle_part(end="2024-01-02T10:00:00Z")]},
        {"parts": [candle_part(start="2024-01-02T11:00:00Z")]},
        {"parts": [candle_part(start="1969-12-31T23:00:00Z")]},
        {"parts": [candle_part(end="2100-01-01T00:00:01Z")]},
        {"parts": [candle_part(extra=1)]},
        {
            "parts": [
                {
                    "kind": "ticks",
                    "instrument": "EURUSD",
                    "time_unit": "m1",
                    "start": "2024-01-02T10:00:00Z",
                    "end": "2024-01-02T10:10:00Z",
                }
            ]
        },
        {
            "parts": [
                {"kind": "instrument", "instrument": "EURUSD", "start": "2024-01-02T10:00:00Z"}
            ]
        },
        {"parts": [candle_part()], "broker": ""},
        {"parts": [candle_part()], "broker": 7},
        {"parts": [candle_part()], "unknown": 1},
    ],
)
def test_an_invalid_request_for_completeness_is_422(client: TestClient, body: Any) -> None:
    set_default_source(client, BROKER)

    response = client.post(f"{API}/completeness", json=body)

    assert response.status_code == 422, body
    assert response.json()["detail"] == BODY_INVALID
    assert "secret-kind-5" not in response.text


def test_the_period_may_reach_the_end_of_the_supported_times(client: TestClient) -> None:
    set_default_source(client, BROKER)
    last = candle_part(time_unit="mn1", start="2099-12-01T00:00:00Z", end="2100-01-01T00:00:00Z")
    first = candle_part(time_unit="mn1", start="1970-01-01T00:00:00Z", end="1970-02-01T00:00:00Z")

    assert check(client, last, first).status_code == 200


@pytest.mark.parametrize(
    "content", [b"", b"not json", b"[]", b'"x"', b'{"parts": [], "parts": []}', b'{"parts": NaN}']
)
def test_a_body_for_completeness_that_is_no_json_object_is_422(
    client: TestClient, content: bytes
) -> None:
    response = client.post(f"{API}/completeness", content=content, headers=JSON)

    assert response.status_code == 422
    assert response.json()["detail"] == BODY_INVALID


def test_the_body_for_completeness_needs_the_media_type_json(client: TestClient) -> None:
    for headers in ({}, {"content-type": "text/plain"}, {"content-type": "text/csv"}):
        response = client.post(
            f"{API}/completeness", content=json.dumps({"parts": [candle_part()]}), headers=headers
        )
        assert response.status_code == 415, headers
        assert response.json() == {
            "detail": "The request body must be JSON (Content-Type: application/json)."
        }


def test_a_stored_default_source_that_is_no_valid_name_is_503(
    tmp_path: Path, client: TestClient
) -> None:
    import sqlite3

    set_default_source(client, BROKER)
    with sqlite3.connect(tmp_path / "replay.db") as connection:
        connection.execute("UPDATE replay_settings SET default_source = ' bad '")

    response = check(client, candle_part())

    assert response.status_code == 503
    assert response.json() == {"detail": "The stored pipwerk replay default source is invalid."}
    assert check(client, candle_part(), broker=BROKER).status_code == 200  # a broker is given


def test_a_failure_of_the_database_is_503_without_detail(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from pipwerk_marketdata import MarketDataStoreError

    def fail(*_args: Any, **_kwargs: Any) -> Any:
        raise MarketDataStoreError("The database operation failed. The data store was not changed.")

    monkeypatch.setattr(MarketDataStore, "overview", fail)
    monkeypatch.setattr(MarketDataStore, "import_json", fail)

    overview = client.get(f"{API}/overview")
    imported = import_json(client, candles_json(2))

    for response in (overview, imported):
        assert response.status_code == 503
        assert response.json() == {"detail": "The data stock could not be read or changed."}
