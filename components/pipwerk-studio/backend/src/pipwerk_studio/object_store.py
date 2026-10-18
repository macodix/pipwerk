"""Object store of pipwerk Studio: one file per object in the object directory.

This layer does not know the content of the files. It stores and returns bytes
(or text) under a file name ``<uuid>.<kind>.json`` and lists the objects of one
kind with the time of their last change. Checking the content and the mark
"not readable" are the task of the layers above (specification 4.1).

Rules (specification 4.1 and 8):

- A file name is built only from a checked UUID (canonical lower case) and one
  of the fixed kinds. No other input becomes part of a file name.
- Writing goes through a temporary file in the same directory, ``fsync`` and
  renaming. A temporary file left behind by an aborted write has a name that
  never matches the pattern, so it is not listed.
- A missing directory is created at the first write, with permissions for the
  user only.
- Other files in the directory are not listed and not changed. Symbolic links
  are not followed: they are not listed, not read and not deleted.
- Moving the files to another directory never overwrites a file.
- One lock per store protects reading, writing, deleting and moving against
  each other within the process.
"""

from __future__ import annotations

import contextlib
import os
import re
import shutil
import stat
import tempfile
import threading
import uuid
from collections.abc import Callable, Iterator
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Literal, get_args

#: Kinds of objects (the ``<kind>`` of the file name).
ObjectKind = Literal["strategy", "indicator", "trend", "rule", "ruleset"]

OBJECT_KINDS: tuple[ObjectKind, ...] = get_args(ObjectKind)

_UUID_PATTERN = r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
_UUID_RE = re.compile(_UUID_PATTERN)
_FILE_NAME_RE = re.compile(
    rf"(?P<object_id>{_UUID_PATTERN})\.(?P<kind>{'|'.join(OBJECT_KINDS)})\.json"
)

_TEMPORARY_PREFIX = "."
_TEMPORARY_SUFFIX = ".tmp"
_CREATE_ATTEMPTS = 10


class ObjectStoreError(Exception):
    """Base class of the errors of the object store. Messages name no path."""


class InvalidObjectIdError(ObjectStoreError, ValueError):
    """The identifier is not a UUID in canonical lower case."""


class InvalidObjectKindError(ObjectStoreError, ValueError):
    """The kind is not one of the fixed kinds."""


class ObjectDirectoryNotSetError(ObjectStoreError):
    """There is no object directory (neither stored nor a default)."""


class ObjectWriteError(ObjectStoreError):
    """Writing or deleting a file failed."""


class ObjectConflictError(ObjectStoreError):
    """The target directory already holds a file with the name of an object file."""

    def __init__(self, names: list[str]) -> None:
        super().__init__("The target directory already contains files with the same names.")
        self.names = names


class ObjectMoveError(ObjectStoreError):
    """Moving the files failed; the files moved so far were brought back."""


class ObjectTargetNotCreatableError(ObjectMoveError):
    """The target directory could not be created; nothing was moved."""


class ObjectMoveRollbackError(ObjectStoreError):
    """Moving failed and bringing back failed too: files are in the target directory."""

    def __init__(self, source: Path, target: Path, names: list[str]) -> None:
        super().__init__("Moving the object files failed and they could not be restored.")
        self.source = source
        self.target = target
        self.names = names


@dataclass(frozen=True)
class ObjectEntry:
    """An object in the listing: its identifier and the time of its last change."""

    object_id: str
    modified: datetime


@dataclass(frozen=True)
class ReadResult[T]:
    """Result of reading a file.

    ``status`` is ``ok`` (``value`` is set), ``missing`` (there is no such
    file) or ``unreadable`` (the file exists but cannot be read, or is not
    UTF-8 text when read as text). Reading never raises for these cases.
    """

    status: Literal["ok", "missing", "unreadable"]
    value: T | None = None


def check_object_id(object_id: str) -> str:
    """Return ``object_id`` if it is a UUID in canonical lower case."""
    if not isinstance(object_id, str) or _UUID_RE.fullmatch(object_id) is None:
        raise InvalidObjectIdError("The object identifier is not a valid UUID.")
    try:
        uuid.UUID(object_id)
    except ValueError as error:
        raise InvalidObjectIdError("The object identifier is not a valid UUID.") from error
    return object_id


def check_object_kind(kind: str) -> ObjectKind:
    """Return ``kind`` if it is one of the fixed kinds."""
    for known in OBJECT_KINDS:
        if kind == known:
            return known
    raise InvalidObjectKindError("The object kind is not known.")


def object_file_name(kind: str, object_id: str) -> str:
    """Return the file name ``<uuid>.<kind>.json`` for a checked UUID and kind."""
    return f"{check_object_id(object_id)}.{check_object_kind(kind)}.json"


def _is_regular_file(path: Path) -> bool:
    """Tell whether ``path`` is a regular file; a symbolic link is not."""
    try:
        return stat.S_ISREG(os.lstat(path).st_mode)
    except OSError:
        return False


def _scan(directory: Path) -> Iterator[tuple[str, ObjectKind, os.stat_result]]:
    """Yield name, kind and status of the object files in ``directory``.

    Only regular files with a name of the pattern are yielded. A missing
    directory yields nothing.
    """
    try:
        entries = list(os.scandir(directory))
    except FileNotFoundError:
        return
    except OSError as error:
        raise ObjectStoreError("The object directory cannot be read.") from error
    for entry in sorted(entries, key=lambda item: item.name):
        match = _FILE_NAME_RE.fullmatch(entry.name)
        if match is None:
            continue
        try:
            status = entry.stat(follow_symlinks=False)
        except OSError:
            continue
        if stat.S_ISREG(status.st_mode):
            yield entry.name, check_object_kind(match["kind"]), status


def _read_file(path: Path, max_bytes: int | None = None) -> ReadResult[bytes]:
    """Read a regular file without following a symbolic link.

    A file larger than ``max_bytes`` (if given) is ``unreadable``; at most
    ``max_bytes`` plus one byte are read from it.
    """
    if not _is_regular_file(path):
        return ReadResult("missing")
    flags = os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0) | getattr(os, "O_CLOEXEC", 0)
    try:
        descriptor = os.open(path, flags)
        with os.fdopen(descriptor, "rb") as file:
            if max_bytes is None:
                return ReadResult("ok", file.read())
            content = file.read(max_bytes + 1)
            if len(content) > max_bytes:
                return ReadResult("unreadable")
            return ReadResult("ok", content)
    except FileNotFoundError:
        return ReadResult("missing")
    except OSError:
        return ReadResult("unreadable")


def _synchronize_directory(directory: Path) -> None:
    """Write the directory entry to disk where the platform allows it."""
    if os.name == "nt":
        return
    with contextlib.suppress(OSError):
        descriptor = os.open(directory, os.O_RDONLY)
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)


def _write_file(directory: Path, name: str, payload: bytes) -> None:
    """Write ``payload`` to ``directory/name`` through a temporary file.

    The old file stays unchanged until the new one is complete. A file other
    than a regular file under the name (a symbolic link) is not replaced.
    """
    directory.mkdir(mode=0o700, parents=True, exist_ok=True)
    target = directory / name
    if os.path.lexists(target) and not _is_regular_file(target):
        raise ObjectWriteError("The object file cannot be written.")
    descriptor, temporary_name = tempfile.mkstemp(
        prefix=_TEMPORARY_PREFIX, suffix=_TEMPORARY_SUFFIX, dir=directory
    )
    temporary = Path(temporary_name)
    try:
        with os.fdopen(descriptor, "wb") as file:
            file.write(payload)
            file.flush()
            os.fsync(file.fileno())
        os.replace(temporary, target)
    except BaseException:
        with contextlib.suppress(OSError):
            temporary.unlink()
        raise
    _synchronize_directory(directory)


def _copy_file(source: Path, target: Path) -> None:
    """Copy ``source`` to ``target`` without ever overwriting ``target``.

    The copy is written to a temporary file in the target directory and then
    linked to the final name; linking fails if the name exists.
    """
    flags = os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0) | getattr(os, "O_CLOEXEC", 0)
    # Opening first: a symbolic link in place of the file fails here and
    # nothing has been created yet.
    with os.fdopen(os.open(source, flags), "rb") as origin:
        descriptor, temporary_name = tempfile.mkstemp(
            prefix=_TEMPORARY_PREFIX, suffix=_TEMPORARY_SUFFIX, dir=target.parent
        )
        temporary = Path(temporary_name)
        try:
            with os.fdopen(descriptor, "wb") as destination:
                shutil.copyfileobj(origin, destination)
                destination.flush()
                os.fsync(destination.fileno())
            _link(temporary, target)
        finally:
            with contextlib.suppress(OSError):
                temporary.unlink()


def _link(source: Path, target: Path) -> None:
    """Create a hard link ``target`` to ``source`` without following a symbolic link.

    Fails with ``FileExistsError`` if ``target`` exists.
    """
    if os.link in os.supports_follow_symlinks:
        os.link(source, target, follow_symlinks=False)
    else:
        os.link(source, target)


def _move_file(source: Path, target: Path) -> None:
    """Move one file and never overwrite ``target``.

    Only a regular file is moved: this is checked again immediately before, and
    a symbolic link that has taken its place since the listing is not followed
    (hard link without following, ``O_NOFOLLOW`` when copying). A hard link is
    created first; it fails with ``FileExistsError`` if the name exists, even if
    it came into being just now. If linking is not possible (another file
    system), the file is copied instead.
    """
    if not _is_regular_file(source):
        raise OSError("Not a regular file.")
    try:
        _link(source, target)
    except FileExistsError:
        raise
    except OSError:
        _copy_file(source, target)
    try:
        os.unlink(source)
    except OSError:
        with contextlib.suppress(OSError):
            os.unlink(target)
        raise


def _same_directory(first: Path, second: Path) -> bool:
    try:
        return os.path.samefile(first, second)
    except OSError:
        return False


def _move_back(source: Path, target: Path, names: list[str]) -> list[str]:
    """Bring ``names`` from ``target`` back to ``source``; return those that failed."""
    failed: list[str] = []
    for name in reversed(names):
        try:
            _move_file(target / name, source / name)
        except OSError:
            failed.append(name)
    return sorted(failed)


@dataclass
class MovedObjects:
    """The object files moved from ``source`` to ``target``."""

    source: Path
    target: Path
    names: list[str]

    def restore(self) -> None:
        """Bring all moved files back to ``source``.

        Raises ``ObjectMoveRollbackError`` if some files could not be brought back.
        """
        failed = _move_back(self.source, self.target, self.names)
        if failed:
            raise ObjectMoveRollbackError(self.source, self.target, failed)


def move_objects(source: Path, target: Path) -> MovedObjects:
    """Move all object files from ``source`` to ``target``.

    Nothing is moved if the target directory holds a file with the name of one
    of them (``ObjectConflictError``). If moving fails on the way, the files
    moved so far are brought back and ``ObjectMoveError`` is raised, or
    ``ObjectMoveRollbackError`` if bringing them back fails too. A file is
    never overwritten. Other files in the directory are not touched.
    """
    try:
        names = [name for name, _kind, _status in _scan(source)]
    except ObjectStoreError as error:
        raise ObjectMoveError("The files to move cannot be listed.") from error
    if not names or _same_directory(source, target):
        return MovedObjects(source, target, [])
    conflicts = [name for name in names if os.path.lexists(target / name)]
    if conflicts:
        raise ObjectConflictError(conflicts)
    try:
        target.mkdir(mode=0o700, parents=True, exist_ok=True)
    except OSError as error:
        raise ObjectTargetNotCreatableError("The target directory cannot be created.") from error
    moved: list[str] = []
    try:
        for name in names:
            _move_file(source / name, target / name)
            moved.append(name)
    except OSError as error:
        failed = _move_back(source, target, moved)
        if failed:
            raise ObjectMoveRollbackError(source, target, failed) from error
        raise ObjectMoveError("Moving the object files failed.") from error
    return MovedObjects(source, target, moved)


class ObjectStore:
    """Reads and writes the object files in the current object directory.

    ``directory`` returns the object directory in force (or ``None``) each time
    it is called, so a change of the setting takes effect at once. ``lock`` is
    held by every operation; whoever changes the directory holds it too.
    """

    def __init__(self, directory: Callable[[], Path | None]) -> None:
        self._directory = directory
        self.lock = threading.RLock()

    def _require_directory(self) -> Path:
        directory = self._directory()
        if directory is None:
            raise ObjectDirectoryNotSetError("The object directory is not set.")
        return directory

    @staticmethod
    def _payload(data: bytes | str) -> bytes:
        return data.encode("utf-8") if isinstance(data, str) else bytes(data)

    def create(self, kind: str, data: bytes | str) -> str:
        """Write a new object under a new UUID and return the UUID."""
        check_object_kind(kind)
        payload = self._payload(data)
        with self.lock:
            directory = self._require_directory()
            for _ in range(_CREATE_ATTEMPTS):
                object_id = str(uuid.uuid4())
                name = object_file_name(kind, object_id)
                if os.path.lexists(directory / name):
                    continue
                self._write(directory, name, payload)
                return object_id
        raise ObjectWriteError("The object file cannot be written.")

    def write(self, kind: str, object_id: str, data: bytes | str) -> None:
        """Write (create or replace) the object with the given UUID."""
        name = object_file_name(kind, object_id)
        payload = self._payload(data)
        with self.lock:
            self._write(self._require_directory(), name, payload)

    @staticmethod
    def _write(directory: Path, name: str, payload: bytes) -> None:
        try:
            _write_file(directory, name, payload)
        except OSError as error:
            raise ObjectWriteError("The object file cannot be written.") from error

    def read_bytes(
        self, kind: str, object_id: str, max_bytes: int | None = None
    ) -> ReadResult[bytes]:
        """Return the content of an object as bytes. A file larger than ``max_bytes``
        (if given) is ``unreadable``."""
        name = object_file_name(kind, object_id)
        with self.lock:
            directory = self._directory()
            if directory is None:
                return ReadResult("missing")
            return _read_file(directory / name, max_bytes)

    def read_text(self, kind: str, object_id: str, max_bytes: int | None = None) -> ReadResult[str]:
        """Return the content of an object as UTF-8 text."""
        result = self.read_bytes(kind, object_id, max_bytes)
        if result.value is None:
            return ReadResult(result.status)
        try:
            return ReadResult("ok", result.value.decode("utf-8"))
        except UnicodeDecodeError:
            return ReadResult("unreadable")

    def delete(self, kind: str, object_id: str) -> bool:
        """Delete an object; return whether a file was deleted."""
        name = object_file_name(kind, object_id)
        with self.lock:
            directory = self._directory()
            if directory is None or not _is_regular_file(directory / name):
                return False
            try:
                os.unlink(directory / name)
            except FileNotFoundError:
                return False
            except OSError as error:
                raise ObjectWriteError("The object file cannot be deleted.") from error
            _synchronize_directory(directory)
            return True

    def is_link(self, kind: str, object_id: str) -> bool:
        """Tell whether a symbolic link (of any kind, also a dangling one) lies under the
        name of the object. The link is not followed."""
        name = object_file_name(kind, object_id)
        with self.lock:
            directory = self._directory()
            return directory is not None and os.path.islink(directory / name)

    def list_objects(self, kind: str) -> list[ObjectEntry]:
        """List the objects of one kind with the time of their last change."""
        wanted = check_object_kind(kind)
        with self.lock:
            directory = self._directory()
            if directory is None:
                return []
            return [
                ObjectEntry(
                    object_id=name.split(".", 1)[0],
                    modified=datetime.fromtimestamp(status.st_mtime, UTC),
                )
                for name, found, status in _scan(directory)
                if found == wanted
            ]
