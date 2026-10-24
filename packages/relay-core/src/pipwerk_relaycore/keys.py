"""Keys of connections and the directory for secrets (specification E5, E6, 7).

Every connection has its own secret key. It is a file in the directory for secrets: 32 bytes
from the secure random source, written as 64 hexadecimal characters and a line feed.

Access rights are checked before a key is read and after it is created:

- Linux (every POSIX system): the directory and every file in it belong to the current user and
  are not accessible for group and others (directory: ``0o700``, file: ``0o600`` or ``0o400``).
  A key file is never a link.
- Windows: the owner is the current user or the group Administrators, the access list exists and
  allows access only to the owner, the current user, the system account and the group
  Administrators (``_windows_acl``). A new file inherits the rights of the directory, so the
  operator restricts the directory once.
"""

import hmac
import os
import re
import secrets
import stat
import sys
from pathlib import Path

from pipwerk_relaycore.errors import KeyFileError, SecretsAccessError

KEY_BYTES = 32
MAX_KEY_FILE_BYTES = 4096
_FILE_NAME = re.compile(r"[A-Za-z0-9][A-Za-z0-9._-]{0,127}")
_HEX = re.compile(r"[0-9a-f]+")

_NO_FOLLOW = getattr(os, "O_NOFOLLOW", 0)
_BINARY = getattr(os, "O_BINARY", 0)
_CLOSE_ON_EXEC = getattr(os, "O_CLOEXEC", 0)


class ConnectionKey:
    """The secret key of one connection. The value never appears in ``repr`` or messages."""

    __slots__ = ("_value",)

    def __init__(self, value: bytes) -> None:
        if len(value) < KEY_BYTES:
            raise KeyFileError(f"a key has at least {KEY_BYTES} bytes")
        self._value = bytes(value)

    @classmethod
    def generate(cls) -> ConnectionKey:
        """A new key from the secure random source."""
        return cls(secrets.token_bytes(KEY_BYTES))

    def hmac_sha256(self, data: bytes) -> bytes:
        return hmac.digest(self._value, data, "sha256")

    def to_file_text(self) -> str:
        """The text of the key file."""
        return self._value.hex() + "\n"

    @classmethod
    def from_file_text(cls, text: str) -> ConnectionKey:
        stripped = text.strip()
        if len(stripped) % 2 != 0 or not _HEX.fullmatch(stripped):
            raise KeyFileError("a key file holds lower case hexadecimal characters only")
        return cls(bytes.fromhex(stripped))

    def __repr__(self) -> str:
        return "ConnectionKey(<hidden>)"

    __str__ = __repr__

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, ConnectionKey):
            return NotImplemented
        return hmac.compare_digest(self._value, other._value)

    __hash__ = None  # type: ignore[assignment]  # keys are not hashable on purpose


def _check_posix_stat(result: os.stat_result, what: str, *, directory: bool) -> None:
    if directory and not stat.S_ISDIR(result.st_mode):
        raise SecretsAccessError(f"{what} is not a directory")
    if not directory and not stat.S_ISREG(result.st_mode):
        raise SecretsAccessError(f"{what} is not a regular file")
    if result.st_uid != os.geteuid():
        raise SecretsAccessError(f"{what} does not belong to the current user")
    forbidden = 0o077 if directory else 0o177
    if result.st_mode & forbidden:
        raise SecretsAccessError(f"{what} is accessible for others")


def _check_directory(path: Path) -> None:
    if sys.platform == "win32":  # pragma: no cover - runs on Windows only
        from pipwerk_relaycore import _windows_acl

        if not path.is_dir():
            raise SecretsAccessError("the directory for secrets is not a directory")
        _windows_acl.check_private(path, directory=True)
        return
    try:
        result = os.stat(path)
    except OSError as error:
        raise SecretsAccessError("the directory for secrets is not accessible") from error
    _check_posix_stat(result, "the directory for secrets", directory=True)


def _check_file(path: Path) -> None:
    """Check a file without following a link."""
    if sys.platform == "win32":  # pragma: no cover - runs on Windows only
        from pipwerk_relaycore import _windows_acl

        if path.is_symlink() or not path.is_file():
            raise SecretsAccessError(f"'{path.name}' is not a regular file")
        _windows_acl.check_private(path, directory=False)
        return
    try:
        result = os.lstat(path)
    except OSError as error:
        raise SecretsAccessError(f"'{path.name}' is not accessible") from error
    _check_posix_stat(result, f"'{path.name}'", directory=False)


class SecretsDirectory:
    """The directory for secrets: keys of connections and other secret files."""

    def __init__(self, path: str | os.PathLike[str]) -> None:
        self._path = Path(path)

    def check(self) -> None:
        """Check the directory and every file in it; raises ``SecretsAccessError``.

        The relay calls this at its start and does not start if it fails.
        """
        _check_directory(self._path)
        try:
            names = sorted(os.listdir(self._path))
        except OSError as error:
            raise SecretsAccessError("the directory for secrets cannot be read") from error
        for name in names:
            _check_file(self._path / name)

    def _file(self, name: str) -> Path:
        if not _FILE_NAME.fullmatch(name):
            raise KeyFileError("not a valid name of a key file")
        return self._path / name

    def new_key(self, name: str) -> ConnectionKey:
        """Create a key file with a new key; an existing file is never overwritten."""
        path = self._file(name)
        _check_directory(self._path)
        key = ConnectionKey.generate()
        try:
            descriptor = os.open(
                path,
                os.O_WRONLY | os.O_CREAT | os.O_EXCL | _NO_FOLLOW | _BINARY | _CLOSE_ON_EXEC,
                0o600,
            )
        except FileExistsError as error:
            raise KeyFileError(f"the key file '{name}' exists already") from error
        except OSError as error:
            raise SecretsAccessError(f"the key file '{name}' cannot be created") from error
        try:
            with os.fdopen(descriptor, "wb") as file:
                file.write(key.to_file_text().encode("ascii"))
                file.flush()
                os.fsync(file.fileno())
            _check_file(path)
        except BaseException:
            path.unlink(missing_ok=True)
            raise
        return key

    def load_key(self, name: str) -> ConnectionKey:
        """Read a key file after checking its rights and those of the directory."""
        path = self._file(name)
        _check_directory(self._path)
        if not os.path.lexists(path):
            raise KeyFileError(f"the key file '{name}' does not exist")
        _check_file(path)
        try:
            descriptor = os.open(path, os.O_RDONLY | _NO_FOLLOW | _BINARY | _CLOSE_ON_EXEC)
        except FileNotFoundError as error:
            raise KeyFileError(f"the key file '{name}' does not exist") from error
        except OSError as error:
            raise SecretsAccessError(f"the key file '{name}' cannot be read") from error
        with os.fdopen(descriptor, "rb") as file:
            if sys.platform != "win32":
                _check_posix_stat(os.fstat(file.fileno()), f"'{name}'", directory=False)
            data = file.read(MAX_KEY_FILE_BYTES + 1)
        if len(data) > MAX_KEY_FILE_BYTES:
            raise KeyFileError(f"the key file '{name}' is too large")
        try:
            text = data.decode("ascii")
        except UnicodeDecodeError as error:
            raise KeyFileError(f"the key file '{name}' is not a key") from error
        try:
            return ConnectionKey.from_file_text(text)
        except KeyFileError as error:
            raise KeyFileError(f"the key file '{name}' does not hold a valid key") from error
