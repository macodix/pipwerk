"""Limits against overload."""

from dataclasses import dataclass

DEFAULT_MAX_BYTES = 32 * 1024 * 1024
DEFAULT_MAX_ROWS = 500_000
DEFAULT_MAX_REPORTED_REJECTIONS = 1000
DEFAULT_MAX_PAGE_SIZE = 10_000

MAX_INTEGER_VALUE = 2_147_483_647
"""Largest value of ``volume`` and ``spread`` of a candle, in JSON and CSV files (2 ** 31 - 1).

The column ``spread`` is a 32-bit integer, so this value fits into it in every database."""


@dataclass(frozen=True, slots=True)
class ImportLimits:
    """Limits of one import file. The defaults hold for every caller that passes none."""

    max_bytes: int = DEFAULT_MAX_BYTES
    """Largest size of a file in bytes (default 32 MiB)."""
    max_rows: int = DEFAULT_MAX_ROWS
    """Largest number of data rows or entries, rejected ones included (default 500 000)."""
    max_reported_rejections: int = DEFAULT_MAX_REPORTED_REJECTIONS
    """Number of rejected rows listed in the result (default 1000); all are counted."""

    def __post_init__(self) -> None:
        if self.max_bytes <= 0 or self.max_rows <= 0 or self.max_reported_rejections < 0:
            raise ValueError("limits must be positive")
