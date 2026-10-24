"""Helpers of the tests of the data stock (not a test module)."""

from __future__ import annotations

import json
from collections.abc import Sequence
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import httpx2
from fastapi import FastAPI
from fastapi.testclient import TestClient

from pipwerk_replay.app import create_app
from pipwerk_replay.config import MarketDataSettings

REPOSITORY = Path(__file__).resolve().parents[4]
EXAMPLES = REPOSITORY / "contracts" / "market-data" / "v1" / "examples"

API = "/api/v1/market-data"
PROCESSES_URL = f"{API}/import-processes"
PREVIEW_URL = f"{API}/import-preview"
SERIES_URL = f"{API}/series"
DETAILS_URL = f"{API}/series/details"
BROKERS_URL = f"{API}/brokers"
TEST_RUN_BROKER_URL = "/api/replay/settings/test-run-broker"
JSON = {"content-type": "application/json"}

BROKER = "TestBroker"
#: The broker of the files in ``contracts/market-data/v1/examples/``.
EXAMPLE_BROKER = "ExampleBroker-Live"

CANDLE_HEADER = "<DATE>\t<TIME>\t<OPEN>\t<HIGH>\t<LOW>\t<CLOSE>\t<TICKVOL>\t<VOL>\t<SPREAD>"
TICK_HEADER = "<DATE>\t<TIME>\t<BID>\t<ASK>\t<LAST>\t<VOLUME>\t<FLAGS>"

FIRST_MINUTE = datetime(2024, 1, 2, 10, 0, tzinfo=UTC)

#: A file of an upload: its name and its content.
Upload = tuple[str, bytes]


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
    name: str = "replay.db",
    **options: Any,
) -> FastAPI:
    return create_app(f"sqlite:///{tmp_path / name}", marketdata=marketdata, **options)


def begin(client: TestClient) -> str:
    """Begin an import process and return its identifier."""
    response = client.post(PROCESSES_URL, json={})
    assert response.status_code == 201, response.text
    return str(response.json()["id"])


def end(client: TestClient, process: str, how: str = "finish") -> httpx2.Response:
    """End (``finish``) or abort (``abort``) an import process."""
    return client.post(f"{PROCESSES_URL}/{process}/{how}", json={})


def file_url(process: str) -> str:
    return f"{PROCESSES_URL}/{process}/files"


def upload_file(
    client: TestClient,
    process: str,
    name: str,
    content: bytes,
    *,
    broker: str | None = BROKER,
    timezone: str | None = None,
    instrument: str | None = None,
    data: str | None = None,
    url: str | None = None,
    headers: dict[str, str] | None = None,
    **fields: str,
) -> httpx2.Response:
    """Post the form of one file of an import process: the file, ``broker``, ``timezone``,
    ``instrument`` and ``data``. ``fields`` are further text fields. ``url`` replaces the path
    (the preview)."""
    form: dict[str, Any] = dict(fields)
    for key, value in (
        ("broker", broker),
        ("timezone", timezone),
        ("instrument", instrument),
        ("data", data),
    ):
        if value is not None:
            form[key] = value
    parts = [("file", (name, content, "application/octet-stream"))]
    return client.post(
        file_url(process) if url is None else url, data=form, files=parts, headers=headers
    )


class Batch:
    """The result of ``upload``: the answers of the requests of the files of one process, shaped
    like the answer of a request. ``status_code`` is 200 if every request was answered with 200,
    else the first other status, and ``json()`` then its body."""

    def __init__(self, status_code: int, payload: dict[str, Any], text: str) -> None:
        self.status_code = status_code
        self._payload = payload
        self.text = text

    def json(self) -> Any:
        return self._payload


def upload(
    client: TestClient,
    files: Sequence[Upload],
    *,
    broker: str | None = BROKER,
    timezone: str | None = None,
    instruments: Sequence[str] | None = None,
    datas: Sequence[str] | None = None,
    headers: dict[str, str] | None = None,
    **fields: str,
) -> Batch:
    """Import the files in one import process, each in a request of its own, with the same
    ``broker`` and ``timezone``; ``instruments`` and ``datas`` give ``instrument`` and ``data``
    of the file at the same position. The process is ended afterwards."""
    process = begin(client)
    outcomes: list[dict[str, Any]] = []
    try:
        for position, (name, content) in enumerate(files):
            response = upload_file(
                client,
                process,
                name,
                content,
                broker=broker,
                timezone=timezone,
                instrument=(instruments[position] or None) if instruments else None,
                data=(datas[position] or None) if datas else None,
                headers=headers,
                **fields,
            )
            if response.status_code != 200:
                return Batch(response.status_code, response.json(), response.text)
            outcomes.append(response.json())
    finally:
        end(client, process)
    refused = sum(1 for item in outcomes if item["refused"])
    payload = {
        "files": outcomes,
        "imported_count": len(outcomes) - refused,
        "refused_count": refused,
    }
    return Batch(200, payload, json.dumps(payload))


def raw_form(parts: Sequence[tuple[str, str | None, bytes]]) -> dict[str, Any]:
    """The arguments (``content``, ``headers``) of a post of a ``multipart/form-data`` body that is
    written by hand: ``(field name, file name or None, content)`` per part. The HTTP client
    encodes file names and sends no form without files; this form says exactly what is given."""
    boundary = "test-boundary-4711"
    body = b""
    for name, file, content in parts:
        disposition = f'form-data; name="{name}"' + (
            f'; filename="{file}"' if file is not None else ""
        )
        body += f"--{boundary}\r\nContent-Disposition: {disposition}\r\n\r\n".encode()
        body += content + b"\r\n"
    body += f"--{boundary}--\r\n".encode()
    return {
        "content": body,
        "headers": {"content-type": f"multipart/form-data; boundary={boundary}"},
    }


def import_json_file(client: TestClient, content: bytes, *, broker: str = BROKER) -> None:
    """Import one JSON file in a process of its own and expect that it is taken over."""
    response = upload(client, [("file.json", content)], broker=broker)
    assert response.status_code == 200, response.text
    assert response.json()["refused_count"] == 0, response.text


def preview(client: TestClient, files: Sequence[Upload]) -> dict[str, Any]:
    """The hints of the preview for each file (one request each), with the broker that all JSON
    files name (``None`` if there is none, one names none, or they name different ones): what the
    dialog of the import makes of the answers."""
    hints: list[dict[str, Any]] = []
    for name, content in files:
        response = client.post(
            PREVIEW_URL, files=[("file", (name, content, "application/octet-stream"))]
        )
        assert response.status_code == 200, response.text
        hints.append(response.json())
    brokers = {hint["broker"] for hint in hints if hint["format"] == "json"}
    json_found = any(hint["format"] == "json" for hint in hints)
    return {
        "files": hints,
        "broker": next(iter(brokers)) if json_found and len(brokers) == 1 else None,
    }


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
