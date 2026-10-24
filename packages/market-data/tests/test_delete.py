"""Deleting (specification 5.5): a series, a period, the instrument data, all data of a broker."""

import json
from datetime import datetime, timedelta
from typing import Any

import pytest
from sqlalchemy.exc import OperationalError

from pipwerk_marketdata import (
    Deletion,
    DeletionError,
    DeletionErrorCode,
    DeletionKind,
    Interval,
    MarketDataStore,
    MarketDataStoreError,
    MissingReason,
)
from pipwerk_marketdata import deletion as deletion_module
from tests.helpers import (
    EXAMPLE_DIRECTORY,
    candle_document,
    candle_entry,
    iso,
    tick_document,
    to_bytes,
    utc,
)

HOUR = timedelta(hours=1)


def put_candles(
    store: MarketDataStore,
    broker: str,
    instrument: str,
    start: datetime,
    count: int,
    unit: str = "h1",
) -> None:
    """A file of ``count`` hourly candles from ``start``; it covers exactly them."""
    entries = [candle_entry(start + HOUR * index) for index in range(count)]
    store.import_json(
        to_bytes(candle_document(entries, broker=broker, instrument=instrument, time_unit=unit))
    )


def put_ticks(store: MarketDataStore, broker: str, instrument: str, count: int) -> None:
    moments = [utc(2024, 1, 2, 10) + timedelta(seconds=index) for index in range(count)]
    entries = [{"time": iso(moment), "bid": 1.0, "ask": 1.1} for moment in moments]
    store.import_json(to_bytes(tick_document(entries, broker=broker, instrument=instrument)))


def put_contract(store: MarketDataStore, broker: str, instrument: str) -> None:
    document = json.loads((EXAMPLE_DIRECTORY / "instrument.json").read_text())
    store.import_json(to_bytes({**document, "broker": broker, "instrument": instrument}))


def keys(store: MarketDataStore) -> list[tuple[str, str, str]]:
    return [(row.broker, row.instrument, row.data) for row in store.list_series().items]


def candles(store: MarketDataStore, broker: str, instrument: str, unit: str = "h1") -> int:
    page = store.read_candles(broker, instrument, unit, utc(2000, 1, 1), utc(2100, 1, 1))
    return len(page.items)


@pytest.fixture
def filled(store: MarketDataStore) -> MarketDataStore:
    put_candles(store, "Alpha", "EURUSD", utc(2024, 1, 2, 0), 10)
    put_candles(store, "Alpha", "EURUSD", utc(2024, 1, 2, 0), 2, unit="h4")
    put_candles(store, "Alpha", "GBPUSD", utc(2024, 1, 2, 0), 5)
    put_ticks(store, "Alpha", "EURUSD", 4)
    put_contract(store, "Alpha", "EURUSD")
    put_candles(store, "Beta", "EURUSD", utc(2024, 1, 2, 0), 3)
    put_contract(store, "Beta", "XAUUSD")
    return store


# --- a series ---------------------------------------------------------------------------------


def test_deleting_a_series_removes_candles_and_covered_periods_only_of_that_series(
    filled: MarketDataStore,
) -> None:
    result = filled.delete_series("Alpha", "EURUSD", "h1")

    assert result == Deletion(
        kind=DeletionKind.SERIES,
        broker="Alpha",
        instrument="EURUSD",
        data="h1",
        start=None,
        end=None,
        candle_count=10,
        tick_count=0,
        series_count=1,
        instrument_count=0,
        broker_removed=False,
    )
    assert ("Alpha", "EURUSD", "h1") not in keys(filled)
    assert candles(filled, "Alpha", "EURUSD", "h1") == 0
    # everything else stays
    assert candles(filled, "Alpha", "EURUSD", "h4") == 2
    assert candles(filled, "Alpha", "GBPUSD") == 5
    assert candles(filled, "Beta", "EURUSD") == 3
    assert filled.instrument_info("Alpha", "EURUSD") is not None
    assert len(filled.overview().series) == 4  # of five series
    # a deleted period is not covered any more
    assert filled.completeness(
        "Alpha", "EURUSD", "h1", utc(2024, 1, 2), utc(2024, 1, 2, 10)
    ).missing


def test_deleting_ticks_counts_the_ticks(filled: MarketDataStore) -> None:
    result = filled.delete_series("Alpha", "EURUSD", "ticks")
    assert (result.candle_count, result.tick_count, result.series_count) == (0, 4, 1)
    assert ("Alpha", "EURUSD", "ticks") not in keys(filled)


def test_a_preview_changes_nothing_and_says_what_a_deletion_would_remove(
    filled: MarketDataStore,
) -> None:
    before = (keys(filled), filled.overview())
    preview = filled.plan_delete_series("Alpha", "EURUSD", "h1")
    assert (preview.candle_count, preview.series_count) == (10, 1)
    assert (keys(filled), filled.overview()) == before
    assert filled.delete_series("Alpha", "EURUSD", "h1") == preview


def test_the_instrument_of_a_deleted_series_keeps_its_row_with_the_instrument_data(
    store: MarketDataStore,
) -> None:
    put_candles(store, "Alpha", "EURUSD", utc(2024, 1, 2), 3)
    put_contract(store, "Alpha", "EURUSD")
    store.delete_series("Alpha", "EURUSD", "h1")
    # the series is gone, the instrument data are not: the row "contract" takes its place
    assert keys(store) == [("Alpha", "EURUSD", "contract")]
    assert store.brokers() == ("Alpha",)


def test_the_broker_without_data_is_gone_and_the_result_says_so(store: MarketDataStore) -> None:
    put_candles(store, "Alpha", "EURUSD", utc(2024, 1, 2), 3)
    assert store.plan_delete_series("Alpha", "EURUSD", "h1").broker_removed
    result = store.delete_series("Alpha", "EURUSD", "h1")
    assert result.broker_removed
    assert store.brokers() == ()
    assert keys(store) == []


# --- a period ---------------------------------------------------------------------------------


def test_deleting_a_period_in_the_middle_leaves_a_gap_that_has_trading_time(
    store: MarketDataStore,
) -> None:
    put_candles(store, "Alpha", "EURUSD", utc(2024, 1, 2, 0), 12)  # Tuesday 00:00 to 12:00
    start, end = utc(2024, 1, 2, 4), utc(2024, 1, 2, 7)

    result = store.delete_period("Alpha", "EURUSD", "h1", start, end)

    assert result.kind is DeletionKind.PERIOD
    assert (result.start, result.end) == (start, end)
    assert (result.candle_count, result.series_count, result.broker_removed) == (3, 0, False)
    assert candles(store, "Alpha", "EURUSD") == 9
    series = store.overview().series[0]
    assert series.covered == (
        Interval(utc(2024, 1, 2, 0), start),
        Interval(end, utc(2024, 1, 2, 12)),
    )
    assert [(m.start, m.end, m.reason) for m in series.missing] == [(start, end, MissingReason.GAP)]
    assert store.list_series().items[0].gap_count == 1
    details = store.series_details("Alpha", "EURUSD", "h1")
    assert details is not None
    assert [(g.start, g.end) for g in details.gaps] == [(start, end)]


def test_a_deleted_period_in_a_time_without_trade_is_no_gap(store: MarketDataStore) -> None:
    # Friday 18:00 to Monday 06:00, the weekend in between
    put_candles(store, "Alpha", "EURUSD", utc(2024, 1, 5, 18), 60)
    store.delete_period("Alpha", "EURUSD", "h1", utc(2024, 1, 5, 22), utc(2024, 1, 7, 22))
    assert store.list_series().items[0].gap_count == 0
    assert len(store.overview().series[0].covered) == 2


def test_a_period_that_begins_at_the_edge_is_not_covered_and_no_gap(store: MarketDataStore) -> None:
    put_candles(store, "Alpha", "EURUSD", utc(2024, 1, 2, 0), 12)
    store.delete_period("Alpha", "EURUSD", "h1", utc(2024, 1, 1, 22), utc(2024, 1, 2, 3))
    assert store.overview().series[0].covered == (
        Interval(utc(2024, 1, 2, 3), utc(2024, 1, 2, 12)),
    )
    assert store.list_series().items[0].gap_count == 0
    result = store.completeness("Alpha", "EURUSD", "h1", utc(2024, 1, 2, 0), utc(2024, 1, 2, 12))
    assert [(m.start, m.end, m.reason) for m in result.missing] == [
        (utc(2024, 1, 2, 0), utc(2024, 1, 2, 3), MissingReason.NOT_COVERED)
    ]


def test_a_period_that_removes_all_candles_removes_the_series(filled: MarketDataStore) -> None:
    result = filled.delete_period("Beta", "EURUSD", "h1", utc(2024, 1, 1), utc(2024, 1, 3))
    assert (result.candle_count, result.series_count) == (3, 1)
    assert ("Beta", "EURUSD", "h1") not in keys(filled)
    # Beta still has instrument data of another instrument
    assert not result.broker_removed
    assert "Beta" in filled.brokers()


def test_a_period_that_removes_the_last_data_of_a_broker_removes_the_broker(
    store: MarketDataStore,
) -> None:
    put_candles(store, "Alpha", "EURUSD", utc(2024, 1, 2), 3)
    result = store.delete_period("Alpha", "EURUSD", "h1", utc(2024, 1, 2), utc(2024, 1, 3))
    assert result.broker_removed
    assert store.brokers() == ()


def test_the_period_of_ticks_is_deleted_by_the_moment(filled: MarketDataStore) -> None:
    # ticks at 10:00:30, 10:01:30, 10:02:30 and 10:03:30
    moments = [utc(2024, 1, 2, 10, minute, 30) for minute in range(4)]
    entries = [{"time": iso(moment), "bid": 1.0, "ask": 1.1} for moment in moments]
    store_ticks = to_bytes(tick_document(entries, broker="Gamma", instrument="USDJPY"))
    filled.import_json(store_ticks)

    result = filled.delete_period(
        "Gamma", "USDJPY", "ticks", utc(2024, 1, 2, 10, 1), utc(2024, 1, 2, 10, 3)
    )

    assert (result.tick_count, result.series_count) == (2, 0)
    left = filled.read_ticks("Gamma", "USDJPY", utc(2024, 1, 2), utc(2024, 1, 3))
    assert [tick.time for tick in left.items] == [moments[0], moments[3]]
    whole = filled.delete_period(
        "Alpha", "EURUSD", "ticks", utc(2024, 1, 2, 10, 0), utc(2024, 1, 2, 10, 1)
    )
    assert (whole.tick_count, whole.series_count) == (4, 1)


def test_a_period_is_checked_before_anything_else(filled: MarketDataStore) -> None:
    start = utc(2024, 1, 2, 4)
    bad = [
        (start, start),  # empty
        (start, utc(2024, 1, 2, 3)),  # backwards
        (start, utc(2024, 1, 2, 5, 0, 30)),  # not on the minute
        (utc(2024, 1, 2, 4, 0, 0, 1), utc(2024, 1, 2, 5)),  # not on the minute
        (utc(1969, 12, 31), utc(1970, 1, 2)),  # before the supported times
        (start, utc(2100, 1, 2)),  # after the supported times
    ]
    for begin, finish in bad:
        with pytest.raises(DeletionError) as raised:
            filled.delete_period("Alpha", "EURUSD", "h1", begin, finish)
        assert raised.value.code is DeletionErrorCode.PERIOD_INVALID
        with pytest.raises(DeletionError):
            filled.plan_delete_period("Alpha", "EURUSD", "h1", begin, finish)
    with pytest.raises(ValueError, match="time zone"):
        filled.delete_period("Alpha", "EURUSD", "h1", datetime(2024, 1, 2), utc(2024, 1, 3))
    assert candles(filled, "Alpha", "EURUSD") == 10


def test_a_period_without_data_and_not_covered_is_refused(filled: MarketDataStore) -> None:
    with pytest.raises(DeletionError) as raised:
        filled.delete_period("Alpha", "EURUSD", "h1", utc(2025, 1, 1), utc(2025, 1, 2))
    assert raised.value.code is DeletionErrorCode.PERIOD_EMPTY
    assert candles(filled, "Alpha", "EURUSD") == 10


def test_a_covered_period_without_candles_can_be_deleted(store: MarketDataStore) -> None:
    store.import_json(
        to_bytes(
            candle_document(
                [candle_entry(utc(2024, 1, 2, 0))],
                time_unit="h1",
                period={"start": iso(utc(2024, 1, 2, 0)), "end": iso(utc(2024, 1, 2, 12))},
            )
        )
    )
    result = store.delete_period(
        "TestBroker", "EURUSD", "h1", utc(2024, 1, 2, 6), utc(2024, 1, 2, 9)
    )
    assert (result.candle_count, result.series_count) == (0, 0)
    assert store.overview().series[0].covered == (
        Interval(utc(2024, 1, 2, 0), utc(2024, 1, 2, 6)),
        Interval(utc(2024, 1, 2, 9), utc(2024, 1, 2, 12)),
    )


def test_a_period_that_cuts_two_covered_periods_trims_both(store: MarketDataStore) -> None:
    put_candles(store, "Alpha", "EURUSD", utc(2024, 1, 2, 0), 4)
    put_candles(store, "Alpha", "EURUSD", utc(2024, 1, 2, 8), 4)
    store.delete_period("Alpha", "EURUSD", "h1", utc(2024, 1, 2, 2), utc(2024, 1, 2, 10))
    assert store.overview().series[0].covered == (
        Interval(utc(2024, 1, 2, 0), utc(2024, 1, 2, 2)),
        Interval(utc(2024, 1, 2, 10), utc(2024, 1, 2, 12)),
    )
    assert candles(store, "Alpha", "EURUSD") == 4


def test_importing_the_deleted_period_again_closes_the_gap(store: MarketDataStore) -> None:
    put_candles(store, "Alpha", "EURUSD", utc(2024, 1, 2, 0), 12)
    store.delete_period("Alpha", "EURUSD", "h1", utc(2024, 1, 2, 4), utc(2024, 1, 2, 7))
    put_candles(store, "Alpha", "EURUSD", utc(2024, 1, 2, 4), 3)
    assert store.list_series().items[0].gap_count == 0
    assert store.overview().series[0].covered == (
        Interval(utc(2024, 1, 2, 0), utc(2024, 1, 2, 12)),
    )


# --- the instrument data --------------------------------------------------------------------------


def test_deleting_the_instrument_data_leaves_the_series(filled: MarketDataStore) -> None:
    result = filled.delete_contract("Alpha", "EURUSD")
    assert result == Deletion(
        kind=DeletionKind.CONTRACT,
        broker="Alpha",
        instrument="EURUSD",
        data=None,
        start=None,
        end=None,
        candle_count=0,
        tick_count=0,
        series_count=0,
        instrument_count=1,
        broker_removed=False,
    )
    assert filled.instrument_info("Alpha", "EURUSD") is None
    assert candles(filled, "Alpha", "EURUSD") == 10
    assert filled.instrument_info("Beta", "XAUUSD") is not None


def test_deleting_all_versions_of_the_instrument_data(store: MarketDataStore) -> None:
    document = json.loads((EXAMPLE_DIRECTORY / "instrument.json").read_text())
    for moment in ("2024-01-01T00:00:00Z", "2024-02-01T00:00:00Z"):
        store.import_json(to_bytes({**document, "acquired_at": moment}))
    broker, name = document["broker"], document["instrument"]
    store.delete_contract(broker, name)
    assert store.instrument_info(broker, name) is None
    assert store.brokers() == ()


def test_deleting_the_last_instrument_data_of_a_broker_removes_the_broker(
    filled: MarketDataStore,
) -> None:
    assert filled.plan_delete_contract("Beta", "XAUUSD").broker_removed is False  # it has candles
    filled.delete_series("Beta", "EURUSD", "h1")
    assert filled.plan_delete_contract("Beta", "XAUUSD").broker_removed is True
    filled.delete_contract("Beta", "XAUUSD")
    assert "Beta" not in filled.brokers()


# --- a broker ---------------------------------------------------------------------------------


def test_deleting_a_broker_removes_all_its_data_and_nothing_of_another(
    filled: MarketDataStore,
) -> None:
    preview = filled.plan_delete_broker("Alpha")
    assert preview == Deletion(
        kind=DeletionKind.BROKER,
        broker="Alpha",
        instrument=None,
        data=None,
        start=None,
        end=None,
        candle_count=10 + 2 + 5,
        tick_count=4,
        series_count=4,
        instrument_count=1,
        broker_removed=True,
    )
    assert "Alpha" in filled.brokers()  # a preview changes nothing

    assert filled.delete_broker("Alpha") == preview

    assert filled.brokers() == ("Beta",)
    assert keys(filled) == [("Beta", "EURUSD", "h1"), ("Beta", "XAUUSD", "contract")]
    assert candles(filled, "Beta", "EURUSD") == 3
    assert filled.instrument_info("Alpha", "EURUSD") is None
    assert candles(filled, "Alpha", "EURUSD") == 0


def test_a_broker_with_only_instrument_data_can_be_deleted(filled: MarketDataStore) -> None:
    put_contract(filled, "Gamma", "EURUSD")
    result = filled.delete_broker("Gamma")
    assert (result.series_count, result.instrument_count) == (0, 1)
    assert "Gamma" not in filled.brokers()


# --- unknown names ----------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("call", "code"),
    [
        (lambda s: s.delete_broker("Nobody"), DeletionErrorCode.BROKER_UNKNOWN),
        (lambda s: s.plan_delete_broker("Nobody"), DeletionErrorCode.BROKER_UNKNOWN),
        (lambda s: s.delete_series("Nobody", "EURUSD", "h1"), DeletionErrorCode.BROKER_UNKNOWN),
        (lambda s: s.delete_contract("Nobody", "EURUSD"), DeletionErrorCode.BROKER_UNKNOWN),
        (lambda s: s.delete_series("Alpha", "NOPE", "h1"), DeletionErrorCode.INSTRUMENT_UNKNOWN),
        (lambda s: s.delete_contract("Alpha", "NOPE"), DeletionErrorCode.INSTRUMENT_UNKNOWN),
        (lambda s: s.delete_series("Alpha", "EURUSD", "d1"), DeletionErrorCode.SERIES_UNKNOWN),
        (lambda s: s.delete_series("Alpha", "EURUSD", "h7"), DeletionErrorCode.SERIES_UNKNOWN),
        (
            lambda s: s.delete_series("Alpha", "EURUSD", "contract"),
            DeletionErrorCode.SERIES_UNKNOWN,
        ),
        (lambda s: s.delete_contract("Alpha", "GBPUSD"), DeletionErrorCode.CONTRACT_UNKNOWN),
        (
            lambda s: s.delete_period("Alpha", "EURUSD", "d1", utc(2024, 1, 1), utc(2024, 1, 2)),
            DeletionErrorCode.SERIES_UNKNOWN,
        ),
        (
            lambda s: s.delete_period("Alpha", "NOPE", "h1", utc(2024, 1, 1), utc(2024, 1, 2)),
            DeletionErrorCode.INSTRUMENT_UNKNOWN,
        ),
    ],
)
def test_unknown_names_give_an_error_with_a_reason_and_change_nothing(
    filled: MarketDataStore, call: Any, code: DeletionErrorCode
) -> None:
    before = (keys(filled), filled.overview())
    with pytest.raises(DeletionError) as raised:
        call(filled)
    assert raised.value.code is code
    assert raised.value.message
    assert (keys(filled), filled.overview()) == before


def test_names_are_matched_exactly(filled: MarketDataStore) -> None:
    with pytest.raises(DeletionError) as raised:
        filled.delete_broker("alpha")
    assert raised.value.code is DeletionErrorCode.BROKER_UNKNOWN


# --- one transaction ------------------------------------------------------------------------------


def test_a_failure_in_the_middle_of_a_deletion_changes_nothing(
    filled: MarketDataStore, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fail(*_args: object) -> None:
        raise OperationalError("DELETE", {}, Exception("disk full"))

    monkeypatch.setattr(deletion_module, "_remove_coverage", fail)
    before = (keys(filled), filled.overview())
    with pytest.raises(MarketDataStoreError):
        filled.delete_period("Alpha", "EURUSD", "h1", utc(2024, 1, 2, 4), utc(2024, 1, 2, 6))
    assert (keys(filled), filled.overview()) == before
    assert candles(filled, "Alpha", "EURUSD") == 10


def test_a_failure_while_deleting_a_broker_changes_nothing(
    filled: MarketDataStore, monkeypatch: pytest.MonkeyPatch
) -> None:
    original = deletion_module._remove_series

    def remove_then_fail(connection: Any, series_ids: list[int]) -> None:
        original(connection, series_ids)
        raise OperationalError("DELETE", {}, Exception("disk full"))

    monkeypatch.setattr(deletion_module, "_remove_series", remove_then_fail)
    before = (keys(filled), filled.overview())
    with pytest.raises(MarketDataStoreError):
        filled.delete_broker("Alpha")
    assert (keys(filled), filled.overview()) == before
    assert filled.instrument_info("Alpha", "EURUSD") is not None
