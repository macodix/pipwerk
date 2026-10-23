"""Tests of the acquisition (``service.py``) against a gateway the test scripts.

Every kind (candles, ticks, details), every error reason of the service, the table of
designations, the conversion of server time with a change of summer time, the limits and the
division of a large period into reads.
"""

from dataclasses import replace
from datetime import UTC, datetime, timedelta, timezone

import pytest
from support import (
    EURUSD,
    ScriptedGateway,
    candle,
    make_config,
    minutes,
    naive,
    tick,
    utc,
)

from pipwerk_fetch_mt5.errors import FetchError
from pipwerk_fetch_mt5.gateway import RawSession
from pipwerk_fetch_mt5.models import CandleSeriesResponse, TickSeriesResponse
from pipwerk_fetch_mt5.service import CANDLE_CHUNK, MAX_REPORTED, FetchService


def service(gateway: ScriptedGateway, **changes: object) -> FetchService:
    return FetchService(gateway, make_config(**changes))


# --- candles -------------------------------------------------------------------------------------


def test_candles_come_in_utc_with_the_fields_of_the_import() -> None:
    gateway = ScriptedGateway(
        candle_rows=[candle(naive(2026, 1, 5, 10, 0), 1.1, 12), candle(naive(2026, 1, 5, 10, 1))]
    )
    response = service(gateway, server_time_zone="Europe/Athens").candles(
        "EURUSD", "m1", utc(2026, 1, 5, 8, 0), utc(2026, 1, 5, 8, 2)
    )
    file = response.file
    assert (file.kind, file.broker, file.instrument, file.time_unit) == (
        "candles",
        "Test-Server",
        "EURUSD",
        "m1",
    )
    assert [row.time for row in file.candles] == [
        "2026-01-05T08:00:00.000Z",
        "2026-01-05T08:01:00.000Z",
    ]
    first = file.candles[0]
    assert (first.open, first.high, first.low, first.close) == pytest.approx(
        (1.1, 1.101, 1.099, 1.1005)
    )
    assert (first.volume, first.spread) == (100, 12)
    assert response.omitted_count == 0
    assert response.omitted == []


def test_a_spread_that_is_not_delivered_stays_empty() -> None:
    gateway = ScriptedGateway(candle_rows=[candle(naive(2026, 1, 5, 10, 0), spread=None)])
    response = service(gateway).candles(
        "EURUSD", "m1", utc(2026, 1, 5, 10, 0), utc(2026, 1, 5, 10, 1)
    )
    assert response.file.candles[0].spread is None


def test_the_end_of_the_period_is_excluded_and_the_start_included() -> None:
    gateway = ScriptedGateway(
        candle_rows=[candle(moment) for moment in minutes(naive(2026, 1, 5, 10, 0), 5)]
    )
    response = service(gateway).candles(
        "EURUSD", "m1", utc(2026, 1, 5, 10, 1), utc(2026, 1, 5, 10, 4)
    )
    assert [row.time for row in response.file.candles] == [
        "2026-01-05T10:01:00.000Z",
        "2026-01-05T10:02:00.000Z",
        "2026-01-05T10:03:00.000Z",
    ]


def test_a_period_with_another_zone_is_converted_to_utc() -> None:
    gateway = ScriptedGateway(candle_rows=[candle(naive(2026, 1, 5, 10, 0))])
    plus_two = timezone(timedelta(hours=2))
    start = datetime(2026, 1, 5, 12, 0, tzinfo=plus_two)
    end = datetime(2026, 1, 5, 12, 5, tzinfo=plus_two)
    response = service(gateway).candles("EURUSD", "m1", start, end)
    assert response.file.candles[0].time == "2026-01-05T10:00:00.000Z"
    assert gateway.candle_calls[0][2:] == (naive(2026, 1, 5, 10, 0), naive(2026, 1, 5, 10, 5))


@pytest.mark.parametrize("time_unit", ["m1", "m5", "h1", "d1", "mn1"])
def test_every_time_unit_is_passed_on(time_unit: str) -> None:
    gateway = ScriptedGateway(candle_rows=[candle(naive(2026, 1, 1, 0, 0))])
    response = service(gateway).candles(
        "EURUSD",
        time_unit,  # type: ignore[arg-type]
        utc(2026, 1, 1, 0, 0),
        utc(2026, 2, 1, 0, 0),
    )
    assert response.file.time_unit == time_unit
    assert gateway.candle_calls[0][1] == time_unit


def test_the_summer_time_change_in_spring_leaves_out_the_missing_times() -> None:
    # 29 March 2026, Athens: 03:00 to 03:59 does not exist.
    gateway = ScriptedGateway(
        candle_rows=[candle(moment) for moment in minutes(naive(2026, 3, 29, 1, 0), 8, step=30)]
    )
    response = service(gateway, server_time_zone="Europe/Athens").candles(
        "EURUSD", "m30", utc(2026, 3, 28, 23, 0), utc(2026, 3, 29, 2, 0)
    )
    assert [row.time for row in response.file.candles] == [
        "2026-03-28T23:00:00.000Z",  # 01:00 EET
        "2026-03-28T23:30:00.000Z",  # 01:30
        "2026-03-29T00:00:00.000Z",  # 02:00
        "2026-03-29T00:30:00.000Z",  # 02:30
        "2026-03-29T01:00:00.000Z",  # 04:00 EEST
        "2026-03-29T01:30:00.000Z",  # 04:30
    ]
    assert response.omitted_count == 2
    assert [(row.server_time, row.reason) for row in response.omitted] == [
        ("2026-03-29T03:00:00.000", "time_does_not_exist"),
        ("2026-03-29T03:30:00.000", "time_does_not_exist"),
    ]


def test_the_summer_time_change_in_autumn_takes_the_earlier_time_once() -> None:
    # 25 October 2026, Athens: 03:00 to 03:59 occurs twice. The clock of the broker shows
    # 02:00, 02:30, 03:00, 03:30, 03:00, 03:30, 04:00, 04:30.
    wall = [
        naive(2026, 10, 25, 2, 0),
        naive(2026, 10, 25, 2, 30),
        naive(2026, 10, 25, 3, 0),
        naive(2026, 10, 25, 3, 30),
        naive(2026, 10, 25, 3, 0),
        naive(2026, 10, 25, 3, 30),
        naive(2026, 10, 25, 4, 0),
        naive(2026, 10, 25, 4, 30),
    ]
    gateway = ScriptedGateway(candle_rows=[candle(moment) for moment in wall])
    response = service(gateway, server_time_zone="Europe/Athens").candles(
        "EURUSD", "m30", utc(2026, 10, 24, 23, 0), utc(2026, 10, 25, 3, 0)
    )
    assert [row.time for row in response.file.candles] == [
        "2026-10-24T23:00:00.000Z",  # 02:00 EEST
        "2026-10-24T23:30:00.000Z",
        "2026-10-25T00:00:00.000Z",  # 03:00 EEST, the earlier one
        "2026-10-25T00:30:00.000Z",
        "2026-10-25T02:00:00.000Z",  # 04:00 EET
        "2026-10-25T02:30:00.000Z",
    ]
    assert response.omitted_count == 2
    assert {row.reason for row in response.omitted} == {"double_local_time"}
    assert len({row.time for row in response.file.candles}) == len(response.file.candles)


def test_a_read_that_begins_in_the_second_occurrence_leaves_it_out() -> None:
    # The period starts at 01:00 UTC = the second 03:00 (EET). The clock shows 03:00, 03:30
    # (first occurrence), 03:00, 03:30 (second occurrence) and 04:00. The first occurrence
    # lies before the period and is not delivered; the second is left out and counted, not
    # shifted to the UTC times of the first.
    gateway = ScriptedGateway(
        candle_rows=[
            candle(naive(2026, 10, 25, 3, 0)),
            candle(naive(2026, 10, 25, 3, 30)),
            candle(naive(2026, 10, 25, 3, 0)),
            candle(naive(2026, 10, 25, 3, 30)),
            candle(naive(2026, 10, 25, 4, 0)),
        ]
    )
    response = service(gateway, server_time_zone="Europe/Athens").candles(
        "EURUSD", "m30", utc(2026, 10, 25, 1, 0), utc(2026, 10, 25, 3, 0)
    )
    assert [row.time for row in response.file.candles] == ["2026-10-25T02:00:00.000Z"]
    assert response.omitted_count == 2


def test_a_candle_with_the_time_of_the_candle_before_is_left_out() -> None:
    gateway = ScriptedGateway(
        candle_rows=[candle(naive(2026, 1, 5, 10, 0)), candle(naive(2026, 1, 5, 10, 0), 2.0)]
    )
    response = service(gateway).candles(
        "EURUSD", "m1", utc(2026, 1, 5, 10, 0), utc(2026, 1, 5, 10, 5)
    )
    assert len(response.file.candles) == 1
    assert response.file.candles[0].open == 1.1
    assert [row.reason for row in response.omitted] == ["duplicate_time"]


@pytest.mark.parametrize("price", [0.0, -1.0, float("nan"), float("inf")])
def test_a_candle_without_valid_prices_is_left_out(price: float) -> None:
    good = candle(naive(2026, 1, 5, 10, 1))
    bad = candle(naive(2026, 1, 5, 10, 0), price=price)
    gateway = ScriptedGateway(candle_rows=[bad, good])
    response = service(gateway).candles(
        "EURUSD", "m1", utc(2026, 1, 5, 10, 0), utc(2026, 1, 5, 10, 5)
    )
    assert [row.time for row in response.file.candles] == ["2026-01-05T10:01:00.000Z"]
    assert [row.reason for row in response.omitted] == ["invalid_price"]


def test_only_the_first_omitted_rows_are_named_but_all_are_counted() -> None:
    rows = [candle(moment, price=0.0) for moment in minutes(naive(2026, 1, 5, 0, 0), 300)]
    rows.append(candle(naive(2026, 1, 5, 9, 0)))
    gateway = ScriptedGateway(candle_rows=rows)
    response = service(gateway).candles(
        "EURUSD", "m1", utc(2026, 1, 5, 0, 0), utc(2026, 1, 6, 0, 0)
    )
    assert response.omitted_count == 300
    assert len(response.omitted) == MAX_REPORTED


def test_no_candles_is_the_error_no_data() -> None:
    gateway = ScriptedGateway()
    with pytest.raises(FetchError) as error:
        service(gateway).candles("EURUSD", "m1", utc(2026, 1, 5, 10, 0), utc(2026, 1, 5, 11, 0))
    assert error.value.code == "no_data"


def test_a_period_with_more_candles_than_allowed_is_refused_before_reading() -> None:
    gateway = ScriptedGateway(candle_rows=[candle(naive(2026, 1, 5, 10, 0))])
    with pytest.raises(FetchError) as error:
        service(gateway, max_rows=1000).candles(
            "EURUSD", "m1", utc(2026, 1, 5, 0, 0), utc(2026, 1, 7, 0, 0)
        )
    assert error.value.code == "range_too_large"
    assert gateway.candle_calls == []


def test_the_largest_allowed_period_is_delivered() -> None:
    gateway = ScriptedGateway(
        candle_rows=[candle(moment) for moment in minutes(naive(2026, 1, 5, 0, 0), 60)]
    )
    response = service(gateway, max_rows=60).candles(
        "EURUSD", "m1", utc(2026, 1, 5, 0, 0), utc(2026, 1, 5, 1, 0)
    )
    assert len(response.file.candles) == 60


def test_a_large_period_is_read_in_several_steps_without_gap_or_overlap() -> None:
    total = CANDLE_CHUNK * 2 + 500
    rows = [candle(moment) for moment in minutes(naive(2026, 1, 5, 0, 0), total)]
    gateway = ScriptedGateway(candle_rows=rows, return_all=True)  # returns more than asked
    end = utc(2026, 1, 5, 0, 0) + timedelta(minutes=total)
    response = service(gateway, max_rows=total).candles("EURUSD", "m1", utc(2026, 1, 5, 0, 0), end)
    assert len(response.file.candles) == total
    times = [row.time for row in response.file.candles]
    assert times == sorted(set(times))
    assert len(gateway.candle_calls) == 3
    windows = [(call[2], call[3]) for call in gateway.candle_calls]
    assert windows[0][0] == naive(2026, 1, 5, 0, 0)
    assert windows[0][1] == windows[1][0]
    assert windows[1][1] == windows[2][0]
    assert windows[2][1] == naive(2026, 1, 5, 0, 0) + timedelta(minutes=total)
    assert response.omitted_count == 0


def test_rows_outside_of_the_period_that_the_gateway_adds_are_ignored() -> None:
    rows = [candle(moment) for moment in minutes(naive(2026, 1, 5, 9, 58), 10)]
    gateway = ScriptedGateway(candle_rows=rows, return_all=True)
    response = service(gateway).candles(
        "EURUSD", "m1", utc(2026, 1, 5, 10, 0), utc(2026, 1, 5, 10, 3)
    )
    assert [row.time[11:16] for row in response.file.candles] == ["10:00", "10:01", "10:02"]
    assert response.omitted_count == 0


# --- ticks ---------------------------------------------------------------------------------------


def test_ticks_come_in_utc_with_milliseconds() -> None:
    gateway = ScriptedGateway(
        tick_rows=[
            tick(datetime(2026, 1, 5, 10, 0, 0, 123000), 1.1, 1.1002),
            tick(datetime(2026, 1, 5, 10, 0, 0, 456000), 1.1001, 1.1003),
        ]
    )
    response = service(gateway, server_time_zone="Europe/Athens").ticks(
        "EURUSD", utc(2026, 1, 5, 8, 0), utc(2026, 1, 5, 8, 1)
    )
    assert response.file.kind == "ticks"
    assert [(row.time, row.bid, row.ask) for row in response.file.ticks] == [
        ("2026-01-05T08:00:00.123Z", 1.1, 1.1002),
        ("2026-01-05T08:00:00.456Z", 1.1001, 1.1003),
    ]


def test_ticks_in_the_same_millisecond_are_all_kept() -> None:
    moment = datetime(2026, 1, 5, 10, 0, 0, 5000)
    gateway = ScriptedGateway(tick_rows=[tick(moment, 1.1), tick(moment, 1.2), tick(moment, 1.3)])
    response = service(gateway).ticks("EURUSD", utc(2026, 1, 5, 10, 0), utc(2026, 1, 5, 11, 0))
    assert [row.bid for row in response.file.ticks] == [1.1, 1.2, 1.3]


def test_a_tick_without_positive_prices_is_left_out() -> None:
    gateway = ScriptedGateway(
        tick_rows=[
            tick(naive(2026, 1, 5, 10, 0, 1), 0.0, 1.1),
            tick(naive(2026, 1, 5, 10, 0, 2), 1.1, 0.0),
            tick(naive(2026, 1, 5, 10, 0, 3), float("nan"), 1.1),
            tick(naive(2026, 1, 5, 10, 0, 4)),
        ]
    )
    response = service(gateway).ticks("EURUSD", utc(2026, 1, 5, 10, 0), utc(2026, 1, 5, 11, 0))
    assert len(response.file.ticks) == 1
    assert response.omitted_count == 3
    assert {row.reason for row in response.omitted} == {"invalid_price"}


def test_ticks_around_the_summer_time_changes() -> None:
    gateway = ScriptedGateway(
        tick_rows=[
            tick(naive(2026, 3, 29, 2, 59, 59)),
            tick(naive(2026, 3, 29, 3, 30)),
            tick(naive(2026, 3, 29, 4, 0, 1)),
        ]
    )
    response = service(gateway, server_time_zone="Europe/Athens").ticks(
        "EURUSD", utc(2026, 3, 28, 23, 0), utc(2026, 3, 29, 2, 0)
    )
    assert [row.time for row in response.file.ticks] == [
        "2026-03-29T00:59:59.000Z",
        "2026-03-29T01:00:01.000Z",
    ]
    assert [row.reason for row in response.omitted] == ["time_does_not_exist"]

    autumn = ScriptedGateway(
        tick_rows=[
            tick(naive(2026, 10, 25, 3, 40)),
            tick(naive(2026, 10, 25, 3, 50)),
            tick(naive(2026, 10, 25, 3, 40)),  # the second 03:40 (EET)
            tick(naive(2026, 10, 25, 4, 5)),
        ]
    )
    response = service(autumn, server_time_zone="Europe/Athens").ticks(
        "EURUSD", utc(2026, 10, 25, 0, 0), utc(2026, 10, 25, 3, 0)
    )
    assert [row.time for row in response.file.ticks] == [
        "2026-10-25T00:40:00.000Z",
        "2026-10-25T00:50:00.000Z",
        "2026-10-25T02:05:00.000Z",
    ]
    assert [row.reason for row in response.omitted] == ["double_local_time"]


def test_ticks_are_read_in_steps_of_six_hours() -> None:
    gateway = ScriptedGateway(
        tick_rows=[tick(naive(2026, 1, 5, 1, 0)), tick(naive(2026, 1, 5, 23, 0))]
    )
    response = service(gateway).ticks("EURUSD", utc(2026, 1, 5, 0, 0), utc(2026, 1, 6, 0, 0))
    assert len(response.file.ticks) == 2
    assert len(gateway.tick_calls) == 4
    assert gateway.tick_calls[0][1:] == (naive(2026, 1, 5, 0, 0), naive(2026, 1, 5, 6, 0))
    assert gateway.tick_calls[3][1:] == (naive(2026, 1, 5, 18, 0), naive(2026, 1, 6, 0, 0))


def test_more_ticks_than_allowed_are_refused() -> None:
    rows = [tick(naive(2026, 1, 5, 10, 0, second)) for second in range(30)]
    gateway = ScriptedGateway(tick_rows=rows)
    with pytest.raises(FetchError) as error:
        service(gateway, max_rows=20).ticks(
            "EURUSD", utc(2026, 1, 5, 10, 0), utc(2026, 1, 5, 11, 0)
        )
    assert error.value.code == "range_too_large"


def test_rows_after_the_first_step_are_counted_and_stop_the_reading() -> None:
    rows = [tick(naive(2026, 1, 5, hour, 0)) for hour in range(0, 24, 3)]
    gateway = ScriptedGateway(tick_rows=rows)
    with pytest.raises(FetchError, match="range_too_large"):
        service(gateway, max_rows=3).ticks("EURUSD", utc(2026, 1, 5, 0, 0), utc(2026, 1, 6, 0, 0))
    assert len(gateway.tick_calls) < 4


def test_no_ticks_is_the_error_no_data() -> None:
    with pytest.raises(FetchError) as error:
        service(ScriptedGateway()).ticks("EURUSD", utc(2026, 1, 5, 10, 0), utc(2026, 1, 5, 11, 0))
    assert error.value.code == "no_data"


# --- details of the instrument -------------------------------------------------------------------


def test_the_details_of_the_instrument_with_the_time_of_the_acquisition() -> None:
    moment = datetime(2026, 10, 21, 9, 30, 15, 250000, tzinfo=UTC)
    gateway = ScriptedGateway(margin=1100.0)
    response = FetchService(
        gateway, make_config(server_time_zone="Europe/Athens"), clock=lambda: moment
    ).instrument_details("EURUSD")
    file = response.file
    assert (file.version, file.kind) == (1, "instrument")
    assert (file.broker, file.instrument) == ("Test-Server", "EURUSD")
    assert file.acquired_at == "2026-10-21T09:30:15.250Z"
    assert file.contract_size == 100000.0
    assert (file.tick_size, file.tick_value, file.tick_value_currency) == (0.00001, 1.0, "USD")
    assert file.point == 0.00001
    assert file.pip == 0.0001  # ten points: the symbol has five digits
    assert file.spread == 0.00012  # 12 points as a price difference
    assert (file.min_volume, file.volume_step) == (0.01, 0.01)
    assert (file.swap_long, file.swap_short) == (-6.5, 1.2)
    assert file.swap_triple_weekday == "wednesday"
    assert file.margin_per_lot == 1100.0
    assert response.omitted_count == 0


@pytest.mark.parametrize(
    ("digits", "point", "pip", "spread_points", "spread"),
    [
        (5, 0.00001, 0.0001, 12, 0.00012),
        (3, 0.001, 0.01, 18, 0.018),
        (4, 0.0001, 0.0001, 2, 0.0002),
        (2, 0.01, 0.01, 40, 0.4),
        (0, 1.0, 1.0, 3, 3.0),
    ],
)
def test_the_pip_and_the_spread_follow_the_digits_of_the_symbol(
    digits: int, point: float, pip: float, spread_points: int, spread: float
) -> None:
    info = replace(EURUSD, digits=digits, point=point, tick_size=point, spread=spread_points)
    response = service(ScriptedGateway(symbols={"EURUSD": info})).instrument_details("EURUSD")
    assert response.file.pip == pip
    assert response.file.spread == spread


def test_the_margin_calculated_by_the_terminal_is_preferred_to_the_one_of_the_symbol() -> None:
    info = replace(EURUSD, margin_initial=1300.0)
    gateway = ScriptedGateway(symbols={"EURUSD": info}, margin=1100.0)
    assert service(gateway).instrument_details("EURUSD").file.margin_per_lot == 1100.0


def test_without_a_calculated_margin_the_one_of_the_symbol_counts() -> None:
    info = replace(EURUSD, margin_initial=1300.0)
    for calculated in (None, float("nan"), float("inf"), -5.0):
        gateway = ScriptedGateway(symbols={"EURUSD": info}, margin=calculated)
        assert service(gateway).instrument_details("EURUSD").file.margin_per_lot == 1300.0


def test_without_any_margin_the_field_is_empty() -> None:
    for calculated in (None, float("nan"), float("inf"), -5.0):
        response = service(ScriptedGateway(margin=calculated)).instrument_details("EURUSD")
        assert response.file.margin_per_lot is None
    nothing = replace(EURUSD, margin_initial=float("nan"))
    gateway = ScriptedGateway(symbols={"EURUSD": nothing}, margin=None)
    assert service(gateway).instrument_details("EURUSD").file.margin_per_lot is None


@pytest.mark.parametrize(
    "change",
    [
        {"tick_size": 0.0},
        {"tick_value": 0.0},
        {"tick_value": float("nan")},
        {"point": 0.0},
        {"min_volume": 0.0},
        {"volume_step": -0.01},
        {"contract_size": 0.0},
        {"contract_size": float("inf")},
        {"swap_long": float("nan")},
        {"spread": -1},
        {"digits": -1},
        {"tick_value_currency": ""},
        {"tick_value_currency": "U"},
        {"tick_value_currency": "USD EUR"},
    ],
)
def test_details_the_import_would_refuse_are_the_error_invalid_broker_data(
    change: dict[str, object],
) -> None:
    info = replace(EURUSD, **change)  # type: ignore[arg-type]
    with pytest.raises(FetchError) as error:
        service(ScriptedGateway(symbols={"EURUSD": info})).instrument_details("EURUSD")
    assert error.value.code == "invalid_broker_data"


# --- trading hours ---------------------------------------------------------------------------


SESSIONS = [
    *(RawSession(day, "00:00", "24:00") for day in ("monday", "tuesday", "wednesday", "thursday")),
    RawSession("friday", "00:00", "22:00"),
    RawSession("sunday", "22:00", "24:00"),
]


def hours_of(
    response: CandleSeriesResponse | TickSeriesResponse,
) -> list[tuple[str, str, str]] | None:
    hours = response.file.trading_hours
    return None if hours is None else [(item.weekday, item.from_, item.to) for item in hours]


def candle_request(gateway: ScriptedGateway, zone: str) -> CandleSeriesResponse:
    return service(gateway, server_time_zone=zone).candles(
        "EURUSD", "m1", utc(2026, 1, 5, 10, 0), utc(2026, 1, 5, 10, 5)
    )


def test_the_trading_hours_are_given_in_utc_in_the_files_of_candles_and_ticks() -> None:
    gateway = ScriptedGateway(
        candle_rows=[candle(naive(2026, 1, 5, 10, 0))],
        tick_rows=[tick(naive(2026, 1, 5, 10, 0, 1))],
        session_rows=SESSIONS,
    )
    expected = [(day, "00:00", "24:00") for day in ("monday", "tuesday", "wednesday", "thursday")]
    expected += [("friday", "00:00", "22:00"), ("sunday", "22:00", "24:00")]
    assert hours_of(candle_request(gateway, "UTC")) == expected
    ticks = service(gateway).ticks("EURUSD", utc(2026, 1, 5, 10, 0), utc(2026, 1, 5, 11, 0))
    assert hours_of(ticks) == expected


def test_sessions_are_moved_by_the_offset_and_split_at_midnight() -> None:
    # A broker in UTC+2 all year (Africa/Johannesburg has no summer time): the week opens on
    # Sunday 22:00 server time = 20:00 UTC and closes on Friday 22:00 = 20:00 UTC.
    gateway = ScriptedGateway(candle_rows=[candle(naive(2026, 1, 5, 12, 0))], session_rows=SESSIONS)
    response = candle_request(gateway, "Africa/Johannesburg")
    assert hours_of(response) == [
        ("sunday", "22:00", "24:00"),  # monday 00:00-02:00 server time is sunday 22:00-24:00
        ("monday", "00:00", "22:00"),
        ("monday", "22:00", "24:00"),  # the rest of monday and tuesday 00:00-02:00
        ("tuesday", "00:00", "22:00"),
        ("tuesday", "22:00", "24:00"),
        ("wednesday", "00:00", "22:00"),
        ("wednesday", "22:00", "24:00"),
        ("thursday", "00:00", "22:00"),
        ("thursday", "22:00", "24:00"),
        ("friday", "00:00", "20:00"),
        ("sunday", "20:00", "22:00"),
    ]


def test_with_summer_time_the_files_carry_no_trading_hours() -> None:
    gateway = ScriptedGateway(candle_rows=[candle(naive(2026, 1, 5, 12, 0))], session_rows=SESSIONS)
    assert hours_of(candle_request(gateway, "Europe/Athens")) is None


def test_without_trading_hours_of_the_source_the_files_carry_none() -> None:
    gateway = ScriptedGateway(candle_rows=[candle(naive(2026, 1, 5, 10, 0))])
    assert hours_of(candle_request(gateway, "UTC")) is None


def test_the_period_of_the_file_is_the_period_asked_for() -> None:
    gateway = ScriptedGateway(
        candle_rows=[candle(naive(2026, 1, 5, 10, 0))],
        tick_rows=[tick(naive(2026, 1, 5, 10, 0, 1))],
    )
    candles = candle_request(gateway, "UTC")
    assert (candles.file.period.start, candles.file.period.end) == (
        "2026-01-05T10:00:00.000Z",
        "2026-01-05T10:05:00.000Z",
    )
    plus_two = timezone(timedelta(hours=2))
    ticks = service(gateway).ticks(
        "EURUSD",
        datetime(2026, 1, 5, 12, 0, tzinfo=plus_two),
        datetime(2026, 1, 5, 13, 30, 0, 500000, tzinfo=plus_two),
    )
    assert (ticks.file.period.start, ticks.file.period.end) == (
        "2026-01-05T10:00:00.000Z",
        "2026-01-05T11:30:00.500Z",
    )


# --- designations, symbols and errors ------------------------------------------------------------


def test_the_table_maps_the_designation_to_the_symbol_of_the_broker() -> None:
    gateway = ScriptedGateway(
        symbols={"EURUSD.r": EURUSD}, candle_rows=[candle(naive(2026, 1, 5, 10, 0))]
    )
    config = make_config(symbols={"EURUSD": "EURUSD.r"})
    response = FetchService(gateway, config).candles(
        "EURUSD", "m1", utc(2026, 1, 5, 10, 0), utc(2026, 1, 5, 11, 0)
    )
    assert response.file.instrument == "EURUSD"  # the file keeps the designation
    assert gateway.candle_calls[0][0] == "EURUSD.r"
    assert gateway.selected == ["EURUSD.r"]


def test_without_an_entry_the_designation_is_the_symbol() -> None:
    gateway = ScriptedGateway(candle_rows=[candle(naive(2026, 1, 5, 10, 0))])
    service(gateway, symbols={"GBPUSD": "GBPUSD.r"}).candles(
        "EURUSD", "m1", utc(2026, 1, 5, 10, 0), utc(2026, 1, 5, 11, 0)
    )
    assert gateway.candle_calls[0][0] == "EURUSD"


def test_a_symbol_the_broker_does_not_know_is_the_error_symbol_unknown() -> None:
    gateway = ScriptedGateway()
    for call in (
        lambda: service(gateway).candles(
            "XXXYYY", "m1", utc(2026, 1, 5, 10, 0), utc(2026, 1, 5, 11, 0)
        ),
        lambda: service(gateway).ticks("XXXYYY", utc(2026, 1, 5, 10, 0), utc(2026, 1, 5, 11, 0)),
        lambda: service(gateway).instrument_details("XXXYYY"),
    ):
        with pytest.raises(FetchError) as error:
            call()
        assert error.value.code == "symbol_unknown"
    assert gateway.candle_calls == []
    assert gateway.selected == []


def test_a_mapped_symbol_the_broker_does_not_know_is_symbol_unknown() -> None:
    gateway = ScriptedGateway()
    with pytest.raises(FetchError) as error:
        service(gateway, symbols={"EURUSD": "EURUSD.zz"}).instrument_details("EURUSD")
    assert error.value.code == "symbol_unknown"


def test_a_terminal_that_is_not_reachable_is_the_error_terminal_unavailable() -> None:
    gateway = ScriptedGateway(available=False)
    for call in (
        lambda: service(gateway).candles(
            "EURUSD", "m1", utc(2026, 1, 5, 10, 0), utc(2026, 1, 5, 11, 0)
        ),
        lambda: service(gateway).ticks("EURUSD", utc(2026, 1, 5, 10, 0), utc(2026, 1, 5, 11, 0)),
        lambda: service(gateway).instrument_details("EURUSD"),
        lambda: service(gateway).check_terminal(),
    ):
        with pytest.raises(FetchError) as error:
            call()
        assert error.value.code == "terminal_unavailable"


def test_the_name_of_the_broker_is_the_name_of_the_trade_server() -> None:
    row = candle(naive(2026, 1, 5, 10, 0))
    period = (utc(2026, 1, 5, 10, 0), utc(2026, 1, 5, 11, 0))
    from_server = service(ScriptedGateway(candle_rows=[row], server="Server-A"))
    assert from_server.candles("EURUSD", "m1", *period).file.broker == "Server-A"
    assert from_server.instrument_details("EURUSD").file.broker == "Server-A"


def test_without_any_name_of_the_broker_the_error_is_broker_unknown() -> None:
    gateway = ScriptedGateway(candle_rows=[candle(naive(2026, 1, 5, 10, 0))], server=None)
    with pytest.raises(FetchError) as error:
        service(gateway).candles("EURUSD", "m1", utc(2026, 1, 5, 10, 0), utc(2026, 1, 5, 11, 0))
    assert error.value.code == "broker_unknown"
