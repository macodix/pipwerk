"""Helpers of the tests of the data stock and the acquisition (not a test module)."""

from __future__ import annotations

import json
import time
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import httpx2
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pipwerk_fetch_mt5.fake_source import FAKE_SHARED_KEY, FakeGateway, create_fake_source_app

from pipwerk_replay.acquisition import ENVELOPE_ALLOWANCE, HttpSourceClient, SourceClient
from pipwerk_replay.app import create_app
from pipwerk_replay.config import MarketDataSettings, SourceSettings

REPOSITORY = Path(__file__).resolve().parents[4]
EXAMPLES = REPOSITORY / "contracts" / "market-data" / "v1" / "examples"

API = "/api/v1/market-data"
JSON = {"content-type": "application/json"}
CSV = {"content-type": "text/csv"}

#: The name of the broker of the replica of the source.
FAKE_BROKER = "Fake-Broker-Demo"
BROKER = "TestBroker"
#: The broker of the files in ``contracts/market-data/v1/examples/``.
EXAMPLE_BROKER = "ExampleBroker-Live"

SOURCE_URL = "http://127.0.0.1"
#: A key that appears nowhere else; a test looks for it in answers, logs and files.
SECRET_KEY = "SECRET-KEY-must-never-appear-4711"

CANDLE_HEADER = "<DATE>\t<TIME>\t<OPEN>\t<HIGH>\t<LOW>\t<CLOSE>\t<TICKVOL>\t<VOL>\t<SPREAD>"
TICK_HEADER = "<DATE>\t<TIME>\t<BID>\t<ASK>\t<LAST>\t<VOLUME>\t<FLAGS>"

FIRST_MINUTE = datetime(2024, 1, 2, 10, 0, tzinfo=UTC)


def example(name: str) -> bytes:
    """A file of ``contracts/market-data/v1/examples/``."""
    return (EXAMPLES / name).read_bytes()


def csv_file(header: str, *rows: str) -> bytes:
    return ("\r\n".join([header, *rows]) + "\r\n").encode("utf-8")


def candle_row(clock: str, date: str = "2024.01.02", prices: str = "1.10\t1.12\t1.09\t1.11") -> str:
    return f"{date}\t{clock}\t{prices}\t50\t0\t7"


def tick_row(clock: str, date: str = "2024.01.02", bid: str = "1.1000", ask: str = "1.1002") -> str:
    return f"{date}\t{clock}\t{bid}\t{ask}\t\t\t6"


def stamp(moment: datetime) -> str:
    return moment.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


def candle_entry(moment: datetime, **changes: Any) -> dict[str, Any]:
    entry: dict[str, Any] = {
        "time": stamp(moment),
        "open": 1.1,
        "high": 1.2,
        "low": 1.0,
        "close": 1.15,
        "volume": 10,
        "spread": 5,
    }
    entry.update(changes)
    return entry


def candles_document(entries: list[dict[str, Any]], **changes: Any) -> bytes:
    document: dict[str, Any] = {
        "version": 1,
        "kind": "candles",
        "broker": BROKER,
        "instrument": "EURUSD",
        "time_unit": "m1",
        "candles": entries,
    }
    document.update(changes)
    return json.dumps(document).encode("utf-8")


def candles_json(count: int, **changes: Any) -> bytes:
    """A file of ``count`` M1 candles from 2024-01-02T10:00:00Z, one per minute."""
    entries = [candle_entry(FIRST_MINUTE + timedelta(minutes=index)) for index in range(count)]
    return candles_document(entries, **changes)


def make_app(
    tmp_path: Path,
    *,
    marketdata: MarketDataSettings | None = None,
    source: SourceSettings | None = None,
    source_client: SourceClient | None = None,
    name: str = "replay.db",
    **options: Any,
) -> FastAPI:
    return create_app(
        f"sqlite:///{tmp_path / name}",
        marketdata=marketdata,
        source=source,
        source_client=source_client,
        **options,
    )


def fake_source(
    *, key: str = FAKE_SHARED_KEY, gateway: FakeGateway | None = None, **options: Any
) -> tuple[TestClient, FakeGateway]:
    """The replica of the source behind a test client, and its gateway (to switch errors on)."""
    gateway = gateway or FakeGateway()
    app = create_fake_source_app(key, gateway=gateway, **options)
    return TestClient(app, base_url=SOURCE_URL), gateway


def source_client(
    http: httpx2.Client,
    *,
    key: str = FAKE_SHARED_KEY,
    max_response_bytes: int = 32 * 1024 * 1024 + ENVELOPE_ALLOWANCE,
) -> HttpSourceClient:
    return HttpSourceClient(
        SOURCE_URL,
        key,
        timeout_seconds=30,
        max_response_bytes=max_response_bytes,
        client=http,
    )


def replay_with_fake_source(
    tmp_path: Path,
    *,
    key: str = FAKE_SHARED_KEY,
    gateway: FakeGateway | None = None,
    marketdata: MarketDataSettings | None = None,
    source: SourceSettings | None = None,
    **options: Any,
) -> tuple[TestClient, FakeGateway]:
    """pipwerk replay with a source (the replica) that is set up, and the gateway of the replica."""
    http, gateway = fake_source(key=key, gateway=gateway, **options)
    app = make_app(
        tmp_path,
        marketdata=marketdata,
        source=source or SourceSettings(url=SOURCE_URL, key=key),
        source_client=source_client(http, key=key),
    )
    return TestClient(app), gateway


def part(kind: str = "candles", **changes: Any) -> dict[str, Any]:
    """A part of a request: by default M5 candles of EURUSD for the hour 08:00 to 09:00 UTC on
    Monday 2026-01-05."""
    base: dict[str, Any] = {"kind": kind, "instrument": "EURUSD"}
    if kind == "candles":
        base["time_unit"] = "m5"
    if kind != "instrument":
        base["start"] = "2026-01-05T08:00:00Z"
        base["end"] = "2026-01-05T09:00:00Z"
    base.update(changes)
    return base


def wait_finished(client: TestClient, acquisition_id: str, seconds: float = 30) -> dict[str, Any]:
    """Poll an acquisition until it is finished; return its state."""
    deadline = time.monotonic() + seconds
    while True:
        response = client.get(f"{API}/acquisitions/{acquisition_id}")
        assert response.status_code == 200, response.text
        body: dict[str, Any] = response.json()
        if body["state"] == "finished":
            return body
        assert time.monotonic() < deadline, "the acquisition did not finish"
        time.sleep(0.01)


def acquire(client: TestClient, *parts: dict[str, Any]) -> dict[str, Any]:
    """Start an acquisition of the parts and wait for its end; return the finished state."""
    response = client.post(f"{API}/acquisitions", json={"parts": list(parts)})
    assert response.status_code == 202, response.text
    return wait_finished(client, response.json()["id"])
