"""Import of an import process: several files, one broker, one time zone, one transaction each."""

import json
from pathlib import Path

import pytest

from pipwerk_marketdata import (
    BatchErrorCode,
    FileErrorCode,
    FileFormat,
    ImportBatchError,
    ImportFile,
    ImportLimits,
    MarketDataStore,
    MarketDataStoreError,
    RejectReason,
)
from tests.helpers import (
    EXAMPLE_DIRECTORY,
    candle_document,
    candle_entry,
    make_engine,
    minutes,
    tick_document,
    to_bytes,
    utc,
)

SERVER = "Example-Server 01"
START = utc(2024, 1, 2, 10)
CSV_HEADER = "<DATE>\t<TIME>\t<OPEN>\t<HIGH>\t<LOW>\t<CLOSE>\t<TICKVOL>\t<VOL>\t<SPREAD>"


def json_file(name: str, document: object) -> ImportFile:
    return ImportFile(name, to_bytes(document), FileFormat.JSON)


def csv_candles(
    name: str, rows: list[str], instrument: str = "GBPUSD", data: str = "h1"
) -> ImportFile:
    text = "\r\n".join([CSV_HEADER, *rows]) + "\r\n"
    return ImportFile(name, text.encode("utf-8"), FileFormat.CSV, instrument, data)


def csv_row(clock: str) -> str:
    return f"2024.01.02\t{clock}\t1.10\t1.12\t1.09\t1.11\t50\t0\t7"


def read_times(store: MarketDataStore, broker: str, instrument: str, unit: str) -> list[object]:
    page = store.read_candles(broker, instrument, unit, utc(2000, 1, 1), utc(2100, 1, 1))
    return [candle.time for candle in page.items]


def test_json_and_csv_with_one_broker_and_one_time_zone(store: MarketDataStore) -> None:
    ticks = tick_document(
        [{"time": "2024-01-02T10:00:00.5Z", "bid": 1.1, "ask": 1.2}], instrument="USDJPY"
    )
    candles = candle_document([candle_entry(t) for t in minutes(START, 3)])
    csv_ticks = ImportFile(
        "AUDUSD,TICKS.csv",
        b"<DATE>\t<TIME>\t<BID>\t<ASK>\n2024.01.02\t12:00:00.250\t0.65\t0.66\n",
        FileFormat.CSV,
        "AUDUSD",
        "ticks",
    )
    result = store.import_files(
        [
            json_file("EURUSD_M1.json", candles),
            json_file("USDJPY_TICKS.json", ticks),
            csv_candles("GBPUSD,H1.csv", [csv_row("12:00:00"), csv_row("13:00:00")]),
            csv_ticks,
        ],
        broker=SERVER,
        timezone="Europe/Athens",
    )
    assert [outcome.name for outcome in result.files] == [
        "EURUSD_M1.json",
        "USDJPY_TICKS.json",
        "GBPUSD,H1.csv",
        "AUDUSD,TICKS.csv",
    ]
    assert [outcome.accepted for outcome in result.files] == [3, 1, 2, 1]
    assert not any(outcome.refused for outcome in result.files)
    # The broker of the process replaces the broker named in the JSON files.
    assert read_times(store, SERVER, "EURUSD", "m1") == minutes(START, 3)
    assert read_times(store, "TestBroker", "EURUSD", "m1") == []
    # Athens is UTC+2 in January: 12:00 and 13:00 local time are 10:00 and 11:00 UTC.
    assert read_times(store, SERVER, "GBPUSD", "h1") == [utc(2024, 1, 2, 10), utc(2024, 1, 2, 11)]
    ticks_page = store.read_ticks(SERVER, "AUDUSD", utc(2024, 1, 1), utc(2024, 1, 3))
    assert [tick.time for tick in ticks_page.items] == [utc(2024, 1, 2, 10, 0, 0, 250000)]
    first = result.files[0].result
    assert first is not None
    assert (first.period_start, first.period_end) == (START, utc(2024, 1, 2, 10, 2))
    assert first.broker == SERVER


def test_json_keeps_its_own_broker_without_a_broker_of_the_process(
    store: MarketDataStore,
) -> None:
    result = store.import_files([json_file("a.json", candle_document([candle_entry(START)]))])
    assert result.files[0].accepted == 1
    assert read_times(store, "TestBroker", "EURUSD", "m1") == [START]


def test_the_broker_of_the_process_applies_to_instrument_data(store: MarketDataStore) -> None:
    document = json.loads((EXAMPLE_DIRECTORY / "instrument.json").read_text())
    result = store.import_files([json_file("EURUSD_CONTRACT.json", document)], broker=SERVER)
    assert result.files[0].accepted == 1
    assert result.files[0].result is not None
    assert result.files[0].result.broker == SERVER
    assert store.instrument_info(SERVER, "EURUSD") is not None
    assert store.instrument_info(document["broker"], "EURUSD") is None


def test_a_refused_file_does_not_stop_the_others(store: MarketDataStore) -> None:
    good_first = json_file("a.json", candle_document([candle_entry(START)]))
    broken = ImportFile("b.json", b"{not json", FileFormat.JSON)
    no_rows = csv_candles("c.csv", [])
    good_last = csv_candles("d.csv", [csv_row("12:00:00")])
    result = store.import_files(
        [good_first, broken, no_rows, good_last], broker=SERVER, timezone="UTC"
    )
    outcomes = {outcome.name: outcome for outcome in result.files}
    assert outcomes["a.json"].accepted == 1
    assert outcomes["d.csv"].accepted == 1
    assert outcomes["b.json"].refused
    assert outcomes["b.json"].error == FileErrorCode.JSON_INVALID
    assert outcomes["b.json"].message
    assert outcomes["b.json"].result is None
    assert outcomes["c.csv"].error == FileErrorCode.NO_ROWS
    assert read_times(store, SERVER, "EURUSD", "m1") == [START]
    assert read_times(store, SERVER, "GBPUSD", "h1") == [utc(2024, 1, 2, 12)]


def test_each_file_reports_its_rejected_rows(store: MarketDataStore) -> None:
    entries = [candle_entry(START), candle_entry(START), candle_entry(utc(2024, 1, 2, 10, 5), 1.2)]
    result = store.import_files(
        [
            json_file("a.json", candle_document(entries)),
            csv_candles(
                "b.csv", [csv_row("12:00:00"), "2024.01.02\t13:00:00\t1.10\t1.0\t1.09\t1.11"]
            ),
        ],
        broker=SERVER,
        timezone="UTC",
    )
    first, second = (outcome.result for outcome in result.files)
    assert first is not None
    assert second is not None
    assert (first.accepted, first.rejected_count) == (2, 1)
    assert [(row.row, row.reason) for row in first.rejected] == [(2, RejectReason.TIME_DUPLICATE)]
    assert (second.accepted, second.rejected_count) == (1, 1)
    assert second.rejected[0].reason in (
        RejectReason.HIGH_BELOW_LOW,
        RejectReason.HIGH_BELOW_OPEN,
        RejectReason.COLUMNS_MISMATCH,
    )
    assert (second.period_start, second.period_end) == (utc(2024, 1, 2, 12), utc(2024, 1, 2, 12))


def test_a_file_that_changes_nothing_when_it_is_refused(store: MarketDataStore) -> None:
    document = candle_document(
        [candle_entry(START)],
        period={"start": "2024-01-01T00:00:00Z", "end": "2024-01-01T00:01:00Z"},
    )
    result = store.import_files([json_file("a.json", document)], broker=SERVER)
    assert result.files[0].error == FileErrorCode.PERIOD_INVALID
    assert store.list_series().total == 0


def test_importing_again_replaces(store: MarketDataStore) -> None:
    files = [json_file("a.json", candle_document([candle_entry(t) for t in minutes(START, 4)]))]
    store.import_files(files, broker=SERVER)
    again = store.import_files(
        [json_file("a.json", candle_document([candle_entry(t, 1.5) for t in minutes(START, 2)]))],
        broker=SERVER,
    )
    result = again.files[0].result
    assert result is not None
    assert (result.accepted, result.replaced) == (2, 2)
    page = store.read_candles(SERVER, "EURUSD", "m1", START, utc(2024, 1, 2, 11))
    assert [candle.open for candle in page.items] == [1.5, 1.5, 1.1, 1.1]


def test_the_same_series_twice_in_one_process_replaces_in_order(store: MarketDataStore) -> None:
    result = store.import_files(
        [
            json_file("a.json", candle_document([candle_entry(START)])),
            json_file("b.json", candle_document([candle_entry(START, 1.5)])),
        ],
        broker=SERVER,
    )
    second = result.files[1].result
    assert second is not None
    assert second.replaced == 1


def test_csv_needs_broker_instrument_data_and_time_zone(store: MarketDataStore) -> None:
    rows = [csv_row("12:00:00")]
    file = csv_candles("a.csv", rows)
    no_instrument = ImportFile("b.csv", file.content, FileFormat.CSV, None, "h1")
    no_data = ImportFile("c.csv", file.content, FileFormat.CSV, "GBPUSD", None)
    contract = ImportFile("d.csv", file.content, FileFormat.CSV, "GBPUSD", "contract")
    unknown_unit = ImportFile("e.csv", file.content, FileFormat.CSV, "GBPUSD", "h5")
    without_broker = store.import_files([file], timezone="UTC")
    assert without_broker.files[0].error == FileErrorCode.SERIES_INVALID
    without_zone = store.import_files([file], broker=SERVER)
    assert without_zone.files[0].error == FileErrorCode.TIMEZONE_UNKNOWN
    unknown_zone = store.import_files([file], broker=SERVER, timezone="Nowhere/Land")
    assert unknown_zone.files[0].error == FileErrorCode.TIMEZONE_UNKNOWN
    result = store.import_files(
        [no_instrument, no_data, contract, unknown_unit], broker=SERVER, timezone="UTC"
    )
    assert [outcome.error for outcome in result.files] == [FileErrorCode.SERIES_INVALID] * 4
    assert store.list_series().total == 0


def test_an_unusable_broker_refuses_every_file(store: MarketDataStore) -> None:
    result = store.import_files(
        [
            json_file("a.json", candle_document([candle_entry(START)])),
            csv_candles("b.csv", [csv_row("12:00:00")]),
        ],
        broker=" padded ",
        timezone="UTC",
    )
    assert [outcome.error for outcome in result.files] == [FileErrorCode.SERIES_INVALID] * 2


def test_limits_of_each_file_apply_in_a_process(store: MarketDataStore) -> None:
    entries = [candle_entry(t) for t in minutes(START, 5)]
    result = store.import_files(
        [
            json_file("big.json", candle_document(entries)),
            json_file("small.json", candle_document(entries[:2], instrument="GBPUSD")),
        ],
        broker=SERVER,
        limits=ImportLimits(max_rows=3),
    )
    assert result.files[0].error == FileErrorCode.TOO_MANY_ROWS
    assert result.files[1].accepted == 2
    sized = store.import_files(
        [json_file("big.json", candle_document(entries))],
        broker=SERVER,
        limits=ImportLimits(max_bytes=100),
    )
    assert sized.files[0].error == FileErrorCode.TOO_LARGE


def test_limit_of_the_number_of_files(store: MarketDataStore) -> None:
    files = [json_file(f"{n}.json", candle_document([candle_entry(START)])) for n in range(3)]
    assert len(store.import_files(files, limits=ImportLimits(max_files=3)).files) == 3
    with pytest.raises(ImportBatchError) as raised:
        store.import_files(files, limits=ImportLimits(max_files=2))
    assert raised.value.code == BatchErrorCode.TOO_MANY_FILES
    assert "2" in raised.value.message


def test_limit_of_the_total_size(store: MarketDataStore) -> None:
    files = [json_file(f"{n}.json", candle_document([candle_entry(START)])) for n in range(2)]
    size = sum(len(file.content) for file in files)
    assert len(store.import_files(files, limits=ImportLimits(max_batch_bytes=size)).files) == 2
    store_before = store.list_series().total
    with pytest.raises(ImportBatchError) as raised:
        store.import_files(files, limits=ImportLimits(max_batch_bytes=size - 1))
    assert raised.value.code == BatchErrorCode.BATCH_TOO_LARGE
    assert store.list_series().total == store_before


def test_a_refused_process_changes_nothing(store: MarketDataStore) -> None:
    files = [json_file(f"{n}.json", candle_document([candle_entry(START)])) for n in range(3)]
    with pytest.raises(ImportBatchError):
        store.import_files(files, limits=ImportLimits(max_files=1))
    assert store.list_series().total == 0


def test_a_process_without_files_is_refused(store: MarketDataStore) -> None:
    with pytest.raises(ImportBatchError) as raised:
        store.import_files([])
    assert raised.value.code == BatchErrorCode.NO_FILES


def test_default_limits_of_a_process() -> None:
    limits = ImportLimits()
    assert (limits.max_files, limits.max_batch_bytes) == (500, 512 * 1024 * 1024)
    for field in ("max_files", "max_batch_bytes"):
        with pytest.raises(ValueError, match="positive"):
            ImportLimits(**{field: 0})


def test_a_database_error_refuses_the_file_and_not_the_process(tmp_path: Path) -> None:
    store = MarketDataStore(make_engine(tmp_path, migrate=False))
    result = store.import_files(
        [
            json_file("a.json", candle_document([candle_entry(START)])),
            ImportFile("b.json", b"[]", FileFormat.JSON),
        ],
        broker=SERVER,
    )
    assert result.files[0].error == FileErrorCode.STORE_FAILED
    assert result.files[0].message
    assert result.files[1].error == FileErrorCode.DOCUMENT_INVALID
    with pytest.raises(MarketDataStoreError):
        store.list_series()


def test_the_file_name_is_only_reported_never_used_as_a_path(
    store: MarketDataStore, tmp_path: Path
) -> None:
    name = "../../outside.json"
    result = store.import_files([json_file(name, candle_document([candle_entry(START)]))])
    assert result.files[0].name == name
    assert not (tmp_path.parent / "outside.json").exists()
