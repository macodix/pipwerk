"""Tests of the web API of the data stock under ``/api/v1/market-data/``: instrument data and
completeness.

The list of series has its tests in ``test_market_series.py``, the import of several files in
``test_market_import.py``, the broker for test runs in ``test_internal_api.py``. Every endpoint is
tested with valid and invalid input.
"""

from __future__ import annotations

import json
import sqlite3
from datetime import timedelta
from pathlib import Path
from typing import Any

import pytest
from datastock import (
    API,
    BROKER,
    EXAMPLE_BROKER,
    FIRST_MINUTE,
    JSON,
    candle_entry,
    candles_document,
    candles_json,
    example,
    import_json_file,
    make_app,
)
from fastapi.testclient import TestClient
from pipwerk_marketdata import MarketDataStore, MarketDataStoreError

from pipwerk_replay.config import MarketDataSettings

BODY_INVALID = "The request body does not fit the schema."
REQUEST_INVALID = "The request is invalid."


def make_client(tmp_path: Path, **settings: Any) -> TestClient:
    marketdata = MarketDataSettings(**settings) if settings else None
    return TestClient(make_app(tmp_path, marketdata=marketdata))


@pytest.fixture
def client(tmp_path: Path) -> TestClient:
    return make_client(tmp_path)


def import_example(client: TestClient, name: str) -> None:
    import_json_file(client, example(name), broker=EXAMPLE_BROKER)


# --- instrument data ----------------------------------------------------------------------------


def test_the_data_of_an_instrument_are_read(client: TestClient) -> None:
    import_example(client, "instrument.json")

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
    import_json_file(client, json.dumps(older).encode(), broker=EXAMPLE_BROKER)
    import_json_file(client, json.dumps(newer).encode(), broker=EXAMPLE_BROKER)
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


def check(client: TestClient, *parts: dict[str, Any], **changes: Any) -> Any:
    return client.post(f"{API}/completeness", json={"parts": list(parts), **changes})


def _gappy(client: TestClient) -> None:
    """Four files with one M1 candle each, at 10:00, 12:00, 14:00 and 16:00: three gaps between
    their covered periods."""
    for index in range(4):
        entry = candle_entry(FIRST_MINUTE + timedelta(hours=2 * index))
        import_json_file(client, candles_document([entry]))


def test_without_a_broker_and_without_any_data_the_check_is_409(client: TestClient) -> None:
    response = check(client, candle_part())

    assert response.status_code == 409
    assert response.json() == {"detail": "The data stock has no broker yet. Import data first."}


def test_without_a_broker_in_the_request_the_broker_for_test_runs_is_checked(
    client: TestClient,
) -> None:
    import_example(client, "candles.json")

    response = check(client, candle_part())

    assert response.status_code == 200
    assert response.json()["broker"] == EXAMPLE_BROKER


def test_needed_present_and_missing_of_a_part_of_candles(client: TestClient) -> None:
    import_example(client, "candles.json")

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
    import_example(client, "candles.json")

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
    import_example(client, "ticks.json")
    ticks = {
        "kind": "ticks",
        "instrument": "EURUSD",
        "start": "2024-01-02T10:00:00Z",
        "end": "2024-01-02T10:01:00Z",
    }
    instrument = {"kind": "instrument", "instrument": "EURUSD"}

    before = check(client, ticks, instrument).json()["results"]
    import_example(client, "instrument.json")
    after = check(client, ticks, instrument).json()["results"]

    assert [item["complete"] for item in before] == [True, False]
    assert [item["complete"] for item in after] == [True, True]
    assert before[1]["present"] == before[1]["missing"] == []
    assert before[1]["needed"] == instrument


def test_nothing_is_present_for_a_series_that_does_not_exist(client: TestClient) -> None:
    [result] = check(client, candle_part(), broker="NoSuchBroker").json()["results"]

    assert result["complete"] is False
    assert result["present"] == []
    assert result["missing"] == [
        {"start": "2024-01-02T10:00:00Z", "end": "2024-01-02T10:10:00Z", "reason": "not_covered"}
    ]


def test_the_closed_market_counts_as_present(client: TestClient) -> None:
    saturday = candle_part(start="2024-01-06T10:00:00Z", end="2024-01-06T12:00:00Z")

    [result] = check(client, saturday, broker="NoSuchBroker").json()["results"]

    assert result["complete"] is True
    assert result["present"] == [{"start": "2024-01-06T10:00:00Z", "end": "2024-01-06T12:00:00Z"}]


def test_a_broker_in_the_request_replaces_the_broker_for_test_runs(client: TestClient) -> None:
    import_example(client, "candles.json")
    import_json_file(client, candles_json(2), broker="AAA-First")  # first in alphabetical order
    part = candle_part(end="2024-01-02T10:05:00Z")

    default = check(client, part).json()
    explicit = check(client, part, broker=EXAMPLE_BROKER).json()

    assert default["broker"] == "AAA-First"
    assert default["results"][0]["complete"] is False
    assert explicit["broker"] == EXAMPLE_BROKER
    assert explicit["results"][0]["complete"] is True


def test_the_chosen_broker_for_test_runs_is_the_one_that_is_checked(client: TestClient) -> None:
    import_example(client, "candles.json")
    import_json_file(client, candles_json(2), broker="AAA-First")
    assert client.put(
        "/api/replay/settings/test-run-broker", json={"broker": EXAMPLE_BROKER}
    ).is_success

    body = check(client, candle_part(end="2024-01-02T10:05:00Z")).json()

    assert body["broker"] == EXAMPLE_BROKER
    assert body["results"][0]["complete"] is True


def test_the_results_come_in_the_order_of_the_request(client: TestClient) -> None:
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

    results = check(client, *parts, broker=BROKER).json()["results"]

    assert [item["needed"] for item in results] == parts


def test_a_moment_with_an_offset_is_kept_as_given_and_compared_in_utc(client: TestClient) -> None:
    import_example(client, "candles.json")
    part = candle_part(start="2024-01-02T12:00:00+02:00", end="2024-01-02T12:05:00+02:00")

    [result] = check(client, part).json()["results"]

    assert result["needed"]["start"] == "2024-01-02T12:00:00+02:00"
    assert result["complete"] is True


def test_the_number_of_parts_is_limited(tmp_path: Path) -> None:
    client = make_client(tmp_path, max_parts_per_request=2)

    ok = check(client, candle_part(), candle_part(), broker=BROKER)
    too_many = check(client, candle_part(), candle_part(), candle_part(), broker=BROKER)

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
    response = client.post(f"{API}/completeness", json=body)

    assert response.status_code == 422, body
    assert response.json()["detail"] == BODY_INVALID
    assert "secret-kind-5" not in response.text


def test_the_period_may_reach_the_end_of_the_supported_times(client: TestClient) -> None:
    last = candle_part(time_unit="mn1", start="2099-12-01T00:00:00Z", end="2100-01-01T00:00:00Z")
    first = candle_part(time_unit="mn1", start="1970-01-01T00:00:00Z", end="1970-02-01T00:00:00Z")

    assert check(client, last, first, broker=BROKER).status_code == 200


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


def test_a_stored_broker_for_test_runs_that_is_no_valid_name_is_503(
    tmp_path: Path, client: TestClient
) -> None:
    import_json_file(client, candles_json(2))
    assert client.put("/api/replay/settings/test-run-broker", json={"broker": BROKER}).is_success
    with sqlite3.connect(tmp_path / "replay.db") as connection:
        connection.execute("UPDATE replay_settings SET test_run_broker = ' bad '")

    response = check(client, candle_part())

    assert response.status_code == 503
    assert response.json() == {
        "detail": "The stored pipwerk replay broker for test runs is invalid."
    }
    assert check(client, candle_part(), broker=BROKER).status_code == 200  # a broker is given


def test_a_failure_of_the_database_is_503_without_detail(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fail(*_args: Any, **_kwargs: Any) -> Any:
        raise MarketDataStoreError("The database operation failed. The data store was not changed.")

    monkeypatch.setattr(MarketDataStore, "list_series", fail)
    monkeypatch.setattr(MarketDataStore, "brokers", fail)
    monkeypatch.setattr(MarketDataStore, "series_details", fail)

    responses = [
        client.get(f"{API}/series"),
        client.get(f"{API}/brokers"),
        client.get(
            f"{API}/series/details", params={"broker": "B", "instrument": "I", "data": "m1"}
        ),
        client.get("/api/replay/settings/test-run-broker"),
        check(client, candle_part()),
    ]

    for response in responses:
        assert response.status_code == 503
        assert response.json() == {"detail": "The data stock could not be read or changed."}
