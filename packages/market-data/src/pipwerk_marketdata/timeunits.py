"""Time units of candles (M1 to MN1, the identifiers of ``pipwerk_domain``)."""

import calendar
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

TICKS = "ticks"
"""Name of the series of ticks where a time unit would stand."""

CONTRACT = "contract"
"""Name of the instrument data where a time unit would stand (list of series, file names)."""


@dataclass(frozen=True, slots=True)
class TimeUnit:
    """A time unit of candles.

    ``duration`` is ``None`` for the month, whose length varies; ``add`` handles it.
    """

    id: str
    duration: timedelta | None

    def add(self, moment: datetime) -> datetime:
        """The moment one candle of this unit later (one calendar month for MN1)."""
        if self.duration is not None:
            return moment + self.duration
        year, month_index = divmod(moment.year * 12 + moment.month, 12)
        month = month_index + 1
        day = min(moment.day, calendar.monthrange(year, month)[1])
        return moment.replace(year=year, month=month, day=day)


def _minutes(count: int) -> timedelta:
    return timedelta(minutes=count)


_UNITS: tuple[TimeUnit, ...] = (
    *(TimeUnit(f"m{n}", _minutes(n)) for n in (1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30)),
    *(TimeUnit(f"h{n}", timedelta(hours=n)) for n in (1, 2, 3, 4, 6, 8, 12)),
    TimeUnit("d1", timedelta(days=1)),
    TimeUnit("w1", timedelta(weeks=1)),
    TimeUnit("mn1", None),
)

TIME_UNITS: dict[str, TimeUnit] = {unit.id: unit for unit in _UNITS}
"""All time units by identifier, as in MetaTrader 5."""


def time_unit(identifier: str) -> TimeUnit:
    """The time unit with this identifier (lower case); ``ValueError`` if unknown."""
    try:
        return TIME_UNITS[identifier]
    except KeyError:
        raise ValueError("unknown time unit") from None


def require_utc(moment: datetime) -> datetime:
    """Convert an aware moment to UTC; ``ValueError`` for a moment without time zone.

    A moment whose UTC time lies beyond the range of ``datetime`` becomes the nearest bound of
    that range (a bound is outside the supported times, so no row matches it).
    """
    offset = moment.utcoffset() if moment.tzinfo is not None else None
    if offset is None:
        raise ValueError("a moment needs a time zone")
    try:
        return moment.astimezone(UTC)
    except OverflowError:
        return (
            datetime.min.replace(tzinfo=UTC)
            if offset > timedelta(0)
            else datetime.max.replace(tzinfo=UTC)
        )
