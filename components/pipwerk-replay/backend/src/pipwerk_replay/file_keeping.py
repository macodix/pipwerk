"""Keeping uploaded files in the storage directory (specification 5.3, 5.6, 11).

With "Dateien behalten" the backend writes every uploaded file unchanged into the storage
directory, also a refused one. The name is the cleaned file name of the request (``file_name`` of
``import_form.py``: no directory, no control characters, never ``.`` or ``..``), the file lies
directly in the storage directory. A kept file never replaces an existing entry: if the name is
taken (by a file, a directory or a symbolic link, also a dangling one), the file gets the smallest
free number from 2 on in brackets before the extension (``EURUSD_M1.csv`` becomes
``EURUSD_M1 (2).csv``; the extension is the part from the last period on, a period at the start
does not count; without an extension the number stands at the end). ``keep_file`` returns the name
under which the file was kept. The backend never removes a kept file.

A file is written completely before it gets its name: first into an intermediate file in the
storage directory (``TEMPORARY_PREFIX``), flushed to the disk, then given its name with
``os.link`` and the intermediate file is removed. ``os.link`` fails if the name exists and never
follows a link at the target, so it is the one step that creates the name only while it is free;
a check before it only chooses the number and is no protection. If another request took the name
in the meantime, the next number is tried, at most ``MAX_NAME_ATTEMPTS`` times. So the target is
complete from the moment it exists, and nothing is ever replaced (neither ``os.replace`` nor
``Path.replace`` occurs here). A file system that cannot make a hard link cannot be a storage
directory: the file is then not kept (``KeepFailedError``); there is no weaker way that keeps the
guarantees. The intermediate file is removed at once in every case (success, failure, abort), and
``remove_leftover_temporary_files`` removes those that a crash left behind at the next start. The
list of the import directory never shows a file with the prefix (``import_directory.py``).

A name that is too long for the file system is shortened before the number (and the extension):
the limit is the maximum name length of the directory in bytes (``PC_NAME_MAX``, 255 if unknown;
on Windows 255 UTF-16 code units); characters are removed from the end as a whole, never in the
middle of a character.
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

#: How often a request tries a further number after another request took the name it had chosen
#: (``os.link`` found it taken). Every loss means that a concurrent request created exactly that
#: name in the few microseconds between the check and the link; 100 such losses in a row do not
#: happen in operation, so the limit only stops a loop that cannot end (a file system that
#: reports every name as taken). The search for the first free number is not counted: it costs a
#: check per existing entry and ends at the first free name.
MAX_NAME_ATTEMPTS = 100

#: The longest name of a file when the file system does not tell.
_DEFAULT_MAX_NAME = 255


class KeepFailedError(Exception):
    """The file could not be written to the storage directory."""


def is_temporary_name(name: str) -> bool:
    """Whether ``name`` is the name of an intermediate file of the backend."""
    return name.startswith(TEMPORARY_PREFIX)


def _split_extension(name: str) -> tuple[str, str]:
    """``name`` as stem and extension: the extension is the part from the last period on; a period
    at the start does not count."""
    index = name.rfind(".")
    if index <= 0:
        return name, ""
    return name[:index], name[index:]


def _length(name: str) -> int:
    """The length of a name in the unit of the file system limit: UTF-16 code units on Windows,
    bytes on other systems. ``KeepFailedError`` for a name that cannot be written as a name."""
    try:
        if os.name == "nt":
            return len(name.encode("utf-16-le", "surrogatepass")) // 2
        return len(os.fsencode(name))
    except UnicodeError:
        raise KeepFailedError from None


def _maximum_length(directory: Path) -> int:
    if os.name == "nt":
        return _DEFAULT_MAX_NAME
    try:
        value = os.pathconf(directory, "PC_NAME_MAX")
    except AttributeError, OSError, ValueError:
        return _DEFAULT_MAX_NAME
    return value if value > 0 else _DEFAULT_MAX_NAME


def candidate_name(name: str, number: int, maximum: int) -> str:
    """The name for ``number`` (1 is the name itself, from 2 on the number is put in brackets
    before the extension), shortened before the number if it is longer than ``maximum``.
    ``KeepFailedError`` if even the shortest form does not fit."""
    stem, extension = _split_extension(name)
    tail = "" if number == 1 else f" ({number})"
    while stem:
        candidate = f"{stem}{tail}{extension}"
        if _length(candidate) <= maximum:
            return candidate
        stem = stem[:-1]
    raise KeepFailedError


def _taken(path: Path) -> bool:
    """Whether anything is at ``path``: a file, a directory, a link (also a dangling one)."""
    return os.path.lexists(path)


def keep_file(directory: Path, name: str, content: bytes) -> str:
    """Write ``content`` as a new file into the storage directory ``directory`` and return the
    name under which it was kept: ``name``, or ``name`` with a number if it was taken (see the
    module description). Nothing existing is replaced.

    The directory is created if it is missing. ``KeepFailedError`` if the name is not a plain file
    name, the file cannot be written or no free name was found in ``MAX_NAME_ATTEMPTS`` attempts;
    nothing remains of the attempt then."""
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
        try:
            with os.fdopen(descriptor, "wb") as stream:
                stream.write(content)
                stream.flush()
                os.fsync(stream.fileno())
            return _give_name(directory, name, temporary)
        except OSError:
            raise KeepFailedError from None
    finally:
        with contextlib.suppress(OSError):
            os.unlink(temporary)


def _give_name(directory: Path, name: str, temporary: str) -> str:
    """Give the finished intermediate file the first free name from ``name`` on."""
    maximum = _maximum_length(directory)
    number = 1
    for _ in range(MAX_NAME_ATTEMPTS):
        candidate = candidate_name(name, number, maximum)
        while _taken(directory / candidate):
            number += 1
            candidate = candidate_name(name, number, maximum)
        try:
            os.link(temporary, directory / candidate)
        except FileExistsError:
            number += 1
            continue
        return candidate
    raise KeepFailedError


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
