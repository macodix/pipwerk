"""Gaps in the data stock through the web API (specification 5.2, Abnahmebericht ``wp02`` Versuch 2
M6, criterion 9 of the plan): holidays and other times without trade are no gaps, a trading day
that was not imported is one, the check before a test run follows the same rule.

The files are CSV files imported with the time zone of a server in UTC+2 (Europe/Athens in
winter), as MetaTrader 5 exports them. The days without trade are those of the startup
configuration (default: 25 December and 1 January).
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest
from datastock import (
    BROKER,
    CANDLE_HEADER,
    DETAILS_URL,
    SERIES_URL,
    candle_row,
    csv_file,
    make_app,
    part,
    upload,
)
from fastapi.testclient import TestClient
from pipwerk_marketdata import CalendarDay

from pipwerk_replay.config import MarketDataSettings

COMPLETENESS = "/api/v1/market-data/completeness"


@pytest.fixture
def client(tmp_path: Path) -> TestClient:
    return TestClient(make_app(tmp_path))


def put_csv(client: TestClient, *rows: tuple[str, str]) -> None:
    """One CSV file of M1 candles of EURUSD with the rows (date, clock) in the time zone of the
    server (UTC+2)."""
    data = csv_file(CANDLE_HEADER, *(candle_row(clock, date=date) for date, clock in rows))
    response = upload(
        client,
        [("EURUSD,M1.csv", data)],
        timezone="Europe/Athens",
        instruments=["EURUSD"],
        datas=["m1"],
    )
    assert response.status_code == 200, response.text
    assert response.json()["refused_count"] == 0, response.text


def details(client: TestClient) -> dict[str, Any]:
    params = {"broker": BROKER, "instrument": "EURUSD", "data": "m1"}
    body: dict[str, Any] = client.get(DETAILS_URL, params=params).json()
    return body


def gaps(client: TestClient) -> list[tuple[str, str]]:
    return [(gap["start"], gap["end"]) for gap in details(client)["gaps"]]


def check(client: TestClient, start: str, end: str) -> dict[str, Any]:
    request = {"broker": BROKER, "parts": [part(time_unit="m1", start=start, end=end)]}
    result: dict[str, Any] = client.post(COMPLETENESS, json=request).json()["results"][0]
    return result


@pytest.mark.parametrize(
    ("before", "after"),
    [
        # a file ends on 24 December, the next one begins on 26 December
        (("2024.12.24", "2024.12.26"), ("09:00:00", "01:00:00")),
        # ... on 31 December and 2 January
        (("2024.12.31", "2025.01.02"), ("09:00:00", "01:00:00")),
    ],
)
def test_the_holiday_between_two_files_is_no_gap(
    client: TestClient, before: tuple[str, str], after: tuple[str, str]
) -> None:
    put_csv(client, (before[0], after[0]), (before[0], "17:30:00"))  # early close
    put_csv(client, (before[1], after[1]), (before[1], "09:00:00"))

    assert gaps(client) == []
    assert details(client)["row"]["gap_count"] == 0
    [row] = client.get(SERIES_URL).json()["items"]
    assert row["gap_count"] == 0


def test_the_early_close_on_the_last_day_of_a_file_is_no_gap(client: TestClient) -> None:
    # the last candle of the file is on 24 December at 17:30 (15:30 UTC); trading ends earlier
    # than on other days, and the export covers the whole day
    put_csv(client, ("2024.12.24", "09:00:00"), ("2024.12.24", "17:30:00"))

    result = check(client, "2024-12-24T15:31:00Z", "2024-12-24T22:00:00Z")

    assert result["complete"] is True
    assert result["missing"] == []


def test_a_holiday_inside_one_file_is_no_gap(client: TestClient) -> None:
    put_csv(client, ("2024.12.23", "09:00:00"), ("2024.12.27", "09:00:00"))

    assert gaps(client) == []
    assert check(client, "2024-12-23T00:00:00Z", "2024-12-27T09:00:00Z")["complete"] is True


def test_a_trading_day_that_was_not_imported_between_two_files_is_a_gap(
    client: TestClient,
) -> None:
    put_csv(client, ("2024.12.17", "09:00:00"))  # Tuesday
    put_csv(client, ("2024.12.19", "09:00:00"))  # Thursday: Wednesday is missing

    assert gaps(client) == [("2024-12-17T22:00:00Z", "2024-12-18T22:00:00Z")]
    assert details(client)["row"]["gap_count"] == 1
    [row] = client.get(SERIES_URL).json()["items"]
    assert row["gap_count"] == 1


def test_the_weekend_between_two_files_is_no_gap(client: TestClient) -> None:
    put_csv(client, ("2024.12.13", "09:00:00"))  # Friday
    put_csv(client, ("2024.12.16", "09:00:00"))  # Monday

    assert gaps(client) == []


def test_a_gap_over_a_weekend_is_one_gap_from_the_first_to_the_last_trading_moment(
    client: TestClient,
) -> None:
    put_csv(client, ("2024.12.12", "09:00:00"))  # Thursday
    put_csv(client, ("2024.12.17", "09:00:00"))  # Tuesday: Friday, Monday are missing

    assert gaps(client) == [("2024-12-12T22:00:00Z", "2024-12-16T22:00:00Z")]


def test_the_check_before_a_test_run_does_not_need_data_for_a_day_without_trade(
    client: TestClient,
) -> None:
    put_csv(client, ("2025.01.02", "01:00:00"), ("2025.01.03", "09:00:00"))

    # the test period begins on 1 January 00:00 UTC, a day without trade (it lasts until 22:00 UTC)
    result = check(client, "2025-01-01T00:00:00Z", "2025-01-03T12:00:00Z")

    assert result["complete"] is True
    assert result["missing"] == []
    assert result["present"] == [{"start": "2025-01-01T00:00:00Z", "end": "2025-01-03T12:00:00Z"}]


def test_the_check_before_a_test_run_misses_data_before_a_trading_day(client: TestClient) -> None:
    put_csv(client, ("2025.01.02", "01:00:00"))

    result = check(client, "2024-12-30T00:00:00Z", "2025-01-02T12:00:00Z")

    assert result["complete"] is False
    assert result["missing"] == [
        {"start": "2024-12-30T00:00:00Z", "end": "2024-12-31T22:00:00Z", "reason": "not_covered"}
    ]


def test_the_days_without_trade_come_from_the_startup_configuration(tmp_path: Path) -> None:
    without = TestClient(make_app(tmp_path, marketdata=MarketDataSettings(no_trading_days=())))
    put_csv(without, ("2024.12.24", "09:00:00"))
    put_csv(without, ("2024.12.26", "09:00:00"))

    # without the days of the configuration the day in between is a gap
    assert gaps(without) == [("2024-12-24T22:00:00Z", "2024-12-25T22:00:00Z")]


def test_another_day_without_trade_in_the_configuration_is_no_gap(tmp_path: Path) -> None:
    default = TestClient(make_app(tmp_path))
    put_csv(default, ("2024.12.17", "09:00:00"))
    put_csv(default, ("2024.12.19", "09:00:00"))
    assert len(gaps(default)) == 1  # 18 December is a trading day

    other = TestClient(
        make_app(
            tmp_path,
            name="other.db",
            marketdata=MarketDataSettings(no_trading_days=(CalendarDay(12, 18),)),
        )
    )
    put_csv(other, ("2024.12.17", "09:00:00"))
    put_csv(other, ("2024.12.19", "09:00:00"))
    assert gaps(other) == []
