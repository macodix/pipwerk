"""Tests of the determination of the revision (``revision.py``) and of ``/api/replay/revision``.

Every failure gives "not determinable" and the application starts and works; the warnings name
no path, no output of Git and no commit.
"""

from __future__ import annotations

import logging
import shutil
import subprocess
from pathlib import Path
from typing import Any

import pytest
from datastock import make_app
from fastapi.testclient import TestClient
from pydantic import ValidationError

from pipwerk_replay import revision as revision_module
from pipwerk_replay.internal_api import ReplayRevision
from pipwerk_replay.revision import (
    Revision,
    determine_revision,
    lookup_git_commit_date,
    lookup_git_revision,
)

URL = "/api/replay/revision"
COMMIT = "0123456789abcdef0123456789abcdef01234567"
DATE = "2026-10-21T09:30:00+02:00"


def read(tmp_path: Path, **lookups: Any) -> Any:
    return TestClient(make_app(tmp_path, **lookups)).get(URL)


def test_the_revision_has_the_short_form_the_commit_and_the_date(tmp_path: Path) -> None:
    response = read(
        tmp_path, revision_lookup=lambda: COMMIT, commit_date_lookup=lambda _commit: DATE
    )

    assert response.status_code == 200
    assert response.json() == {"revision": COMMIT[:7], "commit": COMMIT, "committed_at": DATE}


def test_a_revision_that_is_not_determinable_gives_three_nulls(tmp_path: Path) -> None:
    response = read(tmp_path, revision_lookup=lambda: None)

    assert response.status_code == 200
    assert response.json() == {"revision": None, "commit": None, "committed_at": None}


def test_a_date_that_is_not_determinable_leaves_the_commit(
    tmp_path: Path, caplog: pytest.LogCaptureFixture
) -> None:
    caplog.set_level(logging.WARNING)

    response = read(tmp_path, revision_lookup=lambda: COMMIT, commit_date_lookup=lambda _c: None)

    assert response.json() == {"revision": COMMIT[:7], "commit": COMMIT, "committed_at": None}
    assert caplog.messages.count("The pipwerk replay commit date is not determinable.") == 1


def test_the_revision_is_determined_once_when_the_application_is_created(tmp_path: Path) -> None:
    calls: list[str] = []

    def lookup() -> str:
        calls.append("revision")
        return COMMIT

    def date(_commit: str) -> str:
        calls.append("date")
        return DATE

    client = TestClient(make_app(tmp_path, revision_lookup=lookup, commit_date_lookup=date))
    for _ in range(3):
        assert client.get(URL).status_code == 200

    assert calls == ["revision", "date"]


@pytest.mark.parametrize(
    "output", ["", "xyz", COMMIT.upper(), COMMIT[:39], COMMIT + "0", COMMIT + "\n0"]
)
def test_only_a_hash_of_40_lower_case_hexadecimal_characters_is_valid(
    output: str, caplog: pytest.LogCaptureFixture
) -> None:
    caplog.set_level(logging.WARNING)
    dates: list[str] = []

    def date(commit: str) -> str:
        dates.append(commit)
        return DATE

    result = determine_revision(lambda: output, date)

    assert result is None
    assert dates == []  # the date is only asked for a valid hash
    assert caplog.messages == ["The pipwerk replay revision is not determinable: invalid output."]
    assert output.strip() == "" or output not in caplog.text


def test_a_failing_lookup_is_not_determinable_with_one_warning(
    caplog: pytest.LogCaptureFixture,
) -> None:
    caplog.set_level(logging.WARNING)

    def broken() -> str:
        raise RuntimeError("secret detail of the failure")

    assert determine_revision(broken) is None
    assert caplog.messages == ["The pipwerk replay revision is not determinable: lookup failed."]
    assert "secret detail" not in caplog.text


@pytest.mark.parametrize(
    "answer",
    [
        None,
        "",
        "yesterday",
        "2026-10-21",
        "2026-10-21T09:30:00",
        "2026-13-45T25:61:61+02:00",
        "2026-10-21T09:30:00+02:00\n2026-10-21T09:30:00+02:00",
        "x2026-10-21T09:30:00Z",
    ],
)
def test_a_date_that_does_not_fit_is_not_determinable(
    answer: str | None, caplog: pytest.LogCaptureFixture
) -> None:
    caplog.set_level(logging.WARNING)

    result = determine_revision(lambda: COMMIT, lambda _commit: answer)

    assert result == Revision(COMMIT, None)
    assert caplog.messages == ["The pipwerk replay commit date is not determinable."]


def test_a_date_with_z_or_an_offset_and_surrounding_blanks_is_valid() -> None:
    assert determine_revision(lambda: COMMIT, lambda _c: " 2026-10-21T07:30:00Z\n") == Revision(
        COMMIT, "2026-10-21T07:30:00Z"
    )
    assert determine_revision(lambda: COMMIT, lambda _c: DATE + "\n") == Revision(COMMIT, DATE)


def test_a_failing_date_lookup_keeps_the_commit_without_detail(
    caplog: pytest.LogCaptureFixture,
) -> None:
    caplog.set_level(logging.WARNING)

    def broken(_commit: str) -> str:
        raise RuntimeError("secret detail of the failure")

    assert determine_revision(lambda: COMMIT, broken) == Revision(COMMIT, None)
    assert "secret detail" not in caplog.text
    assert COMMIT not in caplog.text


def test_the_short_form_has_seven_characters() -> None:
    assert Revision(COMMIT, None).short == COMMIT[:7]


# --- the calls of Git ---------------------------------------------------------------------------


class Completed:
    def __init__(self, returncode: int, stdout: str = "") -> None:
        self.returncode = returncode
        self.stdout = stdout


def test_git_is_called_with_a_fixed_argument_list_without_a_shell(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    calls: list[tuple[list[str], dict[str, Any]]] = []

    def run(arguments: list[str], **kwargs: Any) -> Completed:
        calls.append((arguments, kwargs))
        return Completed(0, COMMIT + "\n")

    monkeypatch.setattr(subprocess, "run", run)

    assert lookup_git_revision(tmp_path) == COMMIT
    assert lookup_git_commit_date(COMMIT, tmp_path) == COMMIT + "\n"

    assert calls[0][0] == ["git", "-C", str(tmp_path), "rev-parse", "HEAD"]
    assert calls[1][0] == [
        "git",
        "-C",
        str(tmp_path),
        "log",
        "-1",
        "--no-show-signature",
        "--format=%cI",
        COMMIT,
    ]
    for _arguments, kwargs in calls:
        assert not kwargs.get("shell")
        assert kwargs["timeout"] == revision_module.GIT_TIMEOUT_SECONDS == 5
        assert kwargs["stdin"] == subprocess.DEVNULL
        assert kwargs["check"] is False


@pytest.mark.parametrize(
    "failure",
    [
        FileNotFoundError("git"),
        subprocess.TimeoutExpired("git", 5),
        ValueError("embedded null byte"),
        subprocess.SubprocessError("x"),
    ],
)
def test_a_git_that_cannot_be_run_is_not_determinable_with_one_warning(
    failure: Exception,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    caplog.set_level(logging.WARNING)

    def run(*_args: Any, **_kwargs: Any) -> Any:
        raise failure

    monkeypatch.setattr(subprocess, "run", run)

    assert lookup_git_revision(tmp_path) is None
    assert lookup_git_commit_date(COMMIT, tmp_path) is None
    assert caplog.messages == [
        "The pipwerk replay revision is not determinable: Git could not be run."
    ]
    assert str(tmp_path) not in caplog.text


def test_a_git_that_fails_is_not_determinable_and_its_output_is_not_logged(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    caplog.set_level(logging.WARNING)
    monkeypatch.setattr(subprocess, "run", lambda *_a, **_k: Completed(128, "fatal: secret output"))

    assert lookup_git_revision(tmp_path) is None
    assert lookup_git_commit_date(COMMIT, tmp_path) is None
    assert caplog.messages == [
        "The pipwerk replay revision is not determinable: Git reported no revision."
    ]
    assert "secret output" not in caplog.text


@pytest.mark.skipif(shutil.which("git") is None, reason="Git is not installed")
def test_with_a_real_repository_the_commit_and_its_committer_date_are_found(
    tmp_path: Path,
) -> None:
    def git(*arguments: str) -> str:
        environment = {
            "GIT_AUTHOR_NAME": "Test",
            "GIT_AUTHOR_EMAIL": "test@example.invalid",
            "GIT_COMMITTER_NAME": "Test",
            "GIT_COMMITTER_EMAIL": "test@example.invalid",
            "GIT_COMMITTER_DATE": "2026-01-02T03:04:05+02:00",
            "GIT_AUTHOR_DATE": "2026-01-02T03:04:05+02:00",
            "GIT_CONFIG_GLOBAL": "/dev/null",
            "GIT_CONFIG_SYSTEM": "/dev/null",
            "PATH": __import__("os").environ["PATH"],
            "HOME": str(tmp_path),
        }
        result = subprocess.run(  # noqa: S603
            ["git", "-C", str(tmp_path), *arguments],  # noqa: S607
            capture_output=True,
            text=True,
            check=True,
            env=environment,
        )
        return result.stdout.strip()

    git("init", "-q")
    (tmp_path / "file.txt").write_text("x", encoding="utf-8")
    git("add", "file.txt")
    git("-c", "commit.gpgsign=false", "commit", "-q", "-m", "first")
    expected = git("rev-parse", "HEAD")

    found = determine_revision(
        lambda: lookup_git_revision(tmp_path),
        lambda commit: lookup_git_commit_date(commit, tmp_path),
    )

    assert found == Revision(expected, "2026-01-02T03:04:05+02:00")


@pytest.mark.skipif(shutil.which("git") is None, reason="Git is not installed")
def test_outside_of_a_working_tree_nothing_is_found_and_the_application_starts(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    caplog.set_level(logging.WARNING)
    monkeypatch.setenv("GIT_CEILING_DIRECTORIES", str(tmp_path.parent))
    monkeypatch.delenv("GIT_DIR", raising=False)
    monkeypatch.delenv("GIT_WORK_TREE", raising=False)
    empty = tmp_path / "empty"
    empty.mkdir()

    app = make_app(tmp_path, revision_lookup=lambda: lookup_git_revision(empty))
    client = TestClient(app)

    assert client.get(URL).json() == {"revision": None, "commit": None, "committed_at": None}
    assert client.get("/api/health").json() == {"status": "ok"}
    assert (
        caplog.messages.count(
            "The pipwerk replay revision is not determinable: Git reported no revision."
        )
        == 1
    )
    assert str(empty) not in caplog.text


# --- the answer model ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "fields",
    [
        {"revision": "abc1234", "commit": None, "committed_at": None},
        {"revision": None, "commit": COMMIT, "committed_at": None},
        {"revision": "0000000", "commit": COMMIT, "committed_at": None},
        {"revision": None, "commit": None, "committed_at": DATE},
        {"revision": COMMIT[:7], "commit": COMMIT, "committed_at": 5},
        {"revision": COMMIT[:7], "commit": COMMIT, "committed_at": None, "extra": 1},
    ],
)
def test_the_answer_model_enforces_its_invariants(fields: dict[str, Any]) -> None:
    with pytest.raises(ValidationError):
        ReplayRevision.model_validate(fields, strict=True)


def test_other_methods_are_405(tmp_path: Path) -> None:
    client = TestClient(make_app(tmp_path))

    for method in ("post", "put", "delete", "patch"):
        assert client.request(method, URL).status_code == 405, method


def test_the_default_lookup_in_a_git_working_tree_does_not_break_the_start(tmp_path: Path) -> None:
    """With the real lookup the answer is either a valid revision or three nulls."""
    body = TestClient(make_app(tmp_path)).get(URL).json()

    if body["commit"] is None:
        assert body == {"revision": None, "commit": None, "committed_at": None}
    else:
        assert body["revision"] == body["commit"][:7]
        assert len(body["commit"]) == 40
