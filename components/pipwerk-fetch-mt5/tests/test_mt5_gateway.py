"""Tests of ``Mt5Gateway``: the translation to the package ``MetaTrader5``.

A replica of the package module stands in (``support.FakeMt5Module``); there is no real
MetaTrader 5 in the tests (it runs on Windows only; the acceptance tests against it). The
tests also show that the package is needed only when it is used.
"""

import logging
import subprocess
import sys
from datetime import UTC, datetime

import pytest
from support import FakeMt5Module, naive, rates_rows, symbol_record

from pipwerk_fetch_mt5.config import MetaTraderSettings
from pipwerk_fetch_mt5.errors import FetchError
from pipwerk_fetch_mt5.mt5_gateway import Mt5Gateway


def gateway(module: FakeMt5Module, **settings: object) -> Mt5Gateway:
    return Mt5Gateway(MetaTraderSettings(**settings), module=module)  # type: ignore[arg-type]


def code_of(error: pytest.ExceptionInfo[FetchError]) -> str:
    return error.value.code


# --- connection -----------------------------------------------------------------------------


def test_the_connection_is_made_once_with_the_given_details() -> None:
    module = FakeMt5Module()
    mt5 = gateway(
        module,
        path="C:\\terminal64.exe",
        login=12345,
        password="account-password-1",
        server="Demo-Server",
        timeout_ms=5000,
    )
    mt5.ping()
    mt5.ping()
    assert module.names().count("initialize") == 1
    initialize = next(call for call in module.calls if call[0] == "initialize")
    assert initialize[2] == {
        "timeout": 5000,
        "path": "C:\\terminal64.exe",
        "login": 12345,
        "password": "account-password-1",
        "server": "Demo-Server",
    }


def test_without_details_the_program_attaches_to_the_running_terminal() -> None:
    module = FakeMt5Module()
    gateway(module).ping()
    initialize = next(call for call in module.calls if call[0] == "initialize")
    assert initialize[2] == {"timeout": 60000}


def test_a_failed_connection_is_terminal_unavailable_and_is_tried_again(
    caplog: pytest.LogCaptureFixture,
) -> None:
    module = FakeMt5Module()
    module.initialize_result = False
    module.error = (-10003, "IPC initialize failed")
    mt5 = gateway(module, password="account-password-1")
    with caplog.at_level(logging.INFO), pytest.raises(FetchError) as error:
        mt5.ping()
    assert code_of(error) == "terminal_unavailable"
    module.initialize_result = True
    mt5.ping()  # the next call connects again
    assert module.names().count("initialize") == 2
    assert "account-password-1" not in caplog.text


def test_close_disconnects_once_and_does_nothing_without_a_connection() -> None:
    module = FakeMt5Module()
    mt5 = gateway(module)
    mt5.close()
    assert module.shutdowns == 0  # never connected: nothing to drop
    mt5.ping()
    mt5.close()
    mt5.close()
    assert module.shutdowns == 1


def test_a_terminal_that_is_not_connected_to_its_trade_server_is_unavailable() -> None:
    module = FakeMt5Module()
    module.terminal = type("Info", (), {"connected": False})()
    mt5 = gateway(module)
    with pytest.raises(FetchError) as error:
        mt5.ping()
    assert code_of(error) == "terminal_unavailable"
    assert module.shutdowns == 1  # the connection is dropped so the next call starts anew


def test_a_terminal_that_gives_no_information_is_unavailable() -> None:
    module = FakeMt5Module()
    module.terminal = None
    with pytest.raises(FetchError) as error:
        gateway(module).ping()
    assert code_of(error) == "terminal_unavailable"


def test_an_exception_of_the_package_is_terminal_unavailable_and_names_nothing(
    caplog: pytest.LogCaptureFixture,
) -> None:
    module = FakeMt5Module()

    def explode(**_arguments: object) -> bool:
        raise RuntimeError("secret detail account-password-1")

    module.initialize = explode  # type: ignore[method-assign]
    with caplog.at_level(logging.INFO), pytest.raises(FetchError) as error:
        gateway(module, password="account-password-1").ping()
    assert code_of(error) == "terminal_unavailable"
    assert "account-password-1" not in caplog.text
    assert "secret detail" not in caplog.text


def test_the_missing_package_is_terminal_unavailable_and_the_program_imports_without_it(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # A None entry in sys.modules makes "import MetaTrader5" fail like a missing package.
    monkeypatch.setitem(sys.modules, "MetaTrader5", None)
    mt5 = Mt5Gateway(MetaTraderSettings())
    with pytest.raises(FetchError) as error:
        mt5.ping()
    assert code_of(error) == "terminal_unavailable"


def test_the_package_is_not_imported_by_the_program() -> None:
    program = (
        "import sys\n"
        "import pipwerk_fetch_mt5.cli, pipwerk_fetch_mt5.fetch, pipwerk_fetch_mt5.service\n"
        "import pipwerk_fetch_mt5.mt5_gateway, pipwerk_fetch_mt5.files\n"
        "sys.exit(1 if 'MetaTrader5' in sys.modules else 0)\n"
    )
    result = subprocess.run(  # noqa: S603
        [sys.executable, "-I", "-c", program],
        capture_output=True,
        text=True,
        check=False,
        timeout=120,
    )
    assert result.returncode == 0, result.stderr


# --- name of the broker -----------------------------------------------------------------------


def test_the_server_name_is_the_name_of_the_trade_server() -> None:
    module = FakeMt5Module()
    assert gateway(module).server_name() == "Broker-Live-1"


@pytest.mark.parametrize("account", [None, type("Account", (), {"server": ""})()])
def test_no_server_name_is_none(account: object) -> None:
    module = FakeMt5Module()
    module.account = account
    assert gateway(module).server_name() is None


# --- details of a symbol -------------------------------------------------------------------------


def test_the_details_of_a_symbol_are_translated() -> None:
    module = FakeMt5Module()
    module.symbols["EURUSD"] = symbol_record(swap_rollover3days=3, margin_initial=1300.0)
    info = gateway(module).symbol("EURUSD")
    assert info is not None
    assert (info.tick_size, info.tick_value, info.tick_value_currency) == (0.00001, 1.0, "USD")
    assert (info.point, info.digits, info.spread) == (0.00001, 5, 12)
    assert (info.min_volume, info.volume_step, info.contract_size) == (0.01, 0.01, 100000.0)
    assert (info.swap_long, info.swap_short, info.swap_mode) == (-6.5, 1.2, 1)
    assert info.margin_initial == 1300.0
    assert info.margin_currency == "EUR"


@pytest.mark.parametrize(
    ("number", "weekday"),
    [
        (0, "sunday"),
        (1, "monday"),
        (2, "tuesday"),
        (3, "wednesday"),
        (4, "thursday"),
        (5, "friday"),
        (6, "saturday"),
    ],
)
def test_the_weekday_of_the_triple_swap_counts_from_sunday(number: int, weekday: str) -> None:
    module = FakeMt5Module()
    module.symbols["EURUSD"] = symbol_record(swap_rollover3days=number)
    info = gateway(module).symbol("EURUSD")
    assert info is not None
    assert info.triple_swap_weekday == weekday


def test_an_unknown_symbol_is_none() -> None:
    module = FakeMt5Module()
    module.error = (-4, "Terminal: Not found")
    assert gateway(module).symbol("NOPE") is None


def test_a_symbol_lookup_in_a_broken_connection_is_terminal_unavailable() -> None:
    module = FakeMt5Module()
    module.error = (-10004, "IPC connect failed")
    with pytest.raises(FetchError) as error:
        gateway(module).symbol("EURUSD")
    assert code_of(error) == "terminal_unavailable"


def test_select_makes_the_symbol_available_or_fails() -> None:
    module = FakeMt5Module()
    gateway(module).select("EURUSD")
    assert ("symbol_select", ("EURUSD", True), {}) in module.calls
    module.selectable = False
    module.error = (-1, "Generic fail")
    with pytest.raises(FetchError) as error:
        gateway(module).select("EURUSD")
    assert code_of(error) == "broker_error"


# --- candles ----------------------------------------------------------------------------------


def test_candles_are_translated_and_the_times_are_server_times() -> None:
    module = FakeMt5Module()
    # 2026-01-05 10:00:00 and 10:01:00 as seconds of the server clock.
    first = int(datetime(2026, 1, 5, 10, 0, tzinfo=UTC).timestamp())
    module.rates = rates_rows([first, first + 60])
    candles = gateway(module).candles(
        "EURUSD", "m1", naive(2026, 1, 5, 10, 0), naive(2026, 1, 5, 10, 2)
    )
    assert [row.time for row in candles] == [naive(2026, 1, 5, 10, 0), naive(2026, 1, 5, 10, 1)]
    assert candles[0].open == 1.1
    assert (candles[0].high, candles[0].low, candles[0].close) == (1.2, 1.0, 1.15)
    assert (candles[0].volume, candles[0].spread) == (7, 9)


def test_the_range_is_passed_with_the_end_excluded_and_the_time_unit_as_number() -> None:
    module = FakeMt5Module()
    module.rates = rates_rows([])
    gateway(module).candles("EURUSD", "h1", naive(2026, 1, 5, 10, 0), naive(2026, 1, 5, 12, 0))
    call = next(call for call in module.calls if call[0] == "copy_rates_range")
    symbol, timeframe, start, end = call[1]
    assert (symbol, timeframe) == ("EURUSD", module.TIMEFRAME_H1)
    assert start == datetime(2026, 1, 5, 10, 0, tzinfo=UTC)  # a carrier, no conversion
    assert end == datetime(2026, 1, 5, 11, 59, 59, tzinfo=UTC)  # the package includes the end


def test_a_fractional_second_in_the_end_is_rounded_up_before_it_is_excluded() -> None:
    module = FakeMt5Module()
    module.rates = rates_rows([])
    gateway(module).candles(
        "EURUSD", "m1", naive(2026, 1, 5, 10, 0), datetime(2026, 1, 5, 12, 0, 0, 500000)
    )
    call = next(call for call in module.calls if call[0] == "copy_rates_range")
    assert call[1][3] == datetime(2026, 1, 5, 12, 0, 0, tzinfo=UTC)


def test_no_rows_at_all_is_an_empty_list_when_the_call_worked() -> None:
    module = FakeMt5Module()
    module.rates = None
    module.error = (1, "Success")
    assert gateway(module).candles("EURUSD", "m1", naive(2026, 1, 5), naive(2026, 1, 6)) == []
    module.error = (-4, "Terminal: Not found")
    assert gateway(module).candles("EURUSD", "m1", naive(2026, 1, 5), naive(2026, 1, 6)) == []


def test_a_call_that_returns_nothing_because_of_an_error_is_broker_error() -> None:
    module = FakeMt5Module()
    module.rates = None
    module.error = (-2, "Invalid params")
    with pytest.raises(FetchError) as error:
        gateway(module).candles("EURUSD", "m1", naive(2026, 1, 5), naive(2026, 1, 6))
    assert code_of(error) == "broker_error"


def test_a_broken_connection_during_a_read_is_terminal_unavailable_and_reconnects() -> None:
    module = FakeMt5Module()
    mt5 = gateway(module)
    mt5.ping()
    module.rates = None
    module.error = (-10001, "IPC send failed")
    with pytest.raises(FetchError) as error:
        mt5.candles("EURUSD", "m1", naive(2026, 1, 5), naive(2026, 1, 6))
    assert code_of(error) == "terminal_unavailable"
    assert module.shutdowns == 1
    mt5.ping()
    assert module.names().count("initialize") == 2


def test_an_authorization_failure_is_terminal_unavailable() -> None:
    module = FakeMt5Module()
    module.rates = None
    module.error = (-6, "Authorization failed")
    with pytest.raises(FetchError) as error:
        gateway(module).candles("EURUSD", "m1", naive(2026, 1, 5), naive(2026, 1, 6))
    assert code_of(error) == "terminal_unavailable"


# --- ticks ------------------------------------------------------------------------------------


def test_ticks_are_translated_with_milliseconds() -> None:
    module = FakeMt5Module()
    base = int(datetime(2026, 1, 5, 10, 0, tzinfo=UTC).timestamp()) * 1000
    module.tick_rows = [
        {"time_msc": base + 123, "bid": 1.1, "ask": 1.1002, "flags": 6},
        {"time_msc": base + 1456, "bid": 1.1001, "ask": 1.1003, "flags": 6},
    ]
    ticks = gateway(module).ticks("EURUSD", naive(2026, 1, 5, 10, 0), naive(2026, 1, 5, 10, 1))
    assert [row.time for row in ticks] == [
        datetime(2026, 1, 5, 10, 0, 0, 123000),
        datetime(2026, 1, 5, 10, 0, 1, 456000),
    ]
    assert [(row.bid, row.ask) for row in ticks] == [(1.1, 1.1002), (1.1001, 1.1003)]


def test_the_ticks_are_requested_with_changes_of_bid_and_ask_and_the_end_excluded() -> None:
    module = FakeMt5Module()
    gateway(module).ticks(
        "EURUSD", datetime(2026, 1, 5, 10, 0, 0, 1500), datetime(2026, 1, 5, 11, 0, 0)
    )
    call = next(call for call in module.calls if call[0] == "copy_ticks_range")
    symbol, start, end, flags = call[1]
    assert symbol == "EURUSD"
    assert start == datetime(2026, 1, 5, 10, 0, 0, 1000, tzinfo=UTC)
    assert end == datetime(2026, 1, 5, 10, 59, 59, 999000, tzinfo=UTC)
    assert flags == module.COPY_TICKS_INFO


def test_ticks_without_rows_and_with_an_error() -> None:
    module = FakeMt5Module()
    module.tick_rows = None
    assert gateway(module).ticks("EURUSD", naive(2026, 1, 5), naive(2026, 1, 6)) == []
    module.error = (-10002, "IPC recv failed")
    with pytest.raises(FetchError) as error:
        gateway(module).ticks("EURUSD", naive(2026, 1, 5), naive(2026, 1, 6))
    assert code_of(error) == "terminal_unavailable"


# --- trading hours and margin --------------------------------------------------------------------


def test_the_package_delivers_no_trading_hours() -> None:
    assert gateway(FakeMt5Module()).sessions("EURUSD") == []


def test_the_margin_is_calculated_by_the_terminal_for_one_lot_at_the_ask() -> None:
    module = FakeMt5Module()
    assert gateway(module).margin_per_lot("EURUSD") == 1234.5
    call = next(call for call in module.calls if call[0] == "order_calc_margin")
    assert call[1] == (module.ORDER_TYPE_BUY, "EURUSD", 1.0, 1.1002)


def test_without_a_price_or_a_result_there_is_no_margin() -> None:
    module = FakeMt5Module()
    module.tick = None
    assert gateway(module).margin_per_lot("EURUSD") is None
    module.tick = type("Tick", (), {"ask": 0.0})()
    assert gateway(module).margin_per_lot("EURUSD") is None
    module.tick = type("Tick", (), {"ask": 1.1})()
    module.margin = None
    assert gateway(module).margin_per_lot("EURUSD") is None
