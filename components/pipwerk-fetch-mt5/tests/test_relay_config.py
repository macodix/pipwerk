"""The section ``[relay]`` of the startup configuration and the start of ``serve`` and ``request``
(order 5 point 2, specification relay 3.4 and 6.1).

Every error names the entry, never a value. An invalid call or configuration ends with exit code 2
before anything is sent.
"""

import io
import re
from pathlib import Path

import pytest
from relay_support import RETRIEVAL, Network, files_way
from test_cli import archive, config_file, no_sockets  # noqa: F401 - fixture

from pipwerk_fetch_mt5.cli import main
from pipwerk_fetch_mt5.config import (
    _ALLOWED_OPTIONS,
    CONFIG_FILE_NAME,
    DEFAULT_POLL_INTERVAL_SECONDS,
    StartupConfigError,
    load_relay_settings,
    load_startup_config,
)

SECRET = "never-print-this-value-0123456789"

BROKER = "[broker]\nserver_time_zone = Europe/Athens\n"
RELAY = """
[relay]
address = fetch.net1.relay1
way = files
secrets_directory = /secrets
key_file = fetch.key
database = /state/fetch.db
"""
WAY = """
[relay.way]
target.directory = /relay/from
inbox.directory = /relay/to
"""


def write(tmp_path: Path, text: str) -> Path:
    path = tmp_path / CONFIG_FILE_NAME
    path.write_text(text, encoding="utf-8")
    return path


# --- reading ------------------------------------------------------------------------------------


def test_the_section_is_read_with_its_defaults(tmp_path: Path) -> None:
    settings = load_relay_settings(write(tmp_path, BROKER + RELAY + WAY))
    assert settings.address == "fetch.net1.relay1"
    assert settings.way == "files"
    assert settings.secrets_directory == Path("/secrets")
    assert settings.key_file == "fetch.key"
    assert settings.database == Path("/state/fetch.db")
    assert settings.relay_link is None
    assert settings.poll_interval_seconds == DEFAULT_POLL_INTERVAL_SECONDS == 2
    assert dict(settings.target) == {"directory": "/relay/from"}
    assert dict(settings.inbox) == {"directory": "/relay/to"}


def test_the_optional_entries_are_read(tmp_path: Path) -> None:
    text = RELAY + "relay_link = net1.relay9\npoll_interval_seconds = 30\n" + WAY
    settings = load_relay_settings(write(tmp_path, text))
    assert settings.relay_link == "net1.relay9"
    assert settings.poll_interval_seconds == 30


def test_the_settings_of_the_way_are_passed_on_unchanged(tmp_path: Path) -> None:
    way = (
        "\n[relay.way]\ntarget.directory = C:\\relay\\from\ninbox.directory = C:\\relay\\to\n"
        "target.max_attachment_bytes = 1000\ninbox.other_setting = a b c\n"
    )
    settings = load_relay_settings(write(tmp_path, RELAY + way))
    assert dict(settings.target) == {"directory": "C:\\relay\\from", "max_attachment_bytes": "1000"}
    assert dict(settings.inbox) == {"directory": "C:\\relay\\to", "other_setting": "a b c"}


def test_the_time_zone_is_needed_by_the_command_line_and_serve_but_not_by_request(
    tmp_path: Path,
) -> None:
    path = write(tmp_path, RELAY + WAY)  # no [broker]
    assert load_relay_settings(path).address == "fetch.net1.relay1"
    with pytest.raises(StartupConfigError, match="server_time_zone"):
        load_startup_config(path)


def test_a_time_zone_that_is_given_is_checked_also_for_request(tmp_path: Path) -> None:
    path = write(tmp_path, "[broker]\nserver_time_zone = Mars/Olympus\n" + RELAY + WAY)
    with pytest.raises(StartupConfigError, match="IANA"):
        load_relay_settings(path)


def test_the_command_line_accepts_a_file_with_the_section_and_ignores_its_values(
    tmp_path: Path,
) -> None:
    config = load_startup_config(write(tmp_path, BROKER + RELAY + WAY))
    assert config.server_time_zone == "Europe/Athens"
    assert "relay" not in vars(config)


def test_the_other_entries_are_checked_also_for_request(tmp_path: Path) -> None:
    path = write(tmp_path, RELAY + WAY + "\n[broker]\nmax_rows_per_file = 0\n")
    with pytest.raises(StartupConfigError, match="max_rows_per_file"):
        load_relay_settings(path)


# --- what is rejected ----------------------------------------------------------------------------


@pytest.mark.parametrize("entry", ["address", "way", "secrets_directory", "key_file", "database"])
def test_a_missing_entry_is_named(tmp_path: Path, entry: str) -> None:
    text = "\n".join(line for line in RELAY.splitlines() if not line.startswith(entry + " ="))
    with pytest.raises(StartupConfigError, match=entry):
        load_relay_settings(write(tmp_path, text + WAY))


def test_an_entry_without_a_value_counts_as_missing(tmp_path: Path) -> None:
    text = RELAY.replace("key_file = fetch.key", "key_file =")
    with pytest.raises(StartupConfigError, match="key_file"):
        load_relay_settings(write(tmp_path, text + WAY))


@pytest.mark.parametrize("value", ["0", "3601", "often", "-1"])
def test_an_invalid_poll_interval_is_rejected(tmp_path: Path, value: str) -> None:
    text = RELAY + f"poll_interval_seconds = {value}\n" + WAY
    with pytest.raises(StartupConfigError, match="poll_interval_seconds"):
        load_relay_settings(write(tmp_path, text))


def test_an_unknown_entry_of_the_section_is_rejected_also_for_the_command_line(
    tmp_path: Path,
) -> None:
    path = write(tmp_path, BROKER + RELAY + f"adress = {SECRET}\n" + WAY)
    for load in (load_relay_settings, load_startup_config):
        with pytest.raises(StartupConfigError, match="adress") as raised:
            load(path)
        assert SECRET not in str(raised.value)


def test_the_section_of_the_file_way_does_not_exist_in_this_version(tmp_path: Path) -> None:
    path = write(tmp_path, BROKER + RELAY + WAY + "\n[relay.file_way]\ndirectory = /x\n")
    for load in (load_relay_settings, load_startup_config):
        with pytest.raises(StartupConfigError, match="unknown section"):
            load(path)


def test_unknown_sections_are_still_rejected(tmp_path: Path) -> None:
    path = write(tmp_path, BROKER + RELAY + WAY + "\n[relay.other]\nx = 1\n")
    with pytest.raises(StartupConfigError, match="unknown section"):
        load_relay_settings(path)


def test_an_entry_of_the_way_must_say_whether_it_is_for_the_target_or_for_the_inbox(
    tmp_path: Path,
) -> None:
    path = write(tmp_path, RELAY + f"\n[relay.way]\ndirectory = {SECRET}\n")
    with pytest.raises(StartupConfigError, match="directory") as raised:
        load_relay_settings(path)
    assert SECRET not in str(raised.value)
    path = write(tmp_path, RELAY + "\n[relay.way]\ntarget. = x\n")
    with pytest.raises(StartupConfigError, match="target"):
        load_relay_settings(path)


def test_the_settings_of_the_way_without_the_section_are_an_error(tmp_path: Path) -> None:
    with pytest.raises(StartupConfigError, match=r"\[relay.way\] without \[relay\]"):
        load_relay_settings(write(tmp_path, BROKER + WAY))


def test_request_needs_the_section(tmp_path: Path) -> None:
    with pytest.raises(StartupConfigError, match=r"no section \[relay\]"):
        load_relay_settings(write(tmp_path, BROKER))


# --- the example -------------------------------------------------------------------------------

EXAMPLE = Path(__file__).resolve().parents[1] / "pipwerk-fetch-mt5.example.ini"
MARKER = "# --- The connection to pipwerk relay"


def example_with_relay_switched_on() -> str:
    lines = []
    switched_on = False
    for line in EXAMPLE.read_text(encoding="utf-8").splitlines():
        switched_on = switched_on or line.startswith(MARKER)
        match = re.match(r"^# (\[[\w.]+\]|[\w.]+ = ?.*)$", line)
        lines.append(match.group(1) if switched_on and match else line)
    return "\n".join(lines).replace("server_time_zone =", "server_time_zone = Europe/Athens")


def test_the_example_with_the_section_switched_on_is_valid(tmp_path: Path) -> None:
    path = write(tmp_path, example_with_relay_switched_on())
    settings = load_relay_settings(path)
    assert settings.address == "fetch.net1.relay1"
    assert settings.way == "files"
    assert settings.poll_interval_seconds == 2
    assert settings.relay_link == "net1.relay1"
    assert set(settings.target) == {"directory"}
    assert set(settings.inbox) == {"directory"}
    assert load_startup_config(path).server_time_zone == "Europe/Athens"


def test_the_example_names_every_entry_of_the_section() -> None:
    text = EXAMPLE.read_text(encoding="utf-8")
    for option in _ALLOWED_OPTIONS["relay"]:
        assert re.search(rf"^# {option} =", text, re.MULTILINE), option
    assert "# [relay.way]" in text


def test_the_example_as_it_is_has_no_relay_section_that_is_in_force(tmp_path: Path) -> None:
    text = EXAMPLE.read_text(encoding="utf-8").replace(
        "server_time_zone =", "server_time_zone = Europe/Athens"
    )
    path = write(tmp_path, text)
    assert load_startup_config(path).server_time_zone == "Europe/Athens"
    with pytest.raises(StartupConfigError, match=r"no section \[relay\]"):
        load_relay_settings(path)


# --- the start of the commands -----------------------------------------------------------------


def run(*arguments: str) -> tuple[int, str, str]:
    out, err = io.StringIO(), io.StringIO()
    code = main(list(arguments), out=out, err=err)
    return code, out.getvalue(), err.getvalue()


def request_arguments(network: Network, tmp_path: Path, *more: str) -> list[str]:
    return [
        *("request", "-c", str(network.ask_ini), "--address", RETRIEVAL, "--broker", "B"),
        *("--from", "2026-01-05", "--to", "2026-01-06", "-o", str(tmp_path / "t"), *more),
    ]


@pytest.fixture
def network(tmp_path: Path) -> Network:
    root = tmp_path / "net"
    root.mkdir()
    return Network(root)


def test_serve_does_not_start_without_the_section(tmp_path: Path) -> None:
    code, out, err = run("serve", "-c", str(write(tmp_path, BROKER)))
    assert code == 2
    assert "[relay]" in err
    assert out == ""


def test_serve_does_not_start_without_the_time_zone(network: Network) -> None:
    text = network.fetch_ini.read_text(encoding="utf-8").replace(
        "server_time_zone = UTC", "# no zone"
    )
    network.fetch_ini.write_text(text, encoding="utf-8")
    code, _out, err = run("serve", "-c", str(network.fetch_ini))
    assert code == 2
    assert "server_time_zone" in err


def test_serve_does_not_start_without_a_valid_configuration_file() -> None:
    code, _out, err = run("serve", "-c", "/nonexistent/pipwerk-fetch-mt5.ini")
    assert code == 2
    assert "not found" in err


@pytest.mark.parametrize("command", ["serve", "request"])
def test_a_key_file_that_others_can_read_stops_the_command_before_anything_is_sent(
    network: Network, tmp_path: Path, command: str
) -> None:
    secrets = network.root / ("secrets-fetch" if command == "serve" else "secrets-ask")
    (secrets / "link.key").chmod(0o644)
    if command == "serve":
        code, _out, err = run("serve", "-c", str(network.fetch_ini))
    else:
        code, _out, err = run(*request_arguments(network, tmp_path, "EURUSD"))
    assert code == 2
    assert "accessible for others" in err
    assert files_way(network.ask_out).read() == []
    assert not (tmp_path / "t").exists()  # nothing is created for an invalid start


def test_a_missing_key_file_stops_the_command(network: Network, tmp_path: Path) -> None:
    (network.root / "secrets-ask" / "link.key").unlink()
    code, _out, err = run(*request_arguments(network, tmp_path, "EURUSD"))
    assert code == 2
    assert "link.key" in err
    assert "does not exist" in err


def test_a_way_that_is_not_installed_stops_the_command(network: Network, tmp_path: Path) -> None:
    text = network.ask_ini.read_text(encoding="utf-8").replace("way = files", "way = nosuchway")
    network.ask_ini.write_text(text, encoding="utf-8")
    code, _out, err = run(*request_arguments(network, tmp_path, "EURUSD"))
    assert code == 2
    assert "nosuchway" in err


def test_a_setting_the_way_does_not_know_stops_the_command_and_its_value_is_not_shown(
    network: Network, tmp_path: Path
) -> None:
    text = network.ask_ini.read_text(encoding="utf-8") + f"target.bogus = {SECRET}\n"
    network.ask_ini.write_text(text, encoding="utf-8")
    code, _out, err = run(*request_arguments(network, tmp_path, "EURUSD"))
    assert code == 2
    assert "bogus" in err
    assert SECRET not in err


def test_an_address_of_the_component_that_is_not_an_address_stops_the_command(
    network: Network, tmp_path: Path
) -> None:
    text = network.ask_ini.read_text(encoding="utf-8").replace("ask.net1.relay1", "ask.net1")
    network.ask_ini.write_text(text, encoding="utf-8")
    code, _out, err = run(*request_arguments(network, tmp_path, "EURUSD"))
    assert code == 2
    assert "address" in err


@pytest.mark.parametrize(
    "more",
    [
        ["-u", "H7"],
        ["-u", "H1", "--instrument", "a/b"],
        ["--wait", "0"],
        ["--wait", "99999999999999999"],
    ],
)
def test_an_invalid_call_of_request_ends_with_exit_code_2_and_sends_nothing(
    network: Network, tmp_path: Path, more: list[str]
) -> None:
    code, out, err = run(*request_arguments(network, tmp_path, *more, "EURUSD"))
    assert code == 2, err
    assert out == ""
    assert files_way(network.ask_out).read() == []
    assert not (tmp_path / "t").exists()


def test_the_address_of_the_retrieval_must_be_an_address(network: Network, tmp_path: Path) -> None:
    arguments = request_arguments(network, tmp_path, "EURUSD")
    arguments[arguments.index(RETRIEVAL)] = "fetch.net1"
    code, _out, err = run(*arguments)
    assert code == 2
    assert "--address" in err


def test_the_period_must_run_forward(network: Network, tmp_path: Path) -> None:
    arguments = request_arguments(network, tmp_path, "EURUSD")
    arguments[arguments.index("--from") + 1] = "2026-02-01"
    code, _out, err = run(*arguments)
    assert code == 2
    assert "--from must lie before --to" in err


def test_request_without_the_section_ends_with_exit_code_2(tmp_path: Path) -> None:
    config = write(tmp_path, BROKER)
    code, _out, err = run(
        *("request", "-c", str(config), "--address", RETRIEVAL, "--broker", "B"),
        *("--from", "2026-01-05", "--to", "2026-01-06", "EURUSD"),
    )
    assert code == 2
    assert "no section [relay]" in err


def test_arguments_that_are_missing_end_the_program_like_on_the_command_line() -> None:
    with pytest.raises(SystemExit) as raised:
        main(["request", "EURUSD"])
    assert raised.value.code == 2


def test_an_instrument_named_like_a_command_is_an_instrument_when_it_is_not_the_first_argument(
    tmp_path: Path,
) -> None:
    out, err = io.StringIO(), io.StringIO()
    code = main(
        ["--from", "2026-01-05", "--to", "2026-01-06", "-c", str(config_file(tmp_path)), "serve"],
        module=archive(),
        out=out,
        err=err,
    )
    assert code == 1  # the broker does not know the symbol "serve": it was fetched, not started
    assert "Symbol beim Broker unbekannt" in err.getvalue()
    assert "Fehler: serve, " in err.getvalue()


def test_the_help_of_every_command_is_available(capsys: pytest.CaptureFixture[str]) -> None:
    for arguments, text in (
        (["--help"], "pipwerk-fetch-mt5 serve"),
        (["serve", "--help"], "Runs until it is ended"),
        (["request", "--help"], "--address"),
    ):
        with pytest.raises(SystemExit) as raised:
            main(arguments)
        assert raised.value.code == 0
        assert text in capsys.readouterr().out
