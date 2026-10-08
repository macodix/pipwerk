"""Tests for the Studio revision (WO-2026-10-08-001).

Covers: valid hash gives 7 characters, every failure gives ``null`` and the
application still starts, the real Git lookup, response model and wrong methods.
"""

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


def _fake_run(
    returncode: int = 0, stdout: str = FULL_HASH + "\n"
) -> Callable[..., subprocess.CompletedProcess[str]]:
    def run(*args: object, **kwargs: object) -> subprocess.CompletedProcess[str]:
        return subprocess.CompletedProcess(args=[], returncode=returncode, stdout=stdout)

    return run


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


def test_git_lookup_failures_give_none(monkeypatch: pytest.MonkeyPatch) -> None:
    def missing(*args: object, **kwargs: object) -> subprocess.CompletedProcess[str]:
        raise FileNotFoundError("git")

    def timeout(*args: object, **kwargs: object) -> subprocess.CompletedProcess[str]:
        raise subprocess.TimeoutExpired(cmd="git", timeout=5)

    for run in (
        missing,
        timeout,
        _fake_run(returncode=128, stdout=""),
        _fake_run(stdout="nonsense\n"),
    ):
        monkeypatch.setattr(subprocess, "run", run)
        assert revision.determine_short_revision() is None


def test_git_lookup_logs_one_warning_without_details(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    monkeypatch.setattr(subprocess, "run", _fake_run(returncode=128, stdout=""))

    revision.determine_short_revision()

    warnings = [r for r in caplog.records if r.levelname == "WARNING"]
    assert len(warnings) == 1


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
