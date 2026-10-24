"""The way ``files``: a directory in the file system (specification 3.4).

The directory can be on a network drive that the operator has mounted. Target and inbox are the
same directory; two sides use the same directory in opposite directions or two directories.

Files in the directory:

- ``<message id>.json``: the envelope (the text of ``Envelope.to_json``),
- ``<message id>.<number>.att``: attachment ``number`` (counted from 0 in the order of
  ``message.attachments``).

Writing: every file is written under a temporary name (``<name>.<random>.part``), flushed to
disk and then renamed in the same directory. The attachments come before the envelope. A reader
finds only complete files: it ignores everything that does not have exactly the name of an
envelope, so it never sees half an envelope, and it finds the attachments of every envelope it
sees (as far as the file system keeps the order, see the technical documentation, "Annotations
and limits of renaming"). File names are made only of the message id (a UUID) and the number.

Acknowledging removes the envelope first, then its attachments.

``clean_up`` removes what an interrupted ``send`` leaves behind: unfinished files (``*.part``)
and attachments without an envelope, as soon as they are older than the period given.
"""

import errno
import os
import re
import secrets
import stat
from collections.abc import Iterator, Sequence
from contextlib import contextmanager
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Annotated

from pydantic import Field

from pipwerk_relaycore.envelope import Envelope, verify_attachments
from pipwerk_relaycore.errors import (
    EnvelopeRejected,
    RejectionReason,
    WayError,
    WayTooLargeError,
    WayUnavailableError,
)
from pipwerk_relaycore.way import (
    FaultyEnvelope,
    Incoming,
    ReceivedEnvelope,
    Way,
    WaySettings,
)

_ID = r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
_ID_ONLY = re.compile(_ID)
_ENVELOPE_FILE = re.compile(rf"({_ID})\.json")
_ATTACHMENT_FILE = re.compile(rf"({_ID})\.[0-9]{{1,4}}\.att")
_UNFINISHED_FILE = re.compile(rf"{_ID}(?:\.json|\.[0-9]{{1,4}}\.att)\.[0-9a-f]{{16}}\.part")
_NO_FOLLOW = getattr(os, "O_NOFOLLOW", 0)
_BINARY = getattr(os, "O_BINARY", 0)
_CLOSE_ON_EXEC = getattr(os, "O_CLOEXEC", 0)


class FilesSettings(WaySettings):
    """Own settings of the way ``files``."""

    directory: Annotated[str, Field(min_length=1)]


def envelope_file_name(message_id: str) -> str:
    return f"{message_id}.json"


def attachment_file_name(message_id: str, number: int) -> str:
    return f"{message_id}.{number}.att"


@contextmanager
def _directory_errors() -> Iterator[None]:
    """Report every error of the file system as "directory not reachable" (repeatable).

    The text names the kind of error, never a path.
    """
    try:
        yield
    except OSError as error:
        kind = errno.errorcode.get(error.errno or 0, "unknown")
        text = f"the directory is not reachable or not usable ({kind})"
        raise WayUnavailableError(text) from None


class FilesWay(Way[FilesSettings]):
    """Envelopes and attachments as files in a directory."""

    settings_model = FilesSettings

    def _directory(self) -> Path:
        path = Path(self.settings.directory)
        if not path.is_dir():
            raise WayUnavailableError("the directory is not reachable (not a directory)")
        return path

    def send(self, envelope: Envelope, attachments: Sequence[bytes]) -> None:
        message = envelope.unverified_body().message
        verify_attachments(message, attachments)
        text = envelope.to_json().encode("utf-8")
        if len(text) > self.settings.max_envelope_bytes:
            raise WayTooLargeError("the envelope is larger than the way allows")
        if any(len(content) > self.settings.max_attachment_bytes for content in attachments):
            raise WayTooLargeError("an attachment is larger than the way allows")
        message_id = str(message.id)
        with _directory_errors():
            directory = self._directory()
            for number, content in enumerate(attachments):
                _write_atomic(directory, attachment_file_name(message_id, number), content)
            _write_atomic(directory, envelope_file_name(message_id), text)

    def read(self, limit: int = 100) -> list[Incoming]:
        with _directory_errors():
            directory = self._directory()
            found: list[tuple[float, str]] = []
            with os.scandir(directory) as entries:
                for entry in entries:
                    match = _ENVELOPE_FILE.fullmatch(entry.name)
                    if match and entry.is_file(follow_symlinks=False):
                        found.append((entry.stat(follow_symlinks=False).st_mtime, match.group(1)))
            found.sort()
            result: list[Incoming] = []
            for modified, message_id in found[: max(limit, 0)]:  # oldest first
                item = self._read_one(directory, message_id, modified)
                if item is not None:
                    result.append(item)
            return result

    def acknowledge(self, token: str) -> None:
        if not _ID_ONLY.fullmatch(token):
            raise WayError("not a token of this way")
        attachment_file = re.compile(rf"{re.escape(token)}\.[0-9]{{1,4}}\.att")
        with _directory_errors():
            directory = self._directory()
            _remove(directory / envelope_file_name(token))
            with os.scandir(directory) as entries:
                names = [entry.name for entry in entries if attachment_file.fullmatch(entry.name)]
            for name in names:
                _remove(directory / name)

    def clean_up(self, older_than: timedelta, now: datetime) -> int:
        cutoff = (now - older_than).timestamp()
        removed = 0
        with _directory_errors():
            directory = self._directory()
            files: list[tuple[str, float]] = []
            with os.scandir(directory) as entries:
                for entry in entries:
                    try:
                        if entry.is_file(follow_symlinks=False):
                            files.append((entry.name, entry.stat(follow_symlinks=False).st_mtime))
                    except FileNotFoundError:
                        continue  # taken away in the meantime
            with_envelope = {
                match.group(1) for name, _ in files if (match := _ENVELOPE_FILE.fullmatch(name))
            }
            for name, modified in files:
                if modified >= cutoff:
                    continue
                attachment = _ATTACHMENT_FILE.fullmatch(name)
                leftover = _UNFINISHED_FILE.fullmatch(name) or (
                    attachment is not None and attachment.group(1) not in with_envelope
                )
                if leftover:
                    _remove(directory / name)
                    removed += 1
        return removed

    def _read_one(self, directory: Path, message_id: str, modified: float) -> Incoming | None:
        arrived = datetime.fromtimestamp(modified, UTC)

        def faulty(reason: RejectionReason) -> FaultyEnvelope:
            return FaultyEnvelope(token=message_id, reason=reason, modified_at=arrived)

        try:
            raw = _read_file(directory / envelope_file_name(message_id), self._limit_envelope())
        except FileNotFoundError:
            return None  # taken away by another reader in the meantime
        except _TooLargeFileError:
            return faulty(RejectionReason.TOO_LARGE)
        try:
            envelope = Envelope.from_json(raw)
            body = envelope.unverified_body()
        except EnvelopeRejected as error:
            return faulty(error.reason)
        if str(body.message.id) != message_id:
            return faulty(RejectionReason.BAD_BODY)
        contents: list[bytes] = []
        for number, declared in enumerate(body.message.attachments):
            if declared.size > self.settings.max_attachment_bytes:
                return faulty(RejectionReason.TOO_LARGE)
            try:
                content = _read_file(
                    directory / attachment_file_name(message_id, number), declared.size
                )
            except FileNotFoundError:
                return faulty(RejectionReason.ATTACHMENT_MISSING)
            except _TooLargeFileError:
                return faulty(RejectionReason.ATTACHMENT_SIZE)
            contents.append(content)
        try:
            verify_attachments(body.message, contents)
        except EnvelopeRejected as error:
            return faulty(error.reason)
        return ReceivedEnvelope(
            token=message_id,
            envelope=envelope,
            attachments=tuple(contents),
            modified_at=arrived,
        )

    def _limit_envelope(self) -> int:
        return self.settings.max_envelope_bytes


class _TooLargeFileError(Exception):
    """A file is larger than allowed (raised before it is read)."""


def _read_file(path: Path, limit: int) -> bytes:
    """Read a regular file of at most ``limit`` bytes; links are not followed."""
    try:
        descriptor = os.open(path, os.O_RDONLY | _NO_FOLLOW | _BINARY | _CLOSE_ON_EXEC)
    except OSError as error:
        if error.errno in (errno.ELOOP, errno.EMLINK):  # a link in place of a file
            raise FileNotFoundError(errno.ENOENT, "not a regular file") from None
        raise
    with os.fdopen(descriptor, "rb") as file:
        info = os.fstat(file.fileno())
        if not stat.S_ISREG(info.st_mode):
            raise FileNotFoundError(errno.ENOENT, "not a regular file")
        if info.st_size > limit:
            raise _TooLargeFileError
        data = file.read(limit + 1)
    if len(data) > limit:
        raise _TooLargeFileError
    return data


def _remove(path: Path) -> None:
    try:
        path.unlink()
    except FileNotFoundError:
        return


def _write_atomic(directory: Path, name: str, content: bytes) -> None:
    """Write a file under a temporary name, flush it and rename it to ``name``."""
    temporary = directory / f"{name}.{secrets.token_hex(8)}.part"
    descriptor = os.open(
        temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | _BINARY | _CLOSE_ON_EXEC, 0o666
    )
    try:
        with os.fdopen(descriptor, "wb") as file:
            file.write(content)
            file.flush()
            os.fsync(file.fileno())
        os.replace(temporary, directory / name)
    except BaseException:
        temporary.unlink(missing_ok=True)
        raise
    _flush_directory(directory)


def _flush_directory(directory: Path) -> None:
    """Flush the entries of the directory to disk where the system allows it."""
    try:
        descriptor = os.open(directory, os.O_RDONLY)
    except OSError:
        return  # not possible on every system; the rename itself is done
    try:
        os.fsync(descriptor)
    except OSError:
        return  # not possible on every file system; the rename itself is done
    finally:
        os.close(descriptor)
