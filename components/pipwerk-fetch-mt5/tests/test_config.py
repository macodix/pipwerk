"""Tests of the startup configuration (req-system-017, req-system-018, order 13 point 4).

The file may hold the password for MetaTrader 5. Every error message names the entry that is
wrong and never a value of the file. The program has no server, so the file has no address,
port, key or list of hosts.
"""

import os
from pathlib import Path
from types import SimpleNamespace

import pytest

from pipwerk_fetch_mt5 import config as config_module
from pipwerk_fetch_mt5.config import (
    CONFIG_FILE_NAME,
    DEFAULT_MAX_READS,
    DEFAULT_MAX_ROWS,
    StartupConfig,
    StartupConfigError,
    default_search_locations,
    load_startup_config,
    resolve_config_path,
)

SECRET = "never-print-this-password-0123456789"

MINIMAL = """
[broker]
server_time_zone = Europe/Athens
"""


def pretend_os(monkeypatch: pytest.MonkeyPatch, name: str) -> None:
    """Let the module see another operating system name. Only the module's own ``os`` is
    replaced (by an object with the name and the real environment): changing ``os.name``
    itself would change the kind of path that ``pathlib`` creates."""
    monkeypatch.setattr(config_module, "os", SimpleNamespace(name=name, environ=os.environ))


def write(path: Path, text: str) -> Path:
    path.write_text(text, encoding="utf-8")
    return path


@pytest.fixture
def ini(tmp_path: Path) -> Path:
    return write(tmp_path / CONFIG_FILE_NAME, MINIMAL)


# --- what the file contains ---------------------------------------------------------------------


def test_the_minimal_file_gives_the_defaults(ini: Path) -> None:
    config = load_startup_config(ini)
    assert config.server_time_zone == "Europe/Athens"
    assert config.max_rows == DEFAULT_MAX_ROWS == 200_000
    assert config.max_reads == DEFAULT_MAX_READS == 500
    assert dict(config.symbols) == {}
    assert config.metatrader.path is None
    assert config.metatrader.login is None


def test_every_entry_is_read(tmp_path: Path) -> None:
    path = write(
        tmp_path / CONFIG_FILE_NAME,
        f"""
[broker]
server_time_zone = Europe/Athens
max_rows_per_file = 1234
max_reads_per_file = 77

[metatrader5]
path = C:\\Program Files\\MetaTrader 5\\terminal64.exe
login = 12345
password = {SECRET}
server = Demo-Server
timeout_ms = 5000

[symbols]
EURUSD = EURUSD.r
DE40 = GER40.cash
""",
    )
    config = load_startup_config(path)
    assert config.max_rows == 1234
    assert config.max_reads == 77
    assert config.metatrader.path == "C:\\Program Files\\MetaTrader 5\\terminal64.exe"
    assert config.metatrader.login == 12345
    assert config.metatrader.password == SECRET
    assert config.metatrader.server == "Demo-Server"
    assert config.metatrader.timeout_ms == 5000
    assert dict(config.symbols) == {"EURUSD": "EURUSD.r", "DE40": "GER40.cash"}


def test_the_table_maps_a_designation_and_without_an_entry_the_designation_itself(
    tmp_path: Path,
) -> None:
    path = write(tmp_path / CONFIG_FILE_NAME, MINIMAL + "\n[symbols]\nEURUSD = EURUSD.r\n")
    config = load_startup_config(path)
    assert config.symbol_for("EURUSD") == "EURUSD.r"
    assert config.symbol_for("GBPUSD") == "GBPUSD"


def test_the_case_of_a_designation_is_kept(tmp_path: Path) -> None:
    path = write(tmp_path / CONFIG_FILE_NAME, MINIMAL + "\n[symbols]\nEurUsd = eurusd.R\n")
    config = load_startup_config(path)
    assert dict(config.symbols) == {"EurUsd": "eurusd.R"}
    assert config.symbol_for("EURUSD") == "EURUSD"


def test_a_percent_sign_in_the_password_is_no_interpolation(tmp_path: Path) -> None:
    password = "abc%def%(x)s-0123456789"
    path = write(tmp_path / CONFIG_FILE_NAME, MINIMAL + f"\n[metatrader5]\npassword = {password}\n")
    assert load_startup_config(path).metatrader.password == password


def test_the_configuration_has_no_address_port_key_or_host_list() -> None:
    names = set(StartupConfig.__dataclass_fields__)
    assert names == {"server_time_zone", "max_rows", "max_reads", "symbols", "metatrader"}


# --- what is required and what is rejected ------------------------------------------------------


def test_the_time_zone_is_required(tmp_path: Path) -> None:
    path = write(tmp_path / CONFIG_FILE_NAME, "[broker]\nmax_rows_per_file = 10\n")
    with pytest.raises(StartupConfigError, match="server_time_zone"):
        load_startup_config(path)


def test_the_time_zone_must_be_an_iana_name(tmp_path: Path) -> None:
    text = MINIMAL.replace("Europe/Athens", "Mars/Olympus")
    with pytest.raises(StartupConfigError, match="IANA"):
        load_startup_config(write(tmp_path / CONFIG_FILE_NAME, text))


@pytest.mark.parametrize(
    ("section", "entry"),
    [
        ("broker", "max_rows_per_file = 0"),
        ("broker", "max_rows_per_file = 5000001"),
        ("broker", "max_reads_per_file = 0"),
        ("broker", "max_reads_per_file = 100001"),
        ("broker", "max_reads_per_file = many"),
        ("metatrader5", "login = abc"),
        ("metatrader5", "timeout_ms = 10"),
        ("symbols", "EURUSD ="),
    ],
)
def test_invalid_values_are_rejected(tmp_path: Path, section: str, entry: str) -> None:
    # MINIMAL ends with the section [broker], so an entry of [broker] continues it.
    text = MINIMAL + entry + "\n" if section == "broker" else MINIMAL + f"\n[{section}]\n{entry}\n"
    with pytest.raises(StartupConfigError):
        load_startup_config(write(tmp_path / CONFIG_FILE_NAME, text))


def test_an_unknown_entry_and_an_unknown_section_are_rejected(tmp_path: Path) -> None:
    entry = MINIMAL + "server_time_zon = x\n"
    with pytest.raises(StartupConfigError, match="server_time_zon"):
        load_startup_config(write(tmp_path / CONFIG_FILE_NAME, entry))
    section = MINIMAL + "\n[database]\nurl = x\n"
    with pytest.raises(StartupConfigError, match="unknown section"):
        load_startup_config(write(tmp_path / CONFIG_FILE_NAME, section))


@pytest.mark.parametrize(
    "text",
    [
        "[server]\nhost = 127.0.0.1\n",
        "[server]\nport = 8765\n",
        "[server]\nallowed_hosts = mt5-pc.example\n",
        "[security]\nshared_key = some-key-0123456789\n",
    ],
)
def test_the_entries_of_the_former_server_are_rejected(tmp_path: Path, text: str) -> None:
    with pytest.raises(StartupConfigError):
        load_startup_config(write(tmp_path / CONFIG_FILE_NAME, MINIMAL + "\n" + text))


def test_the_broker_name_cannot_be_set(tmp_path: Path) -> None:
    # The broker is always the name of the trade server MetaTrader 5 is logged in to.
    with pytest.raises(StartupConfigError, match="name"):
        load_startup_config(write(tmp_path / CONFIG_FILE_NAME, MINIMAL + "name = Other\n"))


# --- no error message and no representation shows the password ---------------------------------


def test_a_syntax_error_does_not_show_the_offending_line(tmp_path: Path) -> None:
    path = write(tmp_path / CONFIG_FILE_NAME, MINIMAL + f"\n{SECRET}\n")
    with pytest.raises(StartupConfigError) as error:
        load_startup_config(path)
    assert SECRET not in str(error.value)
    assert "line" in str(error.value)


def test_a_line_before_the_first_section_does_not_show_the_password(tmp_path: Path) -> None:
    path = write(tmp_path / CONFIG_FILE_NAME, f"password = {SECRET}\n" + MINIMAL)
    with pytest.raises(StartupConfigError) as error:
        load_startup_config(path)
    assert SECRET not in str(error.value)


def test_a_duplicate_entry_does_not_show_the_password(tmp_path: Path) -> None:
    text = MINIMAL + f"\n[metatrader5]\npassword = {SECRET}\npassword = {SECRET}-second\n"
    with pytest.raises(StartupConfigError) as error:
        load_startup_config(write(tmp_path / CONFIG_FILE_NAME, text))
    assert SECRET not in str(error.value)


def test_the_representation_of_the_configuration_hides_the_password(tmp_path: Path) -> None:
    path = write(tmp_path / CONFIG_FILE_NAME, MINIMAL + f"\n[metatrader5]\npassword = {SECRET}\n")
    config = load_startup_config(path)
    text = repr(config) + str(config) + repr(config.metatrader)
    assert SECRET not in text


def test_an_unreadable_file_is_reported_without_content(tmp_path: Path) -> None:
    path = tmp_path / CONFIG_FILE_NAME
    path.write_bytes(b"\xff\xfe" + SECRET.encode())
    with pytest.raises(StartupConfigError) as error:
        load_startup_config(path)
    assert SECRET not in str(error.value)


# --- where the file is looked for (req-system-017) --------------------------------------------


def test_an_explicit_path_is_used_and_must_exist(ini: Path, tmp_path: Path) -> None:
    assert resolve_config_path(ini) == ini
    with pytest.raises(StartupConfigError, match="not found"):
        resolve_config_path(tmp_path / "missing.ini")


def test_the_search_order_on_posix(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    pretend_os(monkeypatch, "posix")
    monkeypatch.setenv("HOME", str(tmp_path / "home"))
    locations = default_search_locations()
    assert locations == [
        tmp_path / "home" / "pipwerk" / "etc" / CONFIG_FILE_NAME,
        tmp_path / "home" / ".config" / "pipwerk" / CONFIG_FILE_NAME,
        Path("/etc/pipwerk") / CONFIG_FILE_NAME,
    ]


def test_the_search_order_on_windows(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    pretend_os(monkeypatch, "nt")
    for name in ("USERPROFILE", "APPDATA", "PROGRAMDATA"):
        monkeypatch.setenv(name, str(tmp_path / name.lower()))
    names = [location.relative_to(tmp_path).parts for location in default_search_locations()]
    assert names == [
        ("userprofile", "pipwerk", "etc", CONFIG_FILE_NAME),
        ("appdata", "pipwerk", CONFIG_FILE_NAME),
        ("programdata", "pipwerk", CONFIG_FILE_NAME),
    ]


def test_the_first_file_found_is_used_and_files_are_not_merged(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    pretend_os(monkeypatch, "posix")
    home = tmp_path / "home"
    (home / "pipwerk" / "etc").mkdir(parents=True)
    (home / ".config" / "pipwerk").mkdir(parents=True)
    monkeypatch.setenv("HOME", str(home))
    write(home / ".config" / "pipwerk" / CONFIG_FILE_NAME, MINIMAL.replace("Athens", "Berlin"))
    assert load_startup_config().server_time_zone == "Europe/Berlin"
    # A file with higher priority wins completely; the lower one adds nothing.
    write(
        home / "pipwerk" / "etc" / CONFIG_FILE_NAME,
        MINIMAL.replace("Europe/Athens", "Asia/Tokyo") + "\n[broker]\n",
    )
    with pytest.raises(StartupConfigError):  # [broker] twice: the file is invalid as a whole
        load_startup_config()
    write(
        home / "pipwerk" / "etc" / CONFIG_FILE_NAME,
        MINIMAL.replace("Europe/Athens", "Asia/Tokyo") + "max_rows_per_file = 5\n",
    )
    config = load_startup_config()
    assert config.server_time_zone == "Asia/Tokyo"
    assert config.max_rows == 5


def test_a_relative_home_is_ignored(monkeypatch: pytest.MonkeyPatch) -> None:
    pretend_os(monkeypatch, "posix")
    monkeypatch.setenv("HOME", "relative/home")
    assert default_search_locations() == [Path("/etc/pipwerk") / CONFIG_FILE_NAME]


def test_without_any_file_the_error_names_the_places(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    pretend_os(monkeypatch, "posix")
    monkeypatch.setattr(config_module, "_POSIX_SYSTEM_DIR", tmp_path / "etc")
    monkeypatch.setenv("HOME", str(tmp_path / "home"))
    with pytest.raises(StartupConfigError) as error:
        load_startup_config()
    assert "-c <PATH>" in str(error.value)
    assert str(tmp_path / "home" / "pipwerk" / "etc") in str(error.value)
