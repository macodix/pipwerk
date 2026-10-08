"""Tests for the Studio revision (WO-2026-10-08-001).

Covers: valid hash gives 7 characters, every failure gives ``null`` and the
application still starts, the real Git lookup, response model and wrong methods.
"""

import logging
import shutil
import subprocess
from collections.abc import Callable
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from pipwerk_studio import revision
from pipwerk_studio.app import StudioRevision, create_app

FULL_HASH = "0123456789abcdef0123456789abcdef01234567"


def make_client(lookup: revision.RevisionLookup) -> TestClient:
    return TestClient(create_app("sqlite:///:memory:", revision_lookup=lookup))


def test_valid_hash_gives_seven_characters() -> None:
    response = make_client(lambda: FULL_HASH).get("/api/studio/revision")

    assert response.status_code == 200
    assert response.json() == {"revision": "0123456"}


@pytest.mark.parametrize(
    "output",
    [None, "", "0123456", FULL_HASH.upper(), FULL_HASH + "0", "g" * 40, FULL_HASH + "\n"],
)
def test_invalid_or_missing_hash_gives_null(output: str | None) -> None:
    client = make_client(lambda: output)

    assert client.get("/api/health").json() == {"status": "ok"}
    assert client.get("/api/studio/revision").json() == {"revision": None}


def test_failing_lookup_gives_null_and_app_starts() -> None:
    def failing() -> str:
        raise RuntimeError("boom")

    client = make_client(failing)

    assert client.get("/api/health").status_code == 200
    assert client.get("/api/studio/revision").json() == {"revision": None}


def test_revision_is_determined_once_at_creation() -> None:
    calls: list[int] = []

    def lookup() -> str:
        calls.append(1)
        return FULL_HASH

    client = make_client(lookup)
    client.get("/api/studio/revision")
    client.get("/api/studio/revision")

    assert len(calls) == 1


def test_wrong_methods_are_rejected() -> None:
    client = make_client(lambda: FULL_HASH)

    for method in ("post", "put", "patch", "delete"):
        assert getattr(client, method)("/api/studio/revision").status_code == 405


def test_response_model_rejects_unknown_fields_and_wrong_types() -> None:
    with pytest.raises(ValueError):
        StudioRevision.model_validate({"revision": "0123456", "extra": 1})
    with pytest.raises(ValueError):
        StudioRevision.model_validate({"revision": 1234567})
    with pytest.raises(ValueError):
        StudioRevision.model_validate({})


def test_health_is_unchanged() -> None:
    assert make_client(lambda: FULL_HASH).get("/api/health").json() == {"status": "ok"}


def test_git_lookup_uses_fixed_arguments_without_shell(monkeypatch: pytest.MonkeyPatch) -> None:
    seen: dict[str, object] = {}

    def run(args: list[str], **kwargs: object) -> subprocess.CompletedProcess[str]:
        seen["args"] = args
        seen["kwargs"] = kwargs
        return subprocess.CompletedProcess(args=args, returncode=0, stdout=FULL_HASH + "\n")

    monkeypatch.setattr(subprocess, "run", run)

    assert revision.determine_short_revision() == "0123456"
    args = seen["args"]
    assert isinstance(args, list)
    assert args[0] == "git"
    assert args[1] == "-C"
    assert Path(args[2]) == Path(revision.__file__).resolve().parent
    assert args[3:] == ["rev-parse", "HEAD"]
    kwargs = seen["kwargs"]
    assert isinstance(kwargs, dict)
    assert not kwargs.get("shell")
    assert kwargs["timeout"] == revision.GIT_TIMEOUT_SECONDS


STDOUT_MARKER = "STDOUT-MARKER-71f3"
STDERR_MARKER = "STDERR-MARKER-9ac2"
EXCEPTION_MARKER = "EXCEPTION-MARKER-5be8"


def _runner(
    *, returncode: int = 0, stdout: str = "", stderr: str = ""
) -> Callable[..., subprocess.CompletedProcess[str]]:
    def run(*args: object, **kwargs: object) -> subprocess.CompletedProcess[str]:
        return subprocess.CompletedProcess(
            args=[], returncode=returncode, stdout=stdout, stderr=stderr
        )

    return run


def _raiser(error: Exception) -> Callable[..., subprocess.CompletedProcess[str]]:
    def run(*args: object, **kwargs: object) -> subprocess.CompletedProcess[str]:
        raise error

    return run


def test_git_not_executable_gives_none(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(subprocess, "run", _raiser(FileNotFoundError("git")))

    assert revision.determine_short_revision() is None


def test_git_timeout_gives_none(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(subprocess, "run", _raiser(subprocess.TimeoutExpired("git", 5)))

    assert revision.determine_short_revision() is None


def test_git_exit_code_not_zero_gives_none(monkeypatch: pytest.MonkeyPatch) -> None:
    # An existing working tree, but Git exits with an error and writes to stderr.
    monkeypatch.setattr(
        subprocess, "run", _runner(returncode=1, stdout="", stderr="fatal: " + STDERR_MARKER)
    )

    assert revision.determine_short_revision() is None


def test_git_invalid_output_gives_none(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(subprocess, "run", _runner(stdout="nonsense\n"))

    assert revision.determine_short_revision() is None


@pytest.mark.skipif(shutil.which("git") is None, reason="Git is not installed on this system")
def test_real_git_outside_any_working_tree_gives_none(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path, caplog: pytest.LogCaptureFixture
) -> None:
    # Environment variables of the calling Git must not change the result.
    for name in ("GIT_DIR", "GIT_WORK_TREE", "GIT_CEILING_DIRECTORIES"):
        monkeypatch.delenv(name, raising=False)
    # Git must not search above the temporary directory for a working tree.
    monkeypatch.setenv("GIT_CEILING_DIRECTORIES", str(tmp_path.parent))
    outside = tmp_path / "outside"
    outside.mkdir()

    assert revision.lookup_git_revision(outside) is None
    assert len([r for r in caplog.records if r.levelname == "WARNING"]) == 1


def test_app_starts_normally_when_revision_is_not_determinable() -> None:
    client = make_client(lambda: None)

    assert client.get("/api/health").json() == {"status": "ok"}
    assert client.get("/api/studio/revision").json() == {"revision": None}


def _failing_lookup_for(case: str, monkeypatch: pytest.MonkeyPatch) -> revision.RevisionLookup:
    if case == "git-not-executable":
        monkeypatch.setattr(
            subprocess, "run", _raiser(FileNotFoundError(f"{EXCEPTION_MARKER} /secret/path/git"))
        )
    elif case == "exit-code-not-zero":
        monkeypatch.setattr(
            subprocess,
            "run",
            _runner(returncode=128, stdout=STDOUT_MARKER, stderr=f"fatal: {STDERR_MARKER}"),
        )
    elif case == "timeout":
        monkeypatch.setattr(
            subprocess, "run", _raiser(subprocess.TimeoutExpired("git " + EXCEPTION_MARKER, 5))
        )
    elif case == "invalid-output":
        monkeypatch.setattr(
            subprocess,
            "run",
            _runner(stdout=STDOUT_MARKER + "\n", stderr=STDERR_MARKER),
        )
    elif case == "lookup-raises":

        def raising() -> str:
            raise RuntimeError(f"{EXCEPTION_MARKER} /secret/path")

        return raising
    else:  # pragma: no cover
        raise AssertionError(case)
    return revision.lookup_git_revision


@pytest.mark.parametrize(
    "case",
    ["git-not-executable", "exit-code-not-zero", "timeout", "invalid-output", "lookup-raises"],
)
def test_failure_logs_exactly_one_warning_without_git_output_exception_or_path(
    case: str, monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    lookup = _failing_lookup_for(case, monkeypatch)

    assert revision.determine_short_revision(lookup) is None

    warnings = [r for r in caplog.records if r.levelno >= logging.WARNING]
    assert len(warnings) == 1
    assert warnings[0].levelname == "WARNING"
    text = caplog.text
    package_directory = str(Path(revision.__file__).resolve().parent)
    for forbidden in (
        STDOUT_MARKER,
        STDERR_MARKER,
        EXCEPTION_MARKER,
        "/secret/path",
        package_directory,
        "fatal",
    ):
        assert forbidden not in text


def test_real_git_lookup_matches_git_or_is_none() -> None:
    result = revision.determine_short_revision()
    try:
        expected = subprocess.run(  # noqa: S603
            ["git", "-C", str(Path(revision.__file__).resolve().parent), "rev-parse", "HEAD"],  # noqa: S607
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()[:7]
    except OSError, subprocess.CalledProcessError:
        expected = None

    assert result == expected
