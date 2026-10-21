"""Completeness check (specification 5.2) as pure functions, without database.

Rules (thresholds: ``CompletenessRules``):

* A part of the period no import covers is missing (``not_covered``).
* Inside covered parts, a hole between candles (or between the edge of the covered part and the
  first or last candle) is a gap, if it lies in the trading time:

  - With delivered trading hours: any hole in the trading hours.
  - Without trading hours: the trading time of the hole (the hole without the weekend, Friday
    22:00 to Sunday 22:00 UTC) is longer than the tolerated number of candles (default 1; for a
    hole without weekend that is: more than twice the duration of the time unit lies between
    the opening moments of two candles).

  A gap reaches from the first to the last trading moment of the hole.

* M1 candles missing between two candles within one clock hour that has candles are no gap.
* Ticks: a hole in the trading time (trading hours, or outside the weekend) longer than the
  longest silence (default one hour) is a gap.
"""

from collections.abc import Iterable
from datetime import datetime, timedelta

from pipwerk_marketdata.records import (
    CompletenessRules,
    Interval,
    MissingPart,
    MissingReason,
    TradingSession,
)
from pipwerk_marketdata.timeunits import TimeUnit

_MINUTE = timedelta(minutes=1)
_HOUR = timedelta(hours=1)
_DAY = timedelta(days=1)


def merge(intervals: Iterable[Interval]) -> list[Interval]:
    """Sort and join overlapping or touching intervals; empty ones are dropped."""
    result: list[Interval] = []
    for item in sorted(intervals, key=lambda value: value.start):
        if item.start >= item.end:
            continue
        if result and item.start <= result[-1].end:
            if item.end > result[-1].end:
                result[-1] = Interval(result[-1].start, item.end)
        else:
            result.append(item)
    return result


def subtract(base: Interval, removed: Iterable[Interval]) -> list[Interval]:
    """The parts of ``base`` not covered by ``removed``."""
    result: list[Interval] = []
    pointer = base.start
    for item in merge(removed):
        if item.end <= pointer:
            continue
        if item.start >= base.end:
            break
        if item.start > pointer:
            result.append(Interval(pointer, item.start))
        pointer = max(pointer, item.end)
    if pointer < base.end:
        result.append(Interval(pointer, base.end))
    return result


def intersect(base: Interval, kept: Iterable[Interval]) -> list[Interval]:
    """The parts of ``base`` that lie in ``kept``."""
    result: list[Interval] = []
    for item in merge(kept):
        start, end = max(base.start, item.start), min(base.end, item.end)
        if start < end:
            result.append(Interval(start, end))
    return result


def _midnight(moment: datetime) -> datetime:
    return moment.replace(hour=0, minute=0, second=0, microsecond=0)


def weekends(window: Interval, rules: CompletenessRules) -> list[Interval]:
    """Weekends (UTC) that touch the window."""
    result: list[Interval] = []
    monday = _midnight(window.start) - timedelta(days=window.start.weekday())
    while monday < window.end:
        result.append(
            Interval(
                monday + timedelta(minutes=rules.weekend_start_minute),
                monday + timedelta(minutes=rules.weekend_end_minute),
            )
        )
        monday += timedelta(weeks=1)
    return result


def session_times(window: Interval, sessions: Iterable[TradingSession]) -> list[Interval]:
    """Trading time of the weekly sessions (UTC) that touches the window."""
    pattern = list(sessions)
    result: list[Interval] = []
    day = _midnight(window.start)
    while day < window.end:
        for session in pattern:
            if session.weekday.number == day.weekday():
                result.append(
                    Interval(
                        day + timedelta(minutes=session.start_minute),
                        day + timedelta(minutes=session.end_minute),
                    )
                )
        day += _DAY
    return result


def trading_parts(
    hole: Interval, sessions: list[TradingSession] | None, rules: CompletenessRules
) -> list[Interval]:
    """The part of a hole that lies in the trading time."""
    if sessions:
        return merge(intersect(hole, session_times(hole, sessions)))
    return subtract(hole, weekends(hole, rules))


def _tolerated_length(unit: TimeUnit, hole: Interval, rules: CompletenessRules) -> timedelta:
    """How much trading time may be missing without trading hours: the tolerated candles."""
    limit = hole.start
    for _ in range(rules.tolerated_missing_candles):
        limit = unit.add(limit)
    return limit - hole.start


def _hour_start(moment: datetime) -> datetime:
    return moment.replace(minute=0, second=0, microsecond=0)


def _m1_in_hour(hole: Interval, before: datetime | None, after: datetime | None) -> bool:
    """M1: the hole lies in one clock hour that has a candle before or after the hole."""
    if before is None or after is None:
        return False
    hour = _hour_start(hole.start)
    if _hour_start(hole.end - timedelta(microseconds=1)) != hour:
        return False
    return before >= hour or after < hour + _HOUR


def candle_gaps(
    opens: Iterable[datetime],
    unit: TimeUnit,
    window: Interval,
    sessions: list[TradingSession] | None,
    rules: CompletenessRules,
) -> list[Interval]:
    """Gaps of a series of candles inside ``window`` (which lies in one covered part).

    ``opens`` are the opening moments in ascending order.
    """
    gaps: list[Interval] = []
    pointer = window.start
    previous: datetime | None = None

    def check(hole: Interval, after: datetime | None) -> None:
        parts = trading_parts(hole, sessions, rules)
        if not parts:
            return
        if sessions is None:
            total = sum((part.end - part.start for part in parts), timedelta())
            if total <= _tolerated_length(unit, hole, rules):
                return
        if rules.tolerate_m1_in_hour and unit.id == "m1" and _m1_in_hour(hole, previous, after):
            return
        # one gap from the first to the last trading moment of the hole
        gaps.append(Interval(parts[0].start, parts[-1].end))

    for opened in opens:
        end = unit.add(opened)
        if end <= pointer:
            continue
        if opened >= window.end:
            break
        if opened > pointer:
            check(Interval(pointer, opened), opened)
        pointer = max(pointer, end)
        previous = opened
    if pointer < window.end:
        check(Interval(pointer, window.end), None)
    return merge(gaps)


def tick_gaps(
    moments: Iterable[datetime],
    window: Interval,
    sessions: list[TradingSession] | None,
    rules: CompletenessRules,
) -> list[Interval]:
    """Gaps of a series of ticks inside ``window``; ``moments`` are in ascending order."""
    silence = timedelta(seconds=rules.tick_max_silence_seconds)
    gaps: list[Interval] = []
    pointer = window.start

    def check(hole: Interval) -> None:
        gaps.extend(
            part for part in trading_parts(hole, sessions, rules) if part.end - part.start > silence
        )

    for moment in moments:
        if moment < pointer:
            continue
        if moment >= window.end:
            break
        if moment > pointer:
            check(Interval(pointer, moment))
        pointer = moment
    if pointer < window.end:
        check(Interval(pointer, window.end))
    return merge(gaps)


def combine(
    request: Interval,
    covered: Iterable[Interval],
    gaps: Iterable[Interval],
    sessions: list[TradingSession] | None,
    rules: CompletenessRules,
) -> tuple[list[Interval], list[MissingPart]]:
    """Split the request into present and missing parts.

    ``gaps`` must lie inside ``covered`` parts. What no import covers is missing only where
    the market is open (trading hours, or outside the weekend). Returns ``(present, missing)``.
    """
    uncovered = merge(
        part for hole in subtract(request, covered) for part in trading_parts(hole, sessions, rules)
    )
    missing = sorted(
        [MissingPart(item.start, item.end, MissingReason.NOT_COVERED) for item in uncovered]
        + [MissingPart(item.start, item.end, MissingReason.GAP) for item in gaps],
        key=lambda part: part.start,
    )
    present = subtract(request, [Interval(part.start, part.end) for part in missing])
    return present, missing
