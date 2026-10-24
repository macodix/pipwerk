"""Completeness check (specification 5.2) as pure functions, without database.

Rules (parameters: ``CompletenessRules``):

* The covered periods of a series are the periods its imports cover. Inside a covered period
  there is no gap: what a file delivers for its period is complete, and a time without candles
  or ticks in it is a time in which the broker did not trade.
* A time without trade is the weekend (Friday 22:00 to Sunday 22:00 UTC, or, if the source
  delivered trading hours, every time outside them) and every day without trade (from 22:00
  UTC of the day before to 22:00 UTC of the day, every year).
* A gap is the part of the time between two covered periods of a series that does not lie in a
  time without trade. A gap reaches from the first to the last trading moment of that time.
  What lies before the first or after the last covered period is not covered (``not_covered``),
  again only where the market is open.
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


def no_trading_days(window: Interval, rules: CompletenessRules) -> list[Interval]:
    """The days without trade (UTC) that touch the window.

    A day reaches from the boundary minute of the day before to the boundary minute of the day
    itself, so the day of 1 January begins on 31 December at 22:00 UTC. 29 February counts in
    leap years only.
    """
    result: list[Interval] = []
    if not rules.no_trading_days:
        return result
    boundary = timedelta(minutes=rules.no_trading_day_boundary_minute)
    # A day of the next year can begin in the last day of this year.
    for year in range(window.start.year, window.end.year + 2):
        for entry in rules.no_trading_days:
            try:
                day = datetime(year, entry.month, entry.day, tzinfo=window.start.tzinfo)
            except ValueError:  # 29 February in a year that is no leap year
                continue
            item = Interval(day - _DAY + boundary, day + boundary)
            if item.end > window.start and item.start < window.end:
                result.append(item)
    return merge(result)


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
    """The part of a period that lies in the trading time: it is neither a time without trade
    (weekend, or outside the trading hours of the source) nor a day without trade."""
    closed = no_trading_days(hole, rules)
    if sessions:
        open_times = merge(intersect(hole, session_times(hole, sessions)))
        return [part for item in open_times for part in subtract(item, closed)]
    return subtract(hole, [*weekends(hole, rules), *closed])


def combine(
    request: Interval,
    covered: Iterable[Interval],
    sessions: list[TradingSession] | None,
    rules: CompletenessRules,
) -> tuple[list[Interval], list[MissingPart]]:
    """Split the request into present and missing parts.

    What the covered periods do not cover is missing only where the market is open (not in a
    time without trade). Between two covered periods the missing part is one gap (reason
    ``gap``, from the first to the last trading moment); before the first and after the last
    covered period each trading part is missing on its own (reason ``not_covered``). A request
    that touches no covered period is missing wholly as ``not_covered``. Returns
    ``(present, missing)``.
    """
    periods = merge(covered)
    missing: list[MissingPart] = []
    for hole in subtract(request, periods):
        parts = trading_parts(hole, sessions, rules)
        if not parts:
            continue
        between = bool(periods) and periods[0].end <= hole.start and hole.end <= periods[-1].start
        if between:
            missing.append(MissingPart(parts[0].start, parts[-1].end, MissingReason.GAP))
        else:
            missing.extend(
                MissingPart(part.start, part.end, MissingReason.NOT_COVERED) for part in parts
            )
    present = subtract(request, [Interval(part.start, part.end) for part in missing])
    return present, missing
