"""The import directory: listing it and reading a file from it (specification 5.3 and 11).

The import directory is a directory on the computer of the backend that belongs to the user. The
import reads a chosen file directly there, without upload and without a copy. The backend never
writes, moves, removes or changes anything in it.

A request names a path relative to the import directory. ``resolve`` turns it into the real path
and refuses it if

- it is not a plain relative path (absolute, a drive or root, an empty part, a part ``..``,
  a control character, too long): ``PathInvalidError``;
- the real path, with every symbolic link resolved, is not inside the real import directory:
  ``OutsideImportDirectoryError``;
- nothing is there: ``PathNotFoundError``; or it is another kind than asked for (a directory
  instead of a file or the other way round, a pipe, a device): ``WrongKindError``.

The import directory itself is resolved first; if it is unset, missing or cannot be read,
``ImportDirectoryUnavailableError``.

``open_file`` opens the real path read-only without following a link in the last part (where the
system has ``O_NOFOLLOW``) and checks on the open file that it is a plain file; the size is read
from the open file. The window between ``resolve`` and the opening is not closable with the means
of the standard library; the import directory belongs to the user in the network that the
operator controls (specification 11), and the file is only read.

Names that the backend uses for its own intermediate files (``file_keeping.py``) never appear in
the list and cannot be named.
"""

from __future__ import annotations

import os
import stat
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import BinaryIO, Literal

from pipwerk_replay.directories import MAX_DIRECTORY_LENGTH
from pipwerk_replay.file_keeping import is_temporary_name

Kind = Literal["file", "directory"]


class ImportDirectoryUnavailableError(Exception):
    """The import directory is not set, does not exist or cannot be read."""


class PathInvalidError(Exception):
    """The path is not a plain relative path."""


class OutsideImportDirectoryError(Exception):
    """The real path of the request is not inside the import directory."""


class PathNotFoundError(Exception):
    """Nothing is at the path (or it is an intermediate file of the backend)."""


class WrongKindError(Exception):
    """The path is not of the kind that was asked for (file or directory)."""


class FileNotReadableError(Exception):
    """The file exists inside the import directory and cannot be read."""


@dataclass(frozen=True, slots=True)
class Entry:
    """One file or directory of a listing: its name, size in bytes (``None`` for a directory) and
    the moment of its last change (UTC)."""

    name: str
    kind: Kind
    size: int | None
    modified_at: datetime


@dataclass(frozen=True, slots=True)
class Listing:
    """A page of a listing: the entries from ``offset`` on, at most ``limit``, and the total."""

    items: list[Entry]
    total: int


def _parts(relative: str) -> list[str]:
    """The parts of a relative path, ``/`` separating them (also ``\\`` on Windows)."""
    if relative == "":
        return []
    if (
        len(relative) > MAX_DIRECTORY_LENGTH
        or any(ord(character) < 32 or ord(character) == 127 for character in relative)
        or relative.startswith("/")
    ):
        raise PathInvalidError
    text = relative.replace("\\", "/") if os.name == "nt" else relative
    parts = text.split("/")
    if any(part in ("", "..") for part in parts):
        raise PathInvalidError
    if os.name == "nt" and (Path(relative).is_absolute() or Path(relative).drive):
        raise PathInvalidError
    return [part for part in parts if part != "."]


def real_root(root: Path | None) -> Path:
    """The real path of the import directory. ``ImportDirectoryUnavailableError`` if it is unset,
    missing, not a directory or cannot be read."""
    if root is None:
        raise ImportDirectoryUnavailableError
    try:
        real = root.resolve(strict=True)
        if not real.is_dir():
            raise ImportDirectoryUnavailableError
        with os.scandir(real):
            pass
    except OSError:
        raise ImportDirectoryUnavailableError from None
    return real


def resolve(root: Path | None, relative: str) -> Path:
    """The real path of ``relative`` inside the import directory ``root`` (see the module
    description for the refusals). It is not checked for existence or kind here."""
    real = real_root(root)
    parts = _parts(relative)
    if parts and is_temporary_name(parts[-1]):
        raise PathNotFoundError
    try:
        target = real.joinpath(*parts).resolve(strict=False)
    except OSError, RuntimeError, ValueError:
        # A loop of links, a name the system refuses.
        raise PathInvalidError from None
    if target != real and not target.is_relative_to(real):
        raise OutsideImportDirectoryError
    return target


def _moment(seconds: float) -> datetime:
    try:
        return datetime.fromtimestamp(seconds, UTC)
    except OverflowError, OSError, ValueError:
        return datetime.fromtimestamp(0, UTC)


def _entry(real: Path, item: os.DirEntry[str]) -> Entry | None:
    """The entry for one item of a directory, ``None`` if it is not shown: an intermediate file
    of the backend, a link that leads outside, a link that leads nowhere, or any other kind
    than a file or a directory."""
    if is_temporary_name(item.name):
        return None
    try:
        status = item.stat(follow_symlinks=False)
        if stat.S_ISLNK(status.st_mode):
            target = Path(item.path).resolve(strict=True)
            if not target.is_relative_to(real):
                return None
            status = target.stat()
        if stat.S_ISDIR(status.st_mode):
            return Entry(item.name, "directory", None, _moment(status.st_mtime))
        if stat.S_ISREG(status.st_mode):
            return Entry(item.name, "file", status.st_size, _moment(status.st_mtime))
    except OSError, RuntimeError:
        return None
    return None


def list_directory(root: Path | None, relative: str, *, offset: int, limit: int) -> Listing:
    """The files and subdirectories of the directory ``relative`` inside the import directory:
    directories first, then files, each sorted by name without regard to case. Only the page
    from ``offset`` on with at most ``limit`` entries is returned, with the total.

    The refusals are those of ``resolve``; ``WrongKindError`` if the path is a file,
    ``PathNotFoundError`` if it is missing, ``ImportDirectoryUnavailableError`` if the directory
    (or the import directory) cannot be read."""
    real = real_root(root)
    directory = resolve(root, relative)
    try:
        if not directory.is_dir():
            if directory.exists():
                raise WrongKindError
            raise PathNotFoundError
        with os.scandir(directory) as items:
            entries = [entry for item in items if (entry := _entry(real, item)) is not None]
    except OSError:
        raise ImportDirectoryUnavailableError from None
    entries.sort(key=lambda entry: (entry.kind != "directory", entry.name.casefold(), entry.name))
    return Listing(entries[offset : offset + limit], len(entries))


def open_file(root: Path | None, relative: str) -> tuple[BinaryIO, str, int]:
    """Open the file ``relative`` inside the import directory for reading only.

    Returns the open file, its name (the last part of the path) and its size in bytes; the
    caller closes it. The refusals are those of ``resolve``; ``PathNotFoundError`` if it is
    missing, ``WrongKindError`` if it is not a plain file, ``FileNotReadableError`` if it cannot
    be opened."""
    path = resolve(root, relative)
    flags = os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0) | getattr(os, "O_NONBLOCK", 0)
    flags |= getattr(os, "O_CLOEXEC", 0) | getattr(os, "O_BINARY", 0)
    try:
        descriptor = os.open(path, flags)
    except FileNotFoundError:
        raise PathNotFoundError from None
    except OSError:
        if path.exists() and not path.is_file():
            raise WrongKindError from None
        raise FileNotReadableError from None
    try:
        status = os.fstat(descriptor)
        if not stat.S_ISREG(status.st_mode):
            raise WrongKindError
        stream = os.fdopen(descriptor, "rb")
    except BaseException:
        os.close(descriptor)
        raise
    return stream, path.name, status.st_size
