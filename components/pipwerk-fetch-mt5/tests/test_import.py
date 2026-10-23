"""Proof that the files can be imported (order 13 point 6, specification 5.3 and 10).

The files the program writes are checked against the schemas of ``contracts/market-data/v1/``
and imported without a change with ``pipwerk_marketdata`` (a dependency for the tests only).
"""

import json
from datetime import UTC, datetime
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator
from pipwerk_marketdata import MarketDataStore, migrate_database
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from support import ArchiveMt5Module, naive, server_seconds
from test_cli import archive, config_file, names, read, run

SCHEMAS = Path(__file__).resolve().parents[3] / "contracts" / "market-data" / "v1"
KINDS = {"candles": "candles", "ticks": "ticks", "instrument": "instrument"}


def validator(kind: str) -> Draft202012Validator:
    schema = json.loads((SCHEMAS / f"{KINDS[kind]}.schema.json").read_text(encoding="utf-8"))
    Draft202012Validator.check_schema(schema)
    return Draft202012Validator(schema)


@pytest.fixture
def store(tmp_path: Path) -> MarketDataStore:
    engine: Engine = create_engine(f"sqlite:///{tmp_path / 'data.db'}")
    migrate_database(engine)
    return MarketDataStore(engine)


def fetch_everything(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], module: ArchiveMt5Module, zone: str = "UTC"
) -> Path:
    target = tmp_path / "out"
    result = run(
        capsys, module, config_file(tmp_path, zone=zone), "--from", "2026-01-05",
        "--to", "2026-01-06", "-u", "M1,H1", "--ticks", "-o", str(target), "EURUSD", "GBPUSD",
    )  # fmt: skip
    assert result.code == 0, result.err
    return target


def test_every_file_conforms_to_the_schema_of_its_kind(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    target = fetch_everything(tmp_path, capsys, archive())
    assert len(names(target)) == 8
    for name in names(target):
        document = read(target, name)
        errors = sorted(validator(document["kind"]).iter_errors(document), key=str)
        assert errors == [], (name, errors[:3])


def test_every_file_can_be_imported_without_a_change(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], store: MarketDataStore
) -> None:
    target = fetch_everything(tmp_path, capsys, archive())
    results = {name: store.import_json((target / name).read_bytes()) for name in names(target)}
    for result in results.values():
        assert result.rejected_count == 0
        assert result.broker == "Broker-Live-1"
    assert results["EURUSD_H1_20260105_20260106.json"].accepted == 24
    assert results["EURUSD_H1_20260105_20260106.json"].unit == "h1"
    assert results["GBPUSD_M1_20260105_20260106.json"].accepted == 24
    assert results["EURUSD_TICKS_20260105_20260106.json"].accepted == 144
    assert results["EURUSD_CONTRACT_20260105_20260106.json"].kind == "instrument"
    candles = store.read_candles(
        "Broker-Live-1",
        "EURUSD",
        "h1",
        datetime(2026, 1, 5, tzinfo=UTC),
        datetime(2026, 1, 6, tzinfo=UTC),
    )
    assert [candle.time.hour for candle in candles.items] == list(range(24))
    info = store.instrument_info("Broker-Live-1", "EURUSD")
    assert info is not None
    assert (info.contract_size, info.tick_value_currency) == (100000.0, "USD")
    assert info.acquired_at == datetime(2026, 1, 9, 8, 0, tzinfo=UTC)


def test_importing_the_same_files_again_replaces_the_rows(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], store: MarketDataStore
) -> None:
    target = fetch_everything(tmp_path, capsys, archive())
    path = target / "EURUSD_H1_20260105_20260106.json"
    assert store.import_json(path.read_bytes()).replaced == 0
    again = store.import_json(path.read_bytes())
    assert (again.accepted, again.replaced, again.rejected_count) == (24, 24, 0)


def test_files_of_a_zone_with_summer_time_import_with_the_utc_times(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], store: MarketDataStore
) -> None:
    module = ArchiveMt5Module()
    # Athens, 2026-10-25: 03:00 occurs twice; the second one is left out of the file.
    module.candle_seconds["EURUSD"] = [
        server_seconds(naive(2026, 10, 25, 3)),
        server_seconds(naive(2026, 10, 25, 3)),
        server_seconds(naive(2026, 10, 25, 4)),
    ]
    result = run(
        capsys, module, config_file(tmp_path, zone="Europe/Athens"), "--from", "2026-10-25",
        "--to", "2026-10-26", "-u", "H1", "-o", str(tmp_path / "out"), "EURUSD",
    )  # fmt: skip
    assert result.code == 0, result.err
    imported = store.import_json(
        (tmp_path / "out" / "EURUSD_H1_20261025_20261026.json").read_bytes()
    )
    assert (imported.accepted, imported.rejected_count) == (2, 0)
