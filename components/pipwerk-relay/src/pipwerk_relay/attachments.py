"""The directory for attachments: the attachments of the messages in the queue (specification E6).

An attachment lies in a file ``<entry key>.<number>.att``. The entry key is a UUID that the relay
makes up for each queue entry; the number counts from 0 in the order of ``message.attachments``.
Names of attachments, ids of messages and addresses do not occur in any file name (Abschnitt 7).

Writing: every file is written under a temporary name (``<name>.<random>.part``), flushed to disk
and then renamed. The attachments of an entry are written before the entry is stored in the
database, so an entry never lacks its files; a crash in between leaves files without an entry,
which ``clean_orphans`` removes after a period.
"""

import contextlib
import os
import re
import secrets
from collections.abc import Sequence
from datetime import datetime, timedelta
from pathlib import Path

from pipwerk_relay.errors import AttachmentLost

_KEY = r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
_KEY_ONLY = re.compile(_KEY)
_ATTACHMENT_FILE = re.compile(rf"({_KEY})\.[0-9]{{1,4}}\.att")
_UNFINISHED_FILE = re.compile(rf"{_KEY}\.[0-9]{{1,4}}\.att\.[0-9a-f]{{16}}\.part")
_NO_FOLLOW = getattr(os, "O_NOFOLLOW", 0)
_BINARY = getattr(os, "O_BINARY", 0)
_CLOSE_ON_EXEC = getattr(os, "O_CLOEXEC", 0)


def attachment_file_name(entry_key: str, number: int) -> str:
    return f"{entry_key}.{number}.att"


class AttachmentStore:
    """The directory for attachments."""

    def __init__(self, directory: Path) -> None:
        self._directory = directory

    def ensure_directory(self) -> None:
        """Create the directory if it does not exist (readable for the current user only)."""
        self._directory.mkdir(mode=0o700, parents=True, exist_ok=True)

    def write(self, entry_key: str, contents: Sequence[bytes]) -> None:
        """Write the attachments of an entry; on a failure nothing of it remains."""
        _check_key(entry_key)
        try:
            for number, content in enumerate(contents):
                self._write_atomic(attachment_file_name(entry_key, number), content)
        except BaseException:
            self.remove(entry_key)
            raise

    def read(self, entry_key: str, count: int) -> list[bytes]:
        """Read the ``count`` attachments of an entry; raises ``AttachmentLost``."""
        _check_key(entry_key)
        result: list[bytes] = []
        for number in range(count):
            path = self._directory / attachment_file_name(entry_key, number)
            try:
                descriptor = os.open(path, os.O_RDONLY | _NO_FOLLOW | _BINARY | _CLOSE_ON_EXEC)
                with os.fdopen(descriptor, "rb") as file:  # a link is not followed
                    result.append(file.read())
            except OSError:
                raise AttachmentLost("an attachment of a queued message is missing") from None
        return result

    def remove(self, entry_key: str) -> None:
        """Remove the files of an entry (found in the listing of the directory)."""
        _check_key(entry_key)
        mine = re.compile(rf"{re.escape(entry_key)}\.[0-9]{{1,4}}\.att(\.[0-9a-f]{{16}}\.part)?")
        with contextlib.suppress(FileNotFoundError):
            with os.scandir(self._directory) as entries:
                names = [entry.name for entry in entries if mine.fullmatch(entry.name)]
            for name in names:
                (self._directory / name).unlink(missing_ok=True)

    def clean_orphans(self, known: set[str], older_than: timedelta, now: datetime) -> int:
        """Remove files of entries that are not in the queue and unfinished files, when old.

        ``known`` holds the keys of the entries in the queue. Returns the number removed.
        """
        cutoff = (now - older_than).timestamp()
        removed = 0
        with contextlib.suppress(FileNotFoundError):
            with os.scandir(self._directory) as entries:
                found: list[tuple[str, float]] = []
                for entry in entries:
                    try:
                        if entry.is_file(follow_symlinks=False):
                            found.append((entry.name, entry.stat(follow_symlinks=False).st_mtime))
                    except FileNotFoundError:
                        continue
            for name, modified in found:
                if modified >= cutoff:
                    continue
                attachment = _ATTACHMENT_FILE.fullmatch(name)
                if _UNFINISHED_FILE.fullmatch(name) or (
                    attachment is not None and attachment.group(1) not in known
                ):
                    (self._directory / name).unlink(missing_ok=True)
                    removed += 1
        return removed

    def _write_atomic(self, name: str, content: bytes) -> None:
        temporary = self._directory / f"{name}.{secrets.token_hex(8)}.part"
        descriptor = os.open(
            temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | _BINARY | _CLOSE_ON_EXEC, 0o600
        )
        try:
            with os.fdopen(descriptor, "wb") as file:
                file.write(content)
                file.flush()
                os.fsync(file.fileno())
            os.replace(temporary, self._directory / name)
        except BaseException:
            temporary.unlink(missing_ok=True)
            raise
        self._flush_directory()

    def _flush_directory(self) -> None:
        """Flush the entries of the directory to disk where the system allows it."""
        try:
            descriptor = os.open(self._directory, os.O_RDONLY)
        except OSError:
            return
        try:
            os.fsync(descriptor)
        except OSError:
            return
        finally:
            os.close(descriptor)


def _check_key(entry_key: str) -> None:
    if not _KEY_ONLY.fullmatch(entry_key):
        raise ValueError("not a key of a queue entry")
