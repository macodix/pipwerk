"""Tests for the test environment script ``scripts/testenv``.

``testenv start`` runs in a replica of the repository in a temporary directory: the versioned
files ``LICENSE`` and ``components/pipwerk-replay/**`` (those of the user interface only where a
test asks for them), in the same directory structure. ``uv``, ``npm`` and ``npx`` are replaced by
placeholder programs that note every call.

Covered: the start aborts with a message on every uncommitted change and every new file that
is not ignored in the whole repository and without Git, before anything is installed, built or
started. Without changes, and with ignored new files only, the check lets the start pass. The
script is called with an absolute path from a directory outside of the repository and with a
relative path from the root of the repository. As long as the component has no directory
``frontend/``, only the backend is started and ``status`` says so; with it, the installation
and the build of the user interface are called. The allowed names of the backend follow
``--host``. A complete cycle of ``start``, ``status`` and ``stop`` runs with a small program in
place of the backend and one in place of ``vite preview``. A source is set up with
``--source-url`` and ``--source-key-file``: the key reaches the startup configuration of the test
environment (readable only for the user) and no other place, in particular no command line.

The tests are skipped without an installed Git and in a working directory that
is not a Git working directory (for example an unpacked archive).
"""

import os
import shutil
import socket
import stat
import subprocess
import sys
from collections.abc import Callable
from pathlib import Path

import pytest

COMPONENT = "components/pipwerk-replay"
SCRIPT = f"{COMPONENT}/scripts/testenv"
GIT = shutil.which("git")
GIT_ENVIRONMENT = {
    "GIT_AUTHOR_NAME": "tester",
    "GIT_AUTHOR_EMAIL": "tester@example.invalid",
    "GIT_COMMITTER_NAME": "tester",
    "GIT_COMMITTER_EMAIL": "tester@example.invalid",
    "GIT_CONFIG_GLOBAL": os.devnull,
    "GIT_CONFIG_NOSYSTEM": "1",
}
PLACEHOLDER = '#!/bin/sh\necho "$(basename "$0") $*" >> "$TESTENV_CALL_LOG"\nexit 1\n'
WORKING_PLACEHOLDER = '#!/bin/sh\necho "$(basename "$0") $*" >> "$TESTENV_CALL_LOG"\nexit 0\n'


def _source_root() -> Path | None:
    """Root of the Git working directory these tests run in, or ``None``."""
    if GIT is None:
        return None
    result = subprocess.run(  # noqa: S603
        [GIT, "-C", str(Path(__file__).resolve().parent), "rev-parse", "--show-toplevel"],
        capture_output=True,
        text=True,
        check=False,
        env={**os.environ, "GIT_CONFIG_GLOBAL": os.devnull},
    )
    return Path(result.stdout.strip()) if result.returncode == 0 else None


SOURCE_ROOT = _source_root()

pytestmark = pytest.mark.skipif(
    SOURCE_ROOT is None, reason="Git is not installed or this is not a Git working directory"
)


def _versioned_files(root: Path) -> list[str]:
    assert GIT is not None
    result = subprocess.run(  # noqa: S603
        [GIT, "-C", str(root), "ls-files", "-z", "--", "LICENSE", COMPONENT],
        capture_output=True,
        check=True,
        env={**os.environ, "GIT_CONFIG_GLOBAL": os.devnull},
    )
    return [name for name in result.stdout.decode().split("\0") if name]


def _free_port() -> int:
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        return int(listener.getsockname()[1])


class Replica:
    """Replica of the repository in a temporary directory, with placeholders."""

    def __init__(self, base: Path, *, with_git: bool, with_frontend: bool = False) -> None:
        assert SOURCE_ROOT is not None
        self.base = base
        self.root = base / "repository"
        self.component = self.root / COMPONENT
        self.call_log = base / "calls.log"
        self.call_log.write_text("", encoding="utf-8")
        for name in _versioned_files(SOURCE_ROOT):
            source = SOURCE_ROOT / name
            if not source.is_file():
                continue
            # Most tests work on the component without its user interface (an empty directory
            # ``frontend/`` is created where a test needs one); the files of the real user
            # interface are copied only on request.
            if not with_frontend and name.startswith(f"{COMPONENT}/frontend/"):
                continue
            target = self.root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
        # The file mode of the script is taken over from the source as it is, so that a
        # missing execute bit shows up in the tests that call the script as a program.
        placeholders = base / "placeholders"
        placeholders.mkdir()
        for program in ("uv", "npm", "npx"):
            path = placeholders / program
            path.write_text(PLACEHOLDER, encoding="utf-8")
            path.chmod(0o755)
        self.environment = {
            key: value
            for key, value in os.environ.items()
            if not key.startswith("GIT_") and key != "FORCE_COLOR"
        }
        self.environment.update(GIT_ENVIRONMENT)
        self.environment["GIT_CEILING_DIRECTORIES"] = str(base)
        self.environment["PATH"] = f"{placeholders}{os.pathsep}{os.environ['PATH']}"
        self.environment["TESTENV_CALL_LOG"] = str(self.call_log)
        if with_git:
            self.git("init", "--quiet")
            self.git("add", "--all")
            self.git("commit", "--quiet", "--message", "replica")
        assert not (self.component / ".testenv").exists()

    def git(self, *args: str) -> None:
        assert GIT is not None
        subprocess.run(  # noqa: S603
            [GIT, "-C", str(self.root), *args],
            check=True,
            capture_output=True,
            env=self.environment,
        )

    def run(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(  # noqa: S603
            ["sh", str(self.root / SCRIPT), *args],  # noqa: S607
            capture_output=True,
            text=True,
            check=False,
            timeout=90,
            env=self.environment,
            cwd=self.base,
        )

    def run_relative(self, *args: str) -> subprocess.CompletedProcess[str]:
        """Call the script with a relative path from the root of the replica."""
        return subprocess.run(  # noqa: S603
            ["sh", SCRIPT, *args],  # noqa: S607
            capture_output=True,
            text=True,
            check=False,
            timeout=90,
            env=self.environment,
            cwd=self.root,
        )

    def start(self, *extra: str) -> subprocess.CompletedProcess[str]:
        return self.run(
            "start",
            "--frontend-port",
            str(_free_port()),
            "--backend-port",
            str(_free_port()),
            *extra,
        )

    def start_relative(self) -> subprocess.CompletedProcess[str]:
        return self.run_relative(
            "start",
            "--frontend-port",
            str(_free_port()),
            "--backend-port",
            str(_free_port()),
        )

    def calls(self) -> list[str]:
        return self.call_log.read_text(encoding="utf-8").splitlines()

    def backend_binaries(self) -> Path:
        binaries = self.component / "backend" / ".venv" / "bin"
        binaries.mkdir(parents=True, exist_ok=True)
        return binaries

    def let_installation_pass(self) -> None:
        """``uv``, ``npm`` and ``npx`` note the call and end with exit code 0."""
        for program in ("uv", "npm", "npx"):
            (self.base / "placeholders" / program).write_text(WORKING_PLACEHOLDER, encoding="utf-8")

    def install_recorder(self, record: Path) -> None:
        """Let installation pass and replace the backend by a recorder.

        ``.venv/bin/pipwerk-replay`` copies the startup configuration it is given with ``-c``
        and its arguments to ``record`` and ends with exit code 1, so the start ends before
        any server runs.
        """
        self.let_installation_pass()
        recorder = self.backend_binaries() / "pipwerk-replay"
        recorder.write_text(
            "#!/bin/sh\n"
            'printf "%s\\n" "$@" > "$TESTENV_RECORD_DIR/arguments.txt"\n'
            'cp "$2" "$TESTENV_RECORD_DIR/pipwerk-replay.ini"\n'
            "exit 1\n",
            encoding="utf-8",
        )
        recorder.chmod(0o755)
        self.environment["TESTENV_RECORD_DIR"] = str(record)

    def install_small_backend(self) -> None:
        """Let installation pass and replace the backend by a small program that answers
        ``/api/health`` on the port it is given with ``--port``."""
        self.let_installation_pass()
        program = self.backend_binaries() / "pipwerk-replay"
        program.write_text(
            f"#!{sys.executable}\n"
            "import sys\n"
            "from http.server import BaseHTTPRequestHandler, HTTPServer\n"
            "\n"
            "port = int(sys.argv[sys.argv.index('--port') + 1])\n"
            "\n"
            "class Handler(BaseHTTPRequestHandler):\n"
            "    def do_GET(self):\n"
            '        body = b\'{"status": "ok"}\'\n'
            "        self.send_response(200)\n"
            "        self.send_header('Content-Type', 'application/json')\n"
            "        self.send_header('Content-Length', str(len(body)))\n"
            "        self.end_headers()\n"
            "        self.wfile.write(body)\n"
            "\n"
            "    def log_message(self, *args):\n"
            "        pass\n"
            "\n"
            "HTTPServer(('127.0.0.1', port), Handler).serve_forever()\n",
            encoding="utf-8",
        )
        program.chmod(0o755)

    def install_small_frontend(self) -> None:
        """Let a directory ``frontend/`` exist and replace ``vite preview`` by a small program that
        answers ``/api/health`` on the port it is given with ``--port``."""
        binaries = self.component / "frontend" / "node_modules" / ".bin"
        binaries.mkdir(parents=True, exist_ok=True)
        program = binaries / "vite"
        program.write_text(
            f"#!{sys.executable}\n"
            "import sys\n"
            "from http.server import BaseHTTPRequestHandler, HTTPServer\n"
            "\n"
            "port = int(sys.argv[sys.argv.index('--port') + 1])\n"
            "\n"
            "class Handler(BaseHTTPRequestHandler):\n"
            "    def do_GET(self):\n"
            '        body = b\'{"status": "ok"}\'\n'
            "        self.send_response(200)\n"
            "        self.send_header('Content-Type', 'application/json')\n"
            "        self.send_header('Content-Length', str(len(body)))\n"
            "        self.end_headers()\n"
            "        self.wfile.write(body)\n"
            "\n"
            "    def log_message(self, *args):\n"
            "        pass\n"
            "\n"
            "HTTPServer(('127.0.0.1', port), Handler).serve_forever()\n",
            encoding="utf-8",
        )
        program.chmod(0o755)

    def started_processes(self) -> list[str]:
        """Command lines of all processes that were started from the replica."""
        # -ww: whole lines; ps cuts them at 80 characters when its output is not a terminal.
        listing = subprocess.run(
            ["ps", "-e", "-ww", "-o", "args="],  # noqa: S607
            capture_output=True,
            text=True,
            check=True,
        )
        # The script works on the resolved path of the working directory.
        names = {str(self.root), str(self.root.resolve())}
        return [line for line in listing.stdout.splitlines() if any(name in line for name in names)]


@pytest.fixture
def make_replica(tmp_path: Path) -> Callable[..., Replica]:
    counter = 0

    def make(*, with_git: bool = True, with_frontend: bool = False) -> Replica:
        nonlocal counter
        counter += 1
        base = tmp_path / f"case{counter}"
        base.mkdir()
        return Replica(base, with_git=with_git, with_frontend=with_frontend)

    return make


def _modify_versioned_file_in_component(replica: Replica) -> None:
    with (replica.component / "README.md").open("a", encoding="utf-8") as file:
        file.write("changed\n")


def _modify_license(replica: Replica) -> None:
    with (replica.root / "LICENSE").open("a", encoding="utf-8") as file:
        file.write("changed\n")


def _new_file_in_component(replica: Replica) -> None:
    (replica.component / "new-file.txt").write_text("new\n", encoding="utf-8")


def _new_file_in_root(replica: Replica) -> None:
    (replica.root / "new-file.txt").write_text("new\n", encoding="utf-8")


def _assert_nothing_happened(replica: Replica) -> None:
    assert replica.calls() == []
    assert not (replica.component / ".testenv").exists()
    assert replica.started_processes() == []


@pytest.mark.parametrize(
    ("change", "mentioned"),
    [
        (_modify_versioned_file_in_component, "README.md"),
        (_modify_license, "LICENSE"),
        (_new_file_in_component, "new-file.txt"),
        (_new_file_in_root, "new-file.txt"),
    ],
    ids=[
        "changed file in the component",
        "changed LICENSE outside of the component",
        "new file in the component",
        "new file outside of the component",
    ],
)
def test_start_aborts_on_uncommitted_changes(
    make_replica: Callable[..., Replica],
    change: Callable[[Replica], None],
    mentioned: str,
) -> None:
    replica = make_replica()
    change(replica)

    result = replica.start()

    assert result.returncode != 0
    assert "uncommitted changes" in result.stderr
    assert mentioned in result.stderr
    _assert_nothing_happened(replica)


def test_start_aborts_without_git(make_replica: Callable[..., Replica]) -> None:
    replica = make_replica(with_git=False)

    result = replica.start()

    assert result.returncode != 0
    assert "not in a Git working directory" in result.stderr
    _assert_nothing_happened(replica)


def test_check_lets_a_clean_working_directory_with_ignored_new_files_pass(
    make_replica: Callable[..., Replica],
) -> None:
    replica = make_replica()
    ignored = replica.component / "backend" / ".venv" / "lib" / "module.py"
    ignored.parent.mkdir(parents=True)
    ignored.write_text("ignored\n", encoding="utf-8")

    result = replica.start()

    assert result.returncode != 0
    assert "uncommitted changes" not in result.stderr
    calls = replica.calls()
    assert len(calls) == 1
    assert calls[0].startswith("uv ")
    assert "sync --frozen" in calls[0]
    assert not (replica.component / ".testenv").exists()
    assert replica.started_processes() == []


def test_relative_path_from_the_root_works_on_that_working_directory(
    make_replica: Callable[..., Replica],
) -> None:
    """The call used in the documentation: relative path, run in the root."""
    replica = make_replica()
    _new_file_in_root(replica)

    result = replica.start_relative()

    assert result.returncode != 0
    assert "uncommitted changes" in result.stderr
    assert "new-file.txt" in result.stderr
    _assert_nothing_happened(replica)


def test_relative_path_from_the_root_passes_the_check_on_a_clean_working_directory(
    make_replica: Callable[..., Replica],
) -> None:
    replica = make_replica()

    result = replica.start_relative()

    assert result.returncode != 0
    assert "uncommitted changes" not in result.stderr
    calls = replica.calls()
    assert len(calls) == 1
    # The first call works on the backend of this working directory.
    expected = f"uv --directory {(replica.component / 'backend').resolve()} sync --frozen"
    assert calls[0] == expected
    assert not (replica.component / ".testenv").exists()
    assert replica.started_processes() == []


def test_relative_path_from_the_root_reports_status_of_that_working_directory(
    make_replica: Callable[..., Replica],
) -> None:
    replica = make_replica()

    result = replica.run_relative("status")

    assert result.returncode == 1
    assert "not running" in result.stdout + result.stderr
    _assert_nothing_happened(replica)


@pytest.mark.parametrize(
    "arguments",
    [
        [],
        ["start"],
        ["start", "--frontend-port", "8080"],
        ["start", "--backend-port", "8081"],
        ["start", "--frontend-port", "8080", "--backend-port", "8080"],
        ["start", "--frontend-port", "x", "--backend-port", "8081"],
        ["start", "--frontend-port", "70000", "--backend-port", "8081"],
        ["start", "--frontend-port", "8080", "--backend-port", "8081", "--host", "a b"],
        ["start", "--frontend-port", "8080", "--backend-port", "8081", "--unknown"],
        ["restart"],
    ],
)
def test_invalid_call_is_rejected_before_anything_happens(
    make_replica: Callable[..., Replica], arguments: list[str]
) -> None:
    replica = make_replica()

    result = replica.run(*arguments)

    assert result.returncode != 0
    assert result.stderr != ""
    _assert_nothing_happened(replica)


@pytest.mark.parametrize(
    ("frontend_port", "backend_port", "message"),
    [
        ("99999999999999999999", "28200", "--frontend-port must be a number"),
        ("28200", "99999999999999999999", "--backend-port must be a number"),
        ("0099999999999999999999999999", "28200", "--frontend-port must be a number"),
        ("9223372036854775808", "28200", "--frontend-port must be a number"),
        ("65536", "28200", "--frontend-port must be a number"),
        ("0", "28200", "--frontend-port must be a number"),
        ("0000", "28200", "--frontend-port must be a number"),
        ("28200", "-1", "--backend-port must be a number"),
        ("028300", "28300", "must differ"),
        ("28300", "0028300", "must differ"),
        ("00028300", "028300", "must differ"),
    ],
)
def test_port_boundaries_are_checked_before_anything_happens(
    make_replica: Callable[..., Replica], frontend_port: str, backend_port: str, message: str
) -> None:
    replica = make_replica()

    result = replica.run("start", "--frontend-port", frontend_port, "--backend-port", backend_port)

    assert result.returncode == 1
    assert message in result.stderr
    assert "Illegal number" not in result.stderr
    assert "Traceback" not in result.stderr
    _assert_nothing_happened(replica)


def test_ports_with_leading_zeros_and_the_limits_are_accepted(
    make_replica: Callable[..., Replica],
) -> None:
    replica = make_replica()
    # The check for free ports is replaced by a placeholder for python3 that
    # reports every port as free. The result then does not depend on whether a
    # port such as 65535 is free on the machine that runs the test.
    port_check = replica.base / "port-check"
    port_check.mkdir()
    python = port_check / "python3"
    python.write_text("#!/bin/sh\nexit 0\n", encoding="utf-8")
    python.chmod(0o755)
    replica.environment["PATH"] = f"{port_check}{os.pathsep}{replica.environment['PATH']}"

    result = replica.run("start", "--frontend-port", "065535", "--backend-port", "00001")

    assert result.returncode != 0
    assert "must be a number" not in result.stderr
    assert "must differ" not in result.stderr
    calls = replica.calls()
    assert len(calls) == 1
    assert calls[0].startswith("uv ")


# --- the backend and the user interface ---------------------------------------------------------


def test_without_a_frontend_directory_only_the_backend_is_prepared_and_started(
    make_replica: Callable[..., Replica],
) -> None:
    replica = make_replica()
    record = replica.base / "record"
    record.mkdir()
    replica.install_recorder(record)
    assert not (replica.component / "frontend").exists()

    result = replica.start()

    # The recorder stands in for the backend and ends at once: the start fails after the
    # backend was called, and the failed start removes .testenv/.
    assert result.returncode != 0
    assert "the backend exited during start" in result.stderr
    assert not (replica.component / ".testenv").exists()
    calls = replica.calls()
    assert len(calls) == 1
    assert calls[0].startswith("uv ")
    assert not any(call.startswith(("npm", "npx")) for call in calls)
    # The startup configuration holds only the database URL.
    lines = (record / "pipwerk-replay.ini").read_text(encoding="utf-8").splitlines()
    assert lines[0] == "[database]"
    assert len(lines) == 2
    assert lines[1].startswith("url = sqlite:///")
    assert lines[1].endswith("/.testenv/pipwerk-replay.db")


def test_with_a_frontend_directory_the_user_interface_is_installed_and_built(
    make_replica: Callable[..., Replica],
) -> None:
    replica = make_replica()
    record = replica.base / "record"
    record.mkdir()
    replica.install_recorder(record)
    (replica.component / "frontend").mkdir()  # an empty directory is no change for Git

    result = replica.start()

    assert result.returncode != 0
    assert "the backend exited during start" in result.stderr
    calls = replica.calls()
    assert [call for call in calls if call.startswith("npm")] == ["npm ci", "npm run build"]
    assert calls[0].startswith("uv ")


@pytest.mark.parametrize(
    ("host_arguments", "expected"),
    [
        ([], []),
        (["--host", "127.0.0.1"], ["--allowed-host", "127.0.0.1"]),
        (["--host", "localhost"], ["--allowed-host", "localhost"]),
        (["--host", "::1"], ["--allowed-host", "::1"]),
        (["--host", "0.0.0.0"], ["--allowed-host", "0.0.0.0", "--allowed-host", "*ip"]),
        (["--host", "::"], ["--allowed-host", "::", "--allowed-host", "*ip"]),
    ],
    ids=["no host", "loopback", "name", "IPv6", "all IPv4", "all IPv6"],
)
def test_the_value_of_host_joins_the_allowed_names_of_the_backend(
    make_replica: Callable[..., Replica], host_arguments: list[str], expected: list[str]
) -> None:
    """The user interface passes its Host header on to the backend; the backend accepts only
    names on its list. Without --host the default list is enough (127.0.0.1)."""
    replica = make_replica()
    record = replica.base / "record"
    record.mkdir()
    replica.install_recorder(record)

    replica.start(*host_arguments)

    arguments = (record / "arguments.txt").read_text(encoding="utf-8").splitlines()
    assert arguments[0] == "-c"
    assert arguments[2:6] == ["--host", "127.0.0.1", "--port", arguments[5]]
    assert arguments[6:] == expected  # the backend itself stays bound to 127.0.0.1


def test_the_allowed_names_arrive_at_the_backend_and_let_the_proxy_header_pass(
    tmp_path: Path,
) -> None:
    """The Host header that the proxy of the user interface passes on (its own address) is
    accepted by a backend started with the arguments of the script, and a foreign one is not."""
    from fastapi.testclient import TestClient

    from pipwerk_replay.app import create_app

    for host, allowed in (("192.0.2.7", ["192.0.2.7"]), ("203.0.113.9", ["0.0.0.0", "*ip"])):
        client = TestClient(
            create_app(f"sqlite:///{tmp_path / 'replay.db'}", allowed_hosts=allowed),
            base_url=f"http://{host}:15173",
        )
        assert client.get("/api/health").status_code == 200
        assert (
            client.get("/api/health", headers={"host": "rebind.example:15173"}).status_code == 400
        )


def test_the_script_has_no_fixed_port_path_or_machine_name() -> None:
    assert SOURCE_ROOT is not None
    script = (SOURCE_ROOT / SCRIPT).read_text(encoding="utf-8")

    assert "/srv/" not in script
    assert "/home/" not in script
    assert "8000" not in script
    assert "5173" not in script
    assert "--frontend-port" in script
    assert "--backend-port" in script
    assert ".testenv" in script


def test_start_status_and_stop_of_the_backend_without_a_user_interface(
    make_replica: Callable[..., Replica],
) -> None:
    replica = make_replica()
    replica.install_small_backend()
    backend_port = _free_port()
    frontend_port = _free_port()

    started = replica.run(
        "start", "--frontend-port", str(frontend_port), "--backend-port", str(backend_port)
    )
    try:
        assert started.returncode == 0, started.stderr
        assert "backend only" in started.stdout
        assert f"http://127.0.0.1:{backend_port}/docs" in started.stdout
        assert (replica.component / ".testenv" / "state").is_file()

        status = replica.run("status")
        assert status.returncode == 0
        assert "running (backend only" in status.stdout
        assert f"http://127.0.0.1:{backend_port}/" in status.stdout

        again = replica.start()
        assert again.returncode != 0
        assert "already running" in again.stderr
    finally:
        stopped = replica.run("stop")

    assert stopped.returncode == 0
    assert "test environment stopped" in stopped.stdout
    assert not (replica.component / ".testenv").exists()
    assert replica.started_processes() == []
    after = replica.run("status")
    assert after.returncode == 1
    assert "not running" in after.stdout


def test_the_script_is_executable_in_the_git_index() -> None:
    assert GIT is not None
    assert SOURCE_ROOT is not None
    result = subprocess.run(  # noqa: S603
        [GIT, "-C", str(SOURCE_ROOT), "ls-files", "-s", "--", SCRIPT],
        capture_output=True,
        text=True,
        check=True,
        env={**os.environ, "GIT_CONFIG_GLOBAL": os.devnull},
    )

    assert result.stdout.startswith("100755 "), result.stdout


def test_status_as_a_program_via_the_absolute_path_without_a_test_environment(
    make_replica: Callable[..., Replica],
) -> None:
    replica = make_replica()
    script = replica.root / SCRIPT
    assert script.stat().st_mode & stat.S_IXUSR

    result = subprocess.run(  # noqa: S603
        [str(script), "status"],
        capture_output=True,
        text=True,
        check=False,
        timeout=90,
        env=replica.environment,
        cwd=replica.base,
    )

    assert result.returncode == 1
    assert "not running" in result.stdout
    _assert_nothing_happened(replica)


def test_status_and_stop_without_a_test_environment(
    make_replica: Callable[..., Replica],
) -> None:
    replica = make_replica()

    status = replica.run("status")
    stop = replica.run("stop")

    assert status.returncode != 0
    assert "not running" in status.stdout
    assert stop.returncode == 0
    assert "no test environment is running" in stop.stdout
    _assert_nothing_happened(replica)


# --- the user interface of the component and the source ----------------------------------------


def test_start_status_and_stop_of_backend_and_user_interface(
    make_replica: Callable[..., Replica],
) -> None:
    replica = make_replica()
    replica.install_small_backend()
    replica.install_small_frontend()
    backend_port = _free_port()
    frontend_port = _free_port()

    started = replica.run(
        "start", "--frontend-port", str(frontend_port), "--backend-port", str(backend_port)
    )
    try:
        assert started.returncode == 0, started.stderr
        assert f"http://127.0.0.1:{frontend_port}/" in started.stdout
        assert f"backend on 127.0.0.1:{backend_port}" in started.stdout
        # The user interface is installed and built before it is started.
        calls = replica.calls()
        assert [call for call in calls if call.startswith("npm")] == ["npm ci", "npm run build"]

        status = replica.run("status")
        assert status.returncode == 0
        assert f"user interface: http://127.0.0.1:{frontend_port}/" in status.stdout
        assert f"backend: http://127.0.0.1:{backend_port}/" in status.stdout
        assert "source: not set up" in status.stdout
        assert len(replica.started_processes()) >= 2
    finally:
        stopped = replica.run("stop")

    assert stopped.returncode == 0
    assert not (replica.component / ".testenv").exists()
    assert replica.started_processes() == []


def test_status_reports_a_user_interface_that_does_not_run(
    make_replica: Callable[..., Replica],
) -> None:
    """Both are reported: if only the backend runs, ``status`` says that the test environment
    does not run completely."""
    replica = make_replica()
    replica.install_small_backend()
    replica.install_small_frontend()
    started = replica.start()
    try:
        assert started.returncode == 0, started.stderr
        vite = [line for line in replica.started_processes() if "vite" in line]
        assert len(vite) == 1
        frontend_pid = _pid_in_state(replica, "frontend_pid")
        os.kill(frontend_pid, 9)
        _wait_until_gone(frontend_pid)

        status = replica.run("status")

        assert status.returncode == 1
        assert "not running completely" in status.stdout
    finally:
        replica.run("stop")
    assert replica.started_processes() == []


def _pid_in_state(replica: Replica, name: str) -> int:
    state = (replica.component / ".testenv" / "state").read_text(encoding="utf-8")
    for line in state.splitlines():
        if line.startswith(f"{name}="):
            return int(line.split("=", 1)[1])
    raise AssertionError(f"{name} is not in the state file")


def _wait_until_gone(pid: int) -> None:
    import time

    for _ in range(100):
        try:
            os.kill(pid, 0)
        except ProcessLookupError:
            return
        time.sleep(0.05)


SOURCE_URL = "http://192.0.2.10:8765"
SOURCE_KEY = "test-key-0123456789-abcdef"
COMMAND_NAMES = (
    "python3",
    "sed",
    "head",
    "tail",
    "cat",
    "ps",
    "git",
    "kill",
    "sleep",
    "chmod",
    "mkdir",
    "rm",
    "dirname",
)


def _key_file(replica: Replica, text: str = f"{SOURCE_KEY}\n") -> str:
    path = replica.base / "source.key"
    path.write_text(text, encoding="utf-8")
    path.chmod(0o600)
    return str(path)


def _log_commands(replica: Replica) -> Path:
    """Put programs that note their arguments in front of the real ones (for the commands
    the script runs), so a test can show what no command line contains."""
    log = replica.base / "commands.log"
    log.write_text("", encoding="utf-8")
    directory = replica.base / "sniffers"
    directory.mkdir()
    for name in COMMAND_NAMES:
        real = shutil.which(name)
        if real is None:
            continue
        wrapper = directory / name
        wrapper.write_text(
            f'#!/bin/sh\necho "{name} $*" >> "{log}"\nexec "{real}" "$@"\n', encoding="utf-8"
        )
        wrapper.chmod(0o755)
    replica.environment["PATH"] = f"{directory}{os.pathsep}{replica.environment['PATH']}"
    return log


def _configuration(path: Path) -> dict[str, dict[str, str]]:
    import configparser

    parser = configparser.ConfigParser(interpolation=None)
    parser.read(path, encoding="utf-8")
    return {section: dict(parser[section]) for section in parser.sections()}


def test_a_source_is_written_to_the_startup_configuration_and_the_key_stays_secret(
    make_replica: Callable[..., Replica],
) -> None:
    replica = make_replica()
    record = replica.base / "record"
    record.mkdir()
    replica.install_recorder(record)
    commands = _log_commands(replica)
    key_file = _key_file(replica)

    result = replica.start("--source-url", SOURCE_URL, "--source-key-file", key_file)

    # The recorder stands in for the backend and ends at once; it kept the startup configuration.
    assert result.returncode != 0
    assert "the backend exited during start" in result.stderr
    configuration = _configuration(record / "pipwerk-replay.ini")
    assert configuration["source"] == {"fetch_url": SOURCE_URL, "fetch_key": SOURCE_KEY}
    assert configuration["database"]["url"].endswith("/.testenv/pipwerk-replay.db")
    # The startup configuration is readable only for the user.
    assert (record / "pipwerk-replay.ini").stat().st_mode & 0o077 == 0
    # The key is nowhere else: not in an output, not in the arguments of the backend, not in any
    # command line of a program of the system or of the installation.
    arguments = (record / "arguments.txt").read_text(encoding="utf-8")
    for text in (
        result.stdout,
        result.stderr,
        arguments,
        "\n".join(replica.calls()),
        commands.read_text(encoding="utf-8"),
    ):
        assert SOURCE_KEY not in text
    assert "--source" not in arguments
    assert not (replica.component / ".testenv").exists()


def test_without_the_parameters_no_source_is_set_up(make_replica: Callable[..., Replica]) -> None:
    replica = make_replica()
    record = replica.base / "record"
    record.mkdir()
    replica.install_recorder(record)

    replica.start()

    assert _configuration(record / "pipwerk-replay.ini").keys() == {"database"}


def test_a_key_file_without_a_final_new_line_and_with_more_lines_gives_its_first_line(
    make_replica: Callable[..., Replica],
) -> None:
    for text, expected in ((SOURCE_KEY, SOURCE_KEY), (f"{SOURCE_KEY}\nsecond line\n", SOURCE_KEY)):
        replica = make_replica()
        record = replica.base / "record"
        record.mkdir()
        replica.install_recorder(record)

        replica.start("--source-url", SOURCE_URL, "--source-key-file", _key_file(replica, text))

        assert _configuration(record / "pipwerk-replay.ini")["source"]["fetch_key"] == expected


def test_a_key_with_characters_of_the_ini_syntax_is_written_unchanged(
    make_replica: Callable[..., Replica],
) -> None:
    key = "a=b%c;d#e:f[g]h{{i}}j$k`l'm\"n\\o"
    replica = make_replica()
    record = replica.base / "record"
    record.mkdir()
    replica.install_recorder(record)

    replica.start("--source-url", SOURCE_URL, "--source-key-file", _key_file(replica, f"{key}\n"))

    assert _configuration(record / "pipwerk-replay.ini")["source"]["fetch_key"] == key


@pytest.mark.parametrize(
    ("arguments", "message"),
    [
        (["--source-url", SOURCE_URL], "--source-url needs --source-key-file"),
        (["--source-key-file", "KEYFILE"], "--source-key-file needs --source-url"),
        (["--source-url"], "missing value for --source-url"),
        (["--source-url", SOURCE_URL, "--source-key-file"], "missing value for --source-key-file"),
        (["--source-key", SOURCE_KEY], "unknown parameter: --source-key"),
        (
            ["--source-url", "192.0.2.10:8765", "--source-key-file", "KEYFILE"],
            "--source-url must be an http or https address",
        ),
        (
            ["--source-url", "ftp://192.0.2.10", "--source-key-file", "KEYFILE"],
            "--source-url must be an http or https address",
        ),
        (
            ["--source-url", "http://", "--source-key-file", "KEYFILE"],
            "--source-url must be an http or https address",
        ),
        (["--source-url", "http://a b", "--source-key-file", "KEYFILE"], "must not contain blanks"),
        (
            ["--source-url", "http://user:secret@192.0.2.10", "--source-key-file", "KEYFILE"],
            "must not contain a user name",
        ),
        (
            ["--source-url", "http://" + "a" * 2050, "--source-key-file", "KEYFILE"],
            "longer than 2048",
        ),
        (["--source-url", SOURCE_URL, "--source-key-file", "MISSING"], "cannot be read"),
    ],
)
def test_wrong_source_parameters_are_rejected_before_anything_happens(
    make_replica: Callable[..., Replica], arguments: list[str], message: str
) -> None:
    replica = make_replica()
    key_file = _key_file(replica)
    arguments = [
        key_file
        if argument == "KEYFILE"
        else str(replica.base / "missing.key")
        if argument == "MISSING"
        else argument
        for argument in arguments
    ]

    result = replica.start(*arguments)

    assert result.returncode != 0
    assert message in result.stderr
    assert SOURCE_KEY not in result.stdout + result.stderr
    assert "secret" not in result.stdout + result.stderr
    _assert_nothing_happened(replica)


@pytest.mark.parametrize(
    ("content", "message"),
    [
        ("", "is empty"),
        ("\n", "16 to 256 characters"),
        ("short\n", "16 to 256 characters"),
        ("x" * 15 + "\n", "16 to 256 characters"),
        ("x" * 257 + "\n", "16 to 256 characters"),
        ("a key with blanks 0123456789\n", "visible characters without blanks"),
        (f"{SOURCE_KEY}\r\n", "visible characters without blanks"),
        (f"{SOURCE_KEY}\t\n", "visible characters without blanks"),
        ("schlüssel-0123456789-abc\n", "visible characters without blanks"),
    ],
    ids=[
        "empty",
        "blank line",
        "short",
        "15 characters",
        "257 characters",
        "blanks",
        "CR LF",
        "tab",
        "umlaut",
    ],
)
def test_a_wrong_key_is_rejected_without_repeating_it(
    make_replica: Callable[..., Replica], content: str, message: str
) -> None:
    replica = make_replica()
    key_file = _key_file(replica, content)

    result = replica.start("--source-url", SOURCE_URL, "--source-key-file", key_file)

    assert result.returncode != 0
    assert message in result.stderr
    stripped = content.strip()
    if stripped:
        assert stripped not in result.stdout + result.stderr
    _assert_nothing_happened(replica)


def test_a_key_file_that_is_a_directory_is_rejected(make_replica: Callable[..., Replica]) -> None:
    replica = make_replica()

    result = replica.start("--source-url", SOURCE_URL, "--source-key-file", str(replica.base))

    assert result.returncode != 0
    assert "cannot be read" in result.stderr
    _assert_nothing_happened(replica)


def test_status_names_the_source_and_never_the_key(make_replica: Callable[..., Replica]) -> None:
    replica = make_replica()
    replica.install_small_backend()
    replica.install_small_frontend()
    key_file = _key_file(replica)

    started = replica.start("--source-url", SOURCE_URL, "--source-key-file", key_file)
    try:
        assert started.returncode == 0, started.stderr
        status = replica.run("status")
        assert status.returncode == 0
        assert f"source: {SOURCE_URL}" in status.stdout
        assert SOURCE_KEY not in started.stdout + started.stderr + status.stdout + status.stderr
        # The key is in the startup configuration of the test environment and nowhere else in
        # .testenv/ (state and logs), and the file is readable only for the user.
        testenv = replica.component / ".testenv"
        configuration = testenv / "pipwerk-replay.ini"
        assert (configuration.stat().st_mode & 0o077) == 0
        assert _configuration(configuration)["source"]["fetch_key"] == SOURCE_KEY
        for name in ("state", "backend.log", "frontend.log"):
            assert SOURCE_KEY not in (testenv / name).read_text(encoding="utf-8")
        listing = subprocess.run(
            ["ps", "-e", "-ww", "-o", "args="],  # noqa: S607
            capture_output=True,
            text=True,
            check=True,
        )
        assert SOURCE_KEY not in listing.stdout
    finally:
        stopped = replica.run("stop")
    assert stopped.returncode == 0
    assert not (replica.component / ".testenv").exists()
    assert replica.started_processes() == []


def test_the_script_has_no_trace_output_and_no_parameter_for_the_key() -> None:
    assert SOURCE_ROOT is not None
    script = (SOURCE_ROOT / SCRIPT).read_text(encoding="utf-8")

    assert "set -x" not in script
    assert "set -o xtrace" not in script
    assert "--source-key-file" in script
    assert "--source-url" in script
    assert "--source-key)" not in script


def test_the_real_user_interface_is_installed_and_built(
    make_replica: Callable[..., Replica],
) -> None:
    """With the real files of the user interface in the working directory, the start calls
    ``npm ci`` and ``npm run build`` there, and the build is part of the start."""
    replica = make_replica(with_frontend=True)
    record = replica.base / "record"
    record.mkdir()
    replica.install_recorder(record)
    assert (replica.component / "frontend" / "package.json").is_file()

    result = replica.start()

    assert result.returncode != 0
    assert "the backend exited during start" in result.stderr
    calls = replica.calls()
    assert [call for call in calls if call.startswith("npm")] == ["npm ci", "npm run build"]
