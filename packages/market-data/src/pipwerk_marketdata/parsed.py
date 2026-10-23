"""Result of reading a file, before anything is written, and checks shared by the formats."""

import math
from dataclasses import dataclass, field, replace
from datetime import datetime

from pipwerk_marketdata.errors import ImportFileError
from pipwerk_marketdata.limits import ImportLimits
from pipwerk_marketdata.records import (
    Candle,
    FileErrorCode,
    InstrumentInfo,
    Interval,
    RejectedRow,
    RejectReason,
    Tick,
    TradingSession,
)
from pipwerk_marketdata.timeunits import CONTRACT, TICKS, time_unit

KIND_CANDLES = "candles"
KIND_TICKS = "ticks"
KIND_INSTRUMENT = "instrument"

MAX_NAME_LENGTH = 128


@dataclass(slots=True)
class ParsedImport:
    """What a file contains after the checks of its rows."""

    kind: str
    broker: str
    instrument: str
    unit: str | None
    candles: list[Candle] = field(default_factory=list)
    ticks: list[Tick] = field(default_factory=list)
    info: InstrumentInfo | None = None
    declared_period: Interval | None = None
    trading_hours: list[TradingSession] | None = None
    rejected: list[RejectedRow] = field(default_factory=list)
    rejected_count: int = 0

    @property
    def series_unit(self) -> str | None:
        """The unit in the table of series (time unit or ``ticks``), ``None`` for instruments."""
        if self.kind == KIND_TICKS:
            return TICKS
        return self.unit


class Rejections:
    """Collects rejected rows and checks the order of the moments of the accepted rows."""

    def __init__(self, limits: ImportLimits) -> None:
        self._limit = limits.max_reported_rejections
        self.rows: list[RejectedRow] = []
        self.count = 0
        self._last: datetime | None = None

    def reject(self, row: int, reason: RejectReason) -> None:
        self.count += 1
        if len(self.rows) < self._limit:
            self.rows.append(RejectedRow(row, reason))

    def accept_time(self, row: int, moment: datetime) -> bool:
        """Check that ``moment`` follows the last accepted moment; reject the row if not."""
        if self._last is not None:
            if moment == self._last:
                self.reject(row, RejectReason.TIME_DUPLICATE)
                return False
            if moment < self._last:
                self.reject(row, RejectReason.TIME_NOT_ASCENDING)
                return False
        self._last = moment
        return True


def candle_violation(open_: float, high: float, low: float, close: float) -> RejectReason | None:
    """The first violated relation between the four prices of a candle, ``None`` if consistent."""
    if high < open_:
        return RejectReason.HIGH_BELOW_OPEN
    if high < low:
        return RejectReason.HIGH_BELOW_LOW
    if high < close:
        return RejectReason.HIGH_BELOW_CLOSE
    if low > open_:
        return RejectReason.LOW_ABOVE_OPEN
    if low > close:
        return RejectReason.LOW_ABOVE_CLOSE
    return None


def content_data(parsed: ParsedImport) -> str:
    """The data a parsed file holds: time unit identifier, ``ticks`` or ``contract``."""
    if parsed.kind == KIND_INSTRUMENT:
        return CONTRACT
    if parsed.kind == KIND_TICKS:
        return TICKS
    return parsed.unit or ""


def with_names(
    parsed: ParsedImport, broker: str | None = None, instrument: str | None = None
) -> ParsedImport:
    """The same content for another broker and instrument (those of an import process or of
    the caller replace the ones named in a JSON file); ``ImportFileError`` if a name is not
    usable."""
    broker = parsed.broker if broker is None else broker
    instrument = parsed.instrument if instrument is None else instrument
    check_series_names(broker, instrument, parsed.unit, candles=parsed.kind == KIND_CANDLES)
    info = (
        replace(parsed.info, broker=broker, instrument=instrument)
        if parsed.info is not None
        else None
    )
    return replace(parsed, broker=broker, instrument=instrument, info=info)


def is_finite(value: float) -> bool:
    return math.isfinite(value)


def check_series_names(broker: str, instrument: str, unit: str | None, *, candles: bool) -> None:
    """Check the names that identify a series; ``ImportFileError`` if one is not usable."""
    for name in (broker, instrument):
        if (
            not name
            or len(name) > MAX_NAME_LENGTH
            or name != name.strip()
            or any(ord(char) < 32 or ord(char) == 127 for char in name)
        ):
            raise ImportFileError(
                FileErrorCode.SERIES_INVALID,
                "Broker and instrument need 1 to 128 characters, no control characters and "
                "no space at the beginning or end.",
            )
    if candles:
        try:
            time_unit(unit or "")
        except ValueError:
            raise ImportFileError(
                FileErrorCode.SERIES_INVALID, "The time unit is not known."
            ) from None
