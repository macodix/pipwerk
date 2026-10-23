"""The names of the files and how they are written (specification backtest 5.4 and 11).

A file is named ``<instrument>_<data>_<from>_<to>.json`` (``file_name``): ``<data>`` is the time
unit (``M1``, ``H1``, ...), ``TICKS`` or ``CONTRACT``; ``<from>`` and ``<to>`` are the limits of
the period in UTC as ``YYYYMMDD``, or ``YYYYMMDDTHHMMSS`` where the time is not midnight.

The name is made only from checked parts: the designation of the instrument (letters, digits
and ``. _ # + -``, starting with a letter or a digit, so it holds no separator of a path and
no ``..``), a time unit of MetaTrader 5 or ``TICKS`` or ``CONTRACT``, and two moments. The
symbol of the broker never enters a name. Files are created only directly in the target
directory.

A file is written atomically (``write_file``): first into a temporary file in the same
directory, then renamed. A file of the same name is replaced; if writing fails, no half file
is left and an existing file stays as it was.
"""

from __future__ import annotations

import contextlib
import os
import re
import tempfile
from datetime import UTC, datetime
from pathlib import Path

from pipwerk_fetch_mt5.errors import FetchError

#: The designation of an instrument as it may stand in a file name.
INSTRUMENT_PATTERN = re.compile(r"[A-Za-z0-9][A-Za-z0-9._#+-]{0,63}")

#: The ``<data>`` part of a name: a time unit of MetaTrader 5 in upper case, ``TICKS``,
#: ``CONTRACT``.
DATA_PATTERN = re.compile(r"[A-Z][A-Z0-9]{1,7}")

_STAMP_PATTERN = re.compile(r"[0-9]{8}(?:T[0-9]{6})?")


def stamp(moment: datetime) -> str:
    """A moment for a file name: ``YYYYMMDD`` at midnight UTC, else ``YYYYMMDDTHHMMSS``."""
    utc = moment.astimezone(UTC)
    if (utc.hour, utc.minute, utc.second, utc.microsecond) == (0, 0, 0, 0):
        return utc.strftime("%Y%m%d")
    return utc.strftime("%Y%m%dT%H%M%S")


def file_name(instrument: str, data: str, start: datetime, end: datetime) -> str:
    """``<instrument>_<data>_<from>_<to>.json``; raises ``ValueError`` for a part that is not
    allowed in a name."""
    first, last = stamp(start), stamp(end)
    if (
        INSTRUMENT_PATTERN.fullmatch(instrument) is None
        or DATA_PATTERN.fullmatch(data) is None
        or _STAMP_PATTERN.fullmatch(first) is None
        or _STAMP_PATTERN.fullmatch(last) is None
    ):
        raise ValueError("a part of the file name is not allowed")
    return f"{instrument}_{data}_{first}_{last}.json"


def write_file(directory: Path, name: str, content: bytes) -> Path:
    """Write ``content`` as ``directory/name`` atomically and return the path.

    ``name`` must be a plain file name (no path). Raises ``FetchError("write_failed")`` if the
    file cannot be written."""
    if name != Path(name).name or name in {"", ".", ".."} or "\x00" in name:
        raise ValueError("not a plain file name")
    target = directory / name
    try:
        descriptor, temporary = tempfile.mkstemp(dir=directory, prefix=".", suffix=".tmp")
    except OSError:
        raise FetchError("write_failed") from None
    try:
        with os.fdopen(descriptor, "wb") as stream:
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        Path(temporary).replace(target)
    except OSError:
        with contextlib.suppress(OSError):
            Path(temporary).unlink()
        raise FetchError("write_failed") from None
    return target
