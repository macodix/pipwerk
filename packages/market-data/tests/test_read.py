"""Reading: pages with continuation, limits, overview, instrument data."""

import json
from datetime import datetime
from pathlib import Path

import pytest

from pipwerk_marketdata import MarketDataStore, MarketDataStoreError, MissingReason
from tests.helpers import (
    BROKER,
    EXAMPLE_DIRECTORY,
    INSTRUMENT,
    candle_document,
    candle_entry,
    iso,
    make_engine,
    minutes,
    tick_document,
    to_bytes,
    utc,
)

START = utc(2024, 1, 2, 10)


def fill(store: MarketDataStore, count: int = 25) -> list[datetime]:
    times = minutes(START, count)
    store.import_json(to_bytes(candle_document([candle_entry(t) for t in times])))
    return times


def test_start_is_included_and_end_is_excluded(store: MarketDataStore) -> None:
    times = fill(store, 10)
    page = store.read_candles(BROKER, INSTRUMENT, "m1", times[2], times[5])
    assert [c.time for c in page.items] == times[2:5]
    assert page.next_after is None


def test_pages_with_continuation_return_every_candle_once(store: MarketDataStore) -> None:
    times = fill(store, 25)
    seen: list[datetime] = []
    after = None
    calls = 0
    while True:
        page = store.read_candles(
            BROKER, INSTRUMENT, "m1", START, utc(2024, 1, 3), limit=10, after=after
        )
        calls += 1
        assert len(page.items) <= 10
        seen.extend(c.time for c in page.items)
        if page.next_after is None:
            break
        assert page.next_after == page.items[-1].time
        after = page.next_after
    assert (calls, seen) == (3, times)


def test_exactly_one_full_page_has_no_continuation(store: MarketDataStore) -> None:
    fill(store, 10)
    page = store.read_candles(BROKER, INSTRUMENT, "m1", START, utc(2024, 1, 3), limit=10)
    assert (len(page.items), page.next_after) == (10, None)


def test_default_limit_is_the_maximum_page_size(store: MarketDataStore) -> None:
    fill(store, 150)
    page = store.read_candles(BROKER, INSTRUMENT, "m1", START, utc(2024, 1, 3))
    assert len(page.items) == store.max_page_size == 100
    assert page.next_after == page.items[-1].time


def test_limit_above_the_maximum_or_not_positive_is_refused(store: MarketDataStore) -> None:
    for limit in (0, -1, 101):
        with pytest.raises(ValueError, match="limit"):
            store.read_candles(BROKER, INSTRUMENT, "m1", START, utc(2024, 1, 3), limit=limit)
        with pytest.raises(ValueError, match="limit"):
            store.read_ticks(BROKER, INSTRUMENT, START, utc(2024, 1, 3), limit=limit)
    with pytest.raises(ValueError, match="max_page_size"):
        MarketDataStore(store._engine, max_page_size=0)


def test_moments_without_time_zone_and_unknown_unit_are_refused(store: MarketDataStore) -> None:
    with pytest.raises(ValueError, match="time zone"):
        store.read_candles(BROKER, INSTRUMENT, "m1", datetime(2024, 1, 1), utc(2024, 1, 2))
    with pytest.raises(ValueError, match="time unit"):
        store.read_candles(BROKER, INSTRUMENT, "m7", utc(2024, 1, 1), utc(2024, 1, 2))


def test_reading_an_unknown_series_gives_nothing(store: MarketDataStore) -> None:
    assert store.read_candles("x", "y", "m1", START, utc(2024, 1, 3)).items == ()
    assert store.read_ticks("x", "y", START, utc(2024, 1, 3)).items == ()
    assert store.instrument_info("x", "y") is None
    assert store.trading_hours("x", "y", "m1") == []


def test_tick_pages_with_continuation(store: MarketDataStore) -> None:
    moments = [utc(2024, 1, 2, 10, 0, 0, 1000 * i) for i in range(1, 8)]
    entries = [{"time": iso(m), "bid": 1.0, "ask": 1.1} for m in moments]
    store.import_json(to_bytes(tick_document(entries)))
    first = store.read_ticks(BROKER, INSTRUMENT, START, utc(2024, 1, 3), limit=5)
    second = store.read_ticks(
        BROKER, INSTRUMENT, START, utc(2024, 1, 3), limit=5, after=first.next_after
    )
    assert [t.time for t in first.items] + [t.time for t in second.items] == moments
    assert second.next_after is None


def test_instrument_info_as_of_a_moment(store: MarketDataStore) -> None:
    document = json.loads((EXAMPLE_DIRECTORY / "instrument.json").read_text())
    for moment, swap in (("2024-01-01T00:00:00Z", -1.0), ("2024-02-01T00:00:00Z", -2.0)):
        store.import_json(to_bytes({**document, "acquired_at": moment, "swap_long": swap}))
    broker, name = document["broker"], document["instrument"]
    newest = store.instrument_info(broker, name)
    assert newest is not None
    assert (newest.swap_long, newest.acquired_at) == (-2.0, utc(2024, 2, 1))
    january = store.instrument_info(broker, name, utc(2024, 1, 15))
    assert january is not None
    assert january.swap_long == -1.0
    assert store.instrument_info(broker, name, utc(2023, 12, 31)) is None
    assert store.instrument_info(broker, "OTHER") is None


def test_overview(store: MarketDataStore) -> None:
    # two files with a hole between their periods: 10:50 to 11:10
    times = [
        t for t in minutes(START, 180) if not utc(2024, 1, 2, 10, 50) <= t < utc(2024, 1, 2, 11, 10)
    ]
    for part in (
        [t for t in times if t < utc(2024, 1, 2, 11)],
        [t for t in times if t >= utc(2024, 1, 2, 11)],
    ):
        store.import_json(to_bytes(candle_document([candle_entry(t) for t in part])))
    document = json.loads((EXAMPLE_DIRECTORY / "instrument.json").read_text())
    store.import_json(to_bytes(document))
    overview = store.overview()
    assert len(overview.series) == 1
    series = overview.series[0]
    assert (series.broker, series.instrument, series.unit) == (BROKER, INSTRUMENT, "m1")
    assert series.count == len(times)
    assert (series.first, series.last) == (START, utc(2024, 1, 2, 12, 59))
    assert [(c.start, c.end) for c in series.covered] == [
        (START, utc(2024, 1, 2, 10, 50)),
        (utc(2024, 1, 2, 11, 10), utc(2024, 1, 2, 13)),
    ]
    assert [(m.start, m.end, m.reason) for m in series.missing] == [
        (utc(2024, 1, 2, 10, 50), utc(2024, 1, 2, 11, 10), MissingReason.GAP)
    ]
    assert not series.has_trading_hours
    assert [(i.broker, i.instrument, i.acquired_at) for i in overview.instruments] == [
        (document["broker"], document["instrument"], utc(2024, 1, 2, 9, 30))
    ]


def test_empty_overview(store: MarketDataStore) -> None:
    overview = store.overview()
    assert (overview.series, overview.instruments) == ((), ())


def test_missing_tables_become_a_store_error(tmp_path: Path) -> None:
    store = MarketDataStore(make_engine(tmp_path, migrate=False))
    with pytest.raises(MarketDataStoreError):
        store.overview()
    with pytest.raises(MarketDataStoreError):
        store.read_candles(BROKER, INSTRUMENT, "m1", START, utc(2024, 1, 3))
