"""Tests of what the component brings with it: the example of the startup configuration, the
scripts for Windows, the installation without the package ``MetaTrader5``, no server and no
HTTP interface anywhere, and no password or machine details in the files (order 13, acceptance
criteria 1 and 4)."""

import ast
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
CONTRACTS = REPOSITORY / "contracts"
SOURCE = COMPONENT / "src" / "pipwerk_fetch_mt5"

IGNORED_DIRECTORIES = {".venv", "__pycache__", ".mypy_cache", ".pytest_cache", ".ruff_cache"}


def files_of(root: Path) -> list[Path]:
    return [
        path
        for path in sorted(root.rglob("*"))
        if path.is_file() and not IGNORED_DIRECTORIES & set(path.relative_to(root).parts)
    ]


# --- the example of the startup configuration ----------------------------------------------------


def test_the_example_is_not_a_working_configuration_until_the_zone_is_filled_in(
    tmp_path: Path,
) -> None:
    with pytest.raises(StartupConfigError, match="server_time_zone"):
        load_startup_config(EXAMPLE)
    filled = tmp_path / CONFIG_FILE_NAME
    filled.write_text(
        EXAMPLE.read_text(encoding="utf-8").replace(
            "server_time_zone =", "server_time_zone = Europe/Athens"
        ),
        encoding="utf-8",
    )
    config = load_startup_config(filled)
    assert config.server_time_zone == "Europe/Athens"
    assert config.max_rows == 200_000


def test_the_example_names_every_entry_of_the_startup_configuration() -> None:
    text = EXAMPLE.read_text(encoding="utf-8")
    for section, options in _ALLOWED_OPTIONS.items():
        assert f"[{section}]" in text
        for option in options:
            assert re.search(rf"^#?\s*{option} =", text, re.MULTILINE), (section, option)
    assert "[symbols]" in text
    assert "-c <PATH>" in text


def test_the_example_with_every_optional_entry_switched_on_is_valid(tmp_path: Path) -> None:
    optional = {"max_rows_per_file", "max_reads_per_file", "path", "login", "password"}
    optional |= {"server", "timeout_ms", "EURUSD", "DE40"}
    uncommented = []
    for line in EXAMPLE.read_text(encoding="utf-8").splitlines():
        match = re.match(r"^# (\w+) = ?(.*)$", line)
        if match and match.group(1) in optional:
            uncommented.append(f"{match.group(1)} = {match.group(2)}")  # the optional entries
        elif not line.startswith("#"):
            uncommented.append(line)
    text = "\n".join(uncommented).replace("server_time_zone =", "server_time_zone = Europe/Athens")
    path = tmp_path / CONFIG_FILE_NAME
    path.write_text(text, encoding="utf-8")
    config = load_startup_config(path)
    assert config.max_rows == 200_000
    assert config.max_reads == 500
    assert config.symbol_for("EURUSD") == "EURUSD.r"
    assert config.metatrader.login == 12345678


def test_the_example_has_no_address_port_key_or_list_of_hosts() -> None:
    text = EXAMPLE.read_text(encoding="utf-8")
    assert not re.search(r"^\s*#?\s*(host|port|allowed_hosts|shared_key)\s*=", text, re.MULTILINE)
    assert "[server]" not in text
    assert "[security]" not in text


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


def test_the_program_is_installed_as_a_command() -> None:
    project = tomllib.loads((COMPONENT / "pyproject.toml").read_text(encoding="utf-8"))
    assert project["project"]["scripts"] == {"pipwerk-fetch-mt5": "pipwerk_fetch_mt5.cli:main"}
    assert project["project"]["name"] == "pipwerk-fetch-mt5"


def test_the_library_of_the_data_store_is_a_dependency_for_the_tests_only() -> None:
    project = tomllib.loads((COMPONENT / "pyproject.toml").read_text(encoding="utf-8"))
    assert not [item for item in project["project"]["dependencies"] if "marketdata" in item.lower()]
    assert [item for item in project["dependency-groups"]["dev"] if "marketdata" in item]
    lock = tomllib.loads((COMPONENT / "uv.lock").read_text(encoding="utf-8"))
    own = next(package for package in lock["package"] if package["name"] == "pipwerk-fetch-mt5")
    assert "pipwerk-marketdata" not in {item["name"] for item in own["dependencies"]}
    assert "pipwerk-marketdata" in {item["name"] for item in own["dev-dependencies"]["dev"]}


# --- no server, no port, no HTTP interface (acceptance criteria 1 and 4) --------------------------

#: Written in pieces so that this file does not contain what it searches for.
WEB_PACKAGES = ["fast" + "api", "star" + "lette", "uvi" + "corn", "h" + "11", "httpx" + "2"]
SERVER_MODULES = {"socket", "socketserver", "http", "asyncio", "ssl", "selectors", *WEB_PACKAGES}


def test_neither_project_file_nor_lock_names_a_web_framework_or_a_server() -> None:
    project = (COMPONENT / "pyproject.toml").read_text(encoding="utf-8").lower()
    lock = tomllib.loads((COMPONENT / "uv.lock").read_text(encoding="utf-8"))
    names = {package["name"] for package in lock["package"]}
    for name in WEB_PACKAGES:
        assert name not in project
        assert name not in names


def test_no_module_of_the_program_imports_a_server_or_the_network() -> None:
    for path in sorted(SOURCE.glob("*.py")):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            modules: list[str] = []
            if isinstance(node, ast.Import):
                modules = [alias.name for alias in node.names]
            elif isinstance(node, ast.ImportFrom) and node.module and node.level == 0:
                modules = [node.module]
            for module in modules:
                assert module.split(".")[0] not in SERVER_MODULES, (path.name, module)


def test_the_files_of_the_former_server_are_gone() -> None:
    for name in ("app", "auth", "body_limit", "host_check", "fake_source", "contract"):
        assert not (SOURCE / f"{name}.py").exists(), name
    assert not (COMPONENT / "scripts" / "start.cmd").exists()
    assert not (CONTRACTS / "api" / "pipwerk-fetch").exists()


def http_fragments() -> list[str]:
    return [
        "/api/v1/" + "fetch",
        "/api/v1/" + "health",
        "pipwerk-fetch/" + "v1",
        "Authorization: " + "Bearer",
        "allowed_" + "hosts",
        "shared_" + "key",
    ]


def test_no_http_interface_of_the_program_is_mentioned_in_the_component_or_the_document() -> None:
    paths = [path for path in files_of(COMPONENT) if path.name != "uv.lock"]
    paths = [path for path in paths if "tests" not in path.relative_to(COMPONENT).parts]
    paths.append(DOCUMENT)
    for path in paths:
        text = path.read_text(encoding="utf-8")
        for fragment in [*http_fragments(), "OpenAPI", "openapi"]:
            assert fragment not in text, (path.relative_to(REPOSITORY), fragment)


def test_no_http_interface_of_the_program_is_mentioned_in_the_contracts() -> None:
    for path in files_of(CONTRACTS):
        text = path.read_text(encoding="utf-8")
        for fragment in http_fragments():
            assert fragment not in text, (path.relative_to(REPOSITORY), fragment)


def test_the_overview_of_the_interfaces_does_not_list_the_program() -> None:
    text = (CONTRACTS / "api" / "README.md").read_text(encoding="utf-8")
    assert "pipwerk-fetch" not in text


# --- the scripts for Windows ---------------------------------------------------------------------


def test_the_call_script_runs_the_program_from_the_locked_environment() -> None:
    text = (COMPONENT / "scripts" / "fetch.cmd").read_text(encoding="utf-8")
    command = next(line for line in text.splitlines() if line.startswith("uv "))
    assert command == (
        'uv --project "%COMPONENT%" run --frozen --extra mt5 --no-dev pipwerk-fetch-mt5 %*'
    )
    assert 'set "COMPONENT=%~dp0.."' in text  # derived from the place of the script
    assert "%*" in command  # every parameter reaches the program
    assert "--directory" not in command  # the working folder stays, so relative paths work


def test_the_installation_script_installs_the_locked_dependencies_without_development_tools() -> (
    None
):
    text = (COMPONENT / "scripts" / "install.cmd").read_text(encoding="utf-8")
    command = next(line for line in text.splitlines() if line.startswith("uv "))
    assert command == 'uv --project "%COMPONENT%" sync --frozen --extra mt5 --no-dev'


# --- no password, no machine details ------------------------------------------------------------


def forbidden_fragments() -> list[str]:
    # Written in pieces so that this file does not contain what it searches for.
    return ["/s" + "rv/", "/v" + "ar/lib", "/ho" + "me/", "aix" + "lab", "code" + "srv"]


def text_files() -> list[Path]:
    paths = [path for path in files_of(COMPONENT) if path.name != "uv.lock"]
    paths.append(DOCUMENT)
    return paths


def test_no_file_names_the_development_machine() -> None:
    for path in text_files():
        text = path.read_text(encoding="utf-8")
        for fragment in forbidden_fragments():
            assert fragment not in text, (path.relative_to(REPOSITORY), fragment)


def test_no_file_holds_a_password() -> None:
    allowed_in_tests = COMPONENT / "tests"
    for path in text_files():
        if allowed_in_tests in path.parents or path.suffix == ".py":
            continue  # the tests use made-up passwords; the program holds none in its code
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
            match = re.match(r"^\s*password\s*=\s*(\S.*)$", line)
            assert match is None, (path.relative_to(REPOSITORY), number)
