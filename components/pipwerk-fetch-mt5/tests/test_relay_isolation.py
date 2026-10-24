"""The call on the command line stays what it was (order 5 point 5, specification relay 6.1).

Its modules do not load the library of pipwerk relay, open no socket, resolve no name and load no
network module. The commands ``serve`` and ``request`` are in the package ``relay``, which only
they load. ``request`` needs neither MetaTrader 5 nor its package.
"""

import ast
import io
import subprocess
import sys
from pathlib import Path

import pytest
from relay_support import RETRIEVAL, Network
from test_cli import no_sockets  # noqa: F401 - fixture

from pipwerk_fetch_mt5.cli import main
from pipwerk_fetch_mt5.mt5_gateway import Mt5Gateway
from pipwerk_fetch_mt5.relay.commands import RelayHooks

COMPONENT = Path(__file__).resolve().parents[1]
SOURCE = COMPONENT / "src" / "pipwerk_fetch_mt5"
TESTS = Path(__file__).resolve().parent

#: What the call on the command line must not bring in.
FORBIDDEN_PREFIXES = ("pipwerk_relaycore", "pipwerk_fetch_mt5.relay", "sqlalchemy", "alembic")
NETWORK_MODULES = ("socket", "ssl", "http", "asyncio", "selectors")

PROBE = """
import io, pathlib, sys, tempfile
sys.path.insert(0, {tests!r})
from support import ArchiveMt5Module
from pipwerk_fetch_mt5 import cli

directory = pathlib.Path(tempfile.mkdtemp())
(directory / "c.ini").write_text("[broker]\\nserver_time_zone = UTC\\n")
arguments = {arguments!r}
arguments = [
    directory / "c.ini" if item == "CONFIG" else directory / "out" if item == "OUT" else item
    for item in arguments
]
module = ArchiveMt5Module()
module.candle_seconds["EURUSD"] = [1767571200]  # 2026-01-05 00:00:00
try:
    code = cli.main(
        [str(item) for item in arguments],
        module=module,
        out=io.StringIO(),
        err=io.StringIO(),
    )
except SystemExit as stop:
    code = stop.code
loaded = sorted(
    name for name in sys.modules
    if name.split(".")[0] in {names!r} or name.startswith("pipwerk_fetch_mt5.relay")
)
print(code)
print(",".join(loaded))
"""


def loaded_after(arguments: list[str]) -> tuple[int, list[str]]:
    """Run ``cli.main`` in a fresh interpreter; the exit code and the modules of interest that
    are loaded afterwards."""
    names = {"pipwerk_relaycore", "sqlalchemy", "alembic", *NETWORK_MODULES}
    script = PROBE.format(tests=str(TESTS), arguments=arguments, names=names)
    done = subprocess.run(  # noqa: S603 - our own interpreter, our own script
        [sys.executable, "-I", "-c", script], capture_output=True, text=True, check=False
    )
    assert done.returncode == 0, done.stderr
    code, modules = done.stdout.splitlines()[-2:]  # a help text comes before
    return int(code), [name for name in modules.split(",") if name]


def test_the_call_on_the_command_line_loads_nothing_of_pipwerk_relay_and_no_network_module() -> (
    None
):
    code, loaded = loaded_after(
        [
            *("-c", "CONFIG", "--from", "2026-01-05", "--to", "2026-01-06"),
            *("-o", "OUT", "-u", "H1", "EURUSD"),
        ]
    )
    assert code == 0
    assert loaded == []


def test_the_probe_sees_the_library_when_a_command_of_pipwerk_relay_is_called() -> None:
    # Without this the test above could pass for the wrong reason.
    code, loaded = loaded_after(["request", "--help"])
    assert code == 0
    assert any(name.startswith("pipwerk_fetch_mt5.relay") for name in loaded)
    assert "pipwerk_relaycore" in loaded


def test_no_module_of_the_command_line_imports_the_library_at_module_level() -> None:
    for path in sorted(SOURCE.glob("*.py")):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in tree.body:  # module level only; a block `if TYPE_CHECKING` is not run
            names: list[str] = []
            if isinstance(node, ast.Import):
                names = [alias.name for alias in node.names]
            elif isinstance(node, ast.ImportFrom) and node.module and node.level == 0:
                names = [node.module]
            for name in names:
                assert not name.startswith(FORBIDDEN_PREFIXES), (path.name, name)


def test_only_the_dispatch_of_the_command_line_names_the_relay_package() -> None:
    mentions = []
    for path in sorted(SOURCE.glob("*.py")):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if (
                isinstance(node, ast.ImportFrom)
                and node.module
                and node.module.startswith(FORBIDDEN_PREFIXES)
            ):
                mentions.append((path.name, node.module))
    assert mentions == [
        ("cli.py", "pipwerk_fetch_mt5.relay.commands"),  # under TYPE_CHECKING
        ("cli.py", "pipwerk_fetch_mt5.relay.commands"),  # in main, when a command is called
        ("config.py", "pipwerk_relaycore.connection"),  # under TYPE_CHECKING
        ("config.py", "pipwerk_relaycore.connection"),  # in _relay, when serve or request read it
    ]


def test_the_library_of_pipwerk_relay_is_a_dependency_of_the_program() -> None:
    text = (COMPONENT / "pyproject.toml").read_text(encoding="utf-8")
    assert '"pipwerk-relaycore==0.1.0"' in text  # the version is fixed
    assert 'pipwerk-relaycore = { path = "../../packages/relay-core", editable = true }' in text


# --- request needs no MetaTrader 5 -------------------------------------------------------------


def test_request_does_not_touch_metatrader_5(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    def forbidden(*_args: object, **_kwargs: object) -> None:
        raise AssertionError("request used the connection to MetaTrader 5")

    monkeypatch.setattr(Mt5Gateway, "__init__", forbidden)
    monkeypatch.setattr(Mt5Gateway, "_package", forbidden)
    root = tmp_path / "net"
    root.mkdir()
    network = Network(root)
    now = [0.0]

    def sleep(seconds: float) -> None:
        now[0] += seconds

    err = io.StringIO()
    code = main(
        [
            *("request", "-c", str(network.ask_ini), "--address", RETRIEVAL, "--broker", "B"),
            *("--from", "2026-01-05", "--to", "2026-01-06", "-o", str(tmp_path / "t")),
            *("--wait", "1", "EURUSD"),
        ],
        relay_hooks=RelayHooks(sleep=sleep, monotonic=lambda: now[0], poll_interval=10.0),
        out=io.StringIO(),
        err=err,
    )
    assert code == 1
    assert "kein Ergebnis" in err.getvalue()
