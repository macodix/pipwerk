"""Tests of the conversion between server time and UTC (specification 5.1).

Zone of the examples: Europe/Athens (EET, UTC+2, and EEST, UTC+3 in summer time), a zone that
brokers use as server time. In 2026 the clocks were put forward on Sunday 29 March at 03:00
(to 04:00) and put back on Sunday 25 October at 04:00 (to 03:00).
"""

from datetime import UTC, datetime
from zoneinfo import ZoneInfo

import pytest
from support import naive, utc

from pipwerk_fetch_mt5.timeconv import format_utc, server_to_utc, utc_to_server

ATHENS = ZoneInfo("Europe/Athens")


def test_winter_time_is_two_hours_ahead_of_utc() -> None:
    assert server_to_utc(naive(2026, 1, 5, 10, 0), ATHENS) == utc(2026, 1, 5, 8, 0)


def test_summer_time_is_three_hours_ahead_of_utc() -> None:
    assert server_to_utc(naive(2026, 7, 6, 10, 0), ATHENS) == utc(2026, 7, 6, 7, 0)


def test_the_utc_zone_changes_nothing() -> None:
    assert server_to_utc(naive(2026, 7, 6, 10, 0), ZoneInfo("UTC")) == utc(2026, 7, 6, 10, 0)


def test_milliseconds_are_kept() -> None:
    result = server_to_utc(datetime(2026, 1, 5, 10, 0, 0, 123000), ATHENS)
    assert result == datetime(2026, 1, 5, 8, 0, 0, 123000, tzinfo=UTC)


def test_a_time_that_does_not_exist_cannot_be_converted() -> None:
    # 29 March 2026: 03:00 to 03:59 does not exist, the clocks jumped from 03:00 to 04:00.
    assert server_to_utc(naive(2026, 3, 29, 3, 0), ATHENS) is None
    assert server_to_utc(naive(2026, 3, 29, 3, 30), ATHENS) is None
    assert server_to_utc(naive(2026, 3, 29, 3, 59, 59), ATHENS) is None


def test_the_times_around_the_missing_hour_exist() -> None:
    assert server_to_utc(naive(2026, 3, 29, 2, 59), ATHENS) == utc(2026, 3, 29, 0, 59)
    assert server_to_utc(naive(2026, 3, 29, 4, 0), ATHENS) == utc(2026, 3, 29, 1, 0)


def test_a_time_that_occurs_twice_counts_as_the_earlier_one() -> None:
    # 25 October 2026: 03:00 to 03:59 occurs twice. The earlier one is summer time (UTC+3).
    assert server_to_utc(naive(2026, 10, 25, 3, 0), ATHENS) == utc(2026, 10, 25, 0, 0)
    assert server_to_utc(naive(2026, 10, 25, 3, 30), ATHENS) == utc(2026, 10, 25, 0, 30)
    assert server_to_utc(naive(2026, 10, 25, 3, 59, 59), ATHENS) == utc(2026, 10, 25, 0, 59, 59)


def test_the_times_around_the_double_hour_are_unambiguous() -> None:
    assert server_to_utc(naive(2026, 10, 25, 2, 59), ATHENS) == utc(2026, 10, 24, 23, 59)
    assert server_to_utc(naive(2026, 10, 25, 4, 0), ATHENS) == utc(2026, 10, 25, 2, 0)


def test_a_server_time_with_a_time_zone_is_refused() -> None:
    with pytest.raises(ValueError, match="no time zone"):
        server_to_utc(utc(2026, 1, 5, 10, 0), ATHENS)


def test_utc_to_server_time() -> None:
    assert utc_to_server(utc(2026, 1, 5, 8, 0), ATHENS) == naive(2026, 1, 5, 10, 0)
    assert utc_to_server(utc(2026, 7, 6, 7, 0), ATHENS) == naive(2026, 7, 6, 10, 0)


def test_utc_to_server_time_at_the_changes_is_unambiguous() -> None:
    assert utc_to_server(utc(2026, 3, 29, 0, 59), ATHENS) == naive(2026, 3, 29, 2, 59)
    assert utc_to_server(utc(2026, 3, 29, 1, 0), ATHENS) == naive(2026, 3, 29, 4, 0)
    assert utc_to_server(utc(2026, 10, 25, 0, 30), ATHENS) == naive(2026, 10, 25, 3, 30)
    assert utc_to_server(utc(2026, 10, 25, 1, 30), ATHENS) == naive(2026, 10, 25, 3, 30)


def test_a_utc_time_without_a_time_zone_is_refused() -> None:
    with pytest.raises(ValueError, match="has a time zone"):
        utc_to_server(naive(2026, 1, 5, 8, 0), ATHENS)


def test_format_utc_has_milliseconds_and_a_trailing_z() -> None:
    assert format_utc(utc(2026, 1, 5, 8, 0)) == "2026-01-05T08:00:00.000Z"
    assert (
        format_utc(datetime(2026, 1, 5, 8, 0, 1, 123456, tzinfo=UTC)) == "2026-01-05T08:00:01.123Z"
    )
    other = datetime(2026, 1, 5, 10, 0, tzinfo=ATHENS)
    assert format_utc(other) == "2026-01-05T08:00:00.000Z"
