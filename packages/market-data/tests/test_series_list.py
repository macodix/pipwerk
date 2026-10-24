"""The list of series (filter, pages, order), the details of a row and the brokers."""

import json
from datetime import datetime
from pathlib import Path

import pytest

from pipwerk_marketdata import (
    CONTRACT,
    MarketDataStore,
    MarketDataStoreError,
    MissingReason,
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

START = utc(2024, 1, 2, 10)


def add_candles(
    store: MarketDataStore,
    broker: str,
    instrument: str,
    unit: str = "m1",
    moments: list[datetime] | None = None,
) -> None:
    times = moments if moments is not None else minutes(START, 3)
    document = candle_document(
        [candle_entry(t) for t in times], broker=broker, instrument=instrument, time_unit=unit
    )
    store.import_json(to_bytes(document))


def add_contract(store: MarketDataStore, broker: str, instrument: str) -> None:
    document = json.loads((EXAMPLE_DIRECTORY / "instrument.json").read_text())
    store.import_json(to_bytes({**document, "broker": broker, "instrument": instrument}))


@pytest.fixture
def filled(store: MarketDataStore) -> MarketDataStore:
    add_candles(store, "beta", "GBPUSD", "h1")
    add_candles(store, "beta", "GBPUSD", "m1")
    add_candles(store, "beta", "EURUSD", "d1")
    add_candles(store, "Alpha", "USDJPY", "m15")
    add_candles(store, "Alpha", "EURUSD", "mn1")
    store.import_json(
        to_bytes(
            tick_document(
                [{"time": "2024-01-02T10:00:00Z", "bid": 1.1, "ask": 1.2}],
                broker="Alpha",
                instrument="EURUSD",
            )
        )
    )
    add_contract(store, "Alpha", "XAUUSD")
    add_contract(store, "beta", "GBPUSD")
    return store


def keys(store: MarketDataStore, **filters: object) -> list[tuple[str, str, str]]:
    page = store.list_series(**filters)  # type: ignore[arg-type]
    return [(row.broker, row.instrument, row.data) for row in page.items]


def test_an_empty_data_store_has_an_empty_list(store: MarketDataStore) -> None:
    page = store.list_series()
    assert (page.items, page.total) == ((), 0)
    assert store.brokers() == ()


def test_the_order_is_broker_instrument_data(filled: MarketDataStore) -> None:
    assert keys(filled) == [
        ("Alpha", "EURUSD", "mn1"),
        ("Alpha", "EURUSD", "ticks"),
        ("Alpha", "USDJPY", "m15"),
        ("Alpha", "XAUUSD", CONTRACT),
        ("beta", "EURUSD", "d1"),
        ("beta", "GBPUSD", "m1"),
        ("beta", "GBPUSD", "h1"),
    ]
    assert filled.list_series().total == 7


def test_the_order_does_not_depend_on_the_order_of_import(store: MarketDataStore) -> None:
    for broker, instrument, unit in (
        ("b", "Y", "h1"),
        ("a", "Z", "m1"),
        ("b", "Y", "m5"),
        ("a", "A", "w1"),
    ):
        add_candles(store, broker, instrument, unit)
    first = keys(store)
    assert first == [("a", "A", "w1"), ("a", "Z", "m1"), ("b", "Y", "m5"), ("b", "Y", "h1")]
    assert keys(store) == first


def test_a_row_holds_first_last_and_the_number_of_gaps(filled: MarketDataStore) -> None:
    # three files with one candle each: two holes between their covered periods
    for hour in (10, 13, 17):
        add_candles(filled, "gamma", "EURUSD", "h1", [utc(2024, 1, 2, hour)])
    row = filled.list_series(broker="gamma").items[0]
    assert (row.first, row.last) == (utc(2024, 1, 2, 10), utc(2024, 1, 2, 17))
    assert row.gap_count == 2
    complete = filled.list_series(broker="Alpha", instrument="usdjpy").items[0]
    assert (complete.first, complete.last, complete.gap_count) == (
        START,
        utc(2024, 1, 2, 10, 2),
        0,
    )


def test_a_row_of_contract_data_has_no_period_and_no_gaps(filled: MarketDataStore) -> None:
    row = next(r for r in filled.list_series().items if r.data == CONTRACT)
    assert (row.broker, row.instrument) == ("Alpha", "XAUUSD")
    assert (row.first, row.last, row.gap_count) == (None, None, 0)


def test_contract_data_next_to_a_series_make_no_extra_row(filled: MarketDataStore) -> None:
    # beta/GBPUSD has instrument data and two series: no row "contract" for it.
    assert not [k for k in keys(filled) if k[:2] == ("beta", "GBPUSD") and k[2] == CONTRACT]


@pytest.mark.parametrize(
    ("broker", "instrument", "data", "expected"),
    [
        ("ALPH", None, None, 4),
        ("eta", None, None, 3),
        (None, "jpy", None, 1),
        (None, "usd", None, 7),
        (None, "xau", None, 1),
        (None, None, "H1", 1),
        (None, None, "m", 3),
        (None, None, "tick", 1),
        (None, None, "contract", 1),
        ("alpha", "eur", "m", 1),
        ("", "", "", 7),
        (None, None, None, 7),
        ("nobody", None, None, 0),
        (None, "EURUSD", "xyz", 0),
    ],
)
def test_the_filters_match_parts_without_regard_to_case(
    filled: MarketDataStore,
    broker: str | None,
    instrument: str | None,
    data: str | None,
    expected: int,
) -> None:
    page = filled.list_series(broker=broker, instrument=instrument, data=data)
    assert page.total == expected
    assert len(page.items) == expected


def test_a_filter_is_text_and_not_a_pattern(store: MarketDataStore) -> None:
    add_candles(store, "a%b", "EURUSD")
    add_candles(store, "axb", "EURUSD")
    assert store.list_series(broker="%").total == 1
    assert store.list_series(broker="_").total == 0
    assert store.list_series(broker=".*").total == 0


def test_pages_cover_the_rows_without_gap_or_repetition(filled: MarketDataStore) -> None:
    everything = keys(filled)
    collected: list[tuple[str, str, str]] = []
    for offset in range(0, 8, 3):
        page = filled.list_series(offset=offset, limit=3)
        assert page.total == 7
        assert len(page.items) == min(3, max(0, 7 - offset))
        collected += [(r.broker, r.instrument, r.data) for r in page.items]
    assert collected == everything
    assert filled.list_series(offset=7, limit=3).items == ()
    assert filled.list_series(offset=100).total == 7


def test_the_total_counts_the_filtered_rows(filled: MarketDataStore) -> None:
    page = filled.list_series(broker="beta", offset=1, limit=1)
    assert page.total == 3
    assert [(r.instrument, r.data) for r in page.items] == [("GBPUSD", "m1")]


def test_invalid_offset_and_limit(filled: MarketDataStore) -> None:
    with pytest.raises(ValueError, match="offset"):
        filled.list_series(offset=-1)
    with pytest.raises(ValueError, match="limit"):
        filled.list_series(limit=0)
    with pytest.raises(ValueError, match="limit"):
        filled.list_series(limit=filled.max_page_size + 1)


def test_the_brokers_of_the_data_store(filled: MarketDataStore) -> None:
    assert filled.brokers() == ("Alpha", "beta")
    add_contract(filled, "Zeta", "EURUSD")
    add_candles(filled, "alpha2", "EURUSD")
    assert filled.brokers() == ("Alpha", "alpha2", "beta", "Zeta")


def test_details_of_a_series_with_all_gaps_and_the_contract_data(store: MarketDataStore) -> None:
    for moments in (
        [utc(2024, 1, 2, 10), utc(2024, 1, 2, 11)],
        [utc(2024, 1, 2, 14), utc(2024, 1, 2, 15)],
        [utc(2024, 1, 2, 20)],
    ):
        add_candles(store, "Alpha", "EURUSD", "h1", moments)
    add_contract(store, "Alpha", "EURUSD")
    details = store.series_details("Alpha", "EURUSD", "h1")
    assert details is not None
    assert (details.row.broker, details.row.instrument, details.row.data) == (
        "Alpha",
        "EURUSD",
        "h1",
    )
    assert details.row.gap_count == len(details.gaps) == 2
    assert [(g.start, g.end, g.reason) for g in details.gaps] == [
        (utc(2024, 1, 2, 12), utc(2024, 1, 2, 14), MissingReason.GAP),
        (utc(2024, 1, 2, 16), utc(2024, 1, 2, 20), MissingReason.GAP),
    ]
    assert details.contract is not None
    assert (details.contract.broker, details.contract.contract_size) == ("Alpha", 100000)


def test_the_contract_data_belong_to_the_broker_of_the_row(store: MarketDataStore) -> None:
    add_candles(store, "Alpha", "EURUSD", "h1")
    add_candles(store, "beta", "EURUSD", "h1")
    add_contract(store, "beta", "EURUSD")
    alpha = store.series_details("Alpha", "EURUSD", "h1")
    beta = store.series_details("beta", "EURUSD", "h1")
    assert alpha is not None
    assert beta is not None
    assert alpha.contract is None
    assert beta.contract is not None
    assert beta.contract.broker == "beta"


def test_gaps_between_separate_imports_are_listed(store: MarketDataStore) -> None:
    add_candles(store, "Alpha", "EURUSD", "h1", [utc(2024, 1, 2, 10), utc(2024, 1, 2, 11)])
    add_candles(store, "Alpha", "EURUSD", "h1", [utc(2024, 1, 2, 18), utc(2024, 1, 2, 19)])
    details = store.series_details("Alpha", "EURUSD", "h1")
    assert details is not None
    assert [(g.start, g.end) for g in details.gaps] == [(utc(2024, 1, 2, 12), utc(2024, 1, 2, 18))]


def test_details_of_ticks(filled: MarketDataStore) -> None:
    details = filled.series_details("Alpha", "EURUSD", "ticks")
    assert details is not None
    assert details.gaps == ()
    assert details.row.data == "ticks"
    assert details.contract is None


def test_details_of_the_row_of_contract_data(filled: MarketDataStore) -> None:
    details = filled.series_details("Alpha", "XAUUSD", CONTRACT)
    assert details is not None
    assert details.gaps == ()
    assert details.contract is not None
    assert details.contract.instrument == "XAUUSD"
    assert (details.row.first, details.row.gap_count) == (None, 0)


def test_there_are_no_details_for_a_row_the_list_does_not_have(filled: MarketDataStore) -> None:
    assert filled.series_details("Alpha", "EURUSD", "h1") is None
    assert filled.series_details("nobody", "EURUSD", "mn1") is None
    assert filled.series_details("Alpha", "NOPE", "ticks") is None
    # beta/GBPUSD has series, so the list has no row "contract" for it
    assert filled.series_details("beta", "GBPUSD", CONTRACT) is None
    assert filled.series_details("Alpha", "NOPE", CONTRACT) is None


def test_details_of_an_unknown_time_unit_are_an_error(filled: MarketDataStore) -> None:
    with pytest.raises(ValueError, match="unknown time unit"):
        filled.series_details("Alpha", "EURUSD", "h5")


def test_a_series_without_candles_has_a_row_without_period(store: MarketDataStore) -> None:
    document = candle_document(
        [], period={"start": "2024-01-02T10:00:00Z", "end": "2024-01-02T12:00:00Z"}
    )
    store.import_json(to_bytes(document))
    row = store.list_series().items[0]
    assert (row.first, row.last) == (None, None)


def test_missing_tables_become_a_store_error(tmp_path: Path) -> None:
    store = MarketDataStore(make_engine(tmp_path, migrate=False))
    with pytest.raises(MarketDataStoreError):
        store.brokers()
    with pytest.raises(MarketDataStoreError):
        store.series_details("a", "b", "ticks")
