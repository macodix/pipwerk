"""Determination of the revision Pipwerk Studio runs from.

The revision is the Git commit of the working tree the ``pipwerk_studio``
package is loaded from, together with its committer date. It is determined
once when the application is created. Every failure results in "not
determinable" (``None``); the application then starts and works normally. A
commit date that is not determinable leaves the commit hash intact.
"""

from __future__ import annotations

import logging
import re
import subprocess
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)

REVISION_LENGTH = 7
GIT_TIMEOUT_SECONDS = 5

# Determines the full commit hash (40 lower-case hexadecimal characters) or
# returns ``None`` if it is not determinable. Replaceable for tests.
RevisionLookup = Callable[[], str | None]

# Determines the committer date of the given full commit hash as ISO 8601 string
# with time zone (the format of ``git log --format=%cI``) or returns ``None`` if
# it is not determinable. Replaceable for tests.
CommitDateLookup = Callable[[str], str | None]

_FULL_HASH = re.compile(r"[0-9a-f]{40}")
_ISO_TIMESTAMP = re.compile(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})")


@dataclass(frozen=True)
class Revision:
    """The commit Studio runs from.

    ``commit`` is the full hash (40 lower-case hexadecimal characters),
    ``committed_at`` the committer date as ISO 8601 string with offset or
    ``None`` if it is not determinable.
    """

    commit: str
    committed_at: str | None

    @property
    def short(self) -> str:
        return self.commit[:REVISION_LENGTH]


def lookup_git_revision(directory: Path | None = None) -> str | None:
    """Ask Git for ``HEAD`` of the working tree containing ``directory``.

    ``directory`` defaults to the directory of the ``pipwerk_studio`` package;
    only tests pass another one.

    Runs ``git rev-parse HEAD`` as a subprocess with a fixed argument list,
    without a shell, with a short time limit. Any failure is logged once as a
    warning without technical details and results in ``None``.
    """
    working_directory = directory if directory is not None else Path(__file__).resolve().parent
    try:
        result = subprocess.run(  # noqa: S603 - fixed argument list, no shell
            ["git", "-C", str(working_directory), "rev-parse", "HEAD"],  # noqa: S607
            capture_output=True,
            text=True,
            timeout=GIT_TIMEOUT_SECONDS,
            check=False,
            stdin=subprocess.DEVNULL,
        )
    except OSError, subprocess.SubprocessError, ValueError:
        _warn_not_determinable("Git could not be run")
        return None
    if result.returncode != 0:
        _warn_not_determinable("Git reported no revision")
        return None
    return result.stdout.strip()


def _warn_not_determinable(reason: str) -> None:
    logger.warning("The Studio revision is not determinable: %s.", reason)


def lookup_git_commit_date(commit: str, directory: Path | None = None) -> str | None:
    """Ask Git for the committer date of ``commit`` in the working tree of ``directory``.

    ``directory`` defaults to the directory of the ``pipwerk_studio`` package;
    only tests pass another one.

    Runs ``git log -1 --no-show-signature --format=%cI <commit>`` as a
    subprocess with a fixed argument list, without a shell, with a short time
    limit. Any failure results in ``None`` (the caller logs the warning).
    """
    working_directory = directory if directory is not None else Path(__file__).resolve().parent
    try:
        result = subprocess.run(  # noqa: S603 - fixed argument list, no shell
            [  # noqa: S607
                "git",
                "-C",
                str(working_directory),
                "log",
                "-1",
                "--no-show-signature",
                "--format=%cI",
                commit,
            ],
            capture_output=True,
            text=True,
            timeout=GIT_TIMEOUT_SECONDS,
            check=False,
            stdin=subprocess.DEVNULL,
        )
    except OSError, subprocess.SubprocessError, ValueError:
        return None
    if result.returncode != 0:
        return None
    return result.stdout


def _valid_timestamp(output: str | None) -> str | None:
    """Return ``output`` stripped if it is exactly one ISO 8601 timestamp with offset."""
    if output is None:
        return None
    timestamp = output.strip()
    if _ISO_TIMESTAMP.fullmatch(timestamp) is None:
        return None
    try:
        parsed = datetime.fromisoformat(timestamp)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return None
    return timestamp


def determine_revision(
    lookup: RevisionLookup = lookup_git_revision,
    date_lookup: CommitDateLookup = lookup_git_commit_date,
) -> Revision | None:
    """Return the commit with its committer date or ``None``.

    Only a hash of exactly 40 lower-case hexadecimal characters is valid. The
    date is only looked up for a valid hash; if it is not determinable the
    result still contains the hash, with one warning without technical details.
    """
    try:
        full_hash = lookup()
    except Exception:
        _warn_not_determinable("lookup failed")
        return None
    if full_hash is None:
        return None
    if _FULL_HASH.fullmatch(full_hash) is None:
        _warn_not_determinable("invalid output")
        return None
    try:
        committed_at = _valid_timestamp(date_lookup(full_hash))
    except Exception:
        committed_at = None
    if committed_at is None:
        logger.warning("The Studio commit date is not determinable.")
    return Revision(commit=full_hash, committed_at=committed_at)
