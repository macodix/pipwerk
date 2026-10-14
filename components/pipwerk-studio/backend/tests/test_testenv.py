"""Tests for the test environment script ``scripts/testenv``.

``testenv start`` runs in a replica of the repository in a temporary directory:
exactly the versioned files ``LICENSE`` and ``components/pipwerk-studio/**``, in
the same directory structure. ``uv``, ``npm`` and ``npx`` are replaced by
placeholder programs that note every call and end at once with exit code 1.

Covered: the start aborts with a message on every uncommitted change and every
new file that is not ignored in the whole repository and without Git, before
anything is installed, built or started. Without changes, and with ignored new
files only, the check lets the start pass.

The tests are skipped without an installed Git and in a working directory that
is not a Git working directory (for example an unpacked archive).
"""

import os
import shutil
import socket
import stat
import subprocess
from collections.abc import Callable
from pathlib import Path

import pytest

COMPONENT = "components/pipwerk-studio"
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

    def __init__(self, base: Path, *, with_git: bool) -> None:
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
            target = self.root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
        script = self.root / SCRIPT
        script.chmod(script.stat().st_mode | stat.S_IXUSR)
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
        assert not (self.component / "frontend" / "dist").exists()

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
            timeout=60,
            env=self.environment,
            cwd=self.base,
        )

    def start(self) -> subprocess.CompletedProcess[str]:
        return self.run(
            "start",
            "--frontend-port",
            str(_free_port()),
            "--backend-port",
            str(_free_port()),
        )

    def calls(self) -> list[str]:
        return self.call_log.read_text(encoding="utf-8").splitlines()

    def started_processes(self) -> list[str]:
        """Command lines of all processes that were started from the replica."""
        listing = subprocess.run(
            ["ps", "-e", "-o", "args="],  # noqa: S607
            capture_output=True,
            text=True,
            check=True,
        )
        return [line for line in listing.stdout.splitlines() if str(self.root) in line]


@pytest.fixture
def make_replica(tmp_path: Path) -> Callable[..., Replica]:
    counter = 0

    def make(*, with_git: bool = True) -> Replica:
        nonlocal counter
        counter += 1
        base = tmp_path / f"case{counter}"
        base.mkdir()
        return Replica(base, with_git=with_git)

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
    assert not (replica.component / "frontend" / "dist").exists()
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
    ignored = replica.component / "frontend" / "node_modules" / "package" / "index.js"
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
    assert not (replica.component / "frontend" / "dist").exists()
    assert replica.started_processes() == []


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
