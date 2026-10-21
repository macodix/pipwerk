"""Tests of the acquisition from the source (specification 5.4, E5) through the web API.

The source is the replica ``pipwerk_fetch_mt5.fake_source`` (no network, no MetaTrader 5): the
real HTTP interface of the source with deterministic data. A real connection (a program on a
port) is used once, end to end.
"""

from __future__ import annotations

import dataclasses
import json
import logging
import socket
import subprocess
import sys
import threading
import time
import types
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen

import httpx2
import pytest
from datastock import (
    API,
    FAKE_BROKER,
    JSON,
    SECRET_KEY,
    SOURCE_URL,
    acquire,
    candles_json,
    fake_source,
    make_app,
    part,
    replay_with_fake_source,
    source_client,
    wait_finished,
)
from fastapi.testclient import TestClient
from pipwerk_fetch_mt5.errors import ERRORS
from pipwerk_fetch_mt5.fake_source import DEFAULT_SYMBOLS, FAKE_SHARED_KEY, FakeGateway
from pipwerk_marketdata import MarketDataStore, MarketDataStoreError
from pydantic import TypeAdapter

from pipwerk_replay import acquisition as acquisition_module
from pipwerk_replay.acquisition import (
    SOURCE_ERROR_CODES,
    HttpSourceClient,
    SourceFile,
    request_of,
)
from pipwerk_replay.config import MarketDataSettings, SourceSettings
from pipwerk_replay.marketdata_models import CandlesPart, InstrumentPart, Part, TicksPart

INVALID_ANSWER = "Antwort der Quelle ungültig"


@pytest.fixture
def replay(tmp_path: Path) -> tuple[TestClient, FakeGateway]:
    return replay_with_fake_source(tmp_path)


def failed(state: dict[str, Any], index: int = 0) -> dict[str, Any]:
    item = state["parts"][index]
    assert item["state"] == "failed", item
    assert item["result"] is None
    error: dict[str, Any] = item["error"]
    return error


# --- what is acquired ---------------------------------------------------------------------------


def test_candles_are_acquired_and_imported(replay: tuple[TestClient, FakeGateway]) -> None:
    client, _ = replay

    state = acquire(client, part())

    assert state["state"] == "finished"
    [item] = state["parts"]
    assert item["request"] == part()
    assert item["state"] == "succeeded"
    assert item["error"] is None
    assert item["omitted_count"] == 0
    assert item["result"] == {
        "kind": "candles",
        "broker": FAKE_BROKER,
        "instrument": "EURUSD",
        "unit": "m5",
        "accepted": 12,
        "replaced": 0,
        "period_start": "2026-01-05T08:00:00Z",
        "period_end": "2026-01-05T08:55:00Z",
        "rejected": [],
        "rejected_count": 0,
    }


def test_the_acquired_candles_are_in_the_data_stock_and_complete(
    replay: tuple[TestClient, FakeGateway],
) -> None:
    client, _ = replay
    acquire(client, part())

    series = client.get(f"{API}/overview").json()["series"]
    client.put("/api/replay/settings/default-source", json={"broker": FAKE_BROKER})
    checked = client.post(f"{API}/completeness", json={"parts": [part()]}).json()

    assert [(s["broker"], s["instrument"], s["unit"], s["count"]) for s in series] == [
        (FAKE_BROKER, "EURUSD", "m5", 12)
    ]
    assert series[0]["has_trading_hours"] is True
    assert checked["results"][0]["complete"] is True


def test_acquiring_the_same_part_again_replaces_the_candles(
    replay: tuple[TestClient, FakeGateway],
) -> None:
    client, _ = replay
    acquire(client, part())

    again = acquire(client, part())

    assert again["parts"][0]["result"]["accepted"] == 12
    assert again["parts"][0]["result"]["replaced"] == 12


def test_ticks_and_the_data_of_an_instrument_are_acquired(
    replay: tuple[TestClient, FakeGateway],
) -> None:
    client, _ = replay

    state = acquire(client, part("ticks"), part("instrument"))

    ticks, instrument = state["parts"]
    assert ticks["state"] == instrument["state"] == "succeeded"
    assert ticks["result"]["kind"] == "ticks"
    assert ticks["result"]["unit"] is None
    assert ticks["result"]["accepted"] > 2000  # a tick about every 1.5 seconds for one hour
    assert instrument["result"]["kind"] == "instrument"
    assert instrument["result"]["accepted"] == 1
    info = client.get(
        f"{API}/instrument", params={"broker": FAKE_BROKER, "instrument": "EURUSD"}
    ).json()
    assert info["contract_size"] == 100000


def test_several_parts_are_worked_off_in_order_with_one_state_each(
    replay: tuple[TestClient, FakeGateway],
) -> None:
    client, _ = replay
    parts = [
        part(time_unit="m1", end="2026-01-05T08:10:00Z"),
        part("candles", instrument="GBPUSD", time_unit="h1"),
        part("instrument", instrument="USDJPY"),
    ]

    state = acquire(client, *parts)

    assert [item["request"] for item in state["parts"]] == parts
    assert [item["state"] for item in state["parts"]] == ["succeeded"] * 3
    assert [item["result"]["accepted"] for item in state["parts"]] == [10, 1, 1]


def test_a_failed_part_does_not_stop_the_others(replay: tuple[TestClient, FakeGateway]) -> None:
    client, _ = replay

    state = acquire(
        client,
        part(),
        part(instrument="NOSUCH"),
        part("instrument"),
    )

    assert [item["state"] for item in state["parts"]] == ["succeeded", "failed", "succeeded"]
    assert state["parts"][1]["error"]["code"] == "symbol_unknown"
    assert state["state"] == "finished"


def test_the_answer_to_the_start_shows_every_part_and_the_identifier(
    replay: tuple[TestClient, FakeGateway],
) -> None:
    client, _ = replay

    response = client.post(f"{API}/acquisitions", json={"parts": [part(), part("instrument")]})

    assert response.status_code == 202
    body = response.json()
    assert len(body["id"]) == 36
    assert body["state"] in ("running", "finished")
    assert [item["request"] for item in body["parts"]] == [part(), part("instrument")]
    assert body["created_at"].endswith("Z")
    finished = wait_finished(client, body["id"])
    assert finished["id"] == body["id"]
    assert finished["finished_at"] is not None
    assert finished["finished_at"] >= finished["created_at"]


# --- every reason of the source -----------------------------------------------------------------


def error_of(state: dict[str, Any]) -> tuple[Any, Any]:
    error = failed(state)
    assert error["file_error"] is None
    return error["code"], error["reason"]


def test_an_unknown_symbol(replay: tuple[TestClient, FakeGateway]) -> None:
    client, _ = replay

    state = acquire(client, part(instrument="NOSUCH"))

    assert error_of(state) == ("symbol_unknown", "Symbol beim Broker unbekannt")


def test_no_data_at_the_broker(replay: tuple[TestClient, FakeGateway]) -> None:
    client, _ = replay
    saturday = part(start="2026-01-03T10:00:00Z", end="2026-01-03T12:00:00Z")

    assert error_of(acquire(client, saturday)) == ("no_data", "Daten beim Broker nicht vorhanden")


def test_a_period_that_is_too_large_for_the_source(tmp_path: Path) -> None:
    client, _ = replay_with_fake_source(tmp_path, max_rows=10)

    state = acquire(client, part(time_unit="m1"))

    code, reason = error_of(state)
    assert code == "range_too_large"
    assert reason.startswith("Zeitraum zu groß")


def test_the_terminal_is_not_available(replay: tuple[TestClient, FakeGateway]) -> None:
    client, gateway = replay
    gateway.available = False

    state = acquire(client, part(), part("instrument"))

    assert error_of(state) == ("terminal_unavailable", "MetaTrader 5 nicht erreichbar")
    assert failed(state, 1)["code"] == "terminal_unavailable"


def test_the_broker_reports_an_error(replay: tuple[TestClient, FakeGateway]) -> None:
    client, gateway = replay
    gateway.fail("EURUSD", "broker_error", ["candles"])

    state = acquire(client, part(), part("ticks"))

    assert error_of(state) == (
        "broker_error",
        "MetaTrader 5 hat die Abfrage mit einem Fehler beendet",
    )
    assert state["parts"][1]["state"] == "succeeded"  # only candles fail


def test_the_key_is_wrong(tmp_path: Path) -> None:
    http, _ = fake_source()
    app = make_app(
        tmp_path,
        source=SourceSettings(url=SOURCE_URL, key="another-key-0123456789"),
        source_client=source_client(http, key="another-key-0123456789"),
    )

    state = acquire(TestClient(app), part())

    assert error_of(state) == ("unauthorized", "Schlüssel fehlt oder ist falsch")


def test_the_name_of_the_broker_cannot_be_determined(tmp_path: Path) -> None:
    client, _ = replay_with_fake_source(tmp_path, gateway=FakeGateway(server=None))

    state = acquire(client, part("instrument"))

    assert error_of(state) == ("broker_unknown", "Der Name des Brokers ist nicht bestimmbar")


def test_the_broker_delivers_invalid_data_of_the_instrument(tmp_path: Path) -> None:
    broken = dataclasses.replace(DEFAULT_SYMBOLS["EURUSD"], tick_size=0.0)
    gateway = FakeGateway({"EURUSD": broken})
    client, _ = replay_with_fake_source(tmp_path, gateway=gateway)

    state = acquire(client, part("instrument"))

    assert error_of(state) == (
        "invalid_broker_data",
        "Der Broker liefert ungültige Angaben zum Instrument",
    )


def test_the_source_does_not_allow_the_host_header(tmp_path: Path) -> None:
    http, _ = fake_source()
    other = TestClient(http.app, base_url="http://evil.example")
    app = make_app(
        tmp_path,
        source=SourceSettings(url=SOURCE_URL, key=FAKE_SHARED_KEY),
        source_client=source_client(other),
    )

    state = acquire(TestClient(app), part())

    assert error_of(state) == ("host_not_allowed", "Der Kopf Host der Anfrage ist nicht erlaubt")


def test_the_source_has_an_internal_error(
    replay: tuple[TestClient, FakeGateway], monkeypatch: pytest.MonkeyPatch
) -> None:
    client, gateway = replay

    def broken(*_args: Any, **_kwargs: Any) -> Any:
        raise RuntimeError("defect of the source")

    monkeypatch.setattr(gateway, "candles", broken)

    state = acquire(client, part())

    assert error_of(state) == ("internal_error", "Interner Fehler im Programm")
    assert "defect of the source" not in json.dumps(state)


def test_the_source_cannot_be_reached(tmp_path: Path) -> None:
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        port = listener.getsockname()[1]
    app = make_app(
        tmp_path,
        source=SourceSettings(
            url=f"http://127.0.0.1:{port}", key=FAKE_SHARED_KEY, timeout_seconds=5
        ),
    )

    state = acquire(TestClient(app), part())

    assert error_of(state) == ("source_unreachable", "Quelle nicht erreichbar")
    assert str(port) not in json.dumps(state)


def test_no_source_is_set_up_the_acquisition_is_409_and_the_rest_works(tmp_path: Path) -> None:
    client = TestClient(make_app(tmp_path))

    response = client.post(f"{API}/acquisitions", json={"parts": [part()]})

    assert response.status_code == 409
    assert response.json() == {
        "detail": "No source is set up.",
        "code": "no_source",
        "reason": "Keine Quelle eingerichtet",
    }
    assert client.get(f"{API}/overview").status_code == 200
    assert client.get("/api/health").json() == {"status": "ok"}
    assert client.get("/api/replay/settings/language").status_code == 200
    assert client.get("/api/v1/accounts").status_code == 200


# --- the answers of the source, through a transport that we control -----------------------------


def mock_client(handler: Callable[[httpx2.Request], httpx2.Response]) -> httpx2.Client:
    return httpx2.Client(transport=httpx2.MockTransport(handler), base_url=SOURCE_URL)


def request_part(kind: str) -> CandlesPart | TicksPart | InstrumentPart:
    parts: dict[str, CandlesPart | TicksPart | InstrumentPart] = {
        "candles": CandlesPart.model_validate(part(), strict=False),
        "ticks": TicksPart.model_validate(part("ticks"), strict=False),
        "instrument": InstrumentPart.model_validate(part("instrument")),
    }
    return parts[kind]


def envelope(file: Any, **changes: Any) -> dict[str, Any]:
    body: dict[str, Any] = {"file": file, "omitted_count": 0, "omitted": []}
    body.update(changes)
    return body


def candles_file(**changes: Any) -> dict[str, Any]:
    file: dict[str, Any] = json.loads(
        candles_json(2, broker="B", instrument="EURUSD", time_unit="m5")
    )
    file.update(changes)
    return file


def run_with(
    tmp_path: Path, handler: Callable[[httpx2.Request], httpx2.Response], *parts: dict[str, Any]
) -> dict[str, Any]:
    app = make_app(
        tmp_path,
        source=SourceSettings(url=SOURCE_URL, key=FAKE_SHARED_KEY),
        source_client=source_client(mock_client(handler)),
    )
    return acquire(TestClient(app), *parts)


@pytest.mark.parametrize("code", sorted(ERRORS))
def test_every_error_of_the_source_arrives_with_its_code_and_its_reason(
    tmp_path: Path, code: str
) -> None:
    status, reason = ERRORS[code]  # type: ignore[index]

    def handler(_request: httpx2.Request) -> httpx2.Response:
        return httpx2.Response(status, json={"error": {"code": code, "reason": reason}})

    state = run_with(tmp_path, handler, part())

    assert error_of(state) == (code, reason)


def test_the_codes_that_pipwerk_replay_knows_are_those_of_the_source_program() -> None:
    assert set(ERRORS) == SOURCE_ERROR_CODES


@pytest.mark.parametrize(
    "response",
    [
        pytest.param(httpx2.Response(200, content=b"not json"), id="no-json"),
        pytest.param(httpx2.Response(200, json=[1]), id="list"),
        pytest.param(httpx2.Response(200, json={}), id="empty"),
        pytest.param(httpx2.Response(200, json={"file": {}}), id="without-count"),
        pytest.param(httpx2.Response(200, json=envelope(candles_file(), more=1)), id="extra-key"),
        pytest.param(
            httpx2.Response(200, json=envelope(candles_file(), omitted_count=-1)), id="negative"
        ),
        pytest.param(
            httpx2.Response(200, json=envelope(candles_file(), omitted_count=True)), id="bool"
        ),
        pytest.param(
            httpx2.Response(200, json=envelope(candles_file(), omitted_count="1")), id="text"
        ),
        pytest.param(
            httpx2.Response(200, json=envelope(candles_file(), omitted="x")), id="omitted"
        ),
        pytest.param(httpx2.Response(200, json=envelope([1])), id="file-list"),
        pytest.param(httpx2.Response(200, json=envelope(candles_file(kind="ticks"))), id="kind"),
        pytest.param(
            httpx2.Response(200, json=envelope(candles_file(instrument="GBPUSD"))), id="instrument"
        ),
        pytest.param(
            httpx2.Response(200, json=envelope(candles_file(time_unit="h1"))), id="time-unit"
        ),
        pytest.param(
            httpx2.Response(200, content=b'{"file": {}, "omitted_count": NaN, "omitted": []}'),
            id="nan",
        ),
        pytest.param(httpx2.Response(500, content=b"<html>error</html>"), id="html-error"),
        pytest.param(httpx2.Response(500, json={"detail": "x"}), id="error-without-error"),
        pytest.param(httpx2.Response(500, json={"error": "x"}), id="error-no-object"),
        pytest.param(
            httpx2.Response(500, json={"error": {"code": "invented", "reason": "x"}}),
            id="unknown-code",
        ),
        pytest.param(
            httpx2.Response(500, json={"error": {"code": "no_data", "reason": "  "}}),
            id="empty-reason",
        ),
        pytest.param(
            httpx2.Response(500, json={"error": {"code": "no_data", "reason": 7}}),
            id="reason-number",
        ),
        pytest.param(
            httpx2.Response(500, json={"error": {"code": "no_data", "reason": "x"}, "more": 1}),
            id="error-extra-key",
        ),
        pytest.param(httpx2.Response(204), id="empty-answer"),
    ],
)
def test_an_answer_that_does_not_follow_the_interface_is_an_invalid_answer(
    tmp_path: Path, response: httpx2.Response
) -> None:
    state = run_with(tmp_path, lambda _request: response, part())

    error = failed(state)
    assert (error["code"], error["reason"]) == ("source_response_invalid", INVALID_ANSWER)


def test_a_redirect_is_not_followed_and_the_key_is_not_sent_elsewhere(tmp_path: Path) -> None:
    seen: list[httpx2.Request] = []

    def handler(request: httpx2.Request) -> httpx2.Response:
        seen.append(request)
        return httpx2.Response(302, headers={"Location": "http://elsewhere.example/api/v1/fetch"})

    state = run_with(tmp_path, handler, part())

    assert failed(state)["code"] == "source_response_invalid"
    assert [request.url.host for request in seen] == ["127.0.0.1"]


def test_the_reason_of_the_source_is_cut_and_has_no_control_characters(tmp_path: Path) -> None:
    def handler(_request: httpx2.Request) -> httpx2.Response:
        reason = "A\x00B\nC" + "x" * 1000
        return httpx2.Response(502, json={"error": {"code": "broker_error", "reason": reason}})

    error = failed(run_with(tmp_path, handler, part()))

    assert error["code"] == "broker_error"
    assert error["reason"].startswith("A B C")
    assert len(error["reason"]) == 300


def test_a_timeout_and_a_broken_connection_are_the_source_not_reached(tmp_path: Path) -> None:
    def timeout(_request: httpx2.Request) -> httpx2.Response:
        raise httpx2.ReadTimeout("took too long")

    def broken(_request: httpx2.Request) -> httpx2.Response:
        raise httpx2.RemoteProtocolError("connection closed")

    for handler in (timeout, broken):
        state = run_with(tmp_path, handler, part())
        error = failed(state)
        assert (error["code"], error["reason"]) == ("source_unreachable", "Quelle nicht erreichbar")


def test_an_answer_above_the_limit_is_refused_while_it_is_read(tmp_path: Path) -> None:
    big = httpx2.Response(200, content=b" " * 5000)
    app = make_app(
        tmp_path,
        source=SourceSettings(url=SOURCE_URL, key=FAKE_SHARED_KEY),
        source_client=source_client(mock_client(lambda _r: big), max_response_bytes=1000),
    )

    error = failed(acquire(TestClient(app), part()))

    assert (error["code"], error["reason"]) == (
        "source_response_too_large",
        "Antwort der Quelle zu groß",
    )


@pytest.mark.parametrize("kind", ["candles", "ticks", "instrument"])
def test_the_request_to_the_source_follows_the_interface(tmp_path: Path, kind: str) -> None:
    seen: list[httpx2.Request] = []

    def handler(request: httpx2.Request) -> httpx2.Response:
        seen.append(request)
        return httpx2.Response(404, json={"error": {"code": "no_data", "reason": "x"}})

    run_with(tmp_path, handler, part(kind))

    [request] = seen
    assert (request.method, request.url.path) == ("POST", "/api/v1/fetch")
    assert request.headers["authorization"] == f"Bearer {FAKE_SHARED_KEY}"
    assert request.headers["content-type"] == "application/json"
    assert json.loads(request.content) == request_of(request_part(kind))
    expected = {
        "candles": {
            "kind": "candles",
            "instrument": "EURUSD",
            "time_unit": "m5",
            "start": "2026-01-05T08:00:00Z",
            "end": "2026-01-05T09:00:00Z",
        },
        "ticks": {
            "kind": "ticks",
            "instrument": "EURUSD",
            "start": "2026-01-05T08:00:00Z",
            "end": "2026-01-05T09:00:00Z",
        },
        "instrument": {"kind": "instrument", "instrument": "EURUSD"},
    }[kind]
    assert json.loads(request.content) == expected


def test_a_time_with_an_offset_is_sent_in_utc(tmp_path: Path) -> None:
    seen: list[httpx2.Request] = []

    def handler(request: httpx2.Request) -> httpx2.Response:
        seen.append(request)
        return httpx2.Response(404, json={"error": {"code": "no_data", "reason": "x"}})

    run_with(
        tmp_path,
        handler,
        part(start="2026-01-05T10:00:00+02:00", end="2026-01-05T11:30:00.500+02:00"),
    )

    sent = json.loads(seen[0].content)
    assert (sent["start"], sent["end"]) == ("2026-01-05T08:00:00Z", "2026-01-05T09:30:00.500000Z")


def test_the_requests_of_the_interface_examples_are_built_by_request_of() -> None:
    root = Path(__file__).resolve().parents[4] / "contracts" / "api" / "pipwerk-fetch" / "v1"
    for kind in ("candles", "ticks", "instrument"):
        text = (root / "examples" / f"request-{kind}.json").read_text(encoding="utf-8")
        example = json.loads(text)

        built: Any = TypeAdapter(Part).validate_python(example)

        assert request_of(built) == example


# --- what the import says about the file of the source ------------------------------------------


def test_a_file_that_the_import_refuses_is_a_failure_with_the_reason_of_the_import(
    tmp_path: Path,
) -> None:
    empty = candles_file(candles=[])

    state = run_with(tmp_path, lambda _request: httpx2.Response(200, json=envelope(empty)), part())

    error = failed(state)
    assert error["code"] == "import_refused"
    assert error["reason"] == "Der Import hat die Datei der Quelle abgelehnt"
    assert error["file_error"] == "no_rows"


def test_rows_that_the_import_rejects_are_listed_in_the_result(tmp_path: Path) -> None:
    file = candles_file()
    file["candles"][1]["high"] = 0.5  # below the open price

    state = run_with(
        tmp_path,
        lambda _request: httpx2.Response(200, json=envelope(file, omitted_count=3)),
        part(),
    )

    [item] = state["parts"]
    assert item["state"] == "succeeded"
    assert item["omitted_count"] == 3
    assert item["result"]["accepted"] == 1
    assert item["result"]["rejected"] == [{"row": 2, "reason": "high_below_open"}]


def test_a_file_with_more_rows_than_allowed_is_refused_by_the_import(tmp_path: Path) -> None:
    app = make_app(
        tmp_path,
        marketdata=MarketDataSettings(max_rows=1),
        source=SourceSettings(url=SOURCE_URL, key=FAKE_SHARED_KEY),
        source_client=source_client(
            mock_client(lambda _r: httpx2.Response(200, json=envelope(candles_file())))
        ),
    )

    error = failed(acquire(TestClient(app), part()))

    assert (error["code"], error["file_error"]) == ("import_refused", "too_many_rows")


def test_a_failure_of_the_database_is_reported_for_the_part(
    replay: tuple[TestClient, FakeGateway], monkeypatch: pytest.MonkeyPatch
) -> None:
    client, _ = replay

    def fail(*_args: Any, **_kwargs: Any) -> Any:
        raise MarketDataStoreError("The database operation failed. The data store was not changed.")

    monkeypatch.setattr(MarketDataStore, "import_json", fail)

    error = failed(acquire(client, part()))

    assert error["code"] == "data_store_error"
    assert error["reason"] == "Der Datenbestand konnte nicht geändert werden"


class FaultySource:
    """A source that fails in a way the interface does not describe, for the first part."""

    def __init__(self) -> None:
        self.calls = 0

    def fetch(self, _part: Any) -> SourceFile:
        self.calls += 1
        if self.calls == 1:
            raise RuntimeError("a defect with a secret detail")
        return SourceFile(candles_json(2), 0)


def test_a_defect_fails_the_part_without_detail_and_the_others_go_on(
    tmp_path: Path, caplog: pytest.LogCaptureFixture
) -> None:
    app = make_app(
        tmp_path,
        source=SourceSettings(url=SOURCE_URL, key=FAKE_SHARED_KEY),
        source_client=FaultySource(),
    )
    caplog.set_level(logging.DEBUG)

    state = acquire(TestClient(app), part(), part())

    error = failed(state)
    assert (error["code"], error["reason"]) == (
        "acquisition_failed",
        "Die Beschaffung ist fehlgeschlagen",
    )
    assert state["parts"][1]["state"] == "succeeded"
    assert "secret detail" not in json.dumps(state)
    assert "secret detail" not in caplog.text


# --- limits of the acquisitions -----------------------------------------------------------------


class BlockingSource:
    """A source that waits until the test lets it go."""

    def __init__(self) -> None:
        self.entered = threading.Semaphore(0)
        self.release = threading.Event()

    def fetch(self, _part: Any) -> SourceFile:
        self.entered.release()
        assert self.release.wait(30)
        return SourceFile(candles_json(2), 0)


def blocked_app(tmp_path: Path, source: BlockingSource, **limits: int) -> TestClient:
    settings = SourceSettings(url=SOURCE_URL, key=FAKE_SHARED_KEY, **limits)
    return TestClient(make_app(tmp_path, source=settings, source_client=source))


def start(client: TestClient, count: int = 1) -> Any:
    return client.post(f"{API}/acquisitions", json={"parts": [part()] * count})


def test_the_next_acquisition_is_refused_while_the_acquisitions_that_may_run_are_running(
    tmp_path: Path,
) -> None:
    source = BlockingSource()
    client = blocked_app(tmp_path, source, max_concurrent_acquisitions=1)
    first = start(client)
    try:
        assert source.entered.acquire(timeout=30)

        refused = start(client)
    finally:
        source.release.set()
    wait_finished(client, first.json()["id"])

    assert first.status_code == 202
    assert refused.status_code == 429
    assert refused.json() == {"detail": "Too many acquisitions are running. Try again later."}
    assert start(client).status_code == 202  # the place is free again


def test_as_many_acquisitions_as_allowed_run_at_the_same_time(tmp_path: Path) -> None:
    source = BlockingSource()
    client = blocked_app(tmp_path, source, max_concurrent_acquisitions=2)
    try:
        ids = [start(client).json()["id"] for _ in range(2)]
        assert source.entered.acquire(timeout=30)
        assert source.entered.acquire(timeout=30)

        third = start(client)
    finally:
        source.release.set()
    for identifier in ids:
        wait_finished(client, identifier)

    assert third.status_code == 429


def test_the_state_shows_the_progress_part_by_part(tmp_path: Path) -> None:
    source = BlockingSource()
    client = blocked_app(tmp_path, source)
    started = start(client, 2)
    try:
        assert source.entered.acquire(timeout=30)

        running = client.get(f"{API}/acquisitions/{started.json()['id']}").json()
    finally:
        source.release.set()
    finished = wait_finished(client, started.json()["id"])

    assert running["state"] == "running"
    assert [item["state"] for item in running["parts"]] == ["running", "queued"]
    assert running["finished_at"] is None
    assert [item["state"] for item in finished["parts"]] == ["succeeded", "succeeded"]


def test_the_oldest_finished_acquisitions_are_forgotten_beyond_the_limit(tmp_path: Path) -> None:
    client, _ = replay_with_fake_source(
        tmp_path,
        source=SourceSettings(url=SOURCE_URL, key=FAKE_SHARED_KEY, max_kept_acquisitions=2),
    )
    ids = [acquire(client, part("instrument"))["id"] for _ in range(3)]

    answers = [client.get(f"{API}/acquisitions/{identifier}") for identifier in ids]

    assert [response.status_code for response in answers] == [404, 200, 200]
    assert answers[0].json() == {"detail": "The acquisition does not exist."}


def test_an_acquisition_that_runs_is_never_forgotten(tmp_path: Path) -> None:
    source = BlockingSource()
    client = blocked_app(tmp_path, source, max_kept_acquisitions=1, max_concurrent_acquisitions=3)
    try:
        ids = [start(client).json()["id"] for _ in range(3)]
        statuses = [
            client.get(f"{API}/acquisitions/{identifier}").status_code for identifier in ids
        ]
    finally:
        source.release.set()
    # Once they are finished, all but one go beyond the limit of one.
    deadline = time.monotonic() + 30
    while True:
        answers = [client.get(f"{API}/acquisitions/{identifier}") for identifier in ids]
        if [response.status_code for response in answers].count(200) == 1:
            break
        assert time.monotonic() < deadline
        time.sleep(0.01)

    assert statuses == [200, 200, 200]


def test_an_acquisition_whose_thread_cannot_start_is_neither_running_nor_kept(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    client = TestClient(
        make_app(
            tmp_path,
            source=SourceSettings(
                url=SOURCE_URL, key=FAKE_SHARED_KEY, max_concurrent_acquisitions=1
            ),
            source_client=FaultySource(),
        ),
        raise_server_exceptions=False,
    )

    class NoThread:
        def __init__(self, *_args: Any, **_kwargs: Any) -> None:
            pass

        def start(self) -> None:
            raise RuntimeError("can't start new thread")

    with monkeypatch.context() as patched:
        # only the module of the manager sees the replacement, not the web server's threads
        patched.setattr(acquisition_module, "threading", types.SimpleNamespace(Thread=NoThread))

        failed_start = client.post(f"{API}/acquisitions", json={"parts": [part("instrument")]})

    assert failed_start.status_code == 500
    # the place is not taken: the next acquisition starts
    started = client.post(f"{API}/acquisitions", json={"parts": [part("instrument")]})
    assert started.status_code == 202
    wait_finished(client, started.json()["id"])


def test_the_number_of_parts_is_limited(tmp_path: Path) -> None:
    client, _ = replay_with_fake_source(
        tmp_path, marketdata=MarketDataSettings(max_parts_per_request=2)
    )

    ok = client.post(f"{API}/acquisitions", json={"parts": [part("instrument")] * 2})
    too_many = client.post(f"{API}/acquisitions", json={"parts": [part("instrument")] * 3})

    assert ok.status_code == 202
    assert too_many.status_code == 422
    assert too_many.json()["errors"] == [{"location": ["parts"], "type": "too_long"}]
    wait_finished(client, ok.json()["id"])


@pytest.mark.parametrize(
    "body",
    [
        {},
        {"parts": []},
        {"parts": [{}]},
        {"parts": [part(instrument="")]},
        {"parts": [part(start="2026-01-05T08:00:00")]},
        {"parts": [part(end="2026-01-05T08:00:00Z")]},
        {"parts": [part(time_unit="x1")]},
        {"parts": [part()], "broker": "B"},
        {"parts": [part(), 5]},
    ],
)
def test_an_invalid_request_for_an_acquisition_starts_nothing(
    replay: tuple[TestClient, FakeGateway], body: Any
) -> None:
    client, _ = replay

    response = client.post(f"{API}/acquisitions", json=body)

    assert response.status_code == 422
    assert response.json()["detail"] == "The request body does not fit the schema."
    assert client.get(f"{API}/overview").json()["series"] == []


def test_the_request_for_an_acquisition_needs_the_media_type_json(
    replay: tuple[TestClient, FakeGateway],
) -> None:
    client, _ = replay

    response = client.post(
        f"{API}/acquisitions", content=json.dumps({"parts": [part()]}), headers={}
    )

    assert response.status_code == 415


def test_an_unknown_acquisition_is_404_and_a_bad_identifier_422(
    replay: tuple[TestClient, FakeGateway],
) -> None:
    client, _ = replay

    unknown = client.get(f"{API}/acquisitions/5b0e7c3a-1d84-4f6a-9a52-3c6d0e8f7a21")
    invalid = client.get(f"{API}/acquisitions/not-a-uuid")

    assert unknown.status_code == 404
    assert invalid.status_code == 422
    assert invalid.json()["errors"] == [{"location": ["path", "id"], "type": "uuid_parsing"}]


def test_other_methods_on_the_acquisition_paths_are_405(
    replay: tuple[TestClient, FakeGateway],
) -> None:
    client, _ = replay

    assert client.get(f"{API}/acquisitions").status_code == 405
    assert (
        client.delete(f"{API}/acquisitions/5b0e7c3a-1d84-4f6a-9a52-3c6d0e8f7a21").status_code == 405
    )
    assert (
        client.post(f"{API}/acquisitions/5b0e7c3a-1d84-4f6a-9a52-3c6d0e8f7a21", json={}).status_code
        == 405
    )


# --- the key appears nowhere --------------------------------------------------------------------


def test_the_key_appears_in_no_answer_no_log_no_file_and_no_text(
    tmp_path: Path, caplog: pytest.LogCaptureFixture, capsys: pytest.CaptureFixture[str]
) -> None:
    caplog.set_level(logging.DEBUG)
    caplog.set_level(logging.DEBUG, logger="httpx2")
    http, gateway = fake_source(key=SECRET_KEY)
    settings = SourceSettings(url=SOURCE_URL, key=SECRET_KEY)
    client = source_client(http, key=SECRET_KEY)
    app = make_app(tmp_path, source=settings, source_client=client)
    web = TestClient(app)
    texts: list[str] = []

    def collect(response: Any) -> None:
        texts.append(response.text)

    # success, an error of the source, a source that is down
    texts.append(json.dumps(acquire(web, part(), part("ticks"), part("instrument"))))
    texts.append(json.dumps(acquire(web, part(instrument="NOSUCH"))))
    gateway.available = False
    texts.append(json.dumps(acquire(web, part())))
    # a wrong key at the source
    wrong = make_app(
        tmp_path,
        name="wrong.db",
        source=settings,
        source_client=source_client(
            fake_source(key="the-key-of-the-source-0000")[0], key=SECRET_KEY
        ),
    )
    texts.append(json.dumps(acquire(TestClient(wrong), part())))
    # a source that cannot be reached, with a real client
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        port = listener.getsockname()[1]
    down = make_app(
        tmp_path,
        name="down.db",
        source=SourceSettings(url=f"http://127.0.0.1:{port}", key=SECRET_KEY, timeout_seconds=5),
    )
    texts.append(json.dumps(acquire(TestClient(down), part())))
    for path in ("/openapi.json", f"{API}/overview", "/api/replay/revision", "/docs"):
        collect(web.get(path))
    collect(web.post(f"{API}/acquisitions", json={"parts": []}))

    output = capsys.readouterr()
    everything = "\n".join([*texts, caplog.text, output.out, output.err])
    assert SECRET_KEY not in everything
    assert SECRET_KEY not in repr(settings)
    assert SECRET_KEY not in repr(client)
    assert SECRET_KEY not in str(client.__dict__.get("_client", ""))
    assert all(SECRET_KEY not in str(record.args) for record in caplog.records)
    for database in tmp_path.glob("*.db"):
        assert SECRET_KEY.encode() not in database.read_bytes(), database.name


def test_the_log_of_pipwerk_replay_names_no_address_and_no_key_when_the_source_is_down(
    tmp_path: Path, caplog: pytest.LogCaptureFixture
) -> None:
    caplog.set_level(logging.DEBUG)
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        port = listener.getsockname()[1]
    app = make_app(
        tmp_path,
        source=SourceSettings(url=f"http://127.0.0.1:{port}", key=SECRET_KEY, timeout_seconds=5),
    )

    acquire(TestClient(app), part())

    # pipwerk replay logs the kind of the failure only (the libraries log at debug level).
    own = [record.getMessage() for record in caplog.records if record.name.startswith("pipwerk_")]
    assert "The source could not be reached (ConnectError)." in own
    assert not any(str(port) in message for message in own)
    assert SECRET_KEY not in caplog.text


def test_the_http_client_hides_its_key_in_its_text() -> None:
    client = HttpSourceClient(
        "http://127.0.0.1:1", SECRET_KEY, timeout_seconds=1, max_response_bytes=10
    )

    assert SECRET_KEY not in repr(client)
    assert SECRET_KEY not in str(client)


# --- end to end over real connections -----------------------------------------------------------


def free_port() -> int:
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        return int(listener.getsockname()[1])


@contextmanager
def program(
    arguments: list[str], log: Path, ready: Callable[[], bool]
) -> Iterator[subprocess.Popen[bytes]]:
    with log.open("wb") as output:
        process = subprocess.Popen(  # noqa: S603 - fixed interpreter, our own modules
            [sys.executable, *arguments], stdout=output, stderr=output
        )
        try:
            deadline = time.monotonic() + 30
            while not ready():
                assert process.poll() is None, log.read_text(errors="replace")
                assert time.monotonic() < deadline, "the program did not become ready"
                time.sleep(0.05)
            yield process
        finally:
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=10)


def reachable(url: str, headers: dict[str, str] | None = None) -> bool:
    try:
        request = Request(url, headers=headers or {})  # noqa: S310 - loopback test URL
        with urlopen(request, timeout=0.5) as response:  # noqa: S310
            return bool(response.status == 200)
    except URLError, TimeoutError, ConnectionError, OSError:
        return False


def call(url: str, body: dict[str, Any] | None = None) -> dict[str, Any]:
    data = json.dumps(body).encode() if body is not None else None
    request = Request(url, data=data, headers=JSON, method="POST" if body is not None else "GET")  # noqa: S310
    with urlopen(request, timeout=30) as response:  # noqa: S310 - loopback test URL
        result: dict[str, Any] = json.loads(response.read())
        return result


def poll(base: str, identifier: str) -> dict[str, Any]:
    deadline = time.monotonic() + 30
    while True:
        state = call(f"{base}{API}/acquisitions/{identifier}")
        if state["state"] == "finished":
            return state
        assert time.monotonic() < deadline
        time.sleep(0.05)


def test_end_to_end_with_pipwerk_replay_and_the_source_as_programs(tmp_path: Path) -> None:
    source_port, replay_port = free_port(), free_port()
    source_url = f"http://127.0.0.1:{source_port}"
    base = f"http://127.0.0.1:{replay_port}"
    config = tmp_path / "pipwerk-replay.ini"
    config.write_text(
        f"[database]\nurl = sqlite:///{tmp_path / 'replay.db'}\n\n"
        f"[source]\nfetch_url = {source_url}\nfetch_key = {SECRET_KEY}\n",
        encoding="utf-8",
    )
    source_log, replay_log = tmp_path / "source.log", tmp_path / "replay.log"
    source_arguments = [
        "-m",
        "pipwerk_fetch_mt5.fake_source",
        "--port",
        str(source_port),
        "--key",
        SECRET_KEY,
    ]
    replay_arguments = [
        "-m",
        "pipwerk_replay.cli",
        "-c",
        str(config),
        "--port",
        str(replay_port),
    ]

    with (
        program(
            source_arguments,
            source_log,
            lambda: reachable(
                f"{source_url}/api/v1/health", {"Authorization": f"Bearer {SECRET_KEY}"}
            ),
        ) as source,
        program(replay_arguments, replay_log, lambda: reachable(f"{base}/api/health")),
    ):
        started = call(f"{base}{API}/acquisitions", {"parts": [part(), part(instrument="NOSUCH")]})
        state = poll(base, started["id"])
        overview = call(f"{base}{API}/overview")
        source.terminate()
        source.wait(timeout=10)
        down = poll(base, call(f"{base}{API}/acquisitions", {"parts": [part("instrument")]})["id"])

    assert [item["state"] for item in state["parts"]] == ["succeeded", "failed"]
    assert state["parts"][0]["result"]["accepted"] == 12
    assert state["parts"][1]["error"]["code"] == "symbol_unknown"
    assert [(s["unit"], s["count"]) for s in overview["series"]] == [("m5", 12)]
    assert down["parts"][0]["error"]["code"] == "source_unreachable"
    replay_output = replay_log.read_text(errors="replace")
    assert SECRET_KEY not in replay_output
    assert SECRET_KEY not in json.dumps([started, state, overview, down])
    assert SECRET_KEY.encode() not in (tmp_path / "replay.db").read_bytes()
