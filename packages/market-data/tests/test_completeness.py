"""Completeness: gaps by the rules of 5.2, weekends, trading pauses, thresholds."""

from datetime import datetime, timedelta
from typing import Any

import pytest

from pipwerk_marketdata import (
    Completeness,
    CompletenessRules,
    Interval,
    MarketDataStore,
    MissingPart,
    MissingReason,
    TradingSession,
    Weekday,
)
from pipwerk_marketdata.completeness import intersect, merge, subtract, tick_gaps, weekends
from pipwerk_marketdata.timeunits import TIME_UNITS
from tests.helpers import (
    BROKER,
    INSTRUMENT,
    candle_document,
    candle_entry,
    iso,
    minutes,
    tick_document,
    to_bytes,
    utc,
)

MONDAY = utc(2024, 1, 1)  # a Monday
HOUR = timedelta(hours=1)
ALL_DAY = [
    {"weekday": day.value, "from": "00:00", "to": "24:00"}
    for day in Weekday
    if day not in (Weekday.SATURDAY, Weekday.SUNDAY)
]


def put(store: MarketDataStore, times: list[datetime], unit: str = "h1", **document: Any) -> None:
    entries = [candle_entry(moment) for moment in times]
    store.import_json(to_bytes(candle_document(entries, time_unit=unit, **document)))


def hours(start: datetime, count: int) -> list[datetime]:
    return [start + HOUR * index for index in range(count)]


def check(store: MarketDataStore, start: datetime, end: datetime, unit: str = "h1") -> Completeness:
    return store.completeness(BROKER, INSTRUMENT, unit, start, end)


def gaps_of(result: Completeness) -> list[tuple[datetime, datetime]]:
    return [(part.start, part.end) for part in result.missing if part.reason is MissingReason.GAP]


def test_two_weeks_with_a_weekend_between_are_complete(store: MarketDataStore) -> None:
    put(store, hours(MONDAY, 118))  # Monday 00:00 to Friday 21:00 (last candle ends 22:00)
    put(store, hours(utc(2024, 1, 7, 22), 14))  # Sunday 22:00 to Monday 11:00
    result = check(store, MONDAY, utc(2024, 1, 8, 12))
    assert result.missing == ()
    assert result.complete
    assert result.present == (Interval(MONDAY, utc(2024, 1, 8, 12)),)
    assert not result.uses_trading_hours


def test_gaps_need_more_than_one_missing_candle_without_trading_hours(
    store: MarketDataStore,
) -> None:
    # 10:00 and 12:00: one candle (11:00) missing, tolerated; 15:00 and 18:00: two missing, a gap
    put(store, [utc(2024, 1, 2, h) for h in (9, 10, 12, 13, 14, 15, 18, 19)])
    result = check(store, utc(2024, 1, 2, 9), utc(2024, 1, 2, 20))
    assert gaps_of(result) == [(utc(2024, 1, 2, 16), utc(2024, 1, 2, 18))]
    assert not result.complete
    assert result.present == (
        Interval(utc(2024, 1, 2, 9), utc(2024, 1, 2, 16)),
        Interval(utc(2024, 1, 2, 18), utc(2024, 1, 2, 20)),
    )


def test_hole_before_the_weekend_is_a_gap_only_outside_the_weekend(store: MarketDataStore) -> None:
    # last candle opens Friday 18:00 and ends 19:00; next one opens Sunday 22:00
    put(store, [utc(2024, 1, 5, 17), utc(2024, 1, 5, 18), utc(2024, 1, 7, 22), utc(2024, 1, 7, 23)])
    result = check(store, utc(2024, 1, 5, 17), utc(2024, 1, 8, 0))
    assert gaps_of(result) == [(utc(2024, 1, 5, 19), utc(2024, 1, 5, 22))]


def test_hole_exactly_the_weekend_is_no_gap(store: MarketDataStore) -> None:
    put(store, [utc(2024, 1, 5, 20), utc(2024, 1, 5, 21), utc(2024, 1, 7, 22), utc(2024, 1, 7, 23)])
    result = check(store, utc(2024, 1, 5, 20), utc(2024, 1, 8, 0))
    assert result.missing == ()


def test_holiday_in_the_week_is_a_gap_without_trading_hours(store: MarketDataStore) -> None:
    put(store, [*hours(utc(2024, 1, 1), 24), *hours(utc(2024, 1, 3), 24)])
    result = check(store, utc(2024, 1, 1), utc(2024, 1, 4))
    assert gaps_of(result) == [(utc(2024, 1, 2), utc(2024, 1, 3))]


def test_trading_hours_pauses_are_no_gap_and_a_single_missing_candle_is(
    store: MarketDataStore,
) -> None:
    sessions = [{"weekday": d.value, "from": "01:00", "to": "23:00"} for d in list(Weekday)[:5]]
    tuesday = [t for t in hours(utc(2024, 1, 2, 1), 22) if t != utc(2024, 1, 2, 10)]
    wednesday = hours(utc(2024, 1, 3, 1), 22)
    put(store, [*tuesday, *wednesday], trading_hours=sessions)
    result = check(store, utc(2024, 1, 2, 1), utc(2024, 1, 3, 23))
    assert result.uses_trading_hours
    # the pause from 23:00 to 01:00 is no gap; the missing 10:00 candle is, although it is single
    assert gaps_of(result) == [(utc(2024, 1, 2, 10), utc(2024, 1, 2, 11))]
    # the pause itself belongs to the present parts
    assert Interval(utc(2024, 1, 2, 11), utc(2024, 1, 3, 23)) in result.present


def test_trading_hours_make_weekend_and_sunday_evening_precise(store: MarketDataStore) -> None:
    sessions = [
        *[{"weekday": d.value, "from": "00:00", "to": "24:00"} for d in list(Weekday)[:4]],
        {"weekday": "friday", "from": "00:00", "to": "21:00"},
        {"weekday": "sunday", "from": "23:00", "to": "24:00"},
    ]
    # the broker closes Friday 21:00 and opens Sunday 23:00; the default weekend would call
    # Friday 21:00 to 22:00 a gap and Sunday 22:00 to 23:00 missing
    put(
        store,
        [utc(2024, 1, 5, 19), utc(2024, 1, 5, 20), utc(2024, 1, 7, 23)],
        trading_hours=sessions,
    )
    result = check(store, utc(2024, 1, 5, 19), utc(2024, 1, 8, 0))
    assert result.missing == ()


def test_m1_missing_within_one_hour_with_candles_is_no_gap(store: MarketDataStore) -> None:
    start = utc(2024, 1, 2, 10)
    times = [
        t
        for t in minutes(start, 120)
        if not utc(2024, 1, 2, 10, 20) <= t <= utc(2024, 1, 2, 10, 30)
    ]
    put(store, times, unit="m1")
    assert check(store, start, utc(2024, 1, 2, 12), "m1").missing == ()


def test_m1_missing_across_an_hour_boundary_or_a_whole_hour_is_a_gap(
    store: MarketDataStore,
) -> None:
    start = utc(2024, 1, 2, 10)
    across = [
        t for t in minutes(start, 180) if not utc(2024, 1, 2, 10, 50) <= t < utc(2024, 1, 2, 11, 10)
    ]
    whole_hour = [t for t in across if not utc(2024, 1, 2, 12) <= t < utc(2024, 1, 2, 13)]
    put(store, whole_hour, unit="m1")
    result = check(store, start, utc(2024, 1, 2, 13), "m1")
    assert gaps_of(result) == [(utc(2024, 1, 2, 10, 50), utc(2024, 1, 2, 11, 10))]
    # the last hour is not covered by the import at all
    assert result.missing[-1] == MissingPart(
        utc(2024, 1, 2, 12), utc(2024, 1, 2, 13), MissingReason.NOT_COVERED
    )


def test_m1_whole_hour_missing_between_candles_is_a_gap(store: MarketDataStore) -> None:
    times = [*minutes(utc(2024, 1, 2, 9), 60), *minutes(utc(2024, 1, 2, 11), 60)]
    put(store, times, unit="m1")
    result = check(store, utc(2024, 1, 2, 9), utc(2024, 1, 2, 12), "m1")
    assert gaps_of(result) == [(utc(2024, 1, 2, 10), utc(2024, 1, 2, 11))]


def test_the_m1_exemption_and_the_tolerance_can_be_switched_off(engine: Any) -> None:
    rules = CompletenessRules(tolerate_m1_in_hour=False, tolerated_missing_candles=0)
    strict = MarketDataStore(engine, rules=rules)
    times = [t for t in minutes(utc(2024, 1, 2, 10), 60) if t != utc(2024, 1, 2, 10, 20)]
    put(strict, times, unit="m1")
    result = strict.completeness(BROKER, INSTRUMENT, "m1", utc(2024, 1, 2, 10), utc(2024, 1, 2, 11))
    assert gaps_of(result) == [(utc(2024, 1, 2, 10, 20), utc(2024, 1, 2, 10, 21))]


def test_what_no_import_covers_is_missing_with_its_reason(store: MarketDataStore) -> None:
    put(store, hours(utc(2024, 1, 2, 10), 4))  # covers 10:00 to 14:00
    put(store, hours(utc(2024, 1, 2, 16), 2))  # covers 16:00 to 18:00
    result = check(store, utc(2024, 1, 2, 9), utc(2024, 1, 2, 19))
    assert result.missing == (
        MissingPart(utc(2024, 1, 2, 9), utc(2024, 1, 2, 10), MissingReason.NOT_COVERED),
        MissingPart(utc(2024, 1, 2, 14), utc(2024, 1, 2, 16), MissingReason.NOT_COVERED),
        MissingPart(utc(2024, 1, 2, 18), utc(2024, 1, 2, 19), MissingReason.NOT_COVERED),
    )
    assert result.present == (
        Interval(utc(2024, 1, 2, 10), utc(2024, 1, 2, 14)),
        Interval(utc(2024, 1, 2, 16), utc(2024, 1, 2, 18)),
    )


def test_unknown_series_is_missing_except_for_the_weekend(store: MarketDataStore) -> None:
    result = check(store, utc(2024, 1, 5, 20), utc(2024, 1, 8, 2))
    assert result.missing == (
        MissingPart(utc(2024, 1, 5, 20), utc(2024, 1, 5, 22), MissingReason.NOT_COVERED),
        MissingPart(utc(2024, 1, 7, 22), utc(2024, 1, 8, 2), MissingReason.NOT_COVERED),
    )
    assert result.present == (Interval(utc(2024, 1, 5, 22), utc(2024, 1, 7, 22)),)


def test_covered_period_without_candles_is_a_gap(store: MarketDataStore) -> None:
    store.import_json(
        to_bytes(
            candle_document(
                [],
                time_unit="h1",
                period={"start": iso(utc(2024, 1, 2, 10)), "end": iso(utc(2024, 1, 2, 14))},
            )
        )
    )
    result = check(store, utc(2024, 1, 2, 10), utc(2024, 1, 2, 14))
    assert result.missing == (
        MissingPart(utc(2024, 1, 2, 10), utc(2024, 1, 2, 14), MissingReason.GAP),
    )


def test_declared_period_extends_the_coverage_beyond_the_candles(store: MarketDataStore) -> None:
    put(
        store,
        hours(utc(2024, 1, 2, 10), 2),
        period={"start": iso(utc(2024, 1, 2, 10)), "end": iso(utc(2024, 1, 2, 13))},
    )
    result = check(store, utc(2024, 1, 2, 10), utc(2024, 1, 2, 13))
    # the third hour was asked for and delivered nothing: one candle missing is tolerated
    assert result.missing == ()
    result = check(store, utc(2024, 1, 2, 10), utc(2024, 1, 2, 14))
    assert [part.reason for part in result.missing] == [MissingReason.NOT_COVERED]


def test_coverage_of_overlapping_and_touching_imports_is_joined(store: MarketDataStore) -> None:
    put(store, hours(utc(2024, 1, 2, 10), 3))
    put(store, hours(utc(2024, 1, 2, 13), 3))  # touches
    put(store, hours(utc(2024, 1, 2, 12), 2))  # overlaps
    overview = store.overview().series[0]
    assert overview.covered == (Interval(utc(2024, 1, 2, 10), utc(2024, 1, 2, 16)),)
    assert overview.count == 6


def test_ticks_silence_longer_than_an_hour_is_a_gap(store: MarketDataStore) -> None:
    start = utc(2024, 1, 2, 10)
    moments = [
        *[start + timedelta(minutes=10 * i) for i in range(7)],  # 10:00 to 11:00
        *[utc(2024, 1, 2, 12) + timedelta(minutes=10 * i) for i in range(3)],  # 12:00 to 12:20
        utc(2024, 1, 2, 14, 20),  # silence of exactly 2 hours
    ]
    entries = [{"time": iso(m), "bid": 1.0, "ask": 1.1} for m in moments]
    store.import_json(to_bytes(tick_document(entries)))
    result = store.completeness(BROKER, INSTRUMENT, "ticks", start, utc(2024, 1, 2, 14, 21))
    # 11:00 to 12:00 is exactly one hour: no gap; 12:20 to 14:20 is two hours: a gap
    assert gaps_of(result) == [(utc(2024, 1, 2, 12, 20), utc(2024, 1, 2, 14, 20))]


def test_ticks_before_the_weekend_and_after_it(store: MarketDataStore) -> None:
    moments = [
        utc(2024, 1, 5, 21, 30),
        utc(2024, 1, 5, 21, 59),
        utc(2024, 1, 7, 22, 5),
        utc(2024, 1, 7, 22, 6),
    ]
    entries = [{"time": iso(m), "bid": 1.0, "ask": 1.1} for m in moments]
    store.import_json(to_bytes(tick_document(entries)))
    assert (
        store.completeness(
            BROKER, INSTRUMENT, "ticks", moments[0], moments[-1] + timedelta(milliseconds=1)
        ).missing
        == ()
    )


def test_tick_silence_can_be_set(engine: Any) -> None:
    short = MarketDataStore(engine, rules=CompletenessRules(tick_max_silence_seconds=60))
    entries = [{"time": iso(utc(2024, 1, 2, 10, m)), "bid": 1.0, "ask": 1.1} for m in (0, 1, 5)]
    short.import_json(to_bytes(tick_document(entries)))
    result = short.completeness(
        BROKER, INSTRUMENT, "ticks", utc(2024, 1, 2, 10), utc(2024, 1, 2, 10, 5)
    )
    assert gaps_of(result) == [(utc(2024, 1, 2, 10, 1), utc(2024, 1, 2, 10, 5))]


def test_month_and_week_candles(store: MarketDataStore) -> None:
    put(store, [utc(2024, 1, 1), utc(2024, 2, 1), utc(2024, 4, 1)], unit="mn1")
    result = check(store, utc(2024, 1, 1), utc(2024, 5, 1), "mn1")
    assert result.missing == ()  # March alone is missing: tolerated
    put(store, [utc(2023, 1, 1), utc(2023, 4, 1)], unit="mn1")
    result = check(store, utc(2023, 1, 1), utc(2023, 5, 1), "mn1")
    # February and March are missing; the gap ends at the last trading moment before the
    # weekend that holds April 1st
    assert gaps_of(result) == [(utc(2023, 2, 1), utc(2023, 3, 31, 22))]
    put(store, [utc(2024, 1, 7), utc(2024, 1, 14), utc(2024, 2, 4)], unit="w1")
    result = check(store, utc(2024, 1, 7), utc(2024, 2, 11), "w1")
    assert gaps_of(result) == [(utc(2024, 1, 21, 22), utc(2024, 2, 2, 22))]


def test_time_unit_arithmetic() -> None:
    month = TIME_UNITS["mn1"]
    assert month.add(utc(2024, 1, 31)) == utc(2024, 2, 29)
    assert month.add(utc(2023, 1, 31)) == utc(2023, 2, 28)
    assert month.add(utc(2024, 12, 1)) == utc(2025, 1, 1)
    assert TIME_UNITS["w1"].add(utc(2024, 1, 1)) == utc(2024, 1, 8)
    assert set(TIME_UNITS) == {
        "m1", "m2", "m3", "m4", "m5", "m6", "m10", "m12", "m15", "m20", "m30",
        "h1", "h2", "h3", "h4", "h6", "h8", "h12", "d1", "w1", "mn1",
    }  # fmt: skip


def test_rules_are_checked() -> None:
    with pytest.raises(ValueError, match="weekend"):
        CompletenessRules(weekend_start_minute=100, weekend_end_minute=100)
    with pytest.raises(ValueError, match="tolerated"):
        CompletenessRules(tolerated_missing_candles=-1)
    with pytest.raises(ValueError, match="silence"):
        CompletenessRules(tick_max_silence_seconds=0)
    defaults = CompletenessRules()
    assert (defaults.weekend_start_minute, defaults.weekend_end_minute) == (
        7080,
        9960,
    )  # Friday 22:00 and Sunday 22:00, in minutes from Monday 00:00
    assert (defaults.tolerated_missing_candles, defaults.tick_max_silence_seconds) == (1, 3600)


def test_arguments_are_checked(store: MarketDataStore) -> None:
    with pytest.raises(ValueError, match="time zone"):
        store.completeness(BROKER, INSTRUMENT, "h1", datetime(2024, 1, 1), utc(2024, 1, 2))
    with pytest.raises(ValueError, match="end after"):
        store.completeness(BROKER, INSTRUMENT, "h1", utc(2024, 1, 2), utc(2024, 1, 2))
    with pytest.raises(ValueError, match="time unit"):
        store.completeness(BROKER, INSTRUMENT, "h7", utc(2024, 1, 1), utc(2024, 1, 2))


def test_interval_functions() -> None:
    a, b, c, d = (utc(2024, 1, 1, h) for h in (1, 2, 3, 4))
    assert merge([Interval(c, d), Interval(a, b), Interval(b, c), Interval(d, d)]) == [
        Interval(a, d)
    ]
    assert subtract(Interval(a, d), [Interval(b, c)]) == [Interval(a, b), Interval(c, d)]
    assert subtract(Interval(a, b), [Interval(a, d)]) == []
    assert intersect(Interval(a, c), [Interval(b, d)]) == [Interval(b, c)]
    assert weekends(Interval(utc(2024, 1, 6), utc(2024, 1, 8)), CompletenessRules()) == [
        Interval(utc(2024, 1, 5, 22), utc(2024, 1, 7, 22))
    ]


def test_tick_gaps_function_with_sessions() -> None:
    sessions = [TradingSession(Weekday.TUESDAY, 600, 720)]  # Tuesday 10:00 to 12:00
    window = Interval(utc(2024, 1, 2, 9), utc(2024, 1, 2, 13))
    rules = CompletenessRules(tick_max_silence_seconds=600)
    gaps = tick_gaps([utc(2024, 1, 2, 10, 5), utc(2024, 1, 2, 10, 10)], window, sessions, rules)
    # no tick for more than 10 minutes in the session: 10:10 to 12:00; the rest is outside
    assert gaps == [Interval(utc(2024, 1, 2, 10, 10), utc(2024, 1, 2, 12))]
