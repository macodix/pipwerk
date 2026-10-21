"""Tests of the replica of the source (``fake_source.py``), order 03 point 5.

The replica is used by pipwerk replay in its tests, so what it promises is tested: the same
interface as the program, fixed deterministic data, the error reasons on request, and use as
a program on a port.
"""

import itertools
import json
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from collections.abc import Iterator
from datetime import datetime, timedelta
from typing import Any

import pytest
import uvicorn
from fastapi.testclient import TestClient
from support import LOCAL, naive

from pipwerk_fetch_mt5.fake_source import (
    FAKE_SHARED_KEY,
    FakeGateway,
    create_fake_source_app,
    main,
)
from pipwerk_fetch_mt5.gateway import TIME_UNIT_MINUTES

FETCH = "/api/v1/fetch"
MONDAY = "2026-01-05"


def candles_request(time_unit: str, start: str, end: str) -> dict[str, str]:
    return {
        "kind": "candles",
        "instrument": "EURUSD",
        "time_unit": time_unit,
        "start": start,
        "end": end,
    }


def rows(client: TestClient, time_unit: str, start: str, end: str) -> list[dict[str, Any]]:
    response = client.post(FETCH, json=candles_request(time_unit, start, end))
    assert response.status_code == 200, response.text
    candles: list[dict[str, Any]] = response.json()["file"]["candles"]
    return candles


# --- the data are fixed ---------------------------------------------------------------------


def test_the_same_request_gives_the_same_bytes(fake_client: TestClient) -> None:
    request = candles_request("m15", "2026-01-05T00:00:00Z", "2026-01-06T00:00:00Z")
    first = fake_client.post(FETCH, json=request).content
    second = fake_client.post(FETCH, json=request).content
    other_app = TestClient(
        create_fake_source_app(),
        base_url=LOCAL,
        headers={"Authorization": f"Bearer {FAKE_SHARED_KEY}"},
    )
    third = other_app.post(FETCH, json=request).content
    assert first == second == third


def test_the_ticks_are_the_same_on_every_run(fake_client: TestClient) -> None:
    request = {
        "kind": "ticks",
        "instrument": "EURUSD",
        "start": "2026-01-05T08:00:00Z",
        "end": "2026-01-05T08:00:20Z",
    }
    first = fake_client.post(FETCH, json=request).json()["file"]["ticks"]
    second = fake_client.post(FETCH, json=request).json()["file"]["ticks"]
    assert first == second
    assert len(first) == 14
    assert first[0] == {"time": "2026-01-05T08:00:00.000Z", "bid": 1.09814, "ask": 1.09815}
    assert first[1]["time"] == "2026-01-05T08:00:01.919Z"


def test_a_part_of_a_period_equals_the_same_part_of_the_whole(fake_client: TestClient) -> None:
    whole = rows(fake_client, "m5", "2026-01-05T08:00:00Z", "2026-01-05T10:00:00Z")
    part = rows(fake_client, "m5", "2026-01-05T09:00:00Z", "2026-01-05T09:30:00Z")
    assert part == [row for row in whole if "09:00" <= row["time"][11:16] < "09:30"]


def period_for(time_unit: str) -> tuple[str, str]:
    """A period with candles of the time unit and below 50000 of them."""
    if TIME_UNIT_MINUTES[time_unit] <= 60:
        return "2026-01-05T00:00:00Z", "2026-01-12T00:00:00Z"
    return "2026-01-05T00:00:00Z", "2026-03-05T00:00:00Z"


def test_the_candles_are_consistent_in_themselves(fake_client: TestClient) -> None:
    for time_unit in TIME_UNIT_MINUTES:
        candles = rows(fake_client, time_unit, *period_for(time_unit))
        for row in candles:
            assert row["high"] >= max(row["open"], row["close"]), time_unit
            assert row["low"] <= min(row["open"], row["close"]), time_unit
            assert row["low"] > 0
            assert row["volume"] > 0
            assert row["spread"] > 0
        times = [row["time"] for row in candles]
        assert times == sorted(set(times)), time_unit


# --- every time unit and its alignment ----------------------------------------------------------


@pytest.mark.parametrize("time_unit", list(TIME_UNIT_MINUTES))
def test_every_time_unit_of_metatrader_5_is_delivered(
    fake_client: TestClient, time_unit: str
) -> None:
    candles = rows(fake_client, time_unit, *period_for(time_unit))
    assert candles
    assert candles[0]["time"] >= "2026-01-05T00:00:00.000Z"


@pytest.mark.parametrize(
    ("time_unit", "minutes"),
    [(name, minutes) for name, minutes in TIME_UNIT_MINUTES.items() if minutes <= 1440],
)
def test_the_candles_follow_each_other_at_the_length_of_the_time_unit(
    fake_client: TestClient, time_unit: str, minutes: int
) -> None:
    candles = rows(fake_client, time_unit, "2026-01-06T00:00:00Z", "2026-01-08T00:00:00Z")
    moments = [datetime.fromisoformat(row["time"]) for row in candles]
    assert {later - earlier for earlier, later in itertools.pairwise(moments)} == {
        timedelta(minutes=minutes)
    }
    assert all(moment.minute % (minutes % 60 or 60) == 0 for moment in moments)


def test_weeks_open_on_sunday_and_months_on_the_first_day(fake_client: TestClient) -> None:
    weeks = rows(fake_client, "w1", "2026-01-01T00:00:00Z", "2026-02-01T00:00:00Z")
    assert [row["time"][:10] for row in weeks] == [
        "2026-01-04",
        "2026-01-11",
        "2026-01-18",
        "2026-01-25",
    ]
    months = rows(fake_client, "mn1", "2026-01-15T00:00:00Z", "2026-05-01T00:00:00Z")
    assert [row["time"][:10] for row in months] == ["2026-02-01", "2026-03-01", "2026-04-01"]


def test_days_open_from_monday_to_friday(fake_client: TestClient) -> None:
    days = rows(fake_client, "d1", "2026-01-05T00:00:00Z", "2026-01-12T00:00:00Z")
    assert [row["time"][:10] for row in days] == [
        "2026-01-05",
        "2026-01-06",
        "2026-01-07",
        "2026-01-08",
        "2026-01-09",
    ]


# --- the weekend -----------------------------------------------------------------------------


def test_no_candle_opens_from_friday_22_00_to_sunday_22_00(fake_client: TestClient) -> None:
    candles = rows(fake_client, "h1", "2026-01-09T20:00:00Z", "2026-01-12T01:00:00Z")
    times = [row["time"][:16] for row in candles]
    assert "2026-01-09T21:00" in times
    assert "2026-01-09T22:00" not in times
    assert not [time for time in times if "2026-01-10" in time]
    assert not [time for time in times if "2026-01-11T0" in time or "2026-01-11T1" in time]
    assert "2026-01-11T21:00" not in times
    assert "2026-01-11T22:00" in times
    assert "2026-01-12T00:00" in times


def test_there_are_no_ticks_on_the_weekend(fake_client: TestClient) -> None:
    request = {
        "kind": "ticks",
        "instrument": "EURUSD",
        "start": "2026-01-10T08:00:00Z",
        "end": "2026-01-10T08:01:00Z",
    }
    response = fake_client.post(FETCH, json=request)
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "no_data"


# --- the other instruments and the details -------------------------------------------------------


def test_the_replica_knows_three_instruments_and_no_other(fake_client: TestClient) -> None:
    for name in ("EURUSD", "GBPUSD", "USDJPY"):
        response = fake_client.post(FETCH, json={"kind": "instrument", "instrument": name})
        assert response.status_code == 200, name
    unknown = fake_client.post(FETCH, json={"kind": "instrument", "instrument": "DAX"})
    assert unknown.status_code == 404
    assert unknown.json()["error"]["code"] == "symbol_unknown"


def test_the_margin_comes_from_the_symbol_or_from_the_calculation_or_is_empty(
    fake_client: TestClient,
) -> None:
    margins = {}
    for name in ("EURUSD", "GBPUSD", "USDJPY"):
        response = fake_client.post(FETCH, json={"kind": "instrument", "instrument": name})
        margins[name] = response.json()["file"]["margin_per_lot"]
    assert margins == {"EURUSD": 1100.0, "GBPUSD": 1300.0, "USDJPY": None}


def test_the_pip_and_the_spread_of_a_symbol_with_three_digits(fake_client: TestClient) -> None:
    file = fake_client.post(FETCH, json={"kind": "instrument", "instrument": "USDJPY"}).json()[
        "file"
    ]
    assert (file["point"], file["pip"], file["spread"]) == (0.001, 0.01, 0.018)
    assert file["tick_value_currency"] == "JPY"
    assert file["swap_triple_weekday"] == "friday"


def test_the_trading_hours_of_the_replica_end_at_the_weekend(fake_client: TestClient) -> None:
    request = candles_request("h1", "2026-01-05T08:00:00Z", "2026-01-05T10:00:00Z")
    hours = fake_client.post(FETCH, json=request).json()["file"]["trading_hours"]
    sessions = {(item["weekday"], item["from"], item["to"]) for item in hours}
    assert ("friday", "00:00", "22:00") in sessions
    assert ("sunday", "22:00", "24:00") in sessions
    assert not any(item["weekday"] == "saturday" for item in hours)


def test_with_a_zone_that_has_summer_time_the_replica_delivers_no_trading_hours() -> None:
    client = TestClient(
        create_fake_source_app(time_zone="Europe/Athens"),
        base_url=LOCAL,
        headers={"Authorization": f"Bearer {FAKE_SHARED_KEY}"},
    )
    request = candles_request("h1", "2026-01-05T08:00:00Z", "2026-01-05T10:00:00Z")
    file = client.post(FETCH, json=request).json()["file"]
    assert file["trading_hours"] is None
    assert len(file["candles"]) == 2


# --- the errors on request ------------------------------------------------------------------


@pytest.mark.parametrize(
    ("code", "status"),
    [("broker_error", 502), ("no_data", 404), ("terminal_unavailable", 503)],
)
def test_reading_a_symbol_can_be_made_to_fail(
    fake_client: TestClient, fake_gateway: FakeGateway, code: str, status: int
) -> None:
    fake_gateway.fail("EURUSD", code)  # type: ignore[arg-type]
    kinds = [
        candles_request("m1", "2026-01-05T08:00:00Z", "2026-01-05T09:00:00Z"),
        {
            "kind": "ticks",
            "instrument": "EURUSD",
            "start": "2026-01-05T08:00:00Z",
            "end": "2026-01-05T08:10:00Z",
        },
        {"kind": "instrument", "instrument": "EURUSD"},
    ]
    for request in kinds:
        response = fake_client.post(FETCH, json=request)
        assert response.status_code == status
        assert response.json()["error"]["code"] == code
    other = fake_client.post(FETCH, json={**kinds[0], "instrument": "GBPUSD"})
    assert other.status_code == 200  # only the named symbol fails
    fake_gateway.clear_failures()
    assert fake_client.post(FETCH, json=kinds[0]).status_code == 200


def test_a_failure_can_be_limited_to_some_kinds(
    fake_client: TestClient, fake_gateway: FakeGateway
) -> None:
    fake_gateway.fail("EURUSD", "no_data", kinds=["ticks"])
    ticks = {
        "kind": "ticks",
        "instrument": "EURUSD",
        "start": "2026-01-05T08:00:00Z",
        "end": "2026-01-05T08:10:00Z",
    }
    assert fake_client.post(FETCH, json=ticks).status_code == 404
    assert (
        fake_client.post(FETCH, json={"kind": "instrument", "instrument": "EURUSD"}).status_code
        == 200
    )


def test_a_failure_with_an_unknown_kind_or_code_is_refused(fake_gateway: FakeGateway) -> None:
    with pytest.raises(ValueError, match="unknown"):
        fake_gateway.fail("EURUSD", "no_data", kinds=["bars"])
    with pytest.raises(ValueError, match="unknown"):
        fake_gateway.fail("EURUSD", "symbol_unknown")


def test_the_replica_can_be_made_unreachable_and_reachable_again(
    fake_client: TestClient, fake_gateway: FakeGateway
) -> None:
    fake_gateway.available = False
    assert fake_client.get("/api/v1/health").status_code == 503
    fake_gateway.available = True
    assert fake_client.get("/api/v1/health").status_code == 200


def test_a_small_limit_gives_the_error_for_a_period_that_is_too_large() -> None:
    client = TestClient(
        create_fake_source_app(max_rows=10),
        base_url=LOCAL,
        headers={"Authorization": f"Bearer {FAKE_SHARED_KEY}"},
    )
    response = client.post(
        FETCH, json=candles_request("m1", "2026-01-05T08:00:00Z", "2026-01-05T09:00:00Z")
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "range_too_large"


def test_the_replica_checks_the_key_like_the_program(fake_client: TestClient) -> None:
    request = candles_request("m1", "2026-01-05T08:00:00Z", "2026-01-05T08:10:00Z")
    assert (
        fake_client.post(FETCH, json=request, headers={"Authorization": "Bearer x"}).status_code
        == 401
    )
    own = TestClient(
        create_fake_source_app("my-own-key-0123456789"),
        base_url=LOCAL,
        headers={"Authorization": "Bearer my-own-key-0123456789"},
    )
    assert own.post(FETCH, json=request).status_code == 200
    assert (
        own.post(
            FETCH, json=request, headers={"Authorization": f"Bearer {FAKE_SHARED_KEY}"}
        ).status_code
        == 401
    )


def test_a_mapping_of_designations_and_a_name_of_the_broker_can_be_given() -> None:
    gateway = FakeGateway()
    gateway.symbols["EURUSD.r"] = gateway.symbols["EURUSD"]
    app = create_fake_source_app(
        gateway=gateway,
        broker_name="Mapped-Broker",
        symbols={"EURUSD": "EURUSD.r"},
        time_zone="Europe/Athens",
    )
    client = TestClient(app, base_url=LOCAL, headers={"Authorization": f"Bearer {FAKE_SHARED_KEY}"})
    file = client.post(
        FETCH, json=candles_request("h1", "2026-01-05T08:00:00Z", "2026-01-05T10:00:00Z")
    ).json()["file"]
    assert file["broker"] == "Mapped-Broker"
    # Server time of the replica's broker is Athens time: the candles are those of the clock
    # of Athens, converted to UTC.
    assert [row["time"] for row in file["candles"]] == [
        "2026-01-05T08:00:00.000Z",
        "2026-01-05T09:00:00.000Z",
    ]


def test_the_gateway_follows_the_interface_of_a_terminal(fake_gateway: FakeGateway) -> None:
    assert fake_gateway.server_name() == "Fake-Broker-Demo"
    assert fake_gateway.symbol("EURUSD") is not None
    assert fake_gateway.symbol("nope") is None
    fake_gateway.select("EURUSD")
    candles = fake_gateway.candles("EURUSD", "m1", naive(2026, 1, 5, 8, 0), naive(2026, 1, 5, 8, 3))
    assert [row.time for row in candles] == [naive(2026, 1, 5, 8, minute) for minute in range(3)]


# --- as a program on a port -------------------------------------------------------------------


def free_port() -> int:
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        port: int = probe.getsockname()[1]
    return port


@pytest.fixture
def running_replica() -> Iterator[int]:
    port = free_port()
    process = subprocess.Popen(  # noqa: S603
        [sys.executable, "-I", "-m", "pipwerk_fetch_mt5.fake_source", "--port", str(port)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        deadline = time.monotonic() + 60
        while time.monotonic() < deadline:
            try:
                with socket.create_connection(("127.0.0.1", port), timeout=0.5):
                    break
            except OSError:
                time.sleep(0.2)
        else:
            raise AssertionError("the replica did not start")
        yield port
    finally:
        process.terminate()
        process.wait(timeout=20)


def call(
    port: int, path: str, key: str | None, body: dict[str, Any] | None = None
) -> tuple[int, Any]:
    headers = {"Content-Type": "application/json"}
    if key is not None:
        headers["Authorization"] = f"Bearer {key}"
    data = None if body is None else json.dumps(body).encode()
    request = urllib.request.Request(f"http://127.0.0.1:{port}{path}", data=data, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=20) as response:  # noqa: S310
            return response.status, json.loads(response.read())
    except urllib.error.HTTPError as error:
        return error.code, json.loads(error.read())


def test_the_replica_runs_as_a_program_on_a_port(running_replica: int) -> None:
    status, body = call(running_replica, "/api/v1/health", FAKE_SHARED_KEY)
    assert (status, body) == (200, {"status": "ok"})
    status, body = call(running_replica, "/api/v1/health", None)
    assert status == 401
    status, body = call(
        running_replica,
        FETCH,
        FAKE_SHARED_KEY,
        candles_request("h1", "2026-01-05T08:00:00Z", "2026-01-05T10:00:00Z"),
    )
    assert status == 200
    assert len(body["file"]["candles"]) == 2


def test_main_starts_the_server_with_the_given_address_and_key(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    started: dict[str, Any] = {}

    def fake_run(app: Any, **keywords: Any) -> None:
        started["app"] = app
        started.update(keywords)

    monkeypatch.setattr(uvicorn, "run", fake_run)  # fake_source.py calls uvicorn.run
    assert main(["--host", "127.0.0.1", "--port", "9123", "--key", "own-key-0123456789abc"]) == 0
    assert (started["host"], started["port"], started["server_header"]) == (
        "127.0.0.1",
        9123,
        False,
    )
    client = TestClient(
        started["app"],
        base_url="http://192.0.2.5",
        headers={"Authorization": "Bearer own-key-0123456789abc"},
    )
    assert client.get("/api/v1/health").status_code == 200  # an IP address is allowed
