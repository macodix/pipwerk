"""Completeness (specification 5.2): covered periods, times without trade, gaps between covered
periods, holidays, early close of trading, check before a test run."""

from datetime import datetime, timedelta
from typing import Any

import pytest

from pipwerk_marketdata import (
    CalendarDay,
    Completeness,
    CompletenessRules,
    Interval,
    MarketDataStore,
    MissingPart,
    MissingReason,
    TradingSession,
    Weekday,
)
from pipwerk_marketdata.completeness import (
    combine,
    intersect,
    merge,
    no_trading_days,
    subtract,
    trading_parts,
    weekends,
)
from pipwerk_marketdata.timeunits import TIME_UNITS
from tests.helpers import (
    BROKER,
    INSTRUMENT,
    candle_document,
    candle_entry,
    iso,
    tick_document,
    to_bytes,
    utc,
)

HOUR = timedelta(hours=1)
CSV_HEADER = "<DATE>\t<TIME>\t<OPEN>\t<HIGH>\t<LOW>\t<CLOSE>\t<TICKVOL>\t<VOL>\t<SPREAD>"
ATHENS = "Europe/Athens"  # UTC+2 in winter, as the server of many brokers
HOLIDAYS = CompletenessRules(no_trading_days=(CalendarDay(12, 25), CalendarDay(1, 1)))


@pytest.fixture
def holiday_store(engine: Any) -> MarketDataStore:
    """A data store with the days without trade 25 December and 1 January."""
    return MarketDataStore(engine, max_page_size=100, rules=HOLIDAYS)


def period(start: datetime, end: datetime) -> dict[str, str]:
    return {"start": iso(start), "end": iso(end)}


def put(
    store: MarketDataStore,
    start: datetime,
    end: datetime,
    unit: str = "h1",
    times: list[datetime] | None = None,
    **document: Any,
) -> None:
    """A JSON file of candles that covers ``start`` to ``end`` and has candles at ``times``
    (default: only the first hour)."""
    entries = [candle_entry(moment) for moment in (times if times is not None else [start])]
    store.import_json(
        to_bytes(candle_document(entries, time_unit=unit, period=period(start, end), **document))
    )


def csv_file(*rows: str) -> bytes:
    return ("\r\n".join([CSV_HEADER, *rows]) + "\r\n").encode("utf-8")


def csv_row(date: str, clock: str) -> str:
    return f"{date}\t{clock}\t1.10\t1.12\t1.09\t1.11\t50\t0\t7"


def put_csv(store: MarketDataStore, *rows: str, timezone: str = ATHENS) -> None:
    store.import_csv(
        csv_file(*rows),
        kind="candles",
        broker=BROKER,
        instrument=INSTRUMENT,
        time_unit="m1",
        timezone=timezone,
    )


def check(store: MarketDataStore, start: datetime, end: datetime, unit: str = "h1") -> Completeness:
    return store.completeness(BROKER, INSTRUMENT, unit, start, end)


def gaps_of(result: Completeness) -> list[tuple[datetime, datetime]]:
    return [(part.start, part.end) for part in result.missing if part.reason is MissingReason.GAP]


# --- inside a covered period there is no gap --------------------------------------------------


def test_inside_a_covered_period_nothing_is_a_gap(store: MarketDataStore) -> None:
    # one candle in a period of a week: what the file delivers for its period is complete
    put(store, utc(2024, 1, 2), utc(2024, 1, 5))
    result = check(store, utc(2024, 1, 2), utc(2024, 1, 5))
    assert result.missing == ()
    assert result.complete
    assert result.present == (Interval(utc(2024, 1, 2), utc(2024, 1, 5)),)
    assert not result.uses_trading_hours


def test_a_holiday_inside_a_covered_period_is_no_gap(holiday_store: MarketDataStore) -> None:
    # candles on 23 and 27 December, nothing on 24 to 26 December, one file for the whole period
    times = [utc(2024, 12, 23, 10), utc(2024, 12, 27, 10)]
    put(holiday_store, utc(2024, 12, 23), utc(2024, 12, 28), times=times)
    assert check(holiday_store, utc(2024, 12, 23), utc(2024, 12, 28)).missing == ()
    assert holiday_store.list_series().items[0].gap_count == 0


def test_the_declared_period_covers_what_the_candles_do_not(store: MarketDataStore) -> None:
    put(store, utc(2024, 1, 2, 10), utc(2024, 1, 2, 13), times=[utc(2024, 1, 2, 10)])
    assert check(store, utc(2024, 1, 2, 10), utc(2024, 1, 2, 13)).missing == ()
    result = check(store, utc(2024, 1, 2, 10), utc(2024, 1, 2, 14))
    assert result.missing == (
        MissingPart(utc(2024, 1, 2, 13), utc(2024, 1, 2, 14), MissingReason.NOT_COVERED),
    )


def test_a_covered_period_without_candles_is_complete(store: MarketDataStore) -> None:
    store.import_json(
        to_bytes(
            candle_document(
                [],
                time_unit="h1",
                period=period(utc(2024, 1, 2, 10), utc(2024, 1, 2, 14)),
            )
        )
    )
    assert check(store, utc(2024, 1, 2, 10), utc(2024, 1, 2, 14)).missing == ()


def test_without_a_period_the_file_covers_its_first_to_its_last_candle(
    store: MarketDataStore,
) -> None:
    store.import_json(
        to_bytes(
            candle_document(
                [candle_entry(utc(2024, 1, 2, 10)), candle_entry(utc(2024, 1, 2, 12))],
                time_unit="h1",
            )
        )
    )
    assert store.overview().series[0].covered == (
        Interval(utc(2024, 1, 2, 10), utc(2024, 1, 2, 13)),
    )
    assert check(store, utc(2024, 1, 2, 10), utc(2024, 1, 2, 13)).missing == ()


# --- between covered periods ------------------------------------------------------------------


def test_the_weekend_between_two_covered_periods_is_no_gap(store: MarketDataStore) -> None:
    put(store, utc(2024, 1, 1), utc(2024, 1, 5, 22))  # Monday to Friday 22:00
    put(store, utc(2024, 1, 7, 22), utc(2024, 1, 9))  # Sunday 22:00 to Tuesday
    result = check(store, utc(2024, 1, 1), utc(2024, 1, 9))
    assert result.missing == ()
    assert result.present == (Interval(utc(2024, 1, 1), utc(2024, 1, 9)),)


def test_a_hole_around_the_weekend_is_a_gap_outside_the_weekend(store: MarketDataStore) -> None:
    put(store, utc(2024, 1, 1), utc(2024, 1, 5, 19))
    put(store, utc(2024, 1, 7, 22), utc(2024, 1, 9))
    result = check(store, utc(2024, 1, 1), utc(2024, 1, 9))
    assert gaps_of(result) == [(utc(2024, 1, 5, 19), utc(2024, 1, 5, 22))]
    assert store.list_series().items[0].gap_count == 1


def test_a_trading_day_that_is_not_imported_between_two_periods_is_a_gap(
    store: MarketDataStore,
) -> None:
    put(store, utc(2024, 1, 1), utc(2024, 1, 2))
    put(store, utc(2024, 1, 4), utc(2024, 1, 5))
    result = check(store, utc(2024, 1, 1), utc(2024, 1, 5))
    assert gaps_of(result) == [(utc(2024, 1, 2), utc(2024, 1, 4))]
    assert not result.complete
    assert result.present == (
        Interval(utc(2024, 1, 1), utc(2024, 1, 2)),
        Interval(utc(2024, 1, 4), utc(2024, 1, 5)),
    )


def test_a_gap_over_a_weekend_reaches_from_the_first_to_the_last_trading_moment(
    store: MarketDataStore,
) -> None:
    put(store, utc(2024, 1, 1), utc(2024, 1, 4))
    put(store, utc(2024, 1, 9), utc(2024, 1, 10))
    gaps = check(store, utc(2024, 1, 1), utc(2024, 1, 10))
    assert gaps_of(gaps) == [(utc(2024, 1, 4), utc(2024, 1, 9))]


def test_a_day_without_trade_between_two_periods_is_no_gap(
    holiday_store: MarketDataStore,
) -> None:
    # the day without trade reaches from 24 December 22:00 UTC to 25 December 22:00 UTC
    put(holiday_store, utc(2024, 12, 23), utc(2024, 12, 24, 22))
    put(holiday_store, utc(2024, 12, 25, 22), utc(2024, 12, 27))
    assert check(holiday_store, utc(2024, 12, 23), utc(2024, 12, 27)).missing == ()


def test_a_hole_that_is_larger_than_the_day_without_trade_is_a_gap(
    holiday_store: MarketDataStore,
) -> None:
    put(holiday_store, utc(2024, 12, 23), utc(2024, 12, 24, 18))
    put(holiday_store, utc(2024, 12, 26), utc(2024, 12, 27))
    result = check(holiday_store, utc(2024, 12, 23), utc(2024, 12, 27))
    # trading time before the day without trade (18:00 to 22:00) and after it (22:00 to 26 Dec)
    assert gaps_of(result) == [(utc(2024, 12, 24, 18), utc(2024, 12, 26))]


def test_without_the_days_the_same_hole_is_a_gap(store: MarketDataStore) -> None:
    put(store, utc(2024, 12, 23), utc(2024, 12, 24, 22))
    put(store, utc(2024, 12, 25, 22), utc(2024, 12, 27))
    assert gaps_of(check(store, utc(2024, 12, 23), utc(2024, 12, 27))) == [
        (utc(2024, 12, 24, 22), utc(2024, 12, 25, 22))
    ]


def test_trading_hours_make_the_times_between_the_sessions_times_without_trade(
    store: MarketDataStore,
) -> None:
    sessions = [{"weekday": d.value, "from": "01:00", "to": "23:00"} for d in list(Weekday)[:5]]
    put(store, utc(2024, 1, 2, 1), utc(2024, 1, 2, 23), trading_hours=sessions)
    put(store, utc(2024, 1, 3, 1), utc(2024, 1, 3, 23), trading_hours=sessions)
    result = check(store, utc(2024, 1, 2, 1), utc(2024, 1, 3, 23))
    assert result.uses_trading_hours
    assert result.missing == ()  # the pause from 23:00 to 01:00 is a time without trade
    put(store, utc(2024, 1, 4, 10), utc(2024, 1, 4, 23), trading_hours=sessions)
    # a hole inside a session is a gap: Wednesday 23:00 to Thursday 10:00 minus the pause
    assert gaps_of(check(store, utc(2024, 1, 3), utc(2024, 1, 5))) == [
        (utc(2024, 1, 4, 1), utc(2024, 1, 4, 10))
    ]


def test_trading_hours_make_weekend_and_sunday_evening_precise(store: MarketDataStore) -> None:
    sessions = [
        *[{"weekday": d.value, "from": "00:00", "to": "24:00"} for d in list(Weekday)[:4]],
        {"weekday": "friday", "from": "00:00", "to": "21:00"},
        {"weekday": "sunday", "from": "23:00", "to": "24:00"},
    ]
    # the broker closes Friday 21:00 and opens Sunday 23:00; the default weekend would call
    # Friday 21:00 to 22:00 a gap and Sunday 22:00 to 23:00 missing
    put(store, utc(2024, 1, 5), utc(2024, 1, 5, 21), trading_hours=sessions)
    put(store, utc(2024, 1, 7, 23), utc(2024, 1, 8, 12), trading_hours=sessions)
    result = check(store, utc(2024, 1, 5), utc(2024, 1, 8, 12))
    assert result.missing == ()


# --- CSV files: whole days in the time zone of the import ---------------------------------------


def test_a_csv_file_covers_whole_days_of_its_time_zone(store: MarketDataStore) -> None:
    put_csv(store, csv_row("2024.01.02", "10:00:00"), csv_row("2024.01.03", "09:30:00"))
    # Athens is UTC+2: 2 January 00:00 local is 1 January 22:00 UTC, 4 January 00:00 local is
    # 3 January 22:00 UTC
    assert store.overview().series[0].covered == (
        Interval(utc(2024, 1, 1, 22), utc(2024, 1, 3, 22)),
    )


def test_a_csv_file_of_ticks_covers_whole_days(store: MarketDataStore) -> None:
    data = (
        b"<DATE>\t<TIME>\t<BID>\t<ASK>\t<LAST>\t<VOLUME>\t<FLAGS>\r\n"
        b"2024.01.02\t10:00:00.250\t1.1\t1.2\t\t\t6\r\n"
    )
    store.import_csv(
        data, kind="ticks", broker=BROKER, instrument=INSTRUMENT, timezone="America/New_York"
    )
    # New York is UTC-5: 2 January 00:00 local is 05:00 UTC
    assert store.overview().series[0].covered == (Interval(utc(2024, 1, 2, 5), utc(2024, 1, 3, 5)),)


def test_a_long_candle_extends_the_period_of_a_csv_file(store: MarketDataStore) -> None:
    store.import_csv(
        csv_file(csv_row("2024.01.01", "00:00:00")),
        kind="candles",
        broker=BROKER,
        instrument=INSTRUMENT,
        time_unit="w1",
        timezone="UTC",
    )
    assert store.overview().series[0].covered == (Interval(utc(2024, 1, 1), utc(2024, 1, 8)),)


def test_early_close_on_the_last_day_of_a_csv_file_is_no_gap(
    holiday_store: MarketDataStore,
) -> None:
    # the file ends on 24 December at 17:30 local time (15:30 UTC), before the close of trading
    put_csv(holiday_store, csv_row("2024.12.24", "09:00:00"), csv_row("2024.12.24", "17:30:00"))
    result = holiday_store.completeness(
        BROKER, INSTRUMENT, "m1", utc(2024, 12, 24, 15, 31), utc(2024, 12, 24, 22)
    )
    assert result.missing == ()


@pytest.mark.parametrize(
    ("last_day_before", "first_day_after"),
    [("2024.12.24", "2024.12.26"), ("2024.12.31", "2025.01.02")],
)
def test_holidays_between_two_csv_files_are_no_gaps(
    holiday_store: MarketDataStore, last_day_before: str, first_day_after: str
) -> None:
    put_csv(
        holiday_store, csv_row(last_day_before, "09:00:00"), csv_row(last_day_before, "17:30:00")
    )
    put_csv(
        holiday_store, csv_row(first_day_after, "01:00:00"), csv_row(first_day_after, "09:00:00")
    )
    overview = holiday_store.overview().series[0]
    assert len(overview.covered) == 2
    assert overview.missing == ()
    assert holiday_store.list_series().items[0].gap_count == 0
    result = holiday_store.completeness(
        BROKER, INSTRUMENT, "m1", overview.covered[0].start, overview.covered[1].end
    )
    assert result.missing == ()


def test_a_trading_day_that_is_not_imported_between_two_csv_files_is_a_gap(
    holiday_store: MarketDataStore,
) -> None:
    put_csv(holiday_store, csv_row("2024.12.17", "09:00:00"))  # Tuesday
    put_csv(holiday_store, csv_row("2024.12.19", "09:00:00"))  # Thursday, Wednesday is missing
    overview = holiday_store.overview().series[0]
    # Wednesday 18 December 00:00 to 19 December 00:00 local time, in UTC two hours earlier
    assert [(part.start, part.end, part.reason) for part in overview.missing] == [
        (utc(2024, 12, 17, 22), utc(2024, 12, 18, 22), MissingReason.GAP)
    ]
    assert holiday_store.list_series().items[0].gap_count == 1


def test_the_time_zone_of_the_import_decides_the_day(holiday_store: MarketDataStore) -> None:
    # With UTC instead of the time zone of the server the files cover 24 December up to 25
    # December 00:00 UTC and from 26 December 00:00 UTC. The day without trade ends 25 December
    # 22:00 UTC, so the last two hours before the second file remain a gap (the limit named in
    # specification 5.2).
    put_csv(holiday_store, csv_row("2024.12.24", "09:00:00"), timezone="UTC")
    put_csv(holiday_store, csv_row("2024.12.26", "09:00:00"), timezone="UTC")
    overview = holiday_store.overview().series[0]
    assert [(part.start, part.end) for part in overview.missing] == [
        (utc(2024, 12, 25, 22), utc(2024, 12, 26))
    ]


# --- check before a test run ----------------------------------------------------------------------


def test_a_test_period_that_starts_on_a_day_without_trade_needs_no_data_before_the_day_ends(
    holiday_store: MarketDataStore,
) -> None:
    put_csv(holiday_store, csv_row("2025.01.02", "01:00:00"), csv_row("2025.01.03", "20:00:00"))
    # 1 January 00:00 UTC: the day without trade lasts until 22:00 UTC, the data begin at
    # 1 January 22:00 UTC (2 January 00:00 local time)
    result = holiday_store.completeness(
        BROKER, INSTRUMENT, "m1", utc(2025, 1, 1), utc(2025, 1, 3, 12)
    )
    assert result.missing == ()
    assert result.complete


def test_a_test_period_ahead_of_the_data_and_after_a_trading_day_misses_the_data(
    holiday_store: MarketDataStore,
) -> None:
    put_csv(holiday_store, csv_row("2025.01.02", "01:00:00"))
    result = holiday_store.completeness(
        BROKER, INSTRUMENT, "m1", utc(2024, 12, 30), utc(2025, 1, 2, 12)
    )
    # 30 December 00:00 to 31 December 22:00 is trading time and not covered
    assert result.missing == (
        MissingPart(utc(2024, 12, 30), utc(2024, 12, 31, 22), MissingReason.NOT_COVERED),
    )


def test_what_no_import_covers_is_missing_with_its_reason(store: MarketDataStore) -> None:
    put(store, utc(2024, 1, 2, 10), utc(2024, 1, 2, 14))
    put(store, utc(2024, 1, 2, 16), utc(2024, 1, 2, 18))
    result = check(store, utc(2024, 1, 2, 9), utc(2024, 1, 2, 19))
    assert result.missing == (
        MissingPart(utc(2024, 1, 2, 9), utc(2024, 1, 2, 10), MissingReason.NOT_COVERED),
        MissingPart(utc(2024, 1, 2, 14), utc(2024, 1, 2, 16), MissingReason.GAP),
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


def test_coverage_of_overlapping_and_touching_imports_is_joined(store: MarketDataStore) -> None:
    put(store, utc(2024, 1, 2, 10), utc(2024, 1, 2, 13))
    put(store, utc(2024, 1, 2, 13), utc(2024, 1, 2, 16))  # touches
    put(store, utc(2024, 1, 2, 12), utc(2024, 1, 2, 14))  # overlaps
    overview = store.overview().series[0]
    assert overview.covered == (Interval(utc(2024, 1, 2, 10), utc(2024, 1, 2, 16)),)
    assert overview.missing == ()


def test_ticks_follow_the_same_rule(store: MarketDataStore) -> None:
    moments = [utc(2024, 1, 2, 10), utc(2024, 1, 2, 10, 5), utc(2024, 1, 2, 14)]
    entries = [{"time": iso(m), "bid": 1.0, "ask": 1.1} for m in moments]
    store.import_json(to_bytes(tick_document(entries)))
    # the file covers 10:00 to 14:00:00.001; silence inside it is no gap
    result = store.completeness(
        BROKER, INSTRUMENT, "ticks", utc(2024, 1, 2, 10), utc(2024, 1, 2, 14)
    )
    assert result.missing == ()
    assert store.list_series().items[0].gap_count == 0


# --- functions and rules --------------------------------------------------------------------------


def test_days_without_trade_reach_from_the_evening_before() -> None:
    window = Interval(utc(2024, 12, 20), utc(2025, 1, 5))
    assert no_trading_days(window, HOLIDAYS) == [
        Interval(utc(2024, 12, 24, 22), utc(2024, 12, 25, 22)),
        Interval(utc(2024, 12, 31, 22), utc(2025, 1, 1, 22)),
    ]
    # a window that begins inside the evening before a day sees the day
    window = Interval(utc(2024, 12, 31, 23), utc(2025, 1, 1))
    assert no_trading_days(window, HOLIDAYS) == [
        Interval(utc(2024, 12, 31, 22), utc(2025, 1, 1, 22))
    ]
    assert no_trading_days(Interval(utc(2024, 12, 26), utc(2024, 12, 31)), HOLIDAYS) == []
    assert no_trading_days(window, CompletenessRules()) == []


def test_the_29th_of_february_counts_in_leap_years_only() -> None:
    rules = CompletenessRules(no_trading_days=(CalendarDay(2, 29),))
    assert no_trading_days(Interval(utc(2024, 2, 1), utc(2024, 3, 31)), rules) == [
        Interval(utc(2024, 2, 28, 22), utc(2024, 2, 29, 22))
    ]
    assert no_trading_days(Interval(utc(2023, 2, 1), utc(2023, 3, 31)), rules) == []


def test_trading_parts_leave_out_weekend_and_days_without_trade() -> None:
    hole = Interval(utc(2024, 12, 24, 20), utc(2024, 12, 26))
    assert trading_parts(hole, None, HOLIDAYS) == [
        Interval(utc(2024, 12, 24, 20), utc(2024, 12, 24, 22)),
        Interval(utc(2024, 12, 25, 22), utc(2024, 12, 26)),
    ]
    sessions = [TradingSession(Weekday.TUESDAY, 600, 720)]  # Tuesday 10:00 to 12:00
    parts = trading_parts(Interval(utc(2024, 12, 24), utc(2024, 12, 25)), sessions, HOLIDAYS)
    assert parts == [Interval(utc(2024, 12, 24, 10), utc(2024, 12, 24, 12))]


def test_combine_without_covered_periods_misses_the_trading_time() -> None:
    present, missing = combine(
        Interval(utc(2024, 1, 5, 20), utc(2024, 1, 6)), [], None, CompletenessRules()
    )
    assert present == [Interval(utc(2024, 1, 5, 22), utc(2024, 1, 6))]
    assert missing == [
        MissingPart(utc(2024, 1, 5, 20), utc(2024, 1, 5, 22), MissingReason.NOT_COVERED)
    ]


def test_rules_are_checked() -> None:
    with pytest.raises(ValueError, match="weekend"):
        CompletenessRules(weekend_start_minute=100, weekend_end_minute=100)
    with pytest.raises(ValueError, match="boundary"):
        CompletenessRules(no_trading_day_boundary_minute=1440)
    with pytest.raises(ValueError, match="day of the year"):
        CalendarDay(2, 30)
    with pytest.raises(ValueError, match="day of the year"):
        CalendarDay(13, 1)
    defaults = CompletenessRules()
    assert (defaults.weekend_start_minute, defaults.weekend_end_minute) == (
        7080,
        9960,
    )  # Friday 22:00 and Sunday 22:00, in minutes from Monday 00:00
    assert defaults.no_trading_days == ()  # the library has no list of holidays
    assert defaults.no_trading_day_boundary_minute == 22 * 60


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
