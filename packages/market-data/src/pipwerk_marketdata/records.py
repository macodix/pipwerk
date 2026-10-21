"""Public value objects of the library (independent of the database tables)."""

from dataclasses import dataclass
from datetime import datetime
from enum import StrEnum


@dataclass(frozen=True, slots=True)
class Candle:
    """A candle with bid prices. ``time`` is the opening moment (UTC)."""

    time: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int | None = None
    spread: int | None = None
    """Spread in points, when the source delivered it."""


@dataclass(frozen=True, slots=True)
class Tick:
    """A tick. ``time`` is the moment (UTC) with milliseconds."""

    time: datetime
    bid: float
    ask: float


class Weekday(StrEnum):
    """Weekday names as used in the files; the order is the order of ``datetime.weekday()``."""

    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"

    @property
    def number(self) -> int:
        """0 for Monday to 6 for Sunday."""
        return list(Weekday).index(self)


@dataclass(frozen=True, slots=True)
class TradingSession:
    """A weekly trading session in UTC: on ``weekday`` from ``start_minute`` to ``end_minute``.

    The minutes count from midnight (0 to 1440); ``start_minute`` is less than ``end_minute``.
    """

    weekday: Weekday
    start_minute: int
    end_minute: int


@dataclass(frozen=True, slots=True)
class InstrumentInfo:
    """Data of an instrument at one broker with the moment it was obtained (UTC)."""

    broker: str
    instrument: str
    acquired_at: datetime
    tick_size: float
    tick_value: float
    tick_value_currency: str
    point: float
    pip: float
    spread: float
    """Usual spread as price difference."""
    min_volume: float
    volume_step: float
    contract_size: float
    swap_long: float
    swap_short: float
    swap_triple_weekday: Weekday
    margin_per_lot: float | None = None


@dataclass(frozen=True, slots=True)
class Interval:
    """A period from ``start`` (included) to ``end`` (excluded), both UTC."""

    start: datetime
    end: datetime


class MissingReason(StrEnum):
    """Why part of a period is missing."""

    NOT_COVERED = "not_covered"
    """No import covers this part."""
    GAP = "gap"
    """Covered by an import, but without the candles or ticks the rules expect."""


@dataclass(frozen=True, slots=True)
class MissingPart:
    """A missing part of a period."""

    start: datetime
    end: datetime
    reason: MissingReason


@dataclass(frozen=True, slots=True)
class Completeness:
    """What exists and what is missing of one series in one period.

    ``present`` and ``missing`` do not overlap and together make up the period asked for.
    Times in which the market is closed (weekend, breaks) belong to ``present``.
    """

    start: datetime
    end: datetime
    present: tuple[Interval, ...]
    missing: tuple[MissingPart, ...]
    uses_trading_hours: bool
    """``True`` if the delivered trading hours were used, ``False`` for the replacement rule."""

    @property
    def complete(self) -> bool:
        return not self.missing


@dataclass(frozen=True, slots=True)
class CompletenessRules:
    """Thresholds of the completeness check (defaults: see technical documentation)."""

    weekend_start_minute: int = 4 * 1440 + 22 * 60
    """Start of the weekend as minute of the week (Monday 00:00 UTC is 0): Friday 22:00."""
    weekend_end_minute: int = 6 * 1440 + 22 * 60
    """End of the weekend as minute of the week: Sunday 22:00."""
    tolerated_missing_candles: int = 1
    """Without trading hours: trading time of up to this many candles may be missing."""
    tolerate_m1_in_hour: bool = True
    """M1 candles missing within one clock hour that has candles are no gap."""
    tick_max_silence_seconds: int = 3600
    """Ticks: no tick for longer than this within the trading time is a gap."""

    def __post_init__(self) -> None:
        week = 7 * 1440
        if not 0 <= self.weekend_start_minute < self.weekend_end_minute <= week:
            raise ValueError("the weekend must lie within one week and end after it starts")
        if self.tolerated_missing_candles < 0:
            raise ValueError("tolerated_missing_candles must not be negative")
        if self.tick_max_silence_seconds <= 0:
            raise ValueError("tick_max_silence_seconds must be positive")


@dataclass(frozen=True, slots=True)
class SeriesOverview:
    """One series in the overview. ``unit`` is a time unit identifier or ``ticks``."""

    broker: str
    instrument: str
    unit: str
    count: int
    first: datetime | None
    last: datetime | None
    covered: tuple[Interval, ...]
    missing: tuple[MissingPart, ...]
    has_trading_hours: bool


@dataclass(frozen=True, slots=True)
class InstrumentOverview:
    """The newest instrument data of one instrument at one broker."""

    broker: str
    instrument: str
    acquired_at: datetime


@dataclass(frozen=True, slots=True)
class Overview:
    series: tuple[SeriesOverview, ...]
    instruments: tuple[InstrumentOverview, ...]


@dataclass(frozen=True, slots=True)
class CandlePage:
    """Candles of one call. ``next_after`` continues the reading, ``None`` if nothing follows."""

    items: tuple[Candle, ...]
    next_after: datetime | None


@dataclass(frozen=True, slots=True)
class TickPage:
    items: tuple[Tick, ...]
    next_after: datetime | None


class RejectReason(StrEnum):
    """Why a row of an import file was rejected."""

    COLUMNS_MISMATCH = "columns_mismatch"
    ENTRY_INVALID = "entry_invalid"
    FIELD_UNKNOWN = "field_unknown"
    FIELD_MISSING = "field_missing"
    VALUE_INVALID = "value_invalid"
    TIME_INVALID = "time_invalid"
    TIME_OUT_OF_RANGE = "time_out_of_range"
    LOCAL_TIME_NOT_EXISTING = "local_time_not_existing"
    TIME_NOT_ASCENDING = "time_not_ascending"
    TIME_DUPLICATE = "time_duplicate"
    PRICE_NOT_POSITIVE = "price_not_positive"
    HIGH_BELOW_OPEN = "high_below_open"
    HIGH_BELOW_LOW = "high_below_low"
    HIGH_BELOW_CLOSE = "high_below_close"
    LOW_ABOVE_OPEN = "low_above_open"
    LOW_ABOVE_CLOSE = "low_above_close"


@dataclass(frozen=True, slots=True)
class RejectedRow:
    """A rejected row. ``row`` is the line number in a CSV file (header is line 1) and the
    1-based position of the entry in a JSON file."""

    row: int
    reason: RejectReason


class FileErrorCode(StrEnum):
    """Why a whole file was refused."""

    TOO_LARGE = "too_large"
    TOO_MANY_ROWS = "too_many_rows"
    NOT_DECODABLE = "not_decodable"
    JSON_INVALID = "json_invalid"
    DOCUMENT_INVALID = "document_invalid"
    HEADER_INVALID = "header_invalid"
    SERIES_INVALID = "series_invalid"
    TIMEZONE_UNKNOWN = "timezone_unknown"
    PERIOD_INVALID = "period_invalid"
    NO_ROWS = "no_rows"


@dataclass(frozen=True, slots=True)
class ImportResult:
    """Result of an import.

    ``accepted`` counts the rows taken over, ``replaced`` those of them that replaced an
    existing row of the same moment. ``rejected`` lists at most the first
    ``ImportLimits.max_reported_rejections`` rejected rows; ``rejected_count`` counts all.
    ``period_start`` and ``period_end`` span the rows taken over (``None`` if there are none).
    """

    kind: str
    broker: str
    instrument: str
    unit: str | None
    accepted: int
    replaced: int
    period_start: datetime | None
    period_end: datetime | None
    rejected: tuple[RejectedRow, ...]
    rejected_count: int
