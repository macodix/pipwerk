"""Tests for the Studio revision (WO-2026-10-08-001, WO-2026-10-09-004).

Covers: valid hash gives 7 characters and the full commit, the committer date,
every failure gives ``null`` and the application still starts, a date that is not
determinable keeps the hash, the real Git lookups, response model and wrong methods.
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
DATE = "2026-10-09T14:52:03+02:00"
NO_REVISION = {"revision": None, "commit": None, "committed_at": None}


def make_client(
    lookup: revision.RevisionLookup,
    date_lookup: revision.CommitDateLookup = lambda commit: DATE,
) -> TestClient:
    return TestClient(
        create_app("sqlite:///:memory:", revision_lookup=lookup, commit_date_lookup=date_lookup)
    )


def test_valid_hash_gives_seven_characters() -> None:
    response = make_client(lambda: FULL_HASH).get("/api/studio/revision")

    assert response.status_code == 200
    assert response.json() == {"revision": "0123456", "commit": FULL_HASH, "committed_at": DATE}


@pytest.mark.parametrize(
    "output",
    [None, "", "0123456", FULL_HASH.upper(), FULL_HASH + "0", "g" * 40, FULL_HASH + "\n"],
)
def test_invalid_or_missing_hash_gives_null(output: str | None) -> None:
    client = make_client(lambda: output)

    assert client.get("/api/health").json() == {"status": "ok"}
    assert client.get("/api/studio/revision").json() == NO_REVISION


def test_no_date_lookup_without_a_valid_hash() -> None:
    calls: list[str] = []

    def date_lookup(commit: str) -> str:
        calls.append(commit)
        return DATE

    for output in (None, "", "0123456", "g" * 40):
        make_client(lambda output=output: output, date_lookup)  # type: ignore[misc]

    assert calls == []


def test_failing_lookup_gives_null_and_app_starts() -> None:
    def failing() -> str:
        raise RuntimeError("boom")

    client = make_client(failing)

    assert client.get("/api/health").status_code == 200
    assert client.get("/api/studio/revision").json() == NO_REVISION


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
        StudioRevision.model_validate({**VALID_BODY, "extra": 1})
    with pytest.raises(ValueError):
        StudioRevision.model_validate({**VALID_BODY, "revision": 1234567})
    with pytest.raises(ValueError):
        StudioRevision.model_validate({"revision": "0123456"})
    with pytest.raises(ValueError):
        StudioRevision.model_validate({})


VALID_BODY = {"revision": "0123456", "commit": FULL_HASH, "committed_at": DATE}


@pytest.mark.parametrize(
    "body",
    [
        {"revision": None, "commit": FULL_HASH, "committed_at": DATE},
        {"revision": "0123456", "commit": None, "committed_at": None},
        {"revision": "abcdef0", "commit": FULL_HASH, "committed_at": DATE},
        {"revision": None, "commit": None, "committed_at": DATE},
    ],
)
def test_response_model_rejects_violated_invariants(body: dict[str, str | None]) -> None:
    with pytest.raises(ValueError):
        StudioRevision.model_validate(body)


@pytest.mark.parametrize(
    "body",
    [VALID_BODY, {**VALID_BODY, "committed_at": None}, NO_REVISION],
)
def test_response_model_accepts_valid_combinations(body: dict[str, str | None]) -> None:
    assert StudioRevision.model_validate(body).model_dump() == body


def test_health_is_unchanged() -> None:
    assert make_client(lambda: FULL_HASH).get("/api/health").json() == {"status": "ok"}


def test_git_lookup_uses_fixed_arguments_without_shell(monkeypatch: pytest.MonkeyPatch) -> None:
    seen: dict[str, object] = {}

    def run(args: list[str], **kwargs: object) -> subprocess.CompletedProcess[str]:
        seen["args"] = args
        seen["kwargs"] = kwargs
        return subprocess.CompletedProcess(args=args, returncode=0, stdout=FULL_HASH + "\n")

    monkeypatch.setattr(subprocess, "run", run)

    assert revision.determine_revision(date_lookup=lambda commit: DATE) == revision.Revision(
        FULL_HASH, DATE
    )
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

    assert revision.determine_revision() is None


def test_git_timeout_gives_none(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(subprocess, "run", _raiser(subprocess.TimeoutExpired("git", 5)))

    assert revision.determine_revision() is None


def test_git_exit_code_not_zero_gives_none(monkeypatch: pytest.MonkeyPatch) -> None:
    # An existing working tree, but Git exits with an error and writes to stderr.
    monkeypatch.setattr(
        subprocess, "run", _runner(returncode=1, stdout="", stderr="fatal: " + STDERR_MARKER)
    )

    assert revision.determine_revision() is None


def test_git_invalid_output_gives_none(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(subprocess, "run", _runner(stdout="nonsense\n"))

    assert revision.determine_revision() is None


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
    assert client.get("/api/studio/revision").json() == NO_REVISION


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

    assert revision.determine_revision(lookup) is None

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
    result = revision.determine_revision()
    short = None if result is None else result.short
    try:
        expected = subprocess.run(  # noqa: S603
            ["git", "-C", str(Path(revision.__file__).resolve().parent), "rev-parse", "HEAD"],  # noqa: S607
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()[:7]
    except OSError, subprocess.CalledProcessError:
        expected = None

    assert short == expected


def _date_runner(
    stdout: str, *, returncode: int = 0, stderr: str = ""
) -> Callable[..., subprocess.CompletedProcess[str]]:
    return _runner(returncode=returncode, stdout=stdout, stderr=stderr)


def test_valid_date_is_passed_on_unchanged() -> None:
    result = revision.determine_revision(lambda: FULL_HASH, lambda commit: DATE + "\n")

    assert result == revision.Revision(FULL_HASH, DATE)
    assert result is not None
    assert result.short == "0123456"


@pytest.mark.parametrize("stamp", ["2026-10-09T12:52:03Z", "2026-10-09T03:52:03-09:00"])
def test_other_valid_offsets_are_kept_without_conversion(stamp: str) -> None:
    result = revision.determine_revision(lambda: FULL_HASH, lambda commit: stamp)

    assert result == revision.Revision(FULL_HASH, stamp)


def test_date_lookup_receives_the_full_hash() -> None:
    seen: list[str] = []

    def date_lookup(commit: str) -> str:
        seen.append(commit)
        return DATE

    revision.determine_revision(lambda: FULL_HASH, date_lookup)

    assert seen == [FULL_HASH]


def test_git_date_lookup_uses_fixed_arguments_without_shell(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    seen: dict[str, object] = {}

    def run(args: list[str], **kwargs: object) -> subprocess.CompletedProcess[str]:
        seen["args"] = args
        seen["kwargs"] = kwargs
        return subprocess.CompletedProcess(args=args, returncode=0, stdout=DATE + "\n")

    monkeypatch.setattr(subprocess, "run", run)

    assert revision.lookup_git_commit_date(FULL_HASH) == DATE + "\n"
    args = seen["args"]
    assert isinstance(args, list)
    assert args[:2] == ["git", "-C"]
    assert Path(args[2]) == Path(revision.__file__).resolve().parent
    assert args[3:] == ["log", "-1", "--no-show-signature", "--format=%cI", FULL_HASH]
    kwargs = seen["kwargs"]
    assert isinstance(kwargs, dict)
    assert not kwargs.get("shell")
    assert kwargs["timeout"] == revision.GIT_TIMEOUT_SECONDS
    assert kwargs["stdin"] == subprocess.DEVNULL


def _date_failure(case: str, monkeypatch: pytest.MonkeyPatch) -> revision.CommitDateLookup:
    if case == "git-not-executable":
        monkeypatch.setattr(
            subprocess, "run", _raiser(FileNotFoundError(f"{EXCEPTION_MARKER} /secret/path/git"))
        )
    elif case == "timeout":
        monkeypatch.setattr(
            subprocess, "run", _raiser(subprocess.TimeoutExpired("git " + EXCEPTION_MARKER, 5))
        )
    elif case == "exit-code-not-zero":
        monkeypatch.setattr(
            subprocess,
            "run",
            _date_runner(STDOUT_MARKER, returncode=128, stderr=f"fatal: {STDERR_MARKER}"),
        )
    elif case == "invalid-output":
        monkeypatch.setattr(
            subprocess, "run", _date_runner(STDOUT_MARKER + "\n", stderr=STDERR_MARKER)
        )
    elif case == "empty-output":
        monkeypatch.setattr(subprocess, "run", _date_runner("\n", stderr=STDERR_MARKER))
    elif case == "date-without-offset":
        monkeypatch.setattr(subprocess, "run", _date_runner("2026-10-09T14:52:03\n"))
    elif case == "two-lines":
        monkeypatch.setattr(subprocess, "run", _date_runner(DATE + "\n" + DATE + "\n"))
    elif case == "impossible-date":
        monkeypatch.setattr(subprocess, "run", _date_runner("2026-13-45T25:61:61+02:00\n"))
    elif case == "other-format":
        monkeypatch.setattr(subprocess, "run", _date_runner("2026-10-09 14:52:03 +0200\n"))
    elif case == "lookup-raises":

        def raising(commit: str) -> str:
            raise RuntimeError(f"{EXCEPTION_MARKER} /secret/path")

        return raising
    else:  # pragma: no cover
        raise AssertionError(case)
    return revision.lookup_git_commit_date


DATE_FAILURES = [
    "git-not-executable",
    "timeout",
    "exit-code-not-zero",
    "invalid-output",
    "empty-output",
    "date-without-offset",
    "two-lines",
    "impossible-date",
    "other-format",
    "lookup-raises",
]


@pytest.mark.parametrize("case", DATE_FAILURES)
def test_date_failure_keeps_hash_and_logs_exactly_one_warning_without_details(
    case: str, monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    date_lookup = _date_failure(case, monkeypatch)

    result = revision.determine_revision(lambda: FULL_HASH, date_lookup)

    assert result == revision.Revision(FULL_HASH, None)
    warnings = [r for r in caplog.records if r.levelno >= logging.WARNING]
    assert len(warnings) == 1
    assert warnings[0].levelname == "WARNING"
    package_directory = str(Path(revision.__file__).resolve().parent)
    for forbidden in (
        STDOUT_MARKER,
        STDERR_MARKER,
        EXCEPTION_MARKER,
        "/secret/path",
        package_directory,
        "fatal",
        FULL_HASH,
    ):
        assert forbidden not in caplog.text


@pytest.mark.parametrize("case", DATE_FAILURES)
def test_app_starts_and_reports_hash_without_date_for_each_date_failure(
    case: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    date_lookup = _date_failure(case, monkeypatch)

    client = make_client(lambda: FULL_HASH, date_lookup)

    assert client.get("/api/health").json() == {"status": "ok"}
    assert client.get("/api/studio/revision").json() == {
        "revision": "0123456",
        "commit": FULL_HASH,
        "committed_at": None,
    }


def test_no_additional_warning_when_the_hash_is_not_determinable(
    caplog: pytest.LogCaptureFixture,
) -> None:
    def date_lookup(commit: str) -> str:  # pragma: no cover - must not be called
        raise AssertionError("date looked up without a hash")

    assert revision.determine_revision(lambda: None, date_lookup) is None
    assert [r for r in caplog.records if r.levelno >= logging.WARNING] == []


def test_date_is_determined_once_at_creation() -> None:
    calls: list[str] = []

    def date_lookup(commit: str) -> str:
        calls.append(commit)
        return DATE

    client = make_client(lambda: FULL_HASH, date_lookup)
    client.get("/api/studio/revision")
    client.get("/api/studio/revision")

    assert len(calls) == 1


@pytest.mark.skipif(shutil.which("git") is None, reason="Git is not installed on this system")
def test_real_git_date_lookup_matches_git(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    for name in ("GIT_DIR", "GIT_WORK_TREE", "GIT_CEILING_DIRECTORIES"):
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setenv("GIT_CONFIG_GLOBAL", str(tmp_path / "gitconfig"))
    monkeypatch.setenv("GIT_CONFIG_SYSTEM", str(tmp_path / "gitconfig"))
    repository = tmp_path / "repository"
    repository.mkdir()
    environment = {
        "GIT_COMMITTER_DATE": "2026-03-04T05:06:07+0530",
        "GIT_AUTHOR_DATE": "2026-03-04T05:06:07+0530",
    }
    for key, value in environment.items():
        monkeypatch.setenv(key, value)

    def git(*args: str) -> str:
        return subprocess.run(  # noqa: S603
            ["git", "-C", str(repository), *args],  # noqa: S607
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()

    git("init", "-q")
    git(
        "-c",
        "user.name=Test",
        "-c",
        "user.email=test@example.invalid",
        "commit",
        "-q",
        "--allow-empty",
        "-m",
        "test",
    )
    commit = git("rev-parse", "HEAD")

    result = revision.determine_revision(
        lambda: revision.lookup_git_revision(repository),
        lambda c: revision.lookup_git_commit_date(c, repository),
    )

    assert result == revision.Revision(commit, "2026-03-04T05:06:07+05:30")
