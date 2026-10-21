"""Import of CSV files of MetaTrader 5: both candle variants, ticks, time zones, rejections."""

from datetime import datetime
from zoneinfo import ZoneInfo

import pytest

from pipwerk_marketdata import (
    FileErrorCode,
    ImportFileError,
    ImportLimits,
    ImportResult,
    MarketDataStore,
    RejectReason,
)
from pipwerk_marketdata.csvimport import local_to_utc
from tests.helpers import BROKER, INSTRUMENT, minutes, utc

SEPARATE_HEADER = "<DATE>\t<TIME>\t<OPEN>\t<HIGH>\t<LOW>\t<CLOSE>\t<TICKVOL>\t<VOL>\t<SPREAD>"
COMBINED_HEADER = "<TIME>\t<OPEN>\t<HIGH>\t<LOW>\t<CLOSE>\t<TICKVOL>\t<VOL>\t<SPREAD>"
TICK_HEADER = "<DATE>\t<TIME>\t<BID>\t<ASK>\t<LAST>\t<VOLUME>\t<FLAGS>"

ATHENS = "Europe/Athens"


def csv(header: str, *rows: str, delimiter: str = "\t") -> bytes:
    text = "\r\n".join([header, *rows]) + "\r\n"
    if delimiter != "\t":
        text = text.replace("\t", delimiter)
    return text.encode("utf-8")


def candle_row(
    date: str = "2024.01.02", clock: str = "10:00:00", prices: str = "1.10\t1.12\t1.09\t1.11"
) -> str:
    return f"{date}\t{clock}\t{prices}\t50\t0\t7"


def import_candles(
    store: MarketDataStore,
    data: bytes,
    timezone: str = "UTC",
    limits: ImportLimits | None = None,
) -> ImportResult:
    return store.import_csv(
        data,
        kind="candles",
        broker=BROKER,
        instrument=INSTRUMENT,
        time_unit="m1",
        timezone=timezone,
        limits=limits,
    )


def stored(store: MarketDataStore) -> list[datetime]:
    page = store.read_candles(BROKER, INSTRUMENT, "m1", utc(2000, 1, 1), utc(2100, 1, 1))
    return [candle.time for candle in page.items]


def test_separate_date_and_time(store: MarketDataStore) -> None:
    data = csv(
        SEPARATE_HEADER,
        candle_row(clock="10:00:00"),
        candle_row(clock="10:01:00", prices="1.11\t1.13\t1.10\t1.12"),
    )
    result = import_candles(store, data)
    assert (result.accepted, result.rejected_count) == (2, 0)
    page = store.read_candles(BROKER, INSTRUMENT, "m1", utc(2024, 1, 2), utc(2024, 1, 3))
    assert [candle.time for candle in page.items] == minutes(utc(2024, 1, 2, 10), 2)
    first = page.items[0]
    assert (first.open, first.high, first.low, first.close) == (1.10, 1.12, 1.09, 1.11)
    assert (first.volume, first.spread) == (50, 7)


def test_one_time_field(store: MarketDataStore) -> None:
    data = csv(
        COMBINED_HEADER,
        "2024.01.02 10:00:00\t1.10\t1.12\t1.09\t1.11\t50\t0\t7",
        "2024.01.02 10:01:00\t1.11\t1.13\t1.10\t1.12\t51\t0\t8",
    )
    result = import_candles(store, data)
    assert result.accepted == 2
    assert stored(store) == minutes(utc(2024, 1, 2, 10), 2)


def test_both_variants_give_the_same_candles(store: MarketDataStore) -> None:
    separate = csv(SEPARATE_HEADER, candle_row())
    combined = csv(COMBINED_HEADER, "2024.01.02 10:00:00\t1.10\t1.12\t1.09\t1.11\t50\t0\t7")
    import_candles(store, separate)
    first = store.read_candles(BROKER, INSTRUMENT, "m1", utc(2024, 1, 1), utc(2024, 2, 1)).items
    replaced = import_candles(store, combined)
    second = store.read_candles(BROKER, INSTRUMENT, "m1", utc(2024, 1, 1), utc(2024, 2, 1)).items
    assert replaced.replaced == 1
    assert first == second


def test_date_only_for_daily_candles_and_other_header_spellings(store: MarketDataStore) -> None:
    data = csv(
        "Date;Open;High;Low;Close;Tick Volume;Volume;Spread",
        "2024-01-02;1.1;1.2;1.0;1.15;1000;0;12",
        "2024-01-03;1.15;1.2;1.1;1.18;900;0;12",
        delimiter=";",
    )
    result = store.import_csv(
        data,
        kind="candles",
        broker=BROKER,
        instrument=INSTRUMENT,
        time_unit="d1",
        timezone="UTC",
    )
    assert result.accepted == 2
    page = store.read_candles(BROKER, INSTRUMENT, "d1", utc(2024, 1, 1), utc(2024, 2, 1))
    assert [candle.time for candle in page.items] == [utc(2024, 1, 2), utc(2024, 1, 3)]


def test_comma_delimiter_and_missing_optional_columns(store: MarketDataStore) -> None:
    data = csv(
        "time,open,high,low,close",
        "2024.01.02 10:00,1.1,1.2,1.0,1.15",
        delimiter=",",
    )
    result = import_candles(store, data)
    assert result.accepted == 1
    candle = store.read_candles(BROKER, INSTRUMENT, "m1", utc(2024, 1, 1), utc(2024, 2, 1)).items[0]
    assert (candle.volume, candle.spread) == (None, None)


def test_volume_column_is_used_when_there_is_no_tick_volume(store: MarketDataStore) -> None:
    data = csv(
        "<DATE>\t<TIME>\t<OPEN>\t<HIGH>\t<LOW>\t<CLOSE>\t<VOL>",
        "2024.01.02\t10:00:00\t1.1\t1.2\t1.0\t1.15\t33",
    )
    import_candles(store, data)
    candle = store.read_candles(BROKER, INSTRUMENT, "m1", utc(2024, 1, 1), utc(2024, 2, 1)).items[0]
    assert candle.volume == 33


@pytest.mark.parametrize("encoding", ["utf-8", "utf-8-sig", "utf-16"])
def test_encodings_with_and_without_byte_order_mark(store: MarketDataStore, encoding: str) -> None:
    text = SEPARATE_HEADER + "\r\n" + candle_row() + "\r\n"
    result = import_candles(store, text.encode(encoding))
    assert result.accepted == 1


def test_ticks_with_milliseconds_and_empty_last_columns(store: MarketDataStore) -> None:
    data = csv(
        TICK_HEADER,
        "2024.01.02\t10:00:00.120\t1.09512\t1.09520\t\t\t6",
        "2024.01.02\t10:00:00.121\t1.09513\t1.09521\t\t\t6",
        "2024.01.02\t10:00:01.005\t1.09510\t1.09519\t\t\t6",
    )
    result = store.import_csv(
        data, kind="ticks", broker=BROKER, instrument=INSTRUMENT, timezone="UTC"
    )
    assert (result.accepted, result.kind, result.unit) == (3, "ticks", None)
    ticks = store.read_ticks(BROKER, INSTRUMENT, utc(2024, 1, 2), utc(2024, 1, 3)).items
    assert [tick.time.microsecond for tick in ticks] == [120_000, 121_000, 5_000]
    assert (ticks[0].bid, ticks[0].ask) == (1.09512, 1.09520)


def test_ticks_with_empty_bid_or_ask_are_rejected(store: MarketDataStore) -> None:
    data = csv(
        TICK_HEADER,
        "2024.01.02\t10:00:00.120\t\t1.09520\t\t\t6",
        "2024.01.02\t10:00:00.121\t1.09513\t\t\t\t6",
        "2024.01.02\t10:00:00.122\t1.09513\t1.09514\t\t\t6",
    )
    result = store.import_csv(
        data, kind="ticks", broker=BROKER, instrument=INSTRUMENT, timezone="UTC"
    )
    assert [(row.row, row.reason) for row in result.rejected] == [
        (2, RejectReason.FIELD_MISSING),
        (3, RejectReason.FIELD_MISSING),
    ]
    assert result.accepted == 1


def test_server_time_is_converted_to_utc(store: MarketDataStore) -> None:
    winter = csv(SEPARATE_HEADER, candle_row(date="2024.01.02", clock="10:00:00"))
    summer = csv(SEPARATE_HEADER, candle_row(date="2024.07.02", clock="10:00:00"))
    import_candles(store, winter, ATHENS)
    import_candles(store, summer, ATHENS)
    assert stored(store) == [utc(2024, 1, 2, 8), utc(2024, 7, 2, 7)]


def test_clock_set_forward_makes_missing_local_times_a_rejected_row(
    store: MarketDataStore,
) -> None:
    # Europe/Athens, 2024-03-31: 03:00 jumps to 04:00 (UTC+2 to UTC+3)
    data = csv(
        SEPARATE_HEADER,
        candle_row(date="2024.03.31", clock="02:58:00"),
        candle_row(date="2024.03.31", clock="02:59:00"),
        candle_row(date="2024.03.31", clock="03:00:00"),
        candle_row(date="2024.03.31", clock="03:30:00"),
        candle_row(date="2024.03.31", clock="03:59:00"),
        candle_row(date="2024.03.31", clock="04:00:00"),
    )
    result = import_candles(store, data, ATHENS)
    assert [(row.row, row.reason) for row in result.rejected] == [
        (4, RejectReason.LOCAL_TIME_NOT_EXISTING),
        (5, RejectReason.LOCAL_TIME_NOT_EXISTING),
        (6, RejectReason.LOCAL_TIME_NOT_EXISTING),
    ]
    # the candles before and after the jump follow each other without a hole
    assert stored(store) == [
        utc(2024, 3, 31, 0, 58),
        utc(2024, 3, 31, 0, 59),
        utc(2024, 3, 31, 1, 0),
    ]


def test_clock_set_back_makes_a_doubled_local_time_the_earlier_one(store: MarketDataStore) -> None:
    # Europe/Athens, 2024-10-27: 04:00 (UTC+3) goes back to 03:00 (UTC+2); 03:00-03:59 occurs twice
    data = csv(
        SEPARATE_HEADER,
        candle_row(date="2024.10.27", clock="03:58:00"),
        candle_row(date="2024.10.27", clock="03:59:00"),
        candle_row(date="2024.10.27", clock="03:00:00"),
        candle_row(date="2024.10.27", clock="03:59:00"),
        candle_row(date="2024.10.27", clock="04:00:00"),
    )
    result = import_candles(store, data, ATHENS)
    # the second pass of the doubled hour is read as the first one: earlier or equal moments
    assert [(row.row, row.reason) for row in result.rejected] == [
        (4, RejectReason.TIME_NOT_ASCENDING),
        (5, RejectReason.TIME_DUPLICATE),
    ]
    assert stored(store) == [
        utc(2024, 10, 27, 0, 58),
        utc(2024, 10, 27, 0, 59),
        utc(2024, 10, 27, 2, 0),
    ]


def test_conversion_function_directly() -> None:
    athens = ZoneInfo(ATHENS)
    assert local_to_utc(datetime(2024, 3, 31, 3, 30), athens) is None
    assert local_to_utc(datetime(2024, 3, 31, 2, 59), athens) == utc(2024, 3, 31, 0, 59)
    assert local_to_utc(datetime(2024, 3, 31, 4, 0), athens) == utc(2024, 3, 31, 1, 0)
    assert local_to_utc(datetime(2024, 10, 27, 3, 30), athens) == utc(2024, 10, 27, 0, 30)
    assert local_to_utc(datetime(2024, 10, 27, 4, 0), athens) == utc(2024, 10, 27, 2, 0)
    new_york = ZoneInfo("America/New_York")
    assert local_to_utc(datetime(2024, 11, 3, 1, 30), new_york) == utc(2024, 11, 3, 5, 30)
    assert local_to_utc(datetime(2024, 3, 10, 2, 30), new_york) is None
    assert local_to_utc(datetime(2024, 1, 15, 12, 0), ZoneInfo("Asia/Kolkata")) == utc(
        2024, 1, 15, 6, 30
    )


@pytest.mark.parametrize(
    ("row", "reason"),
    [
        ("2024.01.02\t10:00:00\t1.1\t1.2\t1.0", RejectReason.COLUMNS_MISMATCH),
        ("2024.01.02\t10:00:00\t\t1.2\t1.0\t1.1\t5\t0\t1", RejectReason.FIELD_MISSING),
        ("2024.01.02\t10:00:00\tabc\t1.2\t1.0\t1.1\t5\t0\t1", RejectReason.VALUE_INVALID),
        ("2024.01.02\t10:00:00\t1,1\t1.2\t1.0\t1.1\t5\t0\t1", RejectReason.VALUE_INVALID),
        ("2024.01.02\t10:00:00\tnan\t1.2\t1.0\t1.1\t5\t0\t1", RejectReason.VALUE_INVALID),
        ("2024.01.02\t10:00:00\t1e999\t1.2\t1.0\t1.1\t5\t0\t1", RejectReason.VALUE_INVALID),
        ("2024.01.02\t10:00:00\t0\t1.2\t1.0\t1.1\t5\t0\t1", RejectReason.PRICE_NOT_POSITIVE),
        ("2024.01.02\t10:00:00\t1.1\t1.2\t-1\t1.1\t5\t0\t1", RejectReason.PRICE_NOT_POSITIVE),
        ("2024.01.02\t10:00:00\t1.1\t1.2\t1.0\t1.1\tx\t0\t1", RejectReason.VALUE_INVALID),
        ("2024.01.02\t10:00:00\t1.1\t1.2\t1.0\t1.1\t5\t0\t-1", RejectReason.VALUE_INVALID),
        ("2024.01.02\t10:00:00\t1.1\t1.2\t1.0\t1.1\t5\t0\t1.5", RejectReason.VALUE_INVALID),
        ("2024.13.02\t10:00:00\t1.1\t1.2\t1.0\t1.1\t5\t0\t1", RejectReason.TIME_INVALID),
        ("2024.01.02\t25:00:00\t1.1\t1.2\t1.0\t1.1\t5\t0\t1", RejectReason.TIME_INVALID),
        ("02.01.2024\t10:00:00\t1.1\t1.2\t1.0\t1.1\t5\t0\t1", RejectReason.TIME_INVALID),
        ("\t\t1.1\t1.2\t1.0\t1.1\t5\t0\t1", RejectReason.TIME_INVALID),
        ("2024.01.02\t10:00:00\t1.3\t1.2\t1.0\t1.1\t5\t0\t1", RejectReason.HIGH_BELOW_OPEN),
        ("2024.01.02\t10:00:00\t1.0\t1.0\t1.1\t1.0\t5\t0\t1", RejectReason.HIGH_BELOW_LOW),
        ("2024.01.02\t10:00:00\t1.0\t1.1\t0.9\t1.2\t5\t0\t1", RejectReason.HIGH_BELOW_CLOSE),
        ("2024.01.02\t10:00:00\t1.1\t1.3\t1.2\t1.25\t5\t0\t1", RejectReason.LOW_ABOVE_OPEN),
        ("2024.01.02\t10:00:00\t1.1\t1.3\t1.05\t1.0\t5\t0\t1", RejectReason.LOW_ABOVE_CLOSE),
    ],
)
def test_candle_rows_with_a_fault_are_rejected_with_their_line_number(
    store: MarketDataStore, row: str, reason: RejectReason
) -> None:
    data = csv(SEPARATE_HEADER, candle_row(clock="09:00:00"), row, candle_row(clock="11:00:00"))
    result = import_candles(store, data)
    assert [(item.row, item.reason) for item in result.rejected] == [(3, reason)]
    assert result.accepted == 2
    assert stored(store) == [utc(2024, 1, 2, 9), utc(2024, 1, 2, 11)]


def test_time_order_in_csv(store: MarketDataStore) -> None:
    data = csv(
        SEPARATE_HEADER,
        candle_row(clock="10:05:00"),
        candle_row(clock="10:05:00"),
        candle_row(clock="10:04:00"),
        "",
        candle_row(clock="10:06:00"),
    )
    result = import_candles(store, data)
    assert [(row.row, row.reason) for row in result.rejected] == [
        (3, RejectReason.TIME_DUPLICATE),
        (4, RejectReason.TIME_NOT_ASCENDING),
    ]
    assert result.accepted == 2


def test_replace_in_csv_and_period_of_the_result(store: MarketDataStore) -> None:
    import_candles(
        store, csv(SEPARATE_HEADER, candle_row(clock="10:00:00"), candle_row(clock="10:01:00"))
    )
    result = import_candles(
        store,
        csv(
            SEPARATE_HEADER,
            candle_row(clock="10:01:00", prices="2.0\t2.2\t1.9\t2.1"),
            candle_row(clock="10:02:00"),
        ),
    )
    assert (result.accepted, result.replaced) == (2, 1)
    assert (result.period_start, result.period_end) == (
        utc(2024, 1, 2, 10, 1),
        utc(2024, 1, 2, 10, 2),
    )
    page = store.read_candles(BROKER, INSTRUMENT, "m1", utc(2024, 1, 2), utc(2024, 1, 3))
    assert [candle.open for candle in page.items] == [1.10, 2.0, 1.10]


@pytest.mark.parametrize(
    "header",
    [
        "<DATE>\t<TIME>\t<OPEN>\t<HIGH>\t<LOW>",
        "<DATE>\t<TIME>\t<OPEN>\t<HIGH>\t<LOW>\t<CLOSE>\t<OPEN>",
        "<OPEN>\t<HIGH>\t<LOW>\t<CLOSE>",
        "<DATE>\t<TIME>\t<BID>\t<ASK>",
        "just one column",
    ],
)
def test_headers_that_are_refused(store: MarketDataStore, header: str) -> None:
    with pytest.raises(ImportFileError) as caught:
        import_candles(store, csv(header, "1\t2\t3\t4\t5\t6\t7"))
    assert caught.value.code is FileErrorCode.HEADER_INVALID
    assert stored(store) == []


@pytest.mark.parametrize(
    ("data", "code"),
    [
        (b"", FileErrorCode.NO_ROWS),
        (b"\r\n\r\n", FileErrorCode.NO_ROWS),
        (csv(SEPARATE_HEADER).rstrip(), FileErrorCode.NO_ROWS),
        (b"\xff\xff\xff", FileErrorCode.NOT_DECODABLE),
    ],
)
def test_files_that_are_refused(store: MarketDataStore, data: bytes, code: FileErrorCode) -> None:
    with pytest.raises(ImportFileError) as caught:
        import_candles(store, data)
    assert caught.value.code is code


@pytest.mark.parametrize(
    "zone", ["Europe/Nowhere", "", "../etc/passwd", "EST5EDT/x", "/usr/share/zoneinfo/UTC"]
)
def test_unknown_time_zone(store: MarketDataStore, zone: str) -> None:
    with pytest.raises(ImportFileError) as caught:
        import_candles(store, csv(SEPARATE_HEADER, candle_row()), zone)
    assert caught.value.code is FileErrorCode.TIMEZONE_UNKNOWN


@pytest.mark.parametrize(
    "arguments",
    [
        {"time_unit": None},
        {"time_unit": "m7"},
        {"time_unit": "M1"},
        {"broker": ""},
        {"broker": " x"},
        {"instrument": "a\tb"},
        {"instrument": "x" * 129},
        {"kind": "instrument"},
    ],
)
def test_series_arguments_that_are_refused(
    store: MarketDataStore, arguments: dict[str, object]
) -> None:
    values: dict[str, object] = {
        "kind": "candles",
        "broker": BROKER,
        "instrument": INSTRUMENT,
        "time_unit": "m1",
        "timezone": "UTC",
    }
    values.update(arguments)
    with pytest.raises(ImportFileError) as caught:
        store.import_csv(csv(SEPARATE_HEADER, candle_row()), **values)  # type: ignore[arg-type]
    assert caught.value.code is FileErrorCode.SERIES_INVALID


def test_limits(store: MarketDataStore) -> None:
    rows = [candle_row(clock=f"10:{minute:02d}:00") for minute in range(10)]
    data = csv(SEPARATE_HEADER, *rows)
    with pytest.raises(ImportFileError) as caught:
        import_candles(store, data, limits=ImportLimits(max_bytes=len(data) - 1))
    assert caught.value.code is FileErrorCode.TOO_LARGE
    with pytest.raises(ImportFileError) as caught:
        import_candles(store, data, limits=ImportLimits(max_rows=9))
    assert caught.value.code is FileErrorCode.TOO_MANY_ROWS
    assert import_candles(store, data, limits=ImportLimits(max_rows=10)).accepted == 10


def test_rejections_listed_up_to_the_limit(store: MarketDataStore) -> None:
    rows = [candle_row(prices="0\t1\t1\t1")] * 6 + [candle_row()]
    result = import_candles(
        store, csv(SEPARATE_HEADER, *rows), limits=ImportLimits(max_reported_rejections=2)
    )
    assert result.rejected_count == 6
    assert [row.row for row in result.rejected] == [2, 3]
