"""Tests of what the component brings with it: the example of the startup configuration, the
start scripts for Windows, the installation without the package ``MetaTrader5`` and the
absence of keys and machine details in the files (order 03, acceptance criteria 3 and 7)."""

import re
import tomllib
from pathlib import Path

import pytest

from pipwerk_fetch_mt5.config import (
    _ALLOWED_OPTIONS,
    CONFIG_FILE_NAME,
    StartupConfigError,
    load_startup_config,
)

COMPONENT = Path(__file__).resolve().parents[1]
REPOSITORY = COMPONENT.parents[1]
EXAMPLE = COMPONENT / "pipwerk-fetch-mt5.example.ini"
DOCUMENT = REPOSITORY / "docs" / "technical" / "pipwerk-fetch-mt5.md"
CONTRACT = REPOSITORY / "contracts" / "api" / "pipwerk-fetch"

IGNORED_DIRECTORIES = {".venv", "__pycache__", ".mypy_cache", ".pytest_cache", ".ruff_cache"}


def files_of(root: Path) -> list[Path]:
    return [
        path
        for path in sorted(root.rglob("*"))
        if path.is_file() and not IGNORED_DIRECTORIES & set(path.relative_to(root).parts)
    ]


# --- the example of the startup configuration ----------------------------------------------------


def test_the_example_is_not_a_working_configuration_until_the_two_entries_are_filled_in(
    tmp_path: Path,
) -> None:
    with pytest.raises(StartupConfigError, match="server_time_zone"):
        load_startup_config(EXAMPLE)
    text = EXAMPLE.read_text(encoding="utf-8")
    only_zone = tmp_path / "zone.ini"
    only_zone.write_text(
        text.replace("server_time_zone =", "server_time_zone = Europe/Athens"), encoding="utf-8"
    )
    with pytest.raises(StartupConfigError, match="shared_key"):
        load_startup_config(only_zone)
    filled = tmp_path / CONFIG_FILE_NAME
    filled.write_text(
        text.replace("server_time_zone =", "server_time_zone = Europe/Athens").replace(
            "shared_key =", "shared_key = example-key-0123456789"
        ),
        encoding="utf-8",
    )
    config = load_startup_config(filled)
    assert (config.host, config.port) == ("127.0.0.1", 8765)
    assert config.server_time_zone == "Europe/Athens"


def test_the_example_names_every_entry_of_the_startup_configuration() -> None:
    text = EXAMPLE.read_text(encoding="utf-8")
    for section, options in _ALLOWED_OPTIONS.items():
        assert f"[{section}]" in text
        for option in options:
            assert re.search(rf"^#?\s*{option} =", text, re.MULTILINE), (section, option)
    assert "[symbols]" in text
    assert "-c <PATH>" in text


def test_the_example_with_every_optional_entry_switched_on_is_valid(tmp_path: Path) -> None:
    optional = {"allowed_hosts", "name", "max_rows_per_request", "path", "login", "password"}
    optional |= {"server", "timeout_ms", "EURUSD", "DE40"}
    uncommented = []
    for line in EXAMPLE.read_text(encoding="utf-8").splitlines():
        match = re.match(r"^# (\w+) = ?(.*)$", line)
        if match and match.group(1) in optional:
            uncommented.append(f"{match.group(1)} = {match.group(2)}")  # the optional entries
        elif not line.startswith("#"):
            uncommented.append(line)
    text = "\n".join(uncommented)
    text = text.replace("server_time_zone =", "server_time_zone = Europe/Athens").replace(
        "shared_key =", "shared_key = example-key-0123456789"
    )
    path = tmp_path / CONFIG_FILE_NAME
    path.write_text(text, encoding="utf-8")
    config = load_startup_config(path)
    assert config.max_rows == 50000
    assert config.symbol_for("EURUSD") == "EURUSD.r"
    assert config.metatrader.login == 12345678


def test_no_filled_in_configuration_is_in_the_component() -> None:
    names = {path.name for path in files_of(COMPONENT)}
    assert CONFIG_FILE_NAME not in names
    assert not [name for name in names if name.endswith(".conf")]


# --- installation without the package MetaTrader5 -----------------------------------------------


def test_the_package_metatrader5_is_an_optional_dependency_for_windows_only() -> None:
    project = tomllib.loads((COMPONENT / "pyproject.toml").read_text(encoding="utf-8"))
    required = project["project"]["dependencies"]
    assert not [item for item in required if "metatrader5" in item.lower()]
    optional = project["project"]["optional-dependencies"]["mt5"]
    assert len(optional) == 1
    assert optional[0].lower().startswith("metatrader5")
    assert "sys_platform == 'win32'" in optional[0]
    dev = project["dependency-groups"]["dev"]
    assert not [item for item in dev if "metatrader5" in item.lower()]


def test_the_lock_file_pins_the_package_for_windows_only() -> None:
    lock = tomllib.loads((COMPONENT / "uv.lock").read_text(encoding="utf-8"))
    names = {package["name"] for package in lock["package"]}
    assert "metatrader5" in names
    own = next(package for package in lock["package"] if package["name"] == "pipwerk-fetch-mt5")
    assert own["optional-dependencies"]["mt5"] == [
        {"name": "metatrader5", "marker": "sys_platform == 'win32'"}
    ]
    assert not [
        item for item in own["dependencies"] if item["name"] == "metatrader5"
    ]  # not a required dependency


def test_the_program_starts_from_the_files_of_the_component_without_the_package() -> None:
    # On this machine the package is not installed (Linux) or, on Windows, it is: the program
    # must not need it for these imports either way (tests/test_mt5_gateway.py checks the
    # imports in a fresh process).
    project = tomllib.loads((COMPONENT / "pyproject.toml").read_text(encoding="utf-8"))
    assert project["project"]["scripts"] == {"pipwerk-fetch-mt5": "pipwerk_fetch_mt5.cli:main"}
    assert project["project"]["name"] == "pipwerk-fetch-mt5"


# --- the start scripts for Windows ---------------------------------------------------------------


def test_the_start_script_runs_the_program_from_the_locked_environment() -> None:
    text = (COMPONENT / "scripts" / "start.cmd").read_text(encoding="utf-8")
    command = next(line for line in text.splitlines() if line.startswith("uv "))
    assert command == (
        'uv --project "%COMPONENT%" run --frozen --extra mt5 --no-dev pipwerk-fetch-mt5 %*'
    )
    assert 'set "COMPONENT=%~dp0.."' in text  # derived from the place of the script
    assert "%*" in command  # -c <PATH> reaches the program
    assert "--directory" not in command  # the working folder stays, so a relative -c works


def test_the_installation_script_installs_the_locked_dependencies_without_development_tools() -> (
    None
):
    text = (COMPONENT / "scripts" / "install.cmd").read_text(encoding="utf-8")
    command = next(line for line in text.splitlines() if line.startswith("uv "))
    assert command == 'uv --project "%COMPONENT%" sync --frozen --extra mt5 --no-dev'


# --- no key, no machine details ------------------------------------------------------------------


def forbidden_fragments() -> list[str]:
    # Written in pieces so that this file does not contain what it searches for.
    return ["/s" + "rv/", "/v" + "ar/lib", "/ho" + "me/", "aix" + "lab", "code" + "srv"]


def text_files() -> list[Path]:
    paths = [path for path in files_of(COMPONENT) if path.name != "uv.lock"]
    paths += files_of(CONTRACT)
    if DOCUMENT.is_file():
        paths.append(DOCUMENT)
    return paths


def test_no_file_names_the_development_machine() -> None:
    for path in text_files():
        text = path.read_text(encoding="utf-8")
        for fragment in forbidden_fragments():
            assert fragment not in text, (path.relative_to(REPOSITORY), fragment)


def test_no_file_holds_a_key_or_a_password() -> None:
    allowed_in_tests = COMPONENT / "tests"
    for path in text_files():
        if allowed_in_tests in path.parents or path.suffix == ".py":
            continue  # the tests use made-up keys; the program holds none in its code
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
            match = re.match(r"^\s*(shared_key|password)\s*=\s*(\S.*)$", line)
            assert match is None, (path.relative_to(REPOSITORY), number)


def test_the_replica_key_is_a_test_value_and_says_so() -> None:
    from pipwerk_fetch_mt5.fake_source import FAKE_SHARED_KEY

    assert "not-a-secret" in FAKE_SHARED_KEY
