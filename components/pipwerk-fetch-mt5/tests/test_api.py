"""Tests of the HTTP interface (specification backtest 5.4, order 03 points 2 and 5).

Every kind, every error reason with its code, status and fixed reason, and the validation of
the request (Pydantic, additional fields refused). The key, the ``Host`` header and the size
are tested in ``test_security.py``.
"""

from collections.abc import Callable
from typing import Any

import pytest
from fastapi.testclient import TestClient
from support import ScriptedGateway, candle, naive

from pipwerk_fetch_mt5.errors import ERRORS
from pipwerk_fetch_mt5.fake_source import FakeGateway

FETCH = "/api/v1/fetch"
HEALTH = "/api/v1/health"

CANDLES = {
    "kind": "candles",
    "instrument": "EURUSD",
    "time_unit": "m5",
    "start": "2026-01-05T08:00:00Z",
    "end": "2026-01-05T09:00:00Z",
}
TICKS = {
    "kind": "ticks",
    "instrument": "EURUSD",
    "start": "2026-01-05T08:00:00Z",
    "end": "2026-01-05T08:01:00Z",
}
INFO = {"kind": "instrument", "instrument": "EURUSD"}


def error_of(response: Any) -> dict[str, Any]:
    body = response.json()
    assert list(body) == ["error"]
    error: dict[str, Any] = body["error"]
    return error


# --- health -----------------------------------------------------------------------------------


def test_health_is_ok_when_the_terminal_is_reachable(fake_client: TestClient) -> None:
    response = fake_client.get(HEALTH)
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_names_the_terminal_that_is_not_reachable(
    fake_client: TestClient, fake_gateway: FakeGateway
) -> None:
    fake_gateway.available = False
    response = fake_client.get(HEALTH)
    assert response.status_code == 503
    assert error_of(response) == {
        "code": "terminal_unavailable",
        "reason": "MetaTrader 5 nicht erreichbar",
    }
    fake_gateway.available = True
    assert fake_client.get(HEALTH).status_code == 200


# --- the three kinds -------------------------------------------------------------------------


def test_candles_over_http(fake_client: TestClient) -> None:
    response = fake_client.post(FETCH, json=CANDLES)
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"file", "omitted_count", "omitted"}
    file = body["file"]
    assert (file["kind"], file["instrument"], file["time_unit"]) == ("candles", "EURUSD", "m5")
    assert file["broker"] == "Fake-Broker-Demo"
    assert len(file["candles"]) == 12
    assert file["candles"][0]["time"] == "2026-01-05T08:00:00.000Z"
    assert set(file["candles"][0]) == {
        "time",
        "open",
        "high",
        "low",
        "close",
        "volume",
        "spread",
    }
    assert body["omitted_count"] == 0
    assert body["omitted"] == []


def test_ticks_over_http(fake_client: TestClient) -> None:
    response = fake_client.post(FETCH, json=TICKS)
    assert response.status_code == 200
    file = response.json()["file"]
    assert (file["kind"], file["instrument"], file["broker"]) == (
        "ticks",
        "EURUSD",
        "Fake-Broker-Demo",
    )
    assert 35 <= len(file["ticks"]) <= 41
    assert set(file["ticks"][0]) == {"time", "bid", "ask"}
    assert all(row["time"].endswith("Z") and "." in row["time"] for row in file["ticks"])
    assert all(row["ask"] > row["bid"] > 0 for row in file["ticks"])


def test_the_details_of_an_instrument_over_http(fake_client: TestClient) -> None:
    response = fake_client.post(FETCH, json=INFO)
    assert response.status_code == 200
    file = response.json()["file"]
    assert (file["version"], file["kind"]) == (1, "instrument")
    assert file["acquired_at"] == "2026-01-05T08:00:00.000Z"
    assert file["contract_size"] == 100000.0
    assert file["tick_value_currency"] == "USD"
    assert file["pip"] == 0.0001
    assert file["swap_triple_weekday"] == "wednesday"
    assert file["margin_per_lot"] == 1100.0
    assert set(file) == {
        "version",
        "kind",
        "broker",
        "instrument",
        "acquired_at",
        "tick_size",
        "tick_value",
        "tick_value_currency",
        "point",
        "pip",
        "spread",
        "min_volume",
        "volume_step",
        "contract_size",
        "swap_long",
        "swap_short",
        "swap_triple_weekday",
        "margin_per_lot",
    }


def test_the_files_of_candles_and_ticks_carry_version_period_and_trading_hours(
    fake_client: TestClient,
) -> None:
    candles = fake_client.post(FETCH, json=CANDLES).json()["file"]
    assert (candles["version"], candles["kind"]) == (1, "candles")
    assert candles["period"] == {
        "start": "2026-01-05T08:00:00.000Z",
        "end": "2026-01-05T09:00:00.000Z",
    }
    assert candles["trading_hours"][0] == {"weekday": "monday", "from": "00:00", "to": "24:00"}
    assert len(candles["trading_hours"]) == 6
    ticks = fake_client.post(FETCH, json=TICKS).json()["file"]
    assert (ticks["version"], ticks["kind"]) == (1, "ticks")
    assert ticks["period"] == {
        "start": "2026-01-05T08:00:00.000Z",
        "end": "2026-01-05T08:01:00.000Z",
    }
    assert ticks["trading_hours"] == candles["trading_hours"]
    assert set(candles) == {
        "version",
        "kind",
        "broker",
        "instrument",
        "time_unit",
        "period",
        "trading_hours",
        "candles",
    }


def test_a_period_with_an_offset_is_taken_as_that_moment(
    make_client: Callable[..., TestClient],
) -> None:
    gateway = ScriptedGateway(candle_rows=[candle(naive(2026, 1, 5, 8, 0))])
    client = make_client(gateway)
    request = {**CANDLES, "start": "2026-01-05T09:00:00+01:00", "end": "2026-01-05T10:00:00+01:00"}
    response = client.post(FETCH, json=request)
    assert response.status_code == 200
    assert response.json()["file"]["candles"][0]["time"] == "2026-01-05T08:00:00.000Z"


def test_omitted_rows_are_reported_with_their_reason(
    make_client: Callable[..., TestClient],
) -> None:
    gateway = ScriptedGateway(
        candle_rows=[candle(naive(2026, 1, 5, 8, 0)), candle(naive(2026, 1, 5, 8, 5), price=0.0)]
    )
    response = make_client(gateway).post(FETCH, json=CANDLES)
    body = response.json()
    assert len(body["file"]["candles"]) == 1
    assert body["omitted_count"] == 1
    assert body["omitted"] == [
        {"server_time": "2026-01-05T08:05:00.000", "reason": "invalid_price"}
    ]


# --- every error reason ---------------------------------------------------------------------


def test_an_unknown_symbol(fake_client: TestClient) -> None:
    for request in ({**CANDLES, "instrument": "XXXYYY"}, {**INFO, "instrument": "XXXYYY"}):
        response = fake_client.post(FETCH, json=request)
        assert response.status_code == 404
        assert error_of(response) == {
            "code": "symbol_unknown",
            "reason": "Symbol beim Broker unbekannt",
        }


def test_no_data_at_the_broker(fake_client: TestClient, fake_gateway: FakeGateway) -> None:
    fake_gateway.fail("EURUSD", "no_data")
    response = fake_client.post(FETCH, json=CANDLES)
    assert response.status_code == 404
    assert error_of(response) == {
        "code": "no_data",
        "reason": "Daten beim Broker nicht vorhanden",
    }


def test_a_period_without_any_candle_is_no_data(fake_client: TestClient) -> None:
    saturday = {**CANDLES, "start": "2026-01-10T08:00:00Z", "end": "2026-01-10T09:00:00Z"}
    response = fake_client.post(FETCH, json=saturday)
    assert response.status_code == 404
    assert error_of(response)["code"] == "no_data"


def test_the_terminal_is_not_reachable(fake_client: TestClient, fake_gateway: FakeGateway) -> None:
    fake_gateway.available = False
    for request in (CANDLES, TICKS, INFO):
        response = fake_client.post(FETCH, json=request)
        assert response.status_code == 503
        assert error_of(response) == {
            "code": "terminal_unavailable",
            "reason": "MetaTrader 5 nicht erreichbar",
        }


def test_an_error_of_metatrader_5(fake_client: TestClient, fake_gateway: FakeGateway) -> None:
    fake_gateway.fail("EURUSD", "broker_error", kinds=["ticks"])
    response = fake_client.post(FETCH, json=TICKS)
    assert response.status_code == 502
    assert error_of(response)["code"] == "broker_error"
    assert fake_client.post(FETCH, json=CANDLES).status_code == 200  # other kinds work


def test_the_name_of_the_broker_cannot_be_determined(
    make_client: Callable[..., TestClient],
) -> None:
    gateway = ScriptedGateway(candle_rows=[candle(naive(2026, 1, 5, 8, 0))], server=None)
    response = make_client(gateway).post(FETCH, json=CANDLES)
    assert response.status_code == 502
    assert error_of(response)["code"] == "broker_unknown"


def test_a_period_that_is_too_large(make_client: Callable[..., TestClient]) -> None:
    client = make_client(ScriptedGateway(), max_rows=100)
    request = {**CANDLES, "time_unit": "m1", "end": "2026-01-05T12:00:00Z"}
    response = client.post(FETCH, json=request)
    assert response.status_code == 422
    assert error_of(response)["code"] == "range_too_large"
    assert "Zeitraum zu groß" in error_of(response)["reason"]


def test_an_unexpected_error_is_an_internal_error_without_details(
    make_client: Callable[..., TestClient], caplog: pytest.LogCaptureFixture
) -> None:
    class Broken(ScriptedGateway):
        def candles(self, *arguments: Any, **keywords: Any) -> Any:
            raise RuntimeError("a detail of the machine that must not leave it")

    gateway = Broken(candle_rows=[candle(naive(2026, 1, 5, 8, 0))])
    response = make_client(gateway).post(FETCH, json=CANDLES)
    assert response.status_code == 500
    assert error_of(response) == {
        "code": "internal_error",
        "reason": "Interner Fehler im Programm",
    }
    assert "a detail of the machine" not in response.text
    assert "RuntimeError" in caplog.text  # the cause is in the log, not in the answer


def test_an_unexpected_error_in_health_is_an_internal_error(
    make_client: Callable[..., TestClient],
) -> None:
    class Broken(ScriptedGateway):
        def ping(self) -> None:
            raise RuntimeError("detail")

    response = make_client(Broken()).get(HEALTH)
    assert response.status_code == 500
    assert error_of(response)["code"] == "internal_error"


def test_every_error_has_a_status_and_a_fixed_reason() -> None:
    assert set(ERRORS) == {
        "unauthorized",
        "host_not_allowed",
        "body_too_large",
        "invalid_request",
        "not_found",
        "symbol_unknown",
        "no_data",
        "range_too_large",
        "terminal_unavailable",
        "broker_error",
        "broker_unknown",
        "invalid_broker_data",
        "internal_error",
    }
    assert ERRORS["symbol_unknown"][1] == "Symbol beim Broker unbekannt"
    assert ERRORS["no_data"][1] == "Daten beim Broker nicht vorhanden"
    assert ERRORS["terminal_unavailable"][1] == "MetaTrader 5 nicht erreichbar"
    assert all(reason for _status, reason in ERRORS.values())


def test_an_unknown_path_or_method_is_not_found(fake_client: TestClient) -> None:
    assert fake_client.get("/api/v1/other").status_code == 404
    assert error_of(fake_client.get("/api/v1/other"))["code"] == "not_found"
    assert fake_client.get(FETCH).status_code == 404  # only POST is offered
    assert fake_client.post(HEALTH, json={}).status_code == 404
    for page in ("/docs", "/redoc", "/openapi.json", "/"):
        assert fake_client.get(page).status_code == 404


# --- the request is validated ---------------------------------------------------------------


@pytest.mark.parametrize(
    ("change", "field"),
    [
        ({"extra": 1}, "(unknown)"),
        ({"kind": "bars"}, ""),
        ({"time_unit": "m7"}, "time_unit"),
        ({"time_unit": None}, "time_unit"),
        ({"instrument": ""}, "instrument"),
        ({"instrument": "X" * 129}, "instrument"),
        ({"instrument": " EURUSD"}, "instrument"),
        ({"instrument": "EURUSD "}, "instrument"),
        ({"instrument": "EUR\nUSD"}, "instrument"),
        ({"instrument": 5}, "instrument"),
        ({"start": "2026-01-05T08:00:00"}, "start"),
        ({"start": "not a time"}, "start"),
        ({"start": 12345}, "start"),
        ({"end": "2026-01-05T08:00:00Z"}, ""),
        ({"end": "2026-01-05T07:00:00Z"}, ""),
        ({"start": "1960-01-01T00:00:00Z"}, ""),
        ({"end": "2200-01-01T00:00:00Z"}, ""),
    ],
)
def test_an_invalid_candles_request_is_refused_with_the_names_of_the_fields(
    fake_client: TestClient, change: dict[str, Any], field: str
) -> None:
    response = fake_client.post(FETCH, json={**CANDLES, **change})
    assert response.status_code == 422
    error = error_of(response)
    assert error["code"] == "invalid_request"
    assert error["reason"] == "Die Anfrage ist ungültig"
    if field:
        assert any(field in name for name in error["fields"])


def test_the_refusal_does_not_repeat_what_was_sent(fake_client: TestClient) -> None:
    marker = "SENT-VALUE-1234"
    for body in (
        {**CANDLES, "instrument": marker * 10},
        {**CANDLES, "time_unit": marker},
        {**CANDLES, marker: marker},
        {**CANDLES, "start": marker},
    ):
        response = fake_client.post(FETCH, json=body)
        assert response.status_code == 422
        assert marker not in response.text


def test_ticks_and_details_refuse_the_fields_of_other_kinds(fake_client: TestClient) -> None:
    assert fake_client.post(FETCH, json={**TICKS, "time_unit": "m1"}).status_code == 422
    assert fake_client.post(FETCH, json={**INFO, "start": TICKS["start"]}).status_code == 422
    assert fake_client.post(FETCH, json={**INFO, "end": TICKS["end"]}).status_code == 422
    assert fake_client.post(FETCH, json={**CANDLES, "kind": "ticks"}).status_code == 422


def test_missing_fields_are_refused(fake_client: TestClient) -> None:
    for name in ("instrument", "time_unit", "start", "end", "kind"):
        request = {key: value for key, value in CANDLES.items() if key != name}
        assert fake_client.post(FETCH, json=request).status_code == 422, name


@pytest.mark.parametrize("body", ["", "not json", "[]", "null", '"text"', "{"])
def test_a_body_that_is_not_a_request_is_refused(fake_client: TestClient, body: str) -> None:
    response = fake_client.post(FETCH, content=body, headers={"Content-Type": "application/json"})
    assert response.status_code == 422
    assert error_of(response)["code"] == "invalid_request"


def test_numbers_are_not_taken_for_text_nor_text_for_numbers(fake_client: TestClient) -> None:
    assert fake_client.post(FETCH, json={**CANDLES, "instrument": 1}).status_code == 422
    assert fake_client.post(FETCH, json={**CANDLES, "time_unit": 5}).status_code == 422


def test_ticks_of_the_replica_are_a_sequence_in_time_order(fake_client: TestClient) -> None:
    file = fake_client.post(FETCH, json=TICKS).json()["file"]
    times = [row["time"] for row in file["ticks"]]
    assert times == sorted(times)
