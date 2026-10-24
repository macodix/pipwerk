"""The test environment script and the replica of MetaTrader 5 (order 4 point 3).

The script starts two relays, probes and the retrieval from one commit of the Git working
directory (``scripts/testenv start``); this is run by hand and by the testers and QA, because it
installs the dependencies and needs a clean working directory. These tests check what can be
checked without that: the script is valid, executable and free of fixed ports, paths and names,
it refuses an invalid call before it changes anything, it knows every disturbance, and the
documentation names every command; the replica of MetaTrader 5 delivers what the retrieval
reads.
"""

import importlib.util
import os
import re
import subprocess
from datetime import UTC, datetime
from pathlib import Path
from types import ModuleType

import pytest

COMPONENT = Path(__file__).resolve().parents[1]
REPOSITORY = COMPONENT.parents[1]
SCRIPT = COMPONENT / "scripts" / "testenv"
REPLICA = COMPONENT / "scripts" / "replica" / "MetaTrader5.py"
DOCUMENT = (REPOSITORY / "docs" / "technical" / "pipwerk-relay.md").read_text(encoding="utf-8")
USER_DOCUMENT = (REPOSITORY / "docs" / "user" / "pipwerk-relay.md").read_text(encoding="utf-8")


FIXED_PLACES = ("/srv", "/home", "/tmp", "/var", "localhost", "127.0.0.1", "0.0.0.0")  # noqa: S104, S108


def run(*arguments: str, directory: Path | None = None) -> subprocess.CompletedProcess[str]:
    command = [str(SCRIPT)]
    if directory is not None:
        command += ["--directory", str(directory)]
    return subprocess.run(  # noqa: S603 - our own script
        [*command, *arguments], capture_output=True, text=True, check=False, timeout=60
    )


# --- the script ---------------------------------------------------------------------------------


def test_the_script_is_valid_shell_and_executable() -> None:
    checked = subprocess.run(  # noqa: S603 - our own script, checked and not run
        ["/bin/sh", "-n", str(SCRIPT)], capture_output=True, text=True, check=False
    )
    assert checked.returncode == 0, checked.stderr
    assert os.access(SCRIPT, os.X_OK)
    assert SCRIPT.read_text(encoding="utf-8").startswith("#!/bin/sh\n")


def test_the_script_contains_no_fixed_port_path_or_machine_name() -> None:
    text = SCRIPT.read_text(encoding="utf-8")
    code = "\n".join(line for line in text.splitlines() if not line.lstrip().startswith("#"))
    for forbidden in FIXED_PLACES:
        assert forbidden not in code, forbidden
    # the only large numbers are the defaults and limits of the parameters, no port
    numbers = re.findall(r"(?<![\w./-])\d{4,}(?![\w./-])", code)
    assert set(numbers) <= {"1000", "4194304", "604800", "1073741824"}, numbers
    assert "--port" not in code


def test_without_a_command_the_script_prints_how_to_call_it() -> None:
    done = run()
    assert done.returncode == 2
    assert "start --network" in done.stderr
    assert "fault <1..7>" in done.stderr


def test_status_and_stop_without_a_test_environment_say_so(tmp_path: Path) -> None:
    status = run("status", directory=tmp_path / "none")
    assert status.returncode == 1
    assert "not running" in status.stdout
    stop = run("stop", directory=tmp_path / "none")
    assert stop.returncode == 0
    assert "no test environment is running" in stop.stdout


@pytest.mark.parametrize("command", [["send", "a"], ["request"], ["fault", "1", "on"]])
def test_the_other_commands_need_a_running_test_environment(
    tmp_path: Path, command: list[str]
) -> None:
    done = run(*command, directory=tmp_path / "none")
    assert done.returncode == 1
    assert "no test environment is running" in done.stderr


VALID = ["--network", "n1", "--relay-a", "ra", "--relay-b", "rb", "--broker", "x"]


@pytest.mark.parametrize(
    ("arguments", "message"),
    [
        ([], "missing parameter --network"),
        (["--network", "n1"], "missing parameter --relay-a"),
        (["--network", "n1", "--relay-a", "ra"], "missing parameter --relay-b"),
        (["--network", "n1", "--relay-a", "ra", "--relay-b", "rb"], "missing parameter --broker"),
        (["--network", "a.b", "--relay-a", "ra", "--relay-b", "rb", "--broker", "x"], "--network"),
        (["--network", "n1", "--relay-a", "ra", "--relay-b", "ra", "--broker", "x"], "must differ"),
        ([*VALID, "--listen-name", "send"], "the names of the four roles must differ"),
        ([*VALID, "--send-name", "relay"], "reserved for the relays"),
        ([*VALID, "--delivery-deadline", "soon"], "--delivery-deadline must be a whole number"),
        ([*VALID, "--limit-bytes", "999"], "--limit-bytes must be a whole number"),
        (["--unknown"], "unknown parameter"),
    ],
)
def test_an_invalid_start_is_refused_before_anything_is_created(
    tmp_path: Path, arguments: list[str], message: str
) -> None:
    done = run("start", *arguments, directory=tmp_path / "env")
    assert done.returncode == 1
    assert message in done.stderr
    assert not (tmp_path / "env").exists()


@pytest.mark.parametrize("number", ["1", "2", "3", "4", "5", "6", "7"])
def test_every_disturbance_is_named_in_the_script(number: str) -> None:
    text = SCRIPT.read_text(encoding="utf-8")
    assert f"Disturbance {number}:" in text
    assert f"testenv fault {number} " in text


def test_the_directory_of_the_test_environment_is_ignored_by_git() -> None:
    lines = (COMPONENT / ".gitignore").read_text(encoding="utf-8").splitlines()
    assert ".testenv/" in lines


# --- the documentation ------------------------------------------------------------------------


@pytest.mark.parametrize(
    "command",
    [
        "testenv start",
        "testenv stop",
        "testenv status",
        "testenv send",
        "testenv request",
        "testenv fault",
        "--network",
        "--relay-a",
        "--relay-b",
        "--broker",
        "--delivery-deadline",
        "--limit-bytes",
        "--directory",
        "probe listen",
        "probe send",
        "pipwerk-relay-probe.ini",
    ],
)
def test_the_technical_documentation_names_every_command_and_parameter(command: str) -> None:
    assert command in DOCUMENT


@pytest.mark.parametrize("number", range(1, 8))
def test_the_user_documentation_describes_every_disturbance(number: int) -> None:
    assert f"Störung {number}" in USER_DOCUMENT
    assert f"testenv fault {number}" in USER_DOCUMENT


# --- the replica of MetaTrader 5 ---------------------------------------------------------------


@pytest.fixture
def replica(monkeypatch: pytest.MonkeyPatch) -> ModuleType:
    monkeypatch.setenv("PIPWERK_TESTENV_BROKER", "Testbroker-X")
    spec = importlib.util.spec_from_file_location("MetaTrader5_replica", REPLICA)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def utc(
    year: int, month: int, day: int, hour: int = 0, minute: int = 0, second: int = 0
) -> datetime:
    return datetime(year, month, day, hour, minute, second, tzinfo=UTC)


def test_the_replica_names_the_trade_server_from_the_environment(replica: ModuleType) -> None:
    assert replica.initialize(timeout=1) is True
    assert replica.terminal_info().connected is True
    assert replica.account_info().server == "Testbroker-X"
    assert replica.last_error()[0] == 1


def test_the_replica_knows_three_symbols(replica: ModuleType) -> None:
    for symbol in ("EURUSD", "GBPUSD", "USDJPY"):
        info = replica.symbol_info(symbol)
        assert info.digits == 5
        assert replica.symbol_select(symbol, True) is True
    assert replica.symbol_info("NOSUCH") is None
    assert (
        replica.copy_rates_range("NOSUCH", replica.TIMEFRAME_H1, utc(2026, 1, 5), utc(2026, 1, 6))
        is None
    )


def test_the_replica_delivers_candles_at_the_full_steps_and_includes_the_end(
    replica: ModuleType,
) -> None:
    rows = replica.copy_rates_range(
        "EURUSD", replica.TIMEFRAME_H1, utc(2026, 1, 5, 0, 30), utc(2026, 1, 5, 3, 0)
    )
    assert [row["time"] % 86400 // 3600 for row in rows] == [1, 2, 3]
    assert all(row["time"] % 3600 == 0 for row in rows)
    daily = replica.copy_rates_range(
        "EURUSD", replica.TIMEFRAME_D1, utc(2026, 1, 5), utc(2026, 1, 7, 23, 59, 59)
    )
    assert len(daily) == 3
    assert {"time", "open", "high", "low", "close", "tick_volume", "spread"} <= set(daily[0])


def test_the_replica_delivers_a_tick_every_ten_seconds(replica: ModuleType) -> None:
    rows = replica.copy_ticks_range(
        "EURUSD", utc(2026, 1, 5), utc(2026, 1, 5, 0, 1), replica.COPY_TICKS_INFO
    )
    assert len(rows) == 7  # 0, 10, ..., 60 seconds: the end is included, as the package does
    assert rows[1]["time_msc"] - rows[0]["time_msc"] == 10_000
    assert rows[0]["ask"] > rows[0]["bid"]
    assert replica.copy_ticks_range("NOSUCH", utc(2026, 1, 5), utc(2026, 1, 6), 1) is None


def test_the_replica_delivers_what_the_margin_needs(replica: ModuleType) -> None:
    tick = replica.symbol_info_tick("EURUSD")
    assert tick.ask > 0
    assert replica.order_calc_margin(replica.ORDER_TYPE_BUY, "EURUSD", 1.0, tick.ask) > 0
    assert replica.order_calc_margin(replica.ORDER_TYPE_BUY, "NOSUCH", 1.0, 1.0) is None
