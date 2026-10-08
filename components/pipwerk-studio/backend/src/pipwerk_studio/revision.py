"""Determination of the revision Pipwerk Studio runs from.

The revision is the Git commit of the working tree the ``pipwerk_studio``
package is loaded from. It is determined once when the application is
created. Every failure results in "not determinable" (``None``); the
application then starts and works normally.
"""

from __future__ import annotations

import logging
import re
import subprocess
from collections.abc import Callable
from pathlib import Path

logger = logging.getLogger(__name__)

REVISION_LENGTH = 7
GIT_TIMEOUT_SECONDS = 5

# Determines the full commit hash (40 lower-case hexadecimal characters) or
# returns ``None`` if it is not determinable. Replaceable for tests.
RevisionLookup = Callable[[], str | None]

_FULL_HASH = re.compile(r"[0-9a-f]{40}")


def lookup_git_revision() -> str | None:
    """Ask Git for ``HEAD`` of the working tree containing this package.

    Runs ``git rev-parse HEAD`` as a subprocess with a fixed argument list,
    without a shell, with a short time limit. Any failure is logged once as a
    warning without technical details and results in ``None``.
    """
    package_directory = Path(__file__).resolve().parent
    try:
        result = subprocess.run(  # noqa: S603 - fixed argument list, no shell
            ["git", "-C", str(package_directory), "rev-parse", "HEAD"],  # noqa: S607
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


def determine_short_revision(lookup: RevisionLookup = lookup_git_revision) -> str | None:
    """Return the first 7 characters of the commit hash or ``None``.

    Only an output of exactly 40 lower-case hexadecimal characters is valid.
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
    return full_hash[:REVISION_LENGTH]
