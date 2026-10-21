"""The schemas under contracts/market-data/v1/ and their examples against schema and import."""

import json
from pathlib import Path
from typing import Any

import pytest
from jsonschema import Draft202012Validator

from pipwerk_marketdata import ImportFileError, MarketDataStore
from pipwerk_marketdata.documents import SCHEMA_MODELS, differing_schemas, main, schema_file_name
from pipwerk_marketdata.timeunits import TIME_UNITS
from tests.helpers import EXAMPLE_DIRECTORY, SCHEMA_DIRECTORY, to_bytes

NAMES = sorted(SCHEMA_MODELS)


def load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def validator(name: str) -> Draft202012Validator:
    schema = load(SCHEMA_DIRECTORY / schema_file_name(name))
    Draft202012Validator.check_schema(schema)
    return Draft202012Validator(schema)


def test_schema_files_equal_the_models() -> None:
    assert differing_schemas(SCHEMA_DIRECTORY) == []
    assert main([str(SCHEMA_DIRECTORY), "--check"]) == 0


def test_check_reports_a_changed_schema(tmp_path: Path) -> None:
    for name in NAMES:
        (tmp_path / schema_file_name(name)).write_text("{}", encoding="utf-8")
    assert sorted(differing_schemas(tmp_path)) == NAMES
    assert main([str(tmp_path), "--check"]) == 1
    assert main([str(tmp_path)]) == 0
    assert differing_schemas(tmp_path) == []


def test_there_is_one_example_per_schema() -> None:
    assert sorted(path.stem for path in EXAMPLE_DIRECTORY.glob("*.json")) == NAMES


@pytest.mark.parametrize("name", NAMES)
def test_example_matches_the_schema(name: str) -> None:
    assert list(validator(name).iter_errors(load(EXAMPLE_DIRECTORY / f"{name}.json"))) == []


@pytest.mark.parametrize("name", NAMES)
def test_example_is_imported_without_rejections(store: MarketDataStore, name: str) -> None:
    data = (EXAMPLE_DIRECTORY / f"{name}.json").read_bytes()
    result = store.import_json(data)
    assert result.kind == name
    assert result.rejected_count == 0
    assert result.accepted == {"candles": 5, "ticks": 4, "instrument": 1}[name]


def test_candle_example_delivers_trading_hours_and_period(store: MarketDataStore) -> None:
    document = load(EXAMPLE_DIRECTORY / "candles.json")
    store.import_json(to_bytes(document))
    assert len(store.trading_hours(document["broker"], document["instrument"], "m1")) == 6
    series = store.overview().series[0]
    assert [(c.start, c.end) for c in series.covered] == [
        (series.first, series.first.replace(minute=5))  # type: ignore[union-attr]
    ]


def test_time_units_of_the_schema_are_the_time_units_of_the_library() -> None:
    schema = load(SCHEMA_DIRECTORY / "candles.schema.json")
    assert set(schema["properties"]["time_unit"]["enum"]) == set(TIME_UNITS)


def mutate(path: str, value: Any) -> Any:
    document = load(EXAMPLE_DIRECTORY / "candles.json")
    target: Any = document
    *parents, last = path.split(".")
    for part in parents:
        target = target[int(part)] if part.isdigit() else target[part]
    if value is KeyError:
        del target[last]
    elif last.isdigit():
        target[int(last)] = value
    else:
        target[last] = value
    return document


@pytest.mark.parametrize(
    "document",
    [
        mutate("extra", 1),
        mutate("version", 2),
        mutate("kind", "ticks"),
        mutate("broker", ""),
        mutate("time_unit", "m7"),
        mutate("period.start", "2024-01-02 10:00:00"),
        mutate("trading_hours.0.weekday", "someday"),
        mutate("trading_hours.0.from", "24:00"),
        mutate("trading_hours.0.to", "25:00"),
        mutate("candles", "x"),
    ],
)
def test_faults_in_the_header_fail_schema_and_import(store: MarketDataStore, document: Any) -> None:
    assert list(validator("candles").iter_errors(document)) != []
    with pytest.raises(ImportFileError):
        store.import_json(to_bytes(document))


@pytest.mark.parametrize(
    "document",
    [
        mutate("candles.0.open", 0),
        mutate("candles.0.open", "1.0"),
        mutate("candles.0.extra", 1),
        mutate("candles.0.time", "2024-01-02T10:00:00+02:00"),
        mutate("candles.0.volume", -1),
        mutate("candles.0.spread", 1.5),
        mutate("candles.0.close", KeyError),
    ],
)
def test_faults_in_an_entry_fail_the_schema_and_reject_the_row(
    store: MarketDataStore, document: Any
) -> None:
    assert list(validator("candles").iter_errors(document)) != []
    result = store.import_json(to_bytes(document))
    assert (result.accepted, result.rejected_count) == (4, 1)
    assert result.rejected[0].row == 1


def test_instrument_and_tick_faults_fail_schema_and_import(store: MarketDataStore) -> None:
    instrument = load(EXAMPLE_DIRECTORY / "instrument.json")
    for change in ({"tick_size": 0}, {"extra": 1}, {"swap_triple_weekday": "mon"}, {"spread": -1}):
        document = {**instrument, **change}
        assert list(validator("instrument").iter_errors(document)) != []
        with pytest.raises(ImportFileError):
            store.import_json(to_bytes(document))
    ticks = load(EXAMPLE_DIRECTORY / "ticks.json")
    ticks["ticks"][0]["bid"] = -1
    assert list(validator("ticks").iter_errors(ticks)) != []
    assert store.import_json(to_bytes(ticks)).rejected_count == 1
