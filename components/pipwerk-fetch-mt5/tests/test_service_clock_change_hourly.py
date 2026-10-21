"""Candles of one hour and coarser at a change of the clock (order 10, finding 1).

With h1 and coarser a pass of the repeated hour has one row only: the second row has the same
server time as the first, so the server time never falls. The tests use the honest gateway of
``test_service_clock_change.py`` (rows from true UTC times, the server time is what the clock of
the broker shows) and check ``omitted`` (reason, number, server time) and every delivered row.
"""

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import pytest
from support import ScriptedGateway, candle, naive, tick, utc
from test_service_clock_change import (
    ATHENS_AUTUMN,
    HOUR,
    LORD_HOWE_AUTUMN,
    NEW_YORK_AUTUMN,
    PERIODS,
    candle_gateway,
    expected,
    service_for,
    tick_gateway,
)

import pipwerk_fetch_mt5.service as service_module
from pipwerk_fetch_mt5.errors import FetchError
from pipwerk_fetch_mt5.gateway import TimeUnit
from pipwerk_fetch_mt5.timeconv import format_utc

UNIT_STEP = {
    "m1": timedelta(minutes=1),
    "m30": timedelta(minutes=30),
    "h1": HOUR,
    "h4": 4 * HOUR,
    "d1": 24 * HOUR,
}


def grid(change: datetime, unit: str) -> list[datetime]:
    """One candle per time unit on the grid of the true UTC time, from midnight (UTC) of the
    day before the change for three days."""
    step = UNIT_STEP[unit]
    first = change.replace(hour=0, minute=0, second=0) - timedelta(days=1)
    return [first + step * n for n in range(int(timedelta(days=3) / step))]


REPORT_PERIODS = [
    (utc(2026, 10, 24, 19, 0), utc(2026, 10, 25, 4, 0)),
    (utc(2026, 10, 24, 19, 0), utc(2026, 10, 25, 0, 30)),
    (utc(2026, 10, 25, 1, 0), utc(2026, 10, 25, 4, 0)),
]


@pytest.mark.parametrize("period", REPORT_PERIODS)
def test_h1_in_athens_the_second_candle_is_named_once_and_only_in_the_period(
    period: tuple[datetime, datetime],
) -> None:
    zone = ZoneInfo("Europe/Athens")
    moments = grid(ATHENS_AUTUMN[1], "h1")
    start, end = period
    response = service_for(candle_gateway(moments, zone), "Europe/Athens").candles(
        "EURUSD", "h1", start, end
    )
    second = utc(2026, 10, 25, 1, 0)
    want = [m for m in moments if start <= m < end and m != second]
    assert [row.time for row in response.file.candles] == [format_utc(m) for m in want]
    in_period = start <= second < end
    assert response.omitted_count == (1 if in_period else 0)
    assert [(row.server_time, row.reason) for row in response.omitted] == (
        [("2026-10-25T03:00:00.000", "double_local_time")] if in_period else []
    )


ZONES = [
    ATHENS_AUTUMN,
    ("Europe/London", utc(2026, 10, 25, 1, 0), "back"),
    NEW_YORK_AUTUMN,
    LORD_HOWE_AUTUMN,
]


@pytest.mark.parametrize("cut", [1, 2, 3, 100])
@pytest.mark.parametrize("period", PERIODS)
@pytest.mark.parametrize("unit", ["m1", "m30", "h1", "h4", "d1"])
@pytest.mark.parametrize("case", ZONES)
def test_candles_of_every_unit_name_the_second_hour_exactly_once(
    case: tuple[str, datetime, str],
    unit: TimeUnit,
    period: tuple[timedelta, timedelta],
    cut: int,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    zone_name, change, _kind = case
    zone = ZoneInfo(zone_name)
    if zone_name == "Australia/Lord_Howe" and unit == "h1":
        pytest.skip("covered below: the grid in UTC puts a candle on a half hour of the clock")
    monkeypatch.setattr(service_module, "CANDLE_CHUNK", cut)
    start, end = change + period[0], change + period[1]
    moments = grid(change, unit)
    service = service_for(candle_gateway(moments, zone), zone_name)
    want, want_omitted = expected(moments, zone, start, end)
    if not want:  # a period without a candle to deliver
        with pytest.raises(FetchError) as error:
            service.candles("EURUSD", unit, start, end)
        assert error.value.code == "no_data"
        return
    response = service.candles("EURUSD", unit, start, end)
    assert [row.time for row in response.file.candles] == want
    assert [row.server_time for row in response.omitted] == want_omitted
    assert response.omitted_count == len(want_omitted)
    assert {row.reason for row in response.omitted} <= {"double_local_time"}


def test_h1_in_lord_howe_with_candles_on_the_server_hour_loses_and_names_nothing() -> None:
    """The broker puts h1 candles on the full hour of its clock; the repeated time in Lord
    Howe is half an hour (01:30 to 02:00), which holds no candle of h1."""
    change = LORD_HOWE_AUTUMN[1]
    times = [naive(2027, 4, 3, 22) + HOUR * n for n in range(-12, 9)]  # 10:00 to 06:00
    gateway = ScriptedGateway(candle_rows=[candle(t) for t in times])
    response = service_for(gateway, "Australia/Lord_Howe").candles(
        "EURUSD", "h1", change - 8 * HOUR, change + 8 * HOUR
    )
    assert response.omitted_count == 0
    assert len(response.file.candles) > 10
    stamps = [row.time for row in response.file.candles]
    assert stamps == sorted(set(stamps))


def test_an_equal_server_time_outside_the_repeated_hour_stays_a_duplicate() -> None:
    rows = [
        candle(naive(2026, 10, 24, 12)),
        candle(naive(2026, 10, 24, 12)),
        candle(naive(2026, 10, 24, 13)),
    ]
    response = service_for(ScriptedGateway(candle_rows=rows), "Europe/Athens").candles(
        "EURUSD", "h1", utc(2026, 10, 24, 8), utc(2026, 10, 24, 12)
    )
    assert [row.reason for row in response.omitted] == ["duplicate_time"]
    assert len(response.file.candles) == 2


def test_ticks_with_the_same_server_time_in_the_repeated_hour_are_not_a_second_pass() -> None:
    """Several ticks may share a server time within a pass; only a falling time shows the
    second pass of ticks."""
    same = naive(2026, 10, 25, 3, 10)
    rows = [tick(same), tick(same), tick(naive(2026, 10, 25, 3, 20))]
    response = service_for(ScriptedGateway(tick_rows=rows), "Europe/Athens").ticks(
        "EURUSD", utc(2026, 10, 24, 23), utc(2026, 10, 25, 1)
    )
    assert len(response.file.ticks) == 3
    assert response.omitted_count == 0


def test_ticks_in_a_thin_market_cannot_be_told_apart_and_arrive_an_hour_early() -> None:
    """The rest risk of the documentation (section 5): the last tick of the first hour is
    earlier than a tick of the second, so the server time never falls and nothing shows it."""
    zone = ZoneInfo("Europe/Athens")
    first = utc(2026, 10, 25, 0, 54)  # 03:54, first hour
    second = utc(2026, 10, 25, 1, 57)  # 03:57, second hour
    response = service_for(tick_gateway([first, second], zone), "Europe/Athens").ticks(
        "EURUSD", utc(2026, 10, 24, 23), utc(2026, 10, 25, 3)
    )
    assert [row.time for row in response.file.ticks] == [
        "2026-10-25T00:54:00.000Z",
        "2026-10-25T00:57:00.000Z",  # should be 01:57Z: an hour early, without a note
    ]
    assert response.omitted_count == 0
