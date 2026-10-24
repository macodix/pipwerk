"""The directories of the settings (specification 5.7): defaults, checks and the use of a folder.

Three settings name a directory on the computer of the backend: the storage directory (kept
files, 5.6), the import directory (files that the import reads directly, 5.3) and the export
directory (the preset place of future exports). Each is an absolute path. Without a stored value
a default per operating system applies, built like the object directory of pipwerk Studio from
where the startup configuration was found (``ConfigOrigin``):

| Operating system | Startup configuration found in | Default of ``<name>`` |
| --- | --- | --- |
| POSIX | system-wide location | ``/var/lib/pipwerk/replay/<name>`` |
| POSIX | user location or ``-c`` | ``$HOME/.local/share/pipwerk/replay/<name>`` |
| Windows | system-wide location | ``%PROGRAMDATA%\\pipwerk\\replay\\<name>`` |
| Windows | user location or ``-c`` | ``%LOCALAPPDATA%\\pipwerk\\replay\\<name>`` |

``<name>`` is ``storage``, ``import`` or ``export``. A needed environment variable that is unset,
empty or not absolute leaves the default undetermined (``None``): the directory is "not set".

``check_directory`` is the check when a value is saved: absolute path, the directory exists or
can be created (it is created), and it is writable (storage, export) or readable (import).
"""

from __future__ import annotations

import os
import tempfile
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Literal, get_args

from pipwerk_replay.config import ConfigOrigin

#: The three directories of the settings.
DirectoryKind = Literal["storage", "import", "export"]

DIRECTORY_KINDS: tuple[DirectoryKind, ...] = get_args(DirectoryKind)

#: Longest accepted path (the length of the database column).
MAX_DIRECTORY_LENGTH = 4096

#: Base of the default directories of a system-wide installation on POSIX systems.
_POSIX_SYSTEM_DATA_DIR = Path("/var/lib/pipwerk")

#: Why a directory is refused when it is saved. The words are the ``type`` of the error place
#: of the answer (HTTP 422).
DirectoryProblem = Literal[
    "not_absolute", "not_a_directory", "cannot_be_created", "not_writable", "not_readable"
]


class InvalidDirectoryError(ValueError):
    """A directory that is to be saved is refused; ``problem`` tells why."""

    def __init__(self, problem: DirectoryProblem) -> None:
        super().__init__(problem)
        self.problem: DirectoryProblem = problem


@dataclass(frozen=True)
class DirectorySetting:
    """A directory in force. ``path`` is ``None`` if nothing is stored and the default cannot be
    determined; ``is_default`` tells that nothing is stored and the default applies."""

    path: Path | None
    is_default: bool


def _absolute_environment_path(environ: Mapping[str, str], name: str) -> Path | None:
    value = environ.get(name, "")
    if not value:
        return None
    path = Path(value)
    return path if path.is_absolute() else None


def default_directory(
    kind: DirectoryKind,
    origin: ConfigOrigin,
    *,
    windows: bool | None = None,
    environ: Mapping[str, str] | None = None,
) -> Path | None:
    """The default of a directory (see the module description), or ``None``. ``windows`` and
    ``environ`` default to the running system; only tests pass others."""
    use_windows = os.name == "nt" if windows is None else windows
    variables = os.environ if environ is None else environ
    if use_windows:
        base = _absolute_environment_path(
            variables, "PROGRAMDATA" if origin == "system" else "LOCALAPPDATA"
        )
        return None if base is None else base.joinpath("pipwerk", "replay", kind)
    if origin == "system":
        return _POSIX_SYSTEM_DATA_DIR.joinpath("replay", kind)
    home = _absolute_environment_path(variables, "HOME")
    return None if home is None else home.joinpath(".local", "share", "pipwerk", "replay", kind)


def parse_absolute(value: str) -> Path | None:
    """``value`` as an absolute path, ``None`` if it is not one (empty, too long, with a
    control character, or relative)."""
    if (
        not value
        or len(value) > MAX_DIRECTORY_LENGTH
        or any(ord(character) < 32 or ord(character) == 127 for character in value)
    ):
        return None
    path = Path(value)
    return path if path.is_absolute() else None


def check_directory(value: str, kind: DirectoryKind) -> Path:
    """Check a directory that is to be saved and return it as a path.

    It must be an absolute path; the directory exists or is created (with the directories above
    it); a storage or export directory must be writable (a file without a name is created in it
    and closed again, nothing remains), an import directory must be readable (it is only read,
    never written). ``InvalidDirectoryError`` says which check failed."""
    path = parse_absolute(value)
    if path is None:
        raise InvalidDirectoryError("not_absolute")
    try:
        if not path.exists():
            path.mkdir(parents=True, exist_ok=True)
    except OSError:
        raise InvalidDirectoryError("cannot_be_created") from None
    if not path.is_dir():
        raise InvalidDirectoryError("not_a_directory")
    if kind == "import":
        if not _readable(path):
            raise InvalidDirectoryError("not_readable")
    elif not _writable(path):
        raise InvalidDirectoryError("not_writable")
    return path


def _readable(path: Path) -> bool:
    try:
        with os.scandir(path):
            return True
    except OSError:
        return False


def _writable(path: Path) -> bool:
    try:
        with tempfile.TemporaryFile(dir=path):
            return True
    except OSError:
        return False
