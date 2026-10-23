"""Tests of the program as a whole: a call on the command line against a replica of the package
``MetaTrader5`` (order 13 point 6, specification backtest 5.4 and 10).

Every test runs ``main`` with the replica and a startup configuration in a temporary directory.
No socket may be opened while a test runs (``no_sockets``): the program has no server and no
network connection.
"""

import json
import socket
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest
from support import ArchiveMt5Module, naive, server_seconds, symbol_record

from pipwerk_fetch_mt5.cli import main

CLOCK = datetime(2026, 1, 9, 8, 0, tzinfo=UTC)
JAN_5 = naive(2026, 1, 5)


@pytest.fixture(autouse=True)
def no_sockets(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """Fail on every attempt to open a socket or to resolve a name."""

    class ForbiddenSocket:
        def __init__(self, *_arguments: object, **_keywords: object) -> None:
            raise AssertionError("the program opened a socket")

    def forbidden(*_arguments: object, **_keywords: object) -> None:
        raise AssertionError("the program used the network")

    monkeypatch.setattr(socket, "socket", ForbiddenSocket)
    monkeypatch.setattr(socket, "create_connection", forbidden)
    monkeypatch.setattr(socket, "getaddrinfo", forbidden)
    monkeypatch.setattr(socket, "socketpair", forbidden)
    yield


def config_file(tmp_path: Path, *, zone: str = "UTC", extra: str = "") -> Path:
    path = tmp_path / "pipwerk-fetch-mt5.ini"
    path.write_text(f"[broker]\nserver_time_zone = {zone}\n{extra}", encoding="utf-8")
    return path


def hours(first: datetime, count: int) -> list[int]:
    return [server_seconds(first + timedelta(hours=number)) for number in range(count)]


def archive() -> ArchiveMt5Module:
    """A replica with candles and ticks of EURUSD and GBPUSD for 2026-01-05 (server time)."""
    module = ArchiveMt5Module()
    for symbol in ("EURUSD", "GBPUSD"):
        module.candle_seconds[symbol] = hours(JAN_5, 24)
        module.tick_milliseconds[symbol] = [
            server_seconds(JAN_5 + timedelta(minutes=10 * number)) * 1000 + 250
            for number in range(144)
        ]
    return module


class Result:
    def __init__(self, code: int, out: str, err: str) -> None:
        self.code, self.out, self.err = code, out, err


def run(
    capsys: pytest.CaptureFixture[str],
    module: Any,
    config: Path,
    *arguments: str,
) -> Result:
    code = main(["-c", str(config), *arguments], module=module, clock=lambda: CLOCK)
    captured = capsys.readouterr()
    return Result(code, captured.out, captured.err)


def names(directory: Path) -> list[str]:
    return sorted(path.name for path in directory.iterdir())


def read(directory: Path, name: str) -> dict[str, Any]:
    document = json.loads((directory / name).read_text(encoding="utf-8"))
    assert isinstance(document, dict)
    return document


# --- the files ------------------------------------------------------------------------------------


def test_candles_ticks_and_contract_data_are_written_for_every_instrument(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    target = tmp_path / "out"
    result = run(
        capsys,
        archive(),
        config_file(tmp_path),
        "--from",
        "2026-01-05",
        "--to",
        "2026-01-06",
        "-u",
        "M1,H1",
        "--ticks",
        "-o",
        str(target),
        "EURUSD",
        "GBPUSD",
    )
    assert result.code == 0, result.err
    assert names(target) == [
        "EURUSD_CONTRACT_20260105_20260106.json",
        "EURUSD_H1_20260105_20260106.json",
        "EURUSD_M1_20260105_20260106.json",
        "EURUSD_TICKS_20260105_20260106.json",
        "GBPUSD_CONTRACT_20260105_20260106.json",
        "GBPUSD_H1_20260105_20260106.json",
        "GBPUSD_M1_20260105_20260106.json",
        "GBPUSD_TICKS_20260105_20260106.json",
    ]
    assert "8 Dateien geschrieben" in result.out
    assert result.err == ""
    candles = read(target, "EURUSD_H1_20260105_20260106.json")
    assert (candles["kind"], candles["instrument"], candles["time_unit"]) == (
        "candles",
        "EURUSD",
        "h1",
    )
    assert candles["period"] == {
        "start": "2026-01-05T00:00:00.000Z",
        "end": "2026-01-06T00:00:00.000Z",
    }
    assert len(candles["candles"]) == 24
    ticks = read(target, "GBPUSD_TICKS_20260105_20260106.json")
    assert (ticks["kind"], len(ticks["ticks"])) == ("ticks", 144)
    contract = read(target, "EURUSD_CONTRACT_20260105_20260106.json")
    assert contract["kind"] == "instrument"
    assert contract["acquired_at"] == "2026-01-09T08:00:00.000Z"
    assert contract["contract_size"] == 100000.0


def test_the_broker_in_every_file_is_the_name_of_the_trade_server(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    module = archive()
    module.account = type("Account", (), {"server": "Demo-Server-7"})()
    result = run(
        capsys, module, config_file(tmp_path), "--from", "2026-01-05", "--to", "2026-01-06",
        "-o", str(tmp_path), "-u", "H1", "--ticks", "EURUSD",
    )  # fmt: skip
    assert result.code == 0, result.err
    written = [name for name in names(tmp_path) if name.endswith(".json")]
    assert len(written) == 3
    assert {read(tmp_path, name)["broker"] for name in written} == {"Demo-Server-7"}


def test_without_a_time_unit_and_without_ticks_only_the_contract_data_are_written(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    result = run(
        capsys, archive(), config_file(tmp_path), "--from", "2026-01-05", "--to", "2026-01-06",
        "-o", str(tmp_path / "out"), "EURUSD",
    )  # fmt: skip
    assert result.code == 0, result.err
    assert names(tmp_path / "out") == ["EURUSD_CONTRACT_20260105_20260106.json"]


def test_the_default_target_is_the_current_directory(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch
) -> None:
    here = tmp_path / "here"
    here.mkdir()
    config = config_file(tmp_path)
    monkeypatch.chdir(here)
    result = run(
        capsys,
        archive(),
        config,
        "--from",
        "2026-01-05",
        "--to",
        "2026-01-06",
        "-u",
        "H1",
        "EURUSD",
    )
    assert result.code == 0, result.err
    assert names(here) == [
        "EURUSD_CONTRACT_20260105_20260106.json",
        "EURUSD_H1_20260105_20260106.json",
    ]
    assert not [name for name in names(tmp_path) if name.endswith(".json")]


def test_a_period_with_times_and_an_offset_is_named_and_converted_in_utc(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    result = run(
        capsys, archive(), config_file(tmp_path), "--from", "2026-01-05T10:30", "--to",
        "2026-01-05T14:00:00+02:00", "-u", "H1", "-o", str(tmp_path), "EURUSD",
    )  # fmt: skip
    assert result.code == 0, result.err
    assert "EURUSD_H1_20260105T103000_20260105T120000.json" in names(tmp_path)
    document = read(tmp_path, "EURUSD_H1_20260105T103000_20260105T120000.json")
    assert document["period"] == {
        "start": "2026-01-05T10:30:00.000Z",
        "end": "2026-01-05T12:00:00.000Z",
    }
    assert [row["time"] for row in document["candles"]] == [
        "2026-01-05T11:00:00.000Z",
    ]


def test_a_file_of_the_same_name_is_replaced(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    old = tmp_path / "EURUSD_H1_20260105_20260106.json"
    old.write_text("old content", encoding="utf-8")
    result = run(
        capsys, archive(), config_file(tmp_path), "--from", "2026-01-05", "--to", "2026-01-06",
        "-u", "H1", "-o", str(tmp_path), "EURUSD",
    )  # fmt: skip
    assert result.code == 0, result.err
    assert read(tmp_path, old.name)["kind"] == "candles"
    assert not [name for name in names(tmp_path) if name.endswith(".tmp")]


def test_a_repeated_instrument_and_a_repeated_time_unit_are_fetched_once(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    result = run(
        capsys, archive(), config_file(tmp_path), "--from", "2026-01-05", "--to", "2026-01-06",
        "-u", "h1", "-u", "H1,h1", "-o", str(tmp_path), "EURUSD", "EURUSD",
    )  # fmt: skip
    assert result.code == 0, result.err
    assert len(names(tmp_path)) == 3  # the configuration, CONTRACT and H1


# --- the table of symbols and the time zone ------------------------------------------------------


def test_the_table_maps_the_designation_to_the_symbol_of_the_broker(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    module = archive()
    module.symbols["EURUSD.r"] = symbol_record()
    module.candle_seconds["EURUSD.r"] = hours(JAN_5, 3)
    config = config_file(tmp_path, extra="\n[symbols]\nEURUSD = EURUSD.r\n")
    out = tmp_path / "out"
    result = run(
        capsys, module, config, "--from", "2026-01-05", "--to", "2026-01-06",
        "-u", "H1", "-o", str(out), "EURUSD", "GBPUSD",
    )  # fmt: skip
    assert result.code == 0, result.err
    assert names(out) == [
        "EURUSD_CONTRACT_20260105_20260106.json",
        "EURUSD_H1_20260105_20260106.json",
        "GBPUSD_CONTRACT_20260105_20260106.json",
        "GBPUSD_H1_20260105_20260106.json",
    ]
    mapped = read(out, "EURUSD_H1_20260105_20260106.json")
    assert mapped["instrument"] == "EURUSD"  # the designation, never the symbol of the broker
    assert len(mapped["candles"]) == 3  # the data of EURUSD.r
    assert len(read(out, "GBPUSD_H1_20260105_20260106.json")["candles"]) == 24
    symbols = {call[1][0] for call in module.calls if call[0] == "copy_rates_range"}
    assert symbols == {"EURUSD.r", "GBPUSD"}
    assert "EURUSD.r" not in "".join(names(out))


def test_a_symbol_with_path_characters_in_the_table_never_enters_a_file_name(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    module = archive()
    module.symbols["../../evil"] = symbol_record()
    module.candle_seconds["../../evil"] = hours(JAN_5, 3)
    config = config_file(tmp_path, extra="\n[symbols]\nEURUSD = ../../evil\n")
    out = tmp_path / "a" / "b"
    result = run(
        capsys, module, config, "--from", "2026-01-05", "--to", "2026-01-06", "-u", "H1",
        "-o", str(out), "EURUSD",
    )  # fmt: skip
    assert result.code == 0, result.err
    assert names(out) == [
        "EURUSD_CONTRACT_20260105_20260106.json",
        "EURUSD_H1_20260105_20260106.json",
    ]
    assert names(tmp_path) == ["a", "pipwerk-fetch-mt5.ini"]
    assert names(tmp_path / "a") == ["b"]


def test_server_time_is_converted_to_utc_with_winter_and_summer_time(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    module = ArchiveMt5Module()
    module.candle_seconds["EURUSD"] = [
        server_seconds(naive(2026, 1, 5, 12)),  # winter: UTC+2
        server_seconds(naive(2026, 7, 1, 12)),  # summer: UTC+3
    ]
    config = config_file(tmp_path, zone="Europe/Athens")
    winter = tmp_path / "winter"
    summer = tmp_path / "summer"
    first = run(
        capsys, module, config, "--from", "2026-01-05", "--to", "2026-01-06", "-u", "H1",
        "-o", str(winter), "EURUSD",
    )  # fmt: skip
    second = run(
        capsys, module, config, "--from", "2026-07-01", "--to", "2026-07-02", "-u", "H1",
        "-o", str(summer), "EURUSD",
    )  # fmt: skip
    assert (first.code, second.code) == (0, 0)
    assert [row["time"] for row in read(winter, "EURUSD_H1_20260105_20260106.json")["candles"]] == [
        "2026-01-05T10:00:00.000Z"
    ]
    assert [row["time"] for row in read(summer, "EURUSD_H1_20260701_20260702.json")["candles"]] == [
        "2026-07-01T09:00:00.000Z"
    ]


def test_the_second_hour_of_the_repeated_hour_is_left_out_and_named_in_the_output(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    module = ArchiveMt5Module()
    # Athens, 2026-10-25: 03:00 occurs twice (00:00 UTC and 01:00 UTC).
    module.candle_seconds["EURUSD"] = [
        server_seconds(naive(2026, 10, 25, 3)),
        server_seconds(naive(2026, 10, 25, 3)),
        server_seconds(naive(2026, 10, 25, 4)),
    ]
    result = run(
        capsys, module, config_file(tmp_path, zone="Europe/Athens"), "--from", "2026-10-25",
        "--to", "2026-10-26", "-u", "H1", "-o", str(tmp_path), "EURUSD",
    )  # fmt: skip
    assert result.code == 0, result.err
    document = read(tmp_path, "EURUSD_H1_20261025_20261026.json")
    assert [row["time"] for row in document["candles"]] == [
        "2026-10-25T00:00:00.000Z",
        "2026-10-25T02:00:00.000Z",
    ]
    assert "1 Zeilen ausgelassen" in result.out
    assert "2026-10-25T03:00:00.000" in result.out


# --- parts that cannot be fetched -----------------------------------------------------------------


def test_an_unknown_symbol_is_named_with_its_reason_and_the_other_files_are_written(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    result = run(
        capsys, archive(), config_file(tmp_path), "--from", "2026-01-05", "--to", "2026-01-06",
        "-u", "H1", "--ticks", "-o", str(tmp_path / "out"), "NOSUCH", "EURUSD",
    )  # fmt: skip
    assert result.code == 1
    assert names(tmp_path / "out") == [
        "EURUSD_CONTRACT_20260105_20260106.json",
        "EURUSD_H1_20260105_20260106.json",
        "EURUSD_TICKS_20260105_20260106.json",
    ]
    period = "2026-01-05 00:00:00 UTC bis 2026-01-06 00:00:00 UTC"
    for kind in ("Angaben zum Instrument (CONTRACT)", "Kerzen H1", "Ticks"):
        assert f"Fehler: NOSUCH, {kind}, {period}: Symbol beim Broker unbekannt" in result.err
    assert "Fehler: EURUSD" not in result.err
    assert "3 von 6 Dateien geschrieben, 3 Teile nicht geholt" in result.err
    assert "Geschrieben: EURUSD_H1_20260105_20260106.json" in result.out


def test_a_part_without_data_has_the_reason_no_data(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    result = run(
        capsys, archive(), config_file(tmp_path), "--from", "2026-03-01", "--to", "2026-03-02",
        "-u", "H1", "-o", str(tmp_path / "out"), "EURUSD",
    )  # fmt: skip
    assert result.code == 1
    assert names(tmp_path / "out") == ["EURUSD_CONTRACT_20260301_20260302.json"]
    assert (
        "Fehler: EURUSD, Kerzen H1, 2026-03-01 00:00:00 UTC bis 2026-03-02 00:00:00 UTC: "
        "Daten beim Broker nicht vorhanden" in result.err
    )


def test_an_error_of_metatrader_5_is_named_for_that_part_only(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    module = archive()
    module.failing.add("GBPUSD")
    result = run(
        capsys, module, config_file(tmp_path), "--from", "2026-01-05", "--to", "2026-01-06",
        "-u", "H1", "-o", str(tmp_path / "out"), "GBPUSD", "EURUSD",
    )  # fmt: skip
    assert result.code == 1
    assert "Fehler: GBPUSD, Kerzen H1" in result.err
    assert "MetaTrader 5 hat die Abfrage mit einem Fehler beendet" in result.err
    assert "GBPUSD_CONTRACT_20260105_20260106.json" in names(tmp_path / "out")
    assert "EURUSD_H1_20260105_20260106.json" in names(tmp_path / "out")


def test_a_period_that_is_too_large_is_named_and_the_others_are_written(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    config = config_file(tmp_path, extra="max_rows_per_file = 10\n")
    result = run(
        capsys, archive(), config, "--from", "2026-01-05", "--to", "2026-01-06", "-u", "H1",
        "-o", str(tmp_path / "out"), "EURUSD",
    )  # fmt: skip
    assert result.code == 1
    assert names(tmp_path / "out") == ["EURUSD_CONTRACT_20260105_20260106.json"]
    assert "Zeitraum zu groß" in result.err


def test_a_terminal_that_is_not_reachable_is_named_for_every_part_and_tried_once(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    module = archive()
    module.initialize_result = False
    module.error = (-10003, "IPC initialize failed")
    result = run(
        capsys, module, config_file(tmp_path), "--from", "2026-01-05", "--to", "2026-01-06",
        "-u", "M1,H1", "--ticks", "-o", str(tmp_path / "out"), "EURUSD", "GBPUSD",
    )  # fmt: skip
    assert result.code == 1
    assert names(tmp_path / "out") == []
    assert result.err.count("MetaTrader 5 nicht erreichbar") == 8
    assert "0 von 8 Dateien geschrieben, 8 Teile nicht geholt" in result.err
    assert module.names().count("initialize") == 1  # the others are not tried again


def test_the_package_that_is_not_installed_is_named_as_not_reachable(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch
) -> None:
    import sys

    monkeypatch.setitem(sys.modules, "MetaTrader5", None)
    result = run(
        capsys, None, config_file(tmp_path), "--from", "2026-01-05", "--to", "2026-01-06",
        "-o", str(tmp_path / "out"), "EURUSD",
    )  # fmt: skip
    assert result.code == 1
    assert "MetaTrader 5 nicht erreichbar" in result.err


def test_an_unexpected_error_is_a_failed_part_and_does_not_stop_the_others(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    module = archive()

    def explode(symbol: str) -> object:
        if symbol == "GBPUSD":
            raise RuntimeError("secret detail")
        return module.symbols.get(symbol)

    module.symbol_info = explode  # type: ignore[method-assign]
    result = run(
        capsys, module, config_file(tmp_path), "--from", "2026-01-05", "--to", "2026-01-06",
        "-o", str(tmp_path / "out"), "GBPUSD", "EURUSD",
    )  # fmt: skip
    assert result.code == 1
    assert "Interner Fehler im Programm" in result.err
    assert "secret detail" not in result.err + result.out
    assert names(tmp_path / "out") == ["EURUSD_CONTRACT_20260105_20260106.json"]


def test_the_connection_is_closed_at_the_end(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    module = archive()
    run(
        capsys, module, config_file(tmp_path), "--from", "2026-01-05", "--to", "2026-01-06",
        "-o", str(tmp_path / "out"), "EURUSD",
    )  # fmt: skip
    assert module.shutdowns == 1


# --- an invalid call ------------------------------------------------------------------------------


@pytest.mark.parametrize(
    "instrument",
    [
        "../x",
        "a/b",
        "a\\b",
        "EUR USD",
        ".hidden",
        "..",
        "x\x00y",
        "C:EURUSD",
        "A" * 65,
        "EUR\nUSD",
        "€",
    ],
)
def test_an_instrument_with_characters_not_allowed_is_refused_before_anything_happens(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], instrument: str
) -> None:
    module = archive()
    result = run(
        capsys, module, config_file(tmp_path), "--from", "2026-01-05", "--to", "2026-01-06",
        "-o", str(tmp_path / "out"), "EURUSD", instrument,
    )  # fmt: skip
    assert result.code == 2
    assert "not allowed" in result.err
    assert module.calls == []  # no connection was made
    assert not (tmp_path / "out").exists()  # and nothing was written, not even the directory


@pytest.mark.parametrize(
    ("start", "end", "text"),
    [
        ("2026-01-06", "2026-01-05", "--from must lie before --to"),
        ("2026-01-05", "2026-01-05", "--from must lie before --to"),
        ("yesterday", "2026-01-05", "not a date or a time"),
        ("2026-01-05", "2026-13-45", "not a date or a time"),
        ("2026-01-05T10:00:00.5", "2026-01-06", "fractions of a second"),
        ("1969-12-31", "2026-01-06", "between the years"),
        ("2026-01-05", "2101-01-01", "between the years"),
    ],
)
def test_an_invalid_period_is_refused(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], start: str, end: str, text: str
) -> None:
    module = archive()
    result = run(
        capsys, module, config_file(tmp_path), "--from", start, "--to", end,
        "-o", str(tmp_path / "out"), "EURUSD",
    )  # fmt: skip
    assert result.code == 2
    assert text in result.err
    assert module.calls == []


def test_an_unknown_time_unit_is_refused(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    result = run(
        capsys, archive(), config_file(tmp_path), "--from", "2026-01-05", "--to", "2026-01-06",
        "-u", "H1,X9", "-o", str(tmp_path / "out"), "EURUSD",
    )  # fmt: skip
    assert result.code == 2
    assert "'X9' is not a time unit" in result.err


def test_a_target_that_is_a_file_is_refused(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    target = tmp_path / "file"
    target.write_text("x", encoding="utf-8")
    module = archive()
    result = run(
        capsys, module, config_file(tmp_path), "--from", "2026-01-05", "--to", "2026-01-06",
        "-o", str(target), "EURUSD",
    )  # fmt: skip
    assert result.code == 2
    assert "target directory" in result.err
    assert module.calls == []


def test_without_a_valid_configuration_the_call_is_refused(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    broken = tmp_path / "pipwerk-fetch-mt5.ini"
    broken.write_text("[broker]\n", encoding="utf-8")
    module = archive()
    result = run(
        capsys, module, broken, "--from", "2026-01-05", "--to", "2026-01-06",
        "-o", str(tmp_path / "out"), "EURUSD",
    )  # fmt: skip
    assert result.code == 2
    assert "server_time_zone" in result.err
    assert module.calls == []
    assert not (tmp_path / "out").exists()


@pytest.mark.parametrize(
    "arguments",
    [
        [],
        ["EURUSD"],
        ["--from", "2026-01-05", "EURUSD"],
        ["--to", "2026-01-05", "EURUSD"],
        ["--from", "2026-01-05", "--to", "2026-01-06"],
    ],
)
def test_missing_arguments_end_the_program_with_exit_code_2(arguments: list[str]) -> None:
    with pytest.raises(SystemExit) as error:
        main(arguments)
    assert error.value.code == 2


def test_the_help_names_every_option(capsys: pytest.CaptureFixture[str]) -> None:
    with pytest.raises(SystemExit) as error:
        main(["--help"])
    assert error.value.code == 0
    text = capsys.readouterr().out
    for option in ("--from", "--to", "--time-unit", "--ticks", "--output-dir", "--config"):
        assert option in text
    assert "CONTRACT" in text
    assert "M1" in text
    assert "--port" not in text
    assert "--host" not in text


def test_the_program_runs_as_a_module_in_a_fresh_process_without_the_package() -> None:
    import subprocess
    import sys

    result = subprocess.run(
        [sys.executable, "-I", "-m", "pipwerk_fetch_mt5.cli", "--help"],
        capture_output=True,
        text=True,
        check=False,
        timeout=120,
    )
    assert result.returncode == 0, result.stderr
    assert "pipwerk-fetch-mt5" in result.stdout
