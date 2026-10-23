"""Tests of the list of series, the details of a row and the list of brokers
(``/api/v1/market-data/series``, ``.../series/details``, ``.../brokers``).

The data come in through the import of the web API, as for a user. Specification 5.3, 7, 8.3.
"""

from __future__ import annotations

import json
from datetime import timedelta
from pathlib import Path
from typing import Any

import pytest
from datastock import (
    BROKERS_URL,
    DETAILS_URL,
    EXAMPLE_BROKER,
    FIRST_MINUTE,
    SERIES_URL,
    candle_entry,
    candles_document,
    candles_json,
    example,
    import_json_file,
    make_app,
)
from fastapi.testclient import TestClient

from pipwerk_replay.config import MarketDataSettings

REQUEST_INVALID = "The request is invalid."


def make_client(tmp_path: Path, **settings: Any) -> TestClient:
    marketdata = MarketDataSettings(**settings) if settings else None
    return TestClient(make_app(tmp_path, marketdata=marketdata))


@pytest.fixture
def client(tmp_path: Path) -> TestClient:
    return make_client(tmp_path)


def import_example(client: TestClient, name: str, **changes: Any) -> None:
    document = {**json.loads(example(name)), **changes}
    import_json_file(client, json.dumps(document).encode(), broker=EXAMPLE_BROKER)


def import_candles(
    client: TestClient, broker: str, instrument: str, unit: str = "m1", count: int = 2
) -> None:
    import_json_file(
        client, candles_json(count, instrument=instrument, time_unit=unit), broker=broker
    )


def import_gappy(client: TestClient) -> None:
    """M1 candles at 10:00, 12:00, 14:00 and 16:00 inside the period 10:00 to 16:01: three gaps."""
    entries = [candle_entry(FIRST_MINUTE + timedelta(hours=2 * index)) for index in range(4)]
    period = {"start": "2024-01-02T10:00:00Z", "end": "2024-01-02T16:01:00Z"}
    import_json_file(client, candles_document(entries, period=period))


def rows(client: TestClient, **params: Any) -> list[tuple[str, str, str]]:
    response = client.get(SERIES_URL, params=params)
    assert response.status_code == 200, response.text
    return [(item["broker"], item["instrument"], item["data"]) for item in response.json()["items"]]


# --- the list of series --------------------------------------------------------------------------


def test_the_list_of_an_empty_data_stock(client: TestClient) -> None:
    response = client.get(SERIES_URL)

    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 0, "offset": 0, "limit": 1000}


def test_a_row_names_broker_instrument_data_period_and_the_number_of_gaps(
    client: TestClient,
) -> None:
    import_example(client, "candles.json")
    import_example(client, "ticks.json")

    body = client.get(SERIES_URL).json()

    assert body["total"] == 2
    assert body["items"] == [
        {
            "broker": EXAMPLE_BROKER,
            "instrument": "EURUSD",
            "data": "m1",
            "first": "2024-01-02T10:00:00Z",
            "last": "2024-01-02T10:04:00Z",
            "gap_count": 0,
        },
        {
            "broker": EXAMPLE_BROKER,
            "instrument": "EURUSD",
            "data": "ticks",
            "first": "2024-01-02T10:00:00.120000Z",
            "last": "2024-01-02T10:00:42.500000Z",
            "gap_count": 0,
        },
    ]


def test_the_gaps_of_a_row_are_counted(client: TestClient) -> None:
    import_gappy(client)

    [item] = client.get(SERIES_URL).json()["items"]

    assert item["gap_count"] == 3


def test_an_instrument_with_instrument_data_only_has_a_row_with_the_data_contract(
    client: TestClient,
) -> None:
    import_example(client, "candles.json")
    import_example(client, "instrument.json")  # EURUSD has candles: no row of its own
    import_example(client, "instrument.json", instrument="GBPUSD")  # GBPUSD has nothing else

    items = client.get(SERIES_URL).json()["items"]

    assert [(item["instrument"], item["data"]) for item in items] == [
        ("EURUSD", "m1"),
        ("GBPUSD", "contract"),
    ]
    assert items[1] == {
        "broker": EXAMPLE_BROKER,
        "instrument": "GBPUSD",
        "data": "contract",
        "first": None,
        "last": None,
        "gap_count": 0,
    }


def test_the_rows_are_sorted_by_broker_instrument_and_data(client: TestClient) -> None:
    import_candles(client, "Zeta", "AAA")
    import_candles(client, "alpha", "BBB", unit="h1")
    import_candles(client, "alpha", "BBB", unit="m5")
    import_candles(client, "alpha", "AAA", unit="d1")
    import_json_file(client, example("ticks.json").replace(b"EURUSD", b"BBB"), broker="alpha")

    assert rows(client) == [
        ("alpha", "AAA", "d1"),
        ("alpha", "BBB", "m5"),
        ("alpha", "BBB", "h1"),
        ("alpha", "BBB", "ticks"),
        ("Zeta", "AAA", "m1"),
    ]


def test_the_filters_match_a_part_of_the_text_without_regard_to_case(client: TestClient) -> None:
    import_candles(client, "Live-Server", "EURUSD")
    import_candles(client, "Live-Server", "GBPUSD", unit="h1")
    import_candles(client, "Demo-Server", "EURJPY")

    assert rows(client, broker="live") == [
        ("Live-Server", "EURUSD", "m1"),
        ("Live-Server", "GBPUSD", "h1"),
    ]
    assert rows(client, instrument="usd") == [
        ("Live-Server", "EURUSD", "m1"),
        ("Live-Server", "GBPUSD", "h1"),
    ]
    assert rows(client, data="H1") == [("Live-Server", "GBPUSD", "h1")]
    assert rows(client, broker="SERVER", instrument="eur", data="m1") == [
        ("Demo-Server", "EURJPY", "m1"),
        ("Live-Server", "EURUSD", "m1"),
    ]
    assert rows(client, broker="live-server", instrument="eurusd", data="M1") == [
        ("Live-Server", "EURUSD", "m1")
    ]
    assert len(rows(client, broker="", instrument="", data="")) == 3


def test_a_filter_that_no_row_matches_gives_an_empty_list(client: TestClient) -> None:
    import_candles(client, "B", "EURUSD")

    for params in ({"broker": "nobody"}, {"instrument": "xyz"}, {"data": "h1"}, {"data": "ticks"}):
        body = client.get(SERIES_URL, params=params).json()
        assert (body["items"], body["total"]) == ([], 0), params


def test_an_unknown_identifier_of_data_in_the_filter_is_an_empty_list_not_an_error(
    client: TestClient,
) -> None:
    import_candles(client, "B", "EURUSD")

    for data in ("unknown", "xx", "h1x", "Kerzen H1", "%", "' OR 1=1 --"):
        response = client.get(SERIES_URL, params={"data": data})
        assert response.status_code == 200, data
        assert response.json()["items"] == [], data
        assert response.json()["total"] == 0, data


def test_the_list_is_cut_to_the_page_and_the_total_counts_all(client: TestClient) -> None:
    for instrument in ("AAA", "BBB", "CCC", "DDD", "EEE"):
        import_candles(client, "B", instrument)

    page = client.get(SERIES_URL, params={"offset": 1, "limit": 2}).json()

    assert [item["instrument"] for item in page["items"]] == ["BBB", "CCC"]
    assert (page["total"], page["offset"], page["limit"]) == (5, 1, 2)
    last = client.get(SERIES_URL, params={"offset": 4, "limit": 2}).json()
    assert [item["instrument"] for item in last["items"]] == ["EEE"]
    beyond = client.get(SERIES_URL, params={"offset": 50}).json()
    assert beyond["items"] == []
    assert beyond["total"] == 5


def test_the_total_counts_the_rows_that_match_the_filter(client: TestClient) -> None:
    for instrument in ("AAA", "AAB", "CCC"):
        import_candles(client, "B", instrument)

    body = client.get(SERIES_URL, params={"instrument": "aa", "limit": 1}).json()

    assert (len(body["items"]), body["total"]) == (1, 2)


def test_the_default_size_of_a_page_is_the_limit_of_the_configuration(tmp_path: Path) -> None:
    client = make_client(tmp_path, max_listed_items=2)
    for instrument in ("AAA", "BBB", "CCC"):
        import_candles(client, "B", instrument)

    body = client.get(SERIES_URL).json()

    assert [item["instrument"] for item in body["items"]] == ["AAA", "BBB"]
    assert (body["total"], body["limit"]) == (3, 2)
    assert client.get(SERIES_URL, params={"limit": 2}).status_code == 200


def test_a_page_above_the_limit_of_the_configuration_is_422(tmp_path: Path) -> None:
    client = make_client(tmp_path, max_listed_items=2)

    response = client.get(SERIES_URL, params={"limit": 3})

    assert response.status_code == 422
    assert response.json()["errors"] == [
        {"location": ["query", "limit"], "type": "less_than_equal"}
    ]


@pytest.mark.parametrize(
    "params",
    [
        {"offset": -1},
        {"limit": 0},
        {"limit": -3},
        {"offset": "x"},
        {"limit": "1.5"},
        {"foo": "1"},
        {"broker": "x" * 129},
        {"instrument": "x" * 129},
        {"data": "x" * 17},
        {"offset": 1_000_000_001},
    ],
)
def test_an_invalid_query_of_the_list_is_422(client: TestClient, params: dict[str, Any]) -> None:
    response = client.get(SERIES_URL, params=params)

    assert response.status_code == 422
    assert response.json()["detail"] == REQUEST_INVALID


@pytest.mark.parametrize("path", [SERIES_URL, DETAILS_URL, BROKERS_URL])
def test_the_endpoints_of_the_list_only_answer_get(client: TestClient, path: str) -> None:
    assert client.post(path, json={}).status_code == 405
    assert client.put(path, json={}).status_code == 405
    assert client.delete(path).status_code == 405


# --- the details of a row ------------------------------------------------------------------------


def details(client: TestClient, broker: str, instrument: str, data: str) -> Any:
    return client.get(
        DETAILS_URL, params={"broker": broker, "instrument": instrument, "data": data}
    )


def test_the_details_of_a_series_name_all_gaps_and_the_instrument_data(client: TestClient) -> None:
    import_gappy(client)
    import_json_file(
        client,
        json.dumps({**json.loads(example("instrument.json")), "instrument": "EURUSD"}).encode(),
    )

    response = details(client, "TestBroker", "EURUSD", "m1")

    assert response.status_code == 200
    body = response.json()
    assert body["row"] == {
        "broker": "TestBroker",
        "instrument": "EURUSD",
        "data": "m1",
        "first": "2024-01-02T10:00:00Z",
        "last": "2024-01-02T16:00:00Z",
        "gap_count": 3,
    }
    assert body["gaps"] == [
        {"start": "2024-01-02T10:01:00Z", "end": "2024-01-02T12:00:00Z", "reason": "gap"},
        {"start": "2024-01-02T12:01:00Z", "end": "2024-01-02T14:00:00Z", "reason": "gap"},
        {"start": "2024-01-02T14:01:00Z", "end": "2024-01-02T16:00:00Z", "reason": "gap"},
    ]
    assert body["contract"]["contract_size"] == 100000.0
    assert body["contract"]["broker"] == "TestBroker"


def test_the_details_say_that_the_instrument_data_are_missing(client: TestClient) -> None:
    import_candles(client, "B", "EURUSD")

    body = details(client, "B", "EURUSD", "m1").json()

    assert body["contract"] is None
    assert body["gaps"] == []


def test_the_instrument_data_of_another_broker_are_not_shown(client: TestClient) -> None:
    import_candles(client, "B", "EURUSD")
    import_example(client, "instrument.json")  # EXAMPLE_BROKER, not B

    assert details(client, "B", "EURUSD", "m1").json()["contract"] is None


def test_the_gaps_in_the_details_are_cut_and_counted(tmp_path: Path) -> None:
    client = make_client(tmp_path, max_listed_items=2)
    import_gappy(client)

    body = details(client, "TestBroker", "EURUSD", "m1").json()

    assert len(body["gaps"]) == 2
    assert body["row"]["gap_count"] == 3


def test_the_details_of_ticks_and_of_the_contract_row(client: TestClient) -> None:
    import_example(client, "ticks.json")
    import_example(client, "instrument.json", instrument="GBPUSD")

    ticks = details(client, EXAMPLE_BROKER, "EURUSD", "ticks")
    contract = details(client, EXAMPLE_BROKER, "GBPUSD", "contract")

    assert ticks.status_code == 200
    assert ticks.json()["row"]["data"] == "ticks"
    assert contract.status_code == 200
    assert contract.json()["row"]["first"] is None
    assert contract.json()["gaps"] == []
    assert contract.json()["contract"]["instrument"] == "GBPUSD"


@pytest.mark.parametrize(
    ("broker", "instrument", "data"),
    [
        ("B", "EURUSD", "h1"),  # no such series
        ("B", "NOPE", "m1"),
        ("Nobody", "EURUSD", "m1"),
        ("B", "EURUSD", "contract"),  # EURUSD has a series: no row contract
        ("B", "EURUSD", "M1"),  # the identifiers are lower case
        ("B", "EURUSD", "Kerzen H1"),
        ("B", "EURUSD", "xyz"),
        ("B", "EURUSD", ""),
    ],
)
def test_a_row_that_the_list_does_not_have_is_404(
    client: TestClient, broker: str, instrument: str, data: str
) -> None:
    import_candles(client, "B", "EURUSD")

    response = details(client, broker, instrument, data)

    assert response.status_code == 404
    assert response.json() == {"detail": "There is no such row in the list of series."}


@pytest.mark.parametrize(
    "params",
    [
        {},
        {"broker": "B", "instrument": "I"},
        {"broker": "B", "data": "m1"},
        {"instrument": "I", "data": "m1"},
        {"broker": " B", "instrument": "I", "data": "m1"},
        {"broker": "B", "instrument": "", "data": "m1"},
        {"broker": "B", "instrument": "I", "data": "x" * 17},
        {"broker": "B", "instrument": "I", "data": "m1", "other": "1"},
    ],
)
def test_an_invalid_query_of_the_details_is_422(client: TestClient, params: dict[str, str]) -> None:
    response = client.get(DETAILS_URL, params=params)

    assert response.status_code == 422
    assert response.json()["detail"] == REQUEST_INVALID


# --- the brokers ---------------------------------------------------------------------------------


def test_there_is_no_broker_in_an_empty_data_stock(client: TestClient) -> None:
    response = client.get(BROKERS_URL)

    assert response.status_code == 200
    assert response.json() == {"items": []}


def test_the_brokers_are_the_ones_that_occur_sorted_without_regard_to_case(
    client: TestClient,
) -> None:
    import_candles(client, "Zeta", "AAA")
    import_candles(client, "alpha", "AAA")
    import_candles(client, "alpha", "BBB")
    import_example(client, "instrument.json")  # a broker with instrument data only

    assert client.get(BROKERS_URL).json() == {"items": ["alpha", EXAMPLE_BROKER, "Zeta"]}
