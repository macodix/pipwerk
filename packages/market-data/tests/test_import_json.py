"""Import of JSON files: valid files, every reason for rejecting a row, every file error."""

import json
from typing import Any

import pytest
from sqlalchemy import Engine, event
from sqlalchemy.exc import OperationalError

from pipwerk_marketdata import (
    FileErrorCode,
    ImportFileError,
    ImportLimits,
    MarketDataStore,
    MarketDataStoreError,
    RejectReason,
    Weekday,
)
from pipwerk_marketdata.limits import MAX_INTEGER_VALUE
from tests.helpers import (
    BROKER,
    EXAMPLE_DIRECTORY,
    INSTRUMENT,
    candle_document,
    candle_entry,
    iso,
    minutes,
    tick_document,
    to_bytes,
    utc,
)

START = utc(2024, 1, 2, 10, 0)


def read_all(store: MarketDataStore) -> list[Any]:
    return list(
        store.read_candles(BROKER, INSTRUMENT, "m1", utc(2000, 1, 1), utc(2100, 1, 1)).items
    )


def test_valid_candles_are_taken_over(store: MarketDataStore) -> None:
    entries = [candle_entry(moment) for moment in minutes(START, 5)]
    result = store.import_json(to_bytes(candle_document(entries)))
    assert (result.accepted, result.replaced, result.rejected_count) == (5, 0, 0)
    assert result.rejected == ()
    assert (result.period_start, result.period_end) == (START, utc(2024, 1, 2, 10, 4))
    candles = read_all(store)
    assert [item.time for item in candles] == minutes(START, 5)
    assert candles[0].open == 1.1
    assert candles[0].volume == 10
    assert candles[0].spread == 5


def test_optional_fields_may_be_missing_or_null(store: MarketDataStore) -> None:
    entry = candle_entry(START)
    del entry["volume"]
    entry["spread"] = None
    result = store.import_json(to_bytes(candle_document([entry])))
    assert result.accepted == 1
    candle = read_all(store)[0]
    assert (candle.volume, candle.spread) == (None, None)


def test_valid_ticks_with_milliseconds(store: MarketDataStore) -> None:
    entries = [
        {"time": "2024-01-02T10:00:00.120Z", "bid": 1.1, "ask": 1.1001},
        {"time": "2024-01-02T10:00:00.121Z", "bid": 1.1, "ask": 1.1002},
    ]
    result = store.import_json(to_bytes(tick_document(entries)))
    assert result.accepted == 2
    ticks = store.read_ticks(BROKER, INSTRUMENT, utc(2024, 1, 1), utc(2024, 1, 3)).items
    assert [tick.time.microsecond for tick in ticks] == [120_000, 121_000]
    assert ticks[1].ask == 1.1002


def test_valid_instrument(store: MarketDataStore) -> None:
    document = json.loads((EXAMPLE_DIRECTORY / "instrument.json").read_text())
    result = store.import_json(to_bytes(document))
    assert (result.kind, result.accepted, result.replaced) == ("instrument", 1, 0)
    info = store.instrument_info(document["broker"], document["instrument"])
    assert info is not None
    assert info.contract_size == 100000
    assert info.swap_triple_weekday is Weekday.WEDNESDAY
    assert info.margin_per_lot == 3650
    assert info.acquired_at == utc(2024, 1, 2, 9, 30)
    # the same moment is replaced
    again = store.import_json(to_bytes({**document, "swap_long": -1.0}))
    assert again.replaced == 1
    changed = store.instrument_info(document["broker"], document["instrument"])
    assert changed is not None
    assert changed.swap_long == -1.0


@pytest.mark.parametrize(
    ("change", "reason"),
    [
        ({"open": -1.0}, RejectReason.PRICE_NOT_POSITIVE),
        ({"close": 0}, RejectReason.PRICE_NOT_POSITIVE),
        ({"open": "1.1"}, RejectReason.VALUE_INVALID),
        ({"open": None}, RejectReason.VALUE_INVALID),
        ({"volume": -1}, RejectReason.VALUE_INVALID),
        ({"spread": 1.5}, RejectReason.VALUE_INVALID),
        ({"extra": 1}, RejectReason.FIELD_UNKNOWN),
        ({"time": "2024-01-02 10:00:00"}, RejectReason.TIME_INVALID),
        ({"time": "2024-01-02T10:00:00+02:00"}, RejectReason.TIME_INVALID),
        ({"time": "2024-13-02T10:00:00Z"}, RejectReason.TIME_INVALID),
        ({"time": "2024-02-30T10:00:00Z"}, RejectReason.TIME_INVALID),
        ({"time": 1704189600}, RejectReason.VALUE_INVALID),
        ({"high": 1.0}, RejectReason.HIGH_BELOW_OPEN),
        ({"open": 1.0, "high": 1.0001, "low": 1.0002, "close": 1.0}, RejectReason.HIGH_BELOW_LOW),
        ({"open": 1.0, "high": 1.0003, "low": 0.9, "close": 1.0004}, RejectReason.HIGH_BELOW_CLOSE),
        ({"open": 1.1, "high": 1.3, "low": 1.2, "close": 1.25}, RejectReason.LOW_ABOVE_OPEN),
        ({"open": 1.1, "low": 1.05, "close": 1.04, "high": 1.2}, RejectReason.LOW_ABOVE_CLOSE),
    ],
)
def test_candle_rows_with_a_fault_are_rejected(
    store: MarketDataStore, change: dict[str, Any], reason: RejectReason
) -> None:
    good = [candle_entry(moment) for moment in minutes(utc(2024, 1, 2, 11), 2)]
    bad = candle_entry(START, **change)
    result = store.import_json(to_bytes(candle_document([bad, *good])))
    assert result.accepted == 2
    assert [(row.row, row.reason) for row in result.rejected] == [(1, reason)]
    assert result.rejected_count == 1
    assert len(read_all(store)) == 2


def test_entry_that_is_no_object_and_missing_fields(store: MarketDataStore) -> None:
    incomplete = candle_entry(utc(2024, 1, 2, 10, 1))
    del incomplete["high"]
    entries = [5, incomplete, candle_entry(START)]
    result = store.import_json(to_bytes(candle_document(entries)))
    assert [(row.row, row.reason) for row in result.rejected] == [
        (1, RejectReason.ENTRY_INVALID),
        (2, RejectReason.FIELD_MISSING),
    ]
    assert result.accepted == 1


def test_nan_in_an_entry_is_refused_as_json(store: MarketDataStore) -> None:
    text = json.dumps(candle_document([candle_entry(START)])).replace("1.1,", "NaN,", 1)
    with pytest.raises(ImportFileError) as caught:
        store.import_json(text.encode())
    assert caught.value.code is FileErrorCode.JSON_INVALID


def test_time_order_is_checked_against_the_last_accepted_row(store: MarketDataStore) -> None:
    entries = [
        candle_entry(utc(2024, 1, 2, 10, 5)),
        candle_entry(utc(2024, 1, 2, 10, 5)),  # same moment
        candle_entry(utc(2024, 1, 2, 10, 3)),  # earlier
        candle_entry(utc(2024, 1, 2, 10, 6)),
    ]
    result = store.import_json(to_bytes(candle_document(entries)))
    assert [(row.row, row.reason) for row in result.rejected] == [
        (2, RejectReason.TIME_DUPLICATE),
        (3, RejectReason.TIME_NOT_ASCENDING),
    ]
    assert result.accepted == 2


def test_ticks_rows_with_a_fault_are_rejected(store: MarketDataStore) -> None:
    entries = [
        {"time": "2024-01-02T10:00:00.1Z", "bid": 0, "ask": 1.1},
        {"time": "2024-01-02T10:00:00.2Z", "bid": 1.1, "ask": -1.0},
        {"time": "2024-01-02T10:00:00.3Z", "bid": 1.1},
        {"time": "2024-01-02T10:00:00.4Z", "bid": 1.1, "ask": 1.2},
        {"time": "2024-01-02T10:00:00.4Z", "bid": 1.1, "ask": 1.2},
        {"time": "2024-01-02T10:00:00.1Z", "bid": 1.1, "ask": 1.2},
    ]
    result = store.import_json(to_bytes(tick_document(entries)))
    assert [(row.row, row.reason) for row in result.rejected] == [
        (1, RejectReason.PRICE_NOT_POSITIVE),
        (2, RejectReason.PRICE_NOT_POSITIVE),
        (3, RejectReason.FIELD_MISSING),
        (5, RejectReason.TIME_DUPLICATE),
        (6, RejectReason.TIME_NOT_ASCENDING),
    ]
    assert result.accepted == 1


def test_existing_candles_of_the_same_moment_are_replaced(store: MarketDataStore) -> None:
    first = [candle_entry(moment, 1.1) for moment in minutes(START, 3)]
    store.import_json(to_bytes(candle_document(first)))
    second = [candle_entry(moment, 2.2) for moment in minutes(utc(2024, 1, 2, 10, 2), 3)]
    result = store.import_json(to_bytes(candle_document(second)))
    assert (result.accepted, result.replaced) == (3, 1)
    candles = read_all(store)
    assert [candle.time for candle in candles] == minutes(START, 5)
    assert [candle.open for candle in candles] == [1.1, 1.1, 2.2, 2.2, 2.2]


def test_existing_ticks_of_the_same_moment_are_replaced(store: MarketDataStore) -> None:
    store.import_json(
        to_bytes(tick_document([{"time": "2024-01-02T10:00:00.5Z", "bid": 1.0, "ask": 1.1}]))
    )
    result = store.import_json(
        to_bytes(tick_document([{"time": "2024-01-02T10:00:00.5Z", "bid": 2.0, "ask": 2.1}]))
    )
    assert (result.accepted, result.replaced) == (1, 1)
    ticks = store.read_ticks(BROKER, INSTRUMENT, utc(2024, 1, 2), utc(2024, 1, 3)).items
    assert [(tick.bid, tick.ask) for tick in ticks] == [(2.0, 2.1)]


def test_a_database_error_makes_nothing_visible(engine: Engine) -> None:
    store = MarketDataStore(engine, max_page_size=100)
    # more rows than one chunk, so the second insert fails after the first one went through
    entries = [candle_entry(moment) for moment in minutes(START, 1200)]
    counter = {"inserts": 0}

    def fail_on_second_insert(
        _connection: object, _cursor: object, statement: str, *_rest: object
    ) -> None:
        if statement.startswith("INSERT INTO marketdata_candle"):
            counter["inserts"] += 1
            if counter["inserts"] == 2:
                raise OperationalError(statement, {}, Exception("simulated disk failure"))

    event.listen(engine, "before_cursor_execute", fail_on_second_insert)
    try:
        with pytest.raises(MarketDataStoreError):
            store.import_json(to_bytes(candle_document(entries)))
    finally:
        event.remove(engine, "before_cursor_execute", fail_on_second_insert)
    assert counter["inserts"] == 2
    assert read_all(store) == []
    assert store.overview().series == ()
    # the store works afterwards
    assert store.import_json(to_bytes(candle_document(entries[:3]))).accepted == 3


def test_a_database_integrity_error_becomes_a_store_error(engine: Engine) -> None:
    store = MarketDataStore(engine)
    # a violated check constraint of the database (prices must be positive) cannot be reached
    # through the import checks, so the table is dropped to provoke a database error
    with engine.begin() as connection:
        connection.exec_driver_sql("DROP TABLE marketdata_candle")
    with pytest.raises(MarketDataStoreError) as caught:
        store.import_json(to_bytes(candle_document([candle_entry(START)])))
    assert "no such table" not in str(caught.value)


@pytest.mark.parametrize(
    ("document", "code"),
    [
        ([], FileErrorCode.DOCUMENT_INVALID),
        ({"kind": "other"}, FileErrorCode.DOCUMENT_INVALID),
        (candle_document([], version=2), FileErrorCode.DOCUMENT_INVALID),
        (candle_document([], extra=1), FileErrorCode.DOCUMENT_INVALID),
        (candle_document([], broker=5), FileErrorCode.DOCUMENT_INVALID),
        (candle_document([], time_unit="m7"), FileErrorCode.DOCUMENT_INVALID),
        (candle_document([], time_unit="M1"), FileErrorCode.DOCUMENT_INVALID),
        (candle_document([], candles="x"), FileErrorCode.DOCUMENT_INVALID),
        (candle_document([candle_entry(START)], broker=" x"), FileErrorCode.DOCUMENT_INVALID),
        (candle_document([candle_entry(START)], instrument=""), FileErrorCode.DOCUMENT_INVALID),
        (candle_document([candle_entry(START)], instrument="a\nb"), FileErrorCode.DOCUMENT_INVALID),
        (candle_document([candle_entry(START)], broker="x" * 129), FileErrorCode.DOCUMENT_INVALID),
        (candle_document([]), FileErrorCode.NO_ROWS),
        (tick_document([]), FileErrorCode.NO_ROWS),
        (
            candle_document(
                [candle_entry(START)],
                period={"start": "2024-01-02T10:00:00Z", "end": "2024-01-02T10:00:00Z"},
            ),
            FileErrorCode.PERIOD_INVALID,
        ),
        (
            candle_document(
                [candle_entry(START)],
                period={"start": "2024-01-02T10:01:00Z", "end": "2024-01-02T11:00:00Z"},
            ),
            FileErrorCode.PERIOD_INVALID,
        ),
        (
            candle_document(
                [candle_entry(START)],
                period={"start": "2024-01-02T10:00:00Z", "end": "2024-01-02T10:00:30Z"},
            ),
            FileErrorCode.PERIOD_INVALID,
        ),
        (
            tick_document(
                [{"time": "2024-01-02T10:00:00Z", "bid": 1.0, "ask": 1.0}],
                period={"start": "2024-01-02T10:00:00Z", "end": "2024-01-02T10:00:00Z"},
            ),
            FileErrorCode.PERIOD_INVALID,
        ),
        (
            candle_document(
                [candle_entry(START)],
                trading_hours=[{"weekday": "monday", "from": "10:00", "to": "10:00"}],
            ),
            FileErrorCode.DOCUMENT_INVALID,
        ),
        (
            candle_document(
                [candle_entry(START)],
                trading_hours=[{"weekday": "monday", "from": "22:00", "to": "02:00"}],
            ),
            FileErrorCode.DOCUMENT_INVALID,
        ),
        (
            candle_document(
                [candle_entry(START)],
                trading_hours=[{"weekday": "someday", "from": "00:00", "to": "24:00"}],
            ),
            FileErrorCode.DOCUMENT_INVALID,
        ),
    ],
)
def test_files_that_are_refused(store: MarketDataStore, document: Any, code: FileErrorCode) -> None:
    with pytest.raises(ImportFileError) as caught:
        store.import_json(to_bytes(document))
    assert caught.value.code is code
    assert store.overview().series == ()


@pytest.mark.parametrize(
    "data",
    [b"", b"{", b"not json", b'{"a": 1} trailing', b"[" * 100_000],
)
def test_invalid_json_is_refused(store: MarketDataStore, data: bytes) -> None:
    with pytest.raises(ImportFileError) as caught:
        store.import_json(data)
    assert caught.value.code is FileErrorCode.JSON_INVALID


def test_file_that_cannot_be_decoded(store: MarketDataStore) -> None:
    for data in (b"\xff\xfe\x00\xd8", b"{\x00}", b'{"a": "\xc3\x28"}'):
        with pytest.raises(ImportFileError) as caught:
            store.import_json(data)
        assert caught.value.code is FileErrorCode.NOT_DECODABLE


def test_instrument_with_a_fault_is_refused(store: MarketDataStore) -> None:
    document = json.loads((EXAMPLE_DIRECTORY / "instrument.json").read_text())
    for change in (
        {"tick_size": 0},
        {"spread": -1},
        {"swap_triple_weekday": "mon"},
        {"extra": 1},
        {"acquired_at": "2024-02-31T00:00:00Z"},
    ):
        with pytest.raises(ImportFileError) as caught:
            store.import_json(to_bytes({**document, **change}))
        assert caught.value.code in (FileErrorCode.DOCUMENT_INVALID,)
    assert store.instrument_info(document["broker"], document["instrument"]) is None


def test_limits_size_and_rows(store: MarketDataStore) -> None:
    entries = [candle_entry(moment) for moment in minutes(START, 10)]
    data = to_bytes(candle_document(entries))
    with pytest.raises(ImportFileError) as caught:
        store.import_json(data, ImportLimits(max_bytes=len(data) - 1))
    assert caught.value.code is FileErrorCode.TOO_LARGE
    with pytest.raises(ImportFileError) as caught:
        store.import_json(data, ImportLimits(max_rows=9))
    assert caught.value.code is FileErrorCode.TOO_MANY_ROWS
    assert store.import_json(data, ImportLimits(max_bytes=len(data), max_rows=10)).accepted == 10


def test_rejections_are_counted_but_listed_only_up_to_the_limit(store: MarketDataStore) -> None:
    entries = [candle_entry(START, open=-1.0) for _ in range(7)]
    result = store.import_json(
        to_bytes(candle_document([*entries, candle_entry(START)])),
        ImportLimits(max_reported_rejections=3),
    )
    assert result.rejected_count == 7
    assert [row.row for row in result.rejected] == [1, 2, 3]
    assert result.accepted == 1


def test_default_limits() -> None:
    limits = ImportLimits()
    assert (limits.max_bytes, limits.max_rows, limits.max_reported_rejections) == (
        32 * 1024 * 1024,
        500_000,
        1000,
    )
    with pytest.raises(ValueError, match="limits"):
        ImportLimits(max_rows=0)


def test_trading_hours_replace_the_stored_ones(store: MarketDataStore) -> None:
    monday = [{"weekday": "monday", "from": "00:00", "to": "24:00"}]
    store.import_json(to_bytes(candle_document([candle_entry(START)], trading_hours=monday)))
    assert [
        (s.weekday, s.start_minute, s.end_minute)
        for s in store.trading_hours(BROKER, INSTRUMENT, "m1")
    ] == [(Weekday.MONDAY, 0, 1440)]
    friday = [{"weekday": "friday", "from": "01:30", "to": "22:00"}]
    store.import_json(
        to_bytes(candle_document([candle_entry(utc(2024, 1, 2, 10, 1))], trading_hours=friday))
    )
    assert [
        (s.weekday, s.start_minute, s.end_minute)
        for s in store.trading_hours(BROKER, INSTRUMENT, "m1")
    ] == [(Weekday.FRIDAY, 90, 1320)]
    # a file without trading hours leaves them as they are
    store.import_json(to_bytes(candle_document([candle_entry(utc(2024, 1, 2, 10, 2))])))
    assert len(store.trading_hours(BROKER, INSTRUMENT, "m1")) == 1
    # an empty list removes them
    store.import_json(
        to_bytes(candle_document([candle_entry(utc(2024, 1, 2, 10, 3))], trading_hours=[]))
    )
    assert store.trading_hours(BROKER, INSTRUMENT, "m1") == []


def test_several_series_next_to_each_other(store: MarketDataStore) -> None:
    store.import_json(to_bytes(candle_document([candle_entry(START, 1.0)])))
    store.import_json(to_bytes(candle_document([candle_entry(START, 2.0)], time_unit="h1")))
    store.import_json(to_bytes(candle_document([candle_entry(START, 3.0)], instrument="GBPUSD")))
    store.import_json(to_bytes(candle_document([candle_entry(START, 4.0)], broker="Other")))
    store.import_json(to_bytes(tick_document([{"time": iso(START), "bid": 5.0, "ask": 5.1}])))
    window = (utc(2024, 1, 2), utc(2024, 1, 3))
    assert store.read_candles(BROKER, "EURUSD", "m1", *window).items[0].open == 1.0
    assert store.read_candles(BROKER, "EURUSD", "h1", *window).items[0].open == 2.0
    assert store.read_candles(BROKER, "GBPUSD", "m1", *window).items[0].open == 3.0
    assert store.read_candles("Other", "EURUSD", "m1", *window).items[0].open == 4.0
    assert store.read_ticks(BROKER, "EURUSD", *window).items[0].bid == 5.0
    overview = store.overview()
    assert len(overview.series) == 5
    assert {(row.broker, row.instrument, row.unit) for row in overview.series} == {
        (BROKER, "EURUSD", "m1"),
        (BROKER, "EURUSD", "h1"),
        (BROKER, "GBPUSD", "m1"),
        ("Other", "EURUSD", "m1"),
        (BROKER, "EURUSD", "ticks"),
    }


@pytest.mark.parametrize("field", ["volume", "spread"])
def test_integer_field_at_the_limit_is_taken_over(store: MarketDataStore, field: str) -> None:
    entry = candle_entry(START, **{field: MAX_INTEGER_VALUE})
    result = store.import_json(to_bytes(candle_document([entry])))
    assert (result.accepted, result.rejected_count) == (1, 0)
    assert getattr(read_all(store)[0], field) == MAX_INTEGER_VALUE


@pytest.mark.parametrize("field", ["volume", "spread"])
@pytest.mark.parametrize("value", [MAX_INTEGER_VALUE + 1, 2**63, 10**30, 10**400])
def test_integer_field_above_the_limit_is_rejected(
    store: MarketDataStore, field: str, value: int
) -> None:
    good = candle_entry(utc(2024, 1, 2, 11))
    bad = candle_entry(START, **{field: value})
    result = store.import_json(to_bytes(candle_document([bad, good])))
    assert result.accepted == 1
    assert [(row.row, row.reason) for row in result.rejected] == [(1, RejectReason.VALUE_INVALID)]
    assert [item.time for item in read_all(store)] == [utc(2024, 1, 2, 11)]


@pytest.mark.parametrize("value", [1.7e308, 1e308, 10**30, 10**400, -(10**400), 2**63])
@pytest.mark.parametrize("field", ["open", "high", "low", "close"])
def test_extreme_candle_price_never_raises(store: MarketDataStore, field: str, value: Any) -> None:
    entry = candle_entry(START, **{field: value})
    result = store.import_json(to_bytes(candle_document([entry])))
    assert result.accepted + result.rejected_count == 1


@pytest.mark.parametrize("value", [1.7e308, 1e308, 10**30, 10**400, -(10**400), 2**63])
@pytest.mark.parametrize("field", ["bid", "ask"])
def test_extreme_tick_price_never_raises(store: MarketDataStore, field: str, value: Any) -> None:
    entry = {"time": iso(START), "bid": 1.0, "ask": 1.1, field: value}
    result = store.import_json(to_bytes(tick_document([entry])))
    assert result.accepted + result.rejected_count == 1


INSTRUMENT_NUMBERS = [
    "tick_size",
    "tick_value",
    "point",
    "pip",
    "spread",
    "min_volume",
    "volume_step",
    "contract_size",
    "swap_long",
    "swap_short",
    "margin_per_lot",
]


@pytest.mark.parametrize("value", ["1.7e308", "-1.7e308", "1e999", str(10**30), str(10**400)])
@pytest.mark.parametrize("field", INSTRUMENT_NUMBERS)
def test_extreme_instrument_number_never_raises(
    store: MarketDataStore, field: str, value: str
) -> None:
    document = json.loads((EXAMPLE_DIRECTORY / "instrument.json").read_text(encoding="utf-8"))
    document[field] = 0
    text = json.dumps(document).replace(f'"{field}": 0', f'"{field}": {value}')
    try:
        result = store.import_json(text.encode("utf-8"))
    except ImportFileError as error:
        assert error.code is FileErrorCode.DOCUMENT_INVALID
    else:
        assert result.accepted == 1
