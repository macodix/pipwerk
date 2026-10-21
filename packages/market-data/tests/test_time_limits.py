"""Moments at the edge of the supported range never raise ``OverflowError`` (order 08)."""

from datetime import UTC, datetime, timedelta, timezone

import pytest

from pipwerk_marketdata import MarketDataStore, RejectReason
from pipwerk_marketdata.errors import ImportFileError
from pipwerk_marketdata.limits import MAX_MOMENT, MIN_MOMENT
from pipwerk_marketdata.timeunits import TIME_UNITS, require_utc
from tests.helpers import (
    BROKER,
    INSTRUMENT,
    candle_document,
    candle_entry,
    tick_document,
    to_bytes,
    utc,
)

CANDLE_HEADER = "<DATE>\t<TIME>\t<OPEN>\t<HIGH>\t<LOW>\t<CLOSE>\t<TICKVOL>\t<VOL>\t<SPREAD>"
TICK_HEADER = "<DATE>\t<TIME>\t<BID>\t<ASK>"

LAST_YEAR = "9999-12-31T23:59:59Z"
FIRST_YEAR = "0001-01-01T00:00:00Z"
OUT_OF_RANGE = [
    FIRST_YEAR,
    "1969-12-31T23:59:59Z",
    "2100-01-01T00:00:00Z",
    "2100-01-01T00:00:00.000001Z",
    LAST_YEAR,
    "9999-12-31T23:59:59.999999Z",
]
LAST_ACCEPTED = utc(2099, 12, 31, 23, 59, 59, 999999)


def candle_json(times: list[str]) -> dict[str, object]:
    return candle_document([{**candle_entry(utc(2024)), "time": text} for text in times])


def tick_json(times: list[str]) -> dict[str, object]:
    return tick_document([{"time": text, "bid": 1.1, "ask": 1.2} for text in times])


@pytest.mark.parametrize("text", OUT_OF_RANGE)
def test_json_candle_out_of_range_is_rejected_and_the_next_row_is_kept(
    store: MarketDataStore, text: str
) -> None:
    result = store.import_json(to_bytes(candle_json([text, "2024-01-02T00:00:00Z"])))
    assert result.accepted == 1
    assert [(row.row, row.reason) for row in result.rejected] == [
        (1, RejectReason.TIME_OUT_OF_RANGE)
    ]


@pytest.mark.parametrize("text", OUT_OF_RANGE)
def test_json_tick_out_of_range_is_rejected_and_the_next_row_is_kept(
    store: MarketDataStore, text: str
) -> None:
    result = store.import_json(to_bytes(tick_json([text, "2024-01-02T00:00:00Z"])))
    assert result.accepted == 1
    assert [(row.row, row.reason) for row in result.rejected] == [
        (1, RejectReason.TIME_OUT_OF_RANGE)
    ]


@pytest.mark.parametrize("unit", sorted(TIME_UNITS))
def test_json_candle_at_the_upper_edge_is_taken_over_for_every_time_unit(
    store: MarketDataStore, unit: str
) -> None:
    document = candle_json(["1970-01-01T00:00:00Z", "2099-12-31T23:59:59.999999Z"])
    document["time_unit"] = unit
    result = store.import_json(to_bytes(document))
    assert (result.accepted, result.rejected_count) == (2, 0)
    page = store.read_candles(BROKER, INSTRUMENT, unit, MIN_MOMENT, MAX_MOMENT)
    assert [item.time for item in page.items] == [MIN_MOMENT, LAST_ACCEPTED]
    completeness = store.completeness(BROKER, INSTRUMENT, unit, MIN_MOMENT, MAX_MOMENT)
    assert completeness.start == MIN_MOMENT
    assert store.overview().series[0].covered[0].end <= MAX_MOMENT


def test_json_tick_at_the_edges_is_taken_over_and_checked(store: MarketDataStore) -> None:
    result = store.import_json(
        to_bytes(tick_json(["1970-01-01T00:00:00Z", "2099-12-31T23:59:59.999999Z"]))
    )
    assert (result.accepted, result.rejected_count) == (2, 0)
    page = store.read_ticks(BROKER, INSTRUMENT, MIN_MOMENT, MAX_MOMENT)
    assert [item.time for item in page.items] == [MIN_MOMENT, LAST_ACCEPTED]
    store.completeness(BROKER, INSTRUMENT, "ticks", utc(2099, 12, 25), MAX_MOMENT)
    overview = store.overview()
    assert overview.series[0].covered[0].end == MAX_MOMENT


def test_json_period_with_edge_times(store: MarketDataStore) -> None:
    period = {"start": "1970-01-01T00:00:00Z", "end": "2100-01-01T00:00:00Z"}
    document = candle_json(["2099-12-31T23:59:59Z"])
    document["period"] = period
    document["time_unit"] = "w1"
    assert store.import_json(to_bytes(document)).accepted == 1


@pytest.mark.parametrize(
    "period",
    [
        {"start": FIRST_YEAR, "end": "2024-01-01T00:00:00Z"},
        {"start": "2024-01-01T00:00:00Z", "end": LAST_YEAR},
        {"start": "2024-01-01T00:00:00Z", "end": "2100-01-01T00:00:00.000001Z"},
    ],
)
def test_json_period_out_of_range_refuses_the_file(
    store: MarketDataStore, period: dict[str, str]
) -> None:
    document = candle_json(["2024-01-02T00:00:00Z"])
    document["period"] = period
    with pytest.raises(ImportFileError) as caught:
        store.import_json(to_bytes(document))
    assert caught.value.code == "period_invalid"


@pytest.mark.parametrize("text", [FIRST_YEAR, LAST_YEAR, "2100-01-01T00:00:00Z"])
def test_json_instrument_time_out_of_range_refuses_the_file(
    store: MarketDataStore, text: str
) -> None:
    document = {
        "version": 1,
        "kind": "instrument",
        "broker": BROKER,
        "instrument": INSTRUMENT,
        "acquired_at": text,
        "tick_size": 0.00001,
        "tick_value": 1.0,
        "tick_value_currency": "USD",
        "point": 0.00001,
        "pip": 0.0001,
        "spread": 0.0001,
        "min_volume": 0.01,
        "volume_step": 0.01,
        "contract_size": 100000,
        "swap_long": -1.0,
        "swap_short": 0.5,
        "swap_triple_weekday": "wednesday",
    }
    with pytest.raises(ImportFileError) as caught:
        store.import_json(to_bytes(document))
    assert caught.value.code == "document_invalid"
    assert store.instrument_info(BROKER, INSTRUMENT, datetime.max.replace(tzinfo=UTC)) is None


def csv_bytes(header: str, *rows: str) -> bytes:
    return ("\r\n".join([header, *rows]) + "\r\n").encode("utf-8")


def import_candles(store: MarketDataStore, unit: str, zone: str, *rows: str):  # type: ignore[no-untyped-def]
    return store.import_csv(
        csv_bytes(CANDLE_HEADER, *rows),
        kind="candles",
        broker=BROKER,
        instrument=INSTRUMENT,
        timezone=zone,
        time_unit=unit,
    )


def candle_row(date: str, time: str) -> str:
    return f"{date}\t{time}\t1.1\t1.2\t1.0\t1.15\t10\t0\t5"


CSV_FAR_OUT_OF_RANGE = [("0001.01.01", "00:00:00"), ("9999.12.31", "23:59:59")]
CSV_EDGE_OUT_OF_RANGE = [("1969.12.31", "23:59:59"), ("2100.01.01", "00:00:00")]
ZONES = ["UTC", "Europe/Berlin", "America/New_York", "Pacific/Kiritimati"]
CSV_CASES = [(zone, *case) for zone in ZONES for case in CSV_FAR_OUT_OF_RANGE] + [
    ("UTC", *case) for case in CSV_EDGE_OUT_OF_RANGE
]


@pytest.mark.parametrize(("zone", "date", "time"), CSV_CASES)
def test_csv_candle_out_of_range_is_rejected_and_the_next_row_is_kept(
    store: MarketDataStore, zone: str, date: str, time: str
) -> None:
    result = import_candles(
        store, "h1", zone, candle_row(date, time), candle_row("2024.01.03", "12:00:00")
    )
    assert result.accepted == 1
    assert [(row.row, row.reason) for row in result.rejected] == [
        (2, RejectReason.TIME_OUT_OF_RANGE)
    ]


@pytest.mark.parametrize(("zone", "date", "time"), CSV_CASES)
def test_csv_tick_out_of_range_is_rejected_and_the_next_row_is_kept(
    store: MarketDataStore, zone: str, date: str, time: str
) -> None:
    result = store.import_csv(
        csv_bytes(
            TICK_HEADER, f"{date}\t{time}.123\t1.1\t1.2", "2024.01.03\t12:00:00.123\t1.1\t1.2"
        ),
        kind="ticks",
        broker=BROKER,
        instrument=INSTRUMENT,
        timezone=zone,
    )
    assert result.accepted == 1
    assert [row.reason for row in result.rejected] == [RejectReason.TIME_OUT_OF_RANGE]


@pytest.mark.parametrize("unit", sorted(TIME_UNITS))
def test_csv_candle_at_the_upper_edge_is_taken_over_for_every_time_unit(
    store: MarketDataStore, unit: str
) -> None:
    result = import_candles(
        store,
        unit,
        "UTC",
        candle_row("1970.01.01", "00:00:00"),
        candle_row("2099.12.31", "23:59:59"),
    )
    assert (result.accepted, result.rejected_count) == (2, 0)
    page = store.read_candles(BROKER, INSTRUMENT, unit, MIN_MOMENT, MAX_MOMENT)
    assert len(page.items) == 2
    store.completeness(BROKER, INSTRUMENT, unit, MIN_MOMENT, MAX_MOMENT)
    store.overview()


def test_csv_local_time_is_checked_after_the_conversion(store: MarketDataStore) -> None:
    # 1970-01-01 00:30 in Berlin (UTC+1) is 1969-12-31 23:30 UTC: out of range
    # 2099-12-31 23:30 in New York (UTC-5) is 2100-01-01 04:30 UTC: out of range
    result = import_candles(store, "h1", "Europe/Berlin", candle_row("1970.01.01", "00:30:00"))
    assert [row.reason for row in result.rejected] == [RejectReason.TIME_OUT_OF_RANGE]
    result = import_candles(store, "h1", "America/New_York", candle_row("2099.12.31", "23:30:00"))
    assert [row.reason for row in result.rejected] == [RejectReason.TIME_OUT_OF_RANGE]


def test_completeness_outside_the_supported_range_is_a_value_error(store: MarketDataStore) -> None:
    for start, end in [
        (utc(1), utc(2024)),
        (utc(2024), utc(9999, 12, 31, 23, 59, 59)),
        (utc(2024), utc(2100, 1, 1, 0, 0, 0, 1)),
    ]:
        with pytest.raises(ValueError, match="between 1970"):
            store.completeness(BROKER, INSTRUMENT, "m1", start, end)


def test_reading_with_edge_moments_never_overflows(store: MarketDataStore) -> None:
    store.import_json(to_bytes(candle_json(["2024-01-02T00:00:00Z"])))
    far_east = timezone(timedelta(hours=14))
    far_west = timezone(timedelta(hours=-12))
    for start, end in [
        (datetime.min.replace(tzinfo=UTC), datetime.max.replace(tzinfo=UTC)),
        (datetime.min.replace(tzinfo=far_east), datetime.max.replace(tzinfo=far_west)),
    ]:
        page = store.read_candles(BROKER, INSTRUMENT, "m1", start, end, after=start)
        assert len(page.items) == 1
        assert store.read_ticks(BROKER, INSTRUMENT, start, end).items == ()
        assert store.instrument_info(BROKER, INSTRUMENT, end) is None


def test_require_utc_clamps_a_moment_beyond_the_range_of_datetime() -> None:
    east = datetime.min.replace(tzinfo=timezone(timedelta(hours=1)))
    west = datetime.max.replace(tzinfo=timezone(timedelta(hours=-1)))
    assert require_utc(east) == datetime.min.replace(tzinfo=UTC)
    assert require_utc(west) == datetime.max.replace(tzinfo=UTC)
