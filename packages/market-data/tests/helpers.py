"""Helpers of the tests: paths, documents and moments."""

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from sqlalchemy import Engine, create_engine

from pipwerk_marketdata import migrate_database

REPOSITORY = Path(__file__).resolve().parents[3]
SCHEMA_DIRECTORY = REPOSITORY / "contracts" / "market-data" / "v1"
EXAMPLE_DIRECTORY = SCHEMA_DIRECTORY / "examples"
TECHNICAL_DOCUMENT = REPOSITORY / "docs" / "technical" / "pipwerk-marketdata.md"
LIBRARY_SOURCE = Path(__file__).resolve().parents[1] / "src" / "pipwerk_marketdata"

BROKER = "TestBroker"
INSTRUMENT = "EURUSD"


def utc(
    year: int,
    month: int = 1,
    day: int = 1,
    hour: int = 0,
    minute: int = 0,
    second: int = 0,
    microsecond: int = 0,
) -> datetime:
    return datetime(year, month, day, hour, minute, second, microsecond, tzinfo=UTC)


def make_engine(directory: Path, name: str = "data.db", *, migrate: bool = True) -> Engine:
    engine = create_engine(f"sqlite:///{directory / name}")
    if migrate:
        migrate_database(engine)
    return engine


def iso(moment: datetime) -> str:
    text = moment.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%S.%f")
    return text.rstrip("0").rstrip(".") + "Z"


def candle_entry(moment: datetime, price: float = 1.1, **changes: Any) -> dict[str, Any]:
    entry: dict[str, Any] = {
        "time": iso(moment),
        "open": price,
        "high": price + 0.001,
        "low": price - 0.001,
        "close": price + 0.0005,
        "volume": 10,
        "spread": 5,
    }
    entry.update(changes)
    return entry


def candle_document(entries: list[Any], **changes: Any) -> dict[str, Any]:
    document: dict[str, Any] = {
        "version": 1,
        "kind": "candles",
        "broker": BROKER,
        "instrument": INSTRUMENT,
        "time_unit": "m1",
        "candles": entries,
    }
    document.update(changes)
    return document


def tick_document(entries: list[Any], **changes: Any) -> dict[str, Any]:
    document: dict[str, Any] = {
        "version": 1,
        "kind": "ticks",
        "broker": BROKER,
        "instrument": INSTRUMENT,
        "ticks": entries,
    }
    document.update(changes)
    return document


def minutes(start: datetime, count: int, step: int = 1) -> list[datetime]:
    return [start + timedelta(minutes=step * index) for index in range(count)]


def to_bytes(document: Any) -> bytes:
    return json.dumps(document).encode("utf-8")
