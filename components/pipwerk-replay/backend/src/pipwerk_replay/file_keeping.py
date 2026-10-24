"""Keeping uploaded files in the storage directory (specification 5.6).

With "Dateien behalten" the backend writes every uploaded file unchanged into the storage
directory, also a refused one. The name is the cleaned file name of the request (``file_name`` of
``import_form.py``: no directory, no control characters, never ``.`` or ``..``), the file lies
directly in the storage directory. A file of the same name is replaced. The backend never removes
a kept file.

A file is written completely before it gets its name: first into an intermediate file in the
storage directory (``TEMPORARY_PREFIX``), flushed to the disk, then renamed over the target in
one step (``os.replace``). So the target is either the old or the complete new file, never a part
of it. The intermediate file is removed at once if writing fails, and
``remove_leftover_temporary_files`` removes those that a crash left behind at the next start. The
list of the import directory never shows a file with the prefix (``import_directory.py``).
"""

from __future__ import annotations

import contextlib
import logging
import os
import tempfile
from pathlib import Path

logger = logging.getLogger(__name__)

#: The start of the name of every intermediate file of the backend.
TEMPORARY_PREFIX = ".pipwerk-replay-tmp-"
TEMPORARY_SUFFIX = ".part"


class KeepFailedError(Exception):
    """The file could not be written to the storage directory."""


def is_temporary_name(name: str) -> bool:
    """Whether ``name`` is the name of an intermediate file of the backend."""
    return name.startswith(TEMPORARY_PREFIX)


def keep_file(directory: Path, name: str, content: bytes) -> None:
    """Write ``content`` as the file ``name`` into the storage directory ``directory``.

    The directory is created if it is missing. ``KeepFailedError`` if the name is not a plain file
    name or the file cannot be written; nothing remains of the attempt then."""
    if (
        not name
        or name in (".", "..")
        or os.sep in name
        or (os.altsep is not None and os.altsep in name)
        or "\x00" in name
        or is_temporary_name(name)
    ):
        raise KeepFailedError
    try:
        directory.mkdir(parents=True, exist_ok=True)
        descriptor, temporary = tempfile.mkstemp(
            prefix=TEMPORARY_PREFIX, suffix=TEMPORARY_SUFFIX, dir=directory
        )
    except OSError:
        raise KeepFailedError from None
    try:
        with os.fdopen(descriptor, "wb") as stream:
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, directory / name)
    except OSError:
        with contextlib.suppress(OSError):
            os.unlink(temporary)
        raise KeepFailedError from None
    except BaseException:
        with contextlib.suppress(OSError):
            os.unlink(temporary)
        raise


def remove_leftover_temporary_files(directory: Path | None) -> int:
    """Remove the intermediate files that an earlier run left in ``directory`` (a crash during
    writing); returns how many. Only files with the prefix of the backend are touched. A
    directory that is missing or cannot be read is not an error."""
    if directory is None:
        return 0
    removed = 0
    try:
        with os.scandir(directory) as entries:
            for entry in entries:
                if not is_temporary_name(entry.name) or not entry.name.endswith(TEMPORARY_SUFFIX):
                    continue
                if not entry.is_file(follow_symlinks=False):
                    continue
                try:
                    os.unlink(entry.path)
                except OSError:
                    logger.warning("An intermediate file of an earlier run could not be removed.")
                else:
                    removed += 1
    except OSError:
        return removed
    return removed
