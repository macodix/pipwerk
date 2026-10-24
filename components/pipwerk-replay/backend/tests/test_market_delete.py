"""Tests of deleting through the web API (``POST /api/v1/market-data/deletions/...``):
specification 5.5, Abnahmebericht ``wp02`` Versuch 2 M5 and the acceptance criterion 8 of the
plan: series, period, instrument data and all data of a broker, each first as a preview and then
after confirmation; the broker for test runs after the deletion; errors for unknown names.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any

import pytest
from datastock import (
    BROKERS_URL,
    DETAILS_URL,
    SERIES_URL,
    TEST_RUN_BROKER_URL,
    begin,
    candles_json,
    end,
    example,
    import_json_file,
    make_app,
    part,
    upload,
)
from fastapi.testclient import TestClient

DELETIONS = "/api/v1/market-data/deletions"
COMPLETENESS = "/api/v1/market-data/completeness"
START = "2024-01-02T10:00:00Z"


@pytest.fixture
def client(tmp_path: Path) -> TestClient:
    return TestClient(make_app(tmp_path))


def rows(client: TestClient) -> list[tuple[str, str, str]]:
    items = client.get(SERIES_URL, params={"limit": 1000}).json()["items"]
    return [(item["broker"], item["instrument"], item["data"]) for item in items]


def brokers(client: TestClient) -> list[str]:
    items: list[str] = client.get(BROKERS_URL).json()["items"]
    return items


def chosen_broker(client: TestClient) -> dict[str, Any]:
    body: dict[str, Any] = client.get(TEST_RUN_BROKER_URL).json()
    return body


def details(client: TestClient, broker: str, instrument: str, data: str) -> Any:
    params = {"broker": broker, "instrument": instrument, "data": data}
    return client.get(DETAILS_URL, params=params)


def delete(client: TestClient, kind: str, confirm: bool, **body: Any) -> Any:
    return client.post(f"{DELETIONS}/{kind}", json={**body, "confirm": confirm})


def check(client: TestClient, broker: str, **changes: Any) -> dict[str, Any]:
    """The completeness of a part of EURUSD M1 for a broker."""
    request = {"broker": broker, "parts": [part(time_unit="m1", **changes)]}
    result: dict[str, Any] = client.post(COMPLETENESS, json=request).json()["results"][0]
    return result


def fill(client: TestClient) -> None:
    """Alpha: M1 candles (120), ticks (4) and instrument data of EURUSD, M1 candles (10) of
    GBPUSD. Beta: M1 candles (5) of EURUSD. Four rows in the list."""
    import_json_file(client, candles_json(120), broker="Alpha")  # Tuesday 10:00 to 12:00
    import_json_file(client, candles_json(10, instrument="GBPUSD"), broker="Alpha")
    import_json_file(client, example("ticks.json"), broker="Alpha")
    import_json_file(client, example("instrument.json"), broker="Alpha")
    import_json_file(client, candles_json(5), broker="Beta")


# --- a series ---------------------------------------------------------------------------------


def test_the_preview_of_a_series_says_what_would_be_deleted_and_changes_nothing(
    client: TestClient,
) -> None:
    fill(client)
    before = rows(client)
    request = {"broker": "Alpha", "instrument": "EURUSD", "data": "m1"}

    preview = delete(client, "series", False, **request)

    assert preview.status_code == 200
    assert preview.json() == {
        "kind": "series",
        "deleted": False,
        "broker": "Alpha",
        "instrument": "EURUSD",
        "data": "m1",
        "start": None,
        "end": None,
        "candle_count": 120,
        "tick_count": 0,
        "series_count": 1,
        "instrument_count": 0,
        "broker_removed": False,
        "test_run_broker_reset": False,
        "test_run_broker": {"broker": "Alpha", "chosen": False},
    }
    assert rows(client) == before


def test_a_series_is_deleted_after_the_confirmation(client: TestClient) -> None:
    fill(client)
    request = {"broker": "Alpha", "instrument": "EURUSD", "data": "m1"}
    preview = delete(client, "series", False, **request).json()

    done = delete(client, "series", True, **request)

    assert done.status_code == 200
    assert done.json() == {**preview, "deleted": True}
    remaining = set(rows(client))
    assert ("Alpha", "EURUSD", "m1") not in remaining
    # the other series of the instrument, of the broker and of the other broker stay
    assert {
        ("Alpha", "EURUSD", "ticks"),
        ("Alpha", "GBPUSD", "m1"),
        ("Beta", "EURUSD", "m1"),
    } <= remaining
    assert details(client, "Alpha", "EURUSD", "m1").status_code == 404
    assert details(client, "Alpha", "EURUSD", "ticks").status_code == 200
    # the data are gone: a test run that needs them finds them missing
    missing = check(client, "Alpha", start=START, end="2024-01-02T10:30:00Z")
    assert missing["complete"] is False


def test_the_ticks_of_a_series_are_counted_as_ticks(client: TestClient) -> None:
    fill(client)

    done = delete(client, "series", True, broker="Alpha", instrument="EURUSD", data="ticks").json()

    assert (done["candle_count"], done["tick_count"], done["series_count"]) == (0, 4, 1)


def test_a_series_cannot_be_deleted_twice(client: TestClient) -> None:
    fill(client)
    request = {"broker": "Alpha", "instrument": "GBPUSD", "data": "m1"}
    assert delete(client, "series", True, **request).status_code == 200

    again = delete(client, "series", True, **request)

    assert again.status_code == 404
    assert again.json()["code"] == "instrument_unknown"  # Alpha has no data of GBPUSD any more


# --- a period -------------------------------------------------------------------------------------


def test_a_deleted_period_in_the_middle_appears_as_a_gap(client: TestClient) -> None:
    fill(client)
    request = {
        "broker": "Alpha",
        "instrument": "EURUSD",
        "data": "m1",
        "start": "2024-01-02T10:30:00Z",
        "end": "2024-01-02T11:00:00Z",
    }
    assert details(client, "Alpha", "EURUSD", "m1").json()["gaps"] == []

    preview = delete(client, "period", False, **request)
    done = delete(client, "period", True, **request)

    assert preview.json()["candle_count"] == done.json()["candle_count"] == 30
    assert done.json()["start"] == "2024-01-02T10:30:00Z"
    assert (done.json()["end"], done.json()["series_count"]) == ("2024-01-02T11:00:00Z", 0)
    body = details(client, "Alpha", "EURUSD", "m1").json()
    assert body["gaps"] == [
        {"start": "2024-01-02T10:30:00Z", "end": "2024-01-02T11:00:00Z", "reason": "gap"}
    ]
    assert body["row"]["gap_count"] == 1
    listed = client.get(SERIES_URL, params={"broker": "Alpha", "data": "m1"}).json()["items"]
    assert [(item["instrument"], item["gap_count"]) for item in listed] == [
        ("EURUSD", 1),
        ("GBPUSD", 0),
    ]
    # the check before a test run finds the period missing
    result = check(client, "Alpha", start=START, end="2024-01-02T12:00:00Z")
    assert result["complete"] is False
    assert result["missing"] == [
        {"start": "2024-01-02T10:30:00Z", "end": "2024-01-02T11:00:00Z", "reason": "gap"}
    ]


def test_a_period_that_removes_all_candles_removes_the_series(client: TestClient) -> None:
    fill(client)

    done = delete(
        client,
        "period",
        True,
        broker="Beta",
        instrument="EURUSD",
        data="m1",
        start="2024-01-01T00:00:00Z",
        end="2024-01-03T00:00:00Z",
    ).json()

    assert (done["candle_count"], done["series_count"], done["broker_removed"]) == (5, 1, True)
    assert brokers(client) == ["Alpha"]
    assert ("Beta", "EURUSD", "m1") not in rows(client)


def test_a_period_is_given_in_utc_on_the_minute(client: TestClient) -> None:
    fill(client)
    base = {"broker": "Alpha", "instrument": "EURUSD", "data": "m1"}
    # the same moment in another offset is accepted and means the same
    other_offset = delete(
        client,
        "period",
        False,
        **base,
        start="2024-01-02T12:30:00+02:00",
        end="2024-01-02T13:00:00+02:00",
    )
    assert other_offset.status_code == 200
    assert other_offset.json()["start"] == "2024-01-02T10:30:00Z"

    for first, last in (
        ("2024-01-02T10:30:30Z", "2024-01-02T11:00:00Z"),  # not on the minute
        ("2024-01-02T10:30:00.500Z", "2024-01-02T11:00:00Z"),
        ("2024-01-02T11:00:00Z", "2024-01-02T11:00:00Z"),  # empty
        ("2024-01-02T11:00:00Z", "2024-01-02T10:00:00Z"),  # backwards
        ("1969-12-31T00:00:00Z", "2024-01-02T10:00:00Z"),  # before the supported times
        ("2024-01-02T10:00:00Z", "2100-01-02T00:00:00Z"),  # after the supported times
        ("2024-01-02T10:00:00", "2024-01-02T11:00:00Z"),  # without a time zone
        ("yesterday", "2024-01-02T11:00:00Z"),
    ):
        response = delete(client, "period", True, **base, start=first, end=last)
        assert response.status_code == 422, (first, last)
        assert response.json()["detail"] == "The request body does not fit the schema."
    assert details(client, "Alpha", "EURUSD", "m1").json()["gaps"] == []  # nothing was deleted


def test_a_period_without_data_and_not_covered_is_404_period_empty(client: TestClient) -> None:
    fill(client)

    response = delete(
        client,
        "period",
        True,
        broker="Alpha",
        instrument="EURUSD",
        data="m1",
        start="2025-01-01T00:00:00Z",
        end="2025-01-02T00:00:00Z",
    )

    assert response.status_code == 404
    assert response.json()["code"] == "period_empty"
    assert response.json()["message"]
    assert response.json()["detail"]


# --- the instrument data -----------------------------------------------------------------------


def test_the_instrument_data_are_deleted_and_the_series_stay(client: TestClient) -> None:
    fill(client)
    assert details(client, "Alpha", "EURUSD", "m1").json()["contract"] is not None

    preview = delete(client, "contract", False, broker="Alpha", instrument="EURUSD")
    done = delete(client, "contract", True, broker="Alpha", instrument="EURUSD")

    assert preview.json()["instrument_count"] == done.json()["instrument_count"] == 1
    assert done.json()["kind"] == "contract"
    assert (done.json()["data"], done.json()["series_count"]) == (None, 0)
    assert details(client, "Alpha", "EURUSD", "m1").json()["contract"] is None
    assert ("Alpha", "EURUSD", "m1") in rows(client)
    again = delete(client, "contract", True, broker="Alpha", instrument="EURUSD")
    assert again.json()["code"] == "contract_unknown"


def test_the_row_of_the_instrument_data_goes_with_them(client: TestClient) -> None:
    import_json_file(client, example("instrument.json"), broker="Alpha")
    assert rows(client) == [("Alpha", "EURUSD", "contract")]

    done = delete(client, "contract", True, broker="Alpha", instrument="EURUSD").json()

    assert done["broker_removed"] is True
    assert rows(client) == []
    assert brokers(client) == []


# --- a broker; the broker for test runs --------------------------------------------------------


def test_all_data_of_a_broker_are_deleted_and_the_broker_is_gone(client: TestClient) -> None:
    fill(client)

    preview = delete(client, "broker", False, broker="Alpha")
    done = delete(client, "broker", True, broker="Alpha")

    assert preview.json() == {
        "kind": "broker",
        "deleted": False,
        "broker": "Alpha",
        "instrument": None,
        "data": None,
        "start": None,
        "end": None,
        "candle_count": 130,
        "tick_count": 4,
        "series_count": 3,
        "instrument_count": 1,
        "broker_removed": True,
        "test_run_broker_reset": False,
        "test_run_broker": {"broker": "Alpha", "chosen": False},
    }
    assert done.json() == {
        **preview.json(),
        "deleted": True,
        "test_run_broker": {"broker": "Beta", "chosen": False},
    }
    assert brokers(client) == ["Beta"]
    assert rows(client) == [("Beta", "EURUSD", "m1")]


def test_the_broker_for_test_runs_is_not_chosen_any_more_after_its_data_are_deleted(
    client: TestClient,
) -> None:
    fill(client)
    client.put(TEST_RUN_BROKER_URL, json={"broker": "Alpha"})
    assert chosen_broker(client) == {"broker": "Alpha", "chosen": True}

    preview = delete(client, "broker", False, broker="Alpha").json()
    assert preview["test_run_broker_reset"] is True  # the preview says so
    assert preview["test_run_broker"] == {"broker": "Alpha", "chosen": True}  # and changes nothing
    assert chosen_broker(client) == {"broker": "Alpha", "chosen": True}

    done = delete(client, "broker", True, broker="Alpha").json()

    assert done["test_run_broker_reset"] is True
    assert done["test_run_broker"] == {"broker": "Beta", "chosen": False}
    assert chosen_broker(client) == {"broker": "Beta", "chosen": False}
    # a later import of the same broker does not choose it again
    import_json_file(client, candles_json(2), broker="Alpha")
    assert brokers(client) == ["Alpha", "Beta"]
    assert chosen_broker(client) == {"broker": "Alpha", "chosen": False}  # the first, not chosen
    import_json_file(client, candles_json(2), broker="Aaa")
    assert chosen_broker(client) == {"broker": "Aaa", "chosen": False}  # the first in order


def test_deleting_another_broker_leaves_the_choice(client: TestClient) -> None:
    fill(client)
    client.put(TEST_RUN_BROKER_URL, json={"broker": "Beta"})

    done = delete(client, "broker", True, broker="Alpha").json()

    assert done["test_run_broker_reset"] is False
    assert done["test_run_broker"] == {"broker": "Beta", "chosen": True}
    assert chosen_broker(client) == {"broker": "Beta", "chosen": True}


def test_the_choice_goes_also_when_the_broker_leaves_by_another_way(client: TestClient) -> None:
    """Specification 5.5: a broker that does not occur any more, by whatever way, is not chosen
    any more - deleting its last series, its last period or its last instrument data."""
    for kind, body in (
        ("series", {"instrument": "EURUSD", "data": "m1"}),
        (
            "period",
            {
                "instrument": "EURUSD",
                "data": "m1",
                "start": "2024-01-02T10:00:00Z",
                "end": "2024-01-02T11:00:00Z",
            },
        ),
    ):
        import_json_file(client, candles_json(5), broker="Only")
        import_json_file(client, candles_json(5), broker="Other")
        client.put(TEST_RUN_BROKER_URL, json={"broker": "Only"})

        done = delete(client, kind, True, broker="Only", **body).json()

        assert done["broker_removed"] is True, kind
        assert done["test_run_broker_reset"] is True, kind
        assert chosen_broker(client) == {"broker": "Other", "chosen": False}, kind
        import_json_file(client, candles_json(5), broker="Only")  # it comes back, not chosen
        assert chosen_broker(client) == {"broker": "Only", "chosen": False}, kind
        delete(client, "broker", True, broker="Only")
        delete(client, "broker", True, broker="Other")

    import_json_file(client, example("instrument.json"), broker="Only")
    import_json_file(client, candles_json(5), broker="Other")
    client.put(TEST_RUN_BROKER_URL, json={"broker": "Only"})
    done = delete(client, "contract", True, broker="Only", instrument="EURUSD").json()
    assert done["test_run_broker_reset"] is True
    assert chosen_broker(client) == {"broker": "Other", "chosen": False}


def test_a_broker_that_vanished_without_this_service_is_not_chosen_again_by_an_import(
    tmp_path: Path,
) -> None:
    client = TestClient(make_app(tmp_path))
    import_json_file(client, candles_json(2), broker="Zeta")
    import_json_file(client, candles_json(2), broker="Alpha")
    client.put(TEST_RUN_BROKER_URL, json={"broker": "Zeta"})
    with sqlite3.connect(tmp_path / "replay.db") as connection:
        for table in ("marketdata_candle", "marketdata_coverage"):
            connection.execute(
                f"DELETE FROM {table} WHERE series_id IN "  # noqa: S608 - fixed table names
                "(SELECT id FROM marketdata_series WHERE broker = 'Zeta')"
            )
        connection.execute("DELETE FROM marketdata_series WHERE broker = 'Zeta'")

    import_json_file(client, candles_json(2), broker="Zeta")  # no read of the setting before

    assert chosen_broker(client) == {"broker": "Alpha", "chosen": False}


# --- unknown names and wrong requests -----------------------------------------------------------


@pytest.mark.parametrize(
    ("kind", "body", "code"),
    [
        ("broker", {"broker": "Nobody"}, "broker_unknown"),
        ("series", {"broker": "Nobody", "instrument": "EURUSD", "data": "m1"}, "broker_unknown"),
        ("contract", {"broker": "Nobody", "instrument": "EURUSD"}, "broker_unknown"),
        ("series", {"broker": "Alpha", "instrument": "NOPE", "data": "m1"}, "instrument_unknown"),
        ("contract", {"broker": "Alpha", "instrument": "NOPE"}, "instrument_unknown"),
        ("series", {"broker": "Alpha", "instrument": "EURUSD", "data": "d1"}, "series_unknown"),
        ("contract", {"broker": "Alpha", "instrument": "GBPUSD"}, "contract_unknown"),
        (
            "period",
            {
                "broker": "Alpha",
                "instrument": "EURUSD",
                "data": "h4",
                "start": START,
                "end": "2024-01-02T11:00:00Z",
            },
            "series_unknown",
        ),
        (
            "period",
            {
                "broker": "Nobody",
                "instrument": "EURUSD",
                "data": "m1",
                "start": START,
                "end": "2024-01-02T11:00:00Z",
            },
            "broker_unknown",
        ),
    ],
)
def test_unknown_names_are_404_with_a_code_for_the_preview_and_the_deletion(
    client: TestClient, kind: str, body: dict[str, Any], code: str
) -> None:
    fill(client)
    before = rows(client)

    for confirm in (False, True):
        response = delete(client, kind, confirm, **body)

        assert response.status_code == 404, (kind, confirm)
        assert response.json()["code"] == code
        assert response.json()["detail"] == (
            "The data cannot be deleted: the broker, the data or the period is unknown."
        )
        assert isinstance(response.json()["message"], str)
        assert "Traceback" not in response.text
    assert rows(client) == before


def test_names_are_matched_exactly(client: TestClient) -> None:
    fill(client)

    response = delete(client, "broker", True, broker="alpha")

    assert response.status_code == 404
    assert response.json()["code"] == "broker_unknown"
    assert "Alpha" in brokers(client)


@pytest.mark.parametrize(
    "body",
    [
        {"broker": "Alpha"},  # the confirmation is not assumed
        {"broker": "Alpha", "confirm": "true"},
        {"broker": "Alpha", "confirm": 1},
        {"broker": "Alpha", "confirm": None},
        {"broker": "Alpha", "confirm": True, "extra": 1},
        {"confirm": True},
        {"broker": "", "confirm": True},
        {"broker": " Alpha", "confirm": True},
    ],
)
def test_a_wrong_body_is_422_and_deletes_nothing(client: TestClient, body: dict[str, Any]) -> None:
    fill(client)
    before = rows(client)

    response = client.post(f"{DELETIONS}/broker", json=body)

    assert response.status_code == 422
    assert response.json()["detail"] == "The request body does not fit the schema."
    assert rows(client) == before


def test_a_series_needs_a_known_kind_of_data(client: TestClient) -> None:
    fill(client)

    for data in ("contract", "h7", "M1", "", None):
        response = delete(client, "series", True, broker="Alpha", instrument="EURUSD", data=data)
        assert response.status_code == 422, data


def test_a_deletion_needs_a_json_body(client: TestClient) -> None:
    fill(client)
    text = {"content-type": "text/plain"}
    for kind in ("series", "period", "contract", "broker"):
        url = f"{DELETIONS}/{kind}"
        assert client.post(url).status_code == 415
        assert client.post(url, content=b'{"confirm": true}', headers=text).status_code == 415
        assert client.get(url).status_code == 405
        assert client.delete(url).status_code == 405
    assert len(rows(client)) == 4


def test_a_finished_import_process_does_not_block_a_deletion(client: TestClient) -> None:
    fill(client)
    process = begin(client)
    end(client, process)

    assert delete(client, "broker", True, broker="Beta").status_code == 200


def test_deleting_leaves_the_other_data_as_they_were(client: TestClient) -> None:
    fill(client)
    ticks = ("Alpha", "EURUSD", "ticks")
    before = details(client, *ticks).json()

    delete(client, "broker", True, broker="Beta")
    delete(client, "series", True, broker="Alpha", instrument="GBPUSD", data="m1")

    assert details(client, *ticks).json() == before


def test_importing_again_after_deleting_restores_the_series(client: TestClient) -> None:
    fill(client)
    delete(client, "broker", True, broker="Beta")
    assert "Beta" not in brokers(client)

    response = upload(client, [("a.json", candles_json(5))], broker="Beta")

    assert response.json()["imported_count"] == 1
    assert ("Beta", "EURUSD", "m1") in rows(client)
    assert details(client, "Beta", "EURUSD", "m1").json()["gaps"] == []
