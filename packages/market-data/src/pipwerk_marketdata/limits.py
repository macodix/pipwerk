"""Limits against overload."""

from dataclasses import dataclass
from datetime import UTC, datetime

DEFAULT_MAX_BYTES = 32 * 1024 * 1024
DEFAULT_MAX_ROWS = 500_000
DEFAULT_MAX_REPORTED_REJECTIONS = 1000
DEFAULT_MAX_PAGE_SIZE = 10_000

MAX_INTEGER_VALUE = 2_147_483_647
"""Largest value of ``volume`` and ``spread`` of a candle, in JSON and CSV files (2 ** 31 - 1).

The column ``spread`` is a 32-bit integer, so this value fits into it in every database."""

MIN_MOMENT = datetime(1970, 1, 1, tzinfo=UTC)
"""Earliest moment of a candle, tick, period or instrument datum (included): 1970-01-01T00:00:00Z.

MetaTrader 5 counts its times in seconds from this moment, so no source has an earlier time."""

MAX_MOMENT = datetime(2100, 1, 1, tzinfo=UTC)
"""Bound of the supported times (not included for a candle, tick or datum; a period and a request
may end at it): 2100-01-01T00:00:00Z.

The year lies far beyond every series of prices. Because of it, adding the duration of a time
unit or a millisecond to a supported moment never leaves the range of ``datetime``."""

_KIB = 1024
_MIB = 1024 * _KIB
_GIB = 1024 * _MIB


def in_supported_range(moment: datetime) -> bool:
    """``True`` if ``MIN_MOMENT <= moment < MAX_MOMENT`` (``moment`` aware)."""
    return MIN_MOMENT <= moment < MAX_MOMENT


def format_size(size: int) -> str:
    """A size in bytes as a user reads it: ``32 MiB``, ``1.5 GiB``, ``512 KiB``, ``100 bytes``.

    The unit is the largest of KiB, MiB and GiB in which the size is at least 1; at most one
    decimal place, and none if the size is a whole number of that unit."""
    for unit, name in ((_GIB, "GiB"), (_MIB, "MiB"), (_KIB, "KiB")):
        if size >= unit:
            value = size / unit
            return f"{value:.0f} {name}" if size % unit == 0 else f"{value:.1f} {name}"
    return f"{size} bytes"


@dataclass(frozen=True, slots=True)
class ImportLimits:
    """Limits of one import file. The defaults hold for every caller that passes none.

    There is no limit for the number of files or the total size of an import process
    (specification 5.3)."""

    max_bytes: int = DEFAULT_MAX_BYTES
    """Largest size of a file in bytes (default 32 MiB)."""
    max_rows: int = DEFAULT_MAX_ROWS
    """Largest number of data rows or entries, rejected ones included (default 500 000)."""
    max_reported_rejections: int = DEFAULT_MAX_REPORTED_REJECTIONS
    """Number of rejected rows listed in the result (default 1000); all are counted."""

    def __post_init__(self) -> None:
        if self.max_bytes <= 0 or self.max_rows <= 0 or self.max_reported_rejections < 0:
            raise ValueError("limits must be positive")
