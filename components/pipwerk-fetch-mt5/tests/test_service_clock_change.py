"""Tests of the acquisition at a change of the clock of the broker (order 09, finding 1).

An honest gateway is replicated from the true UTC times: every row has a UTC time, its server
time is what the clock of the broker shows then, and a read returns the rows whose server time
lies in the window it is given, however the program cuts the period. What the program has to
deliver is then known without the program: every row whose UTC time lies in ``[start, end)``
and that is not the second occurrence of a repeated hour; the second occurrences in the period
stand under ``omitted``.
"""

from datetime import datetime, timedelta
from itertools import pairwise
from zoneinfo import ZoneInfo

import pytest
from support import ScriptedGateway, candle, make_config, naive, tick, utc

import pipwerk_fetch_mt5.service as service_module
from pipwerk_fetch_mt5.errors import FetchError
from pipwerk_fetch_mt5.service import FetchService
from pipwerk_fetch_mt5.timeconv import format_utc, server_window

HOUR = timedelta(hours=1)
STEP = timedelta(minutes=10)

# (zone, the UTC time at which the clock is put back or forward, the shift)
ATHENS_AUTUMN = ("Europe/Athens", utc(2026, 10, 25, 1, 0), "back")
ATHENS_SPRING = ("Europe/Athens", utc(2027, 3, 28, 1, 0), "forward")
LORD_HOWE_AUTUMN = ("Australia/Lord_Howe", utc(2027, 4, 3, 15, 0), "back")  # half an hour
NEW_YORK_AUTUMN = ("America/New_York", utc(2026, 11, 1, 6, 0), "back")


def server_time(moment: datetime, zone: ZoneInfo) -> datetime:
    return moment.astimezone(zone).replace(tzinfo=None)


def series(change: datetime) -> list[datetime]:
    """The true UTC times every ten minutes from five hours before to five hours after."""
    first = change - 5 * HOUR
    return [first + STEP * number for number in range(10 * 6 + 1)]


def expected(
    moments: list[datetime], zone: ZoneInfo, start: datetime, end: datetime
) -> tuple[list[str], list[str]]:
    """The UTC times delivered and the server times left out, from the true times alone."""
    inside = [moment for moment in moments if start <= moment < end]
    delivered = [format_utc(moment) for moment in inside if moment.astimezone(zone).fold == 0]
    left_out = [
        server_time(moment, zone).strftime("%Y-%m-%dT%H:%M:%S.000")
        for moment in inside
        if moment.astimezone(zone).fold == 1
    ]
    return delivered, left_out


def candle_gateway(moments: list[datetime], zone: ZoneInfo) -> ScriptedGateway:
    return ScriptedGateway(candle_rows=[candle(server_time(m, zone)) for m in moments])


def tick_gateway(moments: list[datetime], zone: ZoneInfo) -> ScriptedGateway:
    return ScriptedGateway(tick_rows=[tick(server_time(m, zone)) for m in moments])


def service_for(gateway: ScriptedGateway, zone: str) -> FetchService:
    return FetchService(gateway, make_config(server_time_zone=zone))


CASES = [ATHENS_AUTUMN, ATHENS_SPRING, LORD_HOWE_AUTUMN, NEW_YORK_AUTUMN]

#: (offset of the start, offset of the end) from the time of the change.
PERIODS = [
    (-3 * HOUR, timedelta(0)),  # the end exactly at the change (01:00Z in Athens)
    (-3 * HOUR, timedelta(minutes=30)),  # the end in the second hour (01:30Z)
    (-3 * HOUR, HOUR),  # the end at the end of the second hour (02:00Z)
    (-3 * HOUR, 3 * HOUR),
    (-timedelta(minutes=30), 3 * HOUR),  # the start in the first hour
    (timedelta(0), 3 * HOUR),  # the start exactly at the change
    (timedelta(minutes=30), 3 * HOUR),  # the start in the second hour
    (HOUR, 3 * HOUR),
    (-timedelta(minutes=20), timedelta(minutes=20)),  # a short period over the change
    (-timedelta(minutes=50), timedelta(minutes=10)),
]


@pytest.mark.parametrize("period", PERIODS)
@pytest.mark.parametrize("case", CASES)
@pytest.mark.parametrize("hours", [1, 2, 3, 5, 6])
def test_ticks_lose_no_row_whatever_the_step_is_cut(
    case: tuple[str, datetime, str],
    period: tuple[timedelta, timedelta],
    hours: int,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    zone_name, change, _kind = case
    zone = ZoneInfo(zone_name)
    monkeypatch.setattr(service_module, "TICK_CHUNK_HOURS", hours)
    start, end = change + period[0], change + period[1]
    moments = series(change)
    response = service_for(tick_gateway(moments, zone), zone_name).ticks("EURUSD", start, end)
    want, want_omitted = expected(moments, zone, start, end)
    assert [row.time for row in response.file.ticks] == want
    assert [row.server_time for row in response.omitted] == want_omitted
    assert response.omitted_count == len(want_omitted)
    assert {row.reason for row in response.omitted} <= {"double_local_time"}


@pytest.mark.parametrize("period", PERIODS)
@pytest.mark.parametrize("case", CASES)
@pytest.mark.parametrize("bars", [2, 3, 5, 6, 7, 9, 18])
def test_candles_lose_no_row_whatever_the_step_is_cut(
    case: tuple[str, datetime, str],
    period: tuple[timedelta, timedelta],
    bars: int,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    zone_name, change, _kind = case
    zone = ZoneInfo(zone_name)
    monkeypatch.setattr(service_module, "CANDLE_CHUNK", bars)
    start, end = change + period[0], change + period[1]
    moments = series(change)
    response = service_for(candle_gateway(moments, zone), zone_name).candles(
        "EURUSD", "m10", start, end
    )
    want, want_omitted = expected(moments, zone, start, end)
    assert [row.time for row in response.file.candles] == want
    assert [row.server_time for row in response.omitted] == want_omitted
    assert response.omitted_count == len(want_omitted)


def test_the_cases_of_the_report_athens_25_october_2026() -> None:
    """Ends at exactly 01:00Z, 01:30Z and 02:00Z, with candles and with ticks: the whole first
    hour (00:00Z to 00:59Z) is delivered; only the second (01:00Z to 01:59Z) is left out."""
    zone = ZoneInfo("Europe/Athens")
    moments = series(ATHENS_AUTUMN[1])
    start = utc(2026, 10, 24, 22, 0)
    for end in (utc(2026, 10, 25, 1, 0), utc(2026, 10, 25, 1, 30), utc(2026, 10, 25, 2, 0)):
        candles = service_for(candle_gateway(moments, zone), "Europe/Athens").candles(
            "EURUSD", "m10", start, end
        )
        ticks = service_for(tick_gateway(moments, zone), "Europe/Athens").ticks(
            "EURUSD", start, end
        )
        for times, response in (
            ([row.time for row in candles.file.candles], candles),
            ([row.time for row in ticks.file.ticks], ticks),
        ):
            first_hour = [text for text in times if text.startswith("2026-10-25T00:")]
            assert len(first_hour) == 6, end  # 00:00Z to 00:50Z, none lost
            second_hour = {f"2026-10-25T03:{minute:02d}:00.000" for minute in range(0, 60, 10)}
            assert {row.server_time for row in response.omitted} <= second_hour
            assert response.omitted_count == int((end - utc(2026, 10, 25, 1, 0)) / STEP)


def test_a_short_last_step_from_18_30z_to_01_30z_with_ticks() -> None:
    zone = ZoneInfo("Europe/Athens")
    moments = [utc(2026, 10, 24, 18, 30) + timedelta(minutes=5 * n) for n in range(0, 100)]
    start, end = utc(2026, 10, 24, 18, 30), utc(2026, 10, 25, 1, 30)
    response = service_for(tick_gateway(moments, zone), "Europe/Athens").ticks("EURUSD", start, end)
    want, want_omitted = expected(moments, zone, start, end)
    assert len(response.file.ticks) == len(want) == 12 * 6 + 6  # 18:30Z to 01:00Z
    assert [row.time for row in response.file.ticks] == want
    assert response.omitted_count == len(want_omitted) == 6  # 01:00Z to 01:25Z


def test_candles_in_the_first_hour_are_kept_when_the_period_ends_in_the_second() -> None:
    """The same with the gateway of the tests of the first report: it returns more than it
    is asked for (all rows)."""
    zone = ZoneInfo("Europe/Athens")
    moments = series(ATHENS_AUTUMN[1])
    gateway = candle_gateway(moments, zone)
    gateway.return_all = True
    start, end = utc(2026, 10, 24, 22, 0), utc(2026, 10, 25, 1, 30)
    response = service_for(gateway, "Europe/Athens").candles("EURUSD", "m10", start, end)
    want, want_omitted = expected(moments, zone, start, end)
    assert [row.time for row in response.file.candles] == want
    assert response.omitted_count == len(want_omitted) == 3


def test_a_zone_without_summer_time_reads_exactly_the_period() -> None:
    zone = ZoneInfo("Asia/Tokyo")
    change = utc(2026, 10, 25, 1, 0)
    moments = series(change)
    start, end = change - 2 * HOUR, change + 2 * HOUR
    gateway = tick_gateway(moments, zone)
    response = service_for(gateway, "Asia/Tokyo").ticks("EURUSD", start, end)
    want, want_omitted = expected(moments, zone, start, end)
    assert [row.time for row in response.file.ticks] == want
    assert want_omitted == []
    assert response.omitted_count == 0
    assert response.omitted == []
    # no widening: the windows are the steps in server time, one after the other
    windows = [(call[1], call[2]) for call in gateway.tick_calls]
    assert windows[0][0] == naive(2026, 10, 25, 8, 0)
    assert windows[-1][1] == naive(2026, 10, 25, 12, 0)
    assert all(a[1] == b[0] for a, b in pairwise(windows))


def test_the_window_is_the_period_in_server_time_without_a_change_of_the_offset() -> None:
    zone = ZoneInfo("Europe/Athens")
    low, high = server_window(utc(2026, 1, 5, 10, 0), utc(2026, 1, 5, 16, 0), zone)
    assert (low, high) == (naive(2026, 1, 5, 12, 0), naive(2026, 1, 5, 18, 0))


def test_the_window_is_wider_where_the_clock_is_put_back() -> None:
    zone = ZoneInfo("Europe/Athens")
    # The end 01:30Z is 03:30 EET, but the first 03:30 EEST (00:30Z) lies before it: the window
    # reaches to the end of the first occurrence, 04:30.
    low, high = server_window(utc(2026, 10, 25, 0, 0), utc(2026, 10, 25, 1, 30), zone)
    assert low <= naive(2026, 10, 25, 2, 0)  # the start 00:00Z is 03:00 EEST
    assert high >= naive(2026, 10, 25, 3, 59, 59)


# --- the clocks put forward: the hour that does not exist ---------------------------------------


@pytest.mark.parametrize("hours", [1, 2, 3, 5])
@pytest.mark.parametrize(
    "end_minutes", [-30, 0, 30, 60, 90]
)  # the end before, at and after the jump (01:00Z)
def test_the_end_at_the_jump_forward_loses_no_row(
    end_minutes: int, hours: int, monkeypatch: pytest.MonkeyPatch
) -> None:
    zone = ZoneInfo("Europe/Athens")
    change = ATHENS_SPRING[1]
    monkeypatch.setattr(service_module, "TICK_CHUNK_HOURS", hours)
    moments = series(change)
    start, end = change - 3 * HOUR, change + timedelta(minutes=end_minutes)
    response = service_for(tick_gateway(moments, zone), "Europe/Athens").ticks("EURUSD", start, end)
    want, _ = expected(moments, zone, start, end)
    assert [row.time for row in response.file.ticks] == want
    assert response.omitted_count == 0


@pytest.mark.parametrize("hours", [1, 2, 3, 5])
def test_rows_in_the_missing_hour_are_each_counted_by_one_step(
    hours: int, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A gateway that returns rows for the hour that does not exist (03:00 to 03:50 on 28
    March 2027 in Athens): every one is named once, whatever the steps are."""
    zone = ZoneInfo("Europe/Athens")
    monkeypatch.setattr(service_module, "TICK_CHUNK_HOURS", hours)
    change = ATHENS_SPRING[1]
    real = [tick(server_time(m, zone)) for m in series(change)]
    missing = [tick(naive(2027, 3, 28, 3, minute)) for minute in range(0, 60, 10)]
    rows = sorted(real + missing, key=lambda row: row.time)
    gateway = ScriptedGateway(tick_rows=rows)
    response = service_for(gateway, "Europe/Athens").ticks(
        "EURUSD", change - 3 * HOUR, change + 3 * HOUR
    )
    assert response.omitted_count == 6
    assert sorted(row.server_time for row in response.omitted) == [
        f"2027-03-28T03:{minute:02d}:00.000" for minute in range(0, 60, 10)
    ]
    assert {row.reason for row in response.omitted} == {"time_does_not_exist"}
    assert len(response.file.ticks) == 6 * 6  # 3 hours before and 3 after, every 10 minutes


# --- the limit of the reads -----------------------------------------------------------------------


def test_a_period_of_130_years_of_ticks_starts_no_read() -> None:
    gateway = ScriptedGateway()
    with pytest.raises(FetchError) as error:
        service_for(gateway, "UTC").ticks("EURUSD", utc(1970, 1, 1), utc(2100, 1, 1))
    assert error.value.code == "range_too_large"
    assert gateway.tick_calls == []


@pytest.mark.parametrize("max_reads, hours, allowed", [(4, 24, True), (4, 25, False)])
def test_the_number_of_reads_is_limited_before_the_first_read(
    max_reads: int, hours: int, allowed: bool
) -> None:
    gateway = ScriptedGateway(tick_rows=[tick(naive(2026, 1, 5, 1, 0))])
    service = FetchService(gateway, make_config(max_reads=max_reads))
    start = utc(2026, 1, 5)
    if allowed:
        service.ticks("EURUSD", start, start + timedelta(hours=hours))
        assert len(gateway.tick_calls) == 4
    else:
        with pytest.raises(FetchError) as error:
            service.ticks("EURUSD", start, start + timedelta(hours=hours))
        assert error.value.code == "range_too_large"
        assert gateway.tick_calls == []


def test_the_reads_of_candles_are_limited_too() -> None:
    gateway = ScriptedGateway(candle_rows=[candle(naive(2026, 1, 5, 0, 0))])
    service = FetchService(gateway, make_config(max_reads=1, max_rows=1_000_000))
    with pytest.raises(FetchError) as error:
        # 15000 bars of one minute need two reads of at most 10000 bars
        service.candles("EURUSD", "m1", utc(2026, 1, 5), utc(2026, 1, 5) + timedelta(minutes=15000))
    assert error.value.code == "range_too_large"
    assert gateway.candle_calls == []
    # the largest period of one read is read
    service.candles("EURUSD", "m1", utc(2026, 1, 5), utc(2026, 1, 5) + timedelta(minutes=10000))
    assert len(gateway.candle_calls) == 1


def test_the_default_limit_allows_a_long_period_of_candles() -> None:
    gateway = ScriptedGateway(candle_rows=[candle(naive(2026, 1, 5, 0, 0))])
    service = FetchService(gateway, make_config())
    service.candles("EURUSD", "d1", utc(1970, 1, 1), utc(2100, 1, 1))
    assert len(gateway.candle_calls) == 5  # 47482 daily bars in steps of 10000
