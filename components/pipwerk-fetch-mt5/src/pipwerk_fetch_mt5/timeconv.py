"""Conversion between the server time of the broker and UTC (specification backtest 5.1).

MetaTrader 5 delivers the server time of the broker: a wall clock time without a time zone.
The program converts it to UTC with the IANA time zone of its startup configuration
(``[broker] server_time_zone``). The rules are those of the import:

- A wall clock time that occurs twice because the clocks are put back counts as the earlier
  one (``fold=0``).
- A wall clock time that does not exist because the clocks are put forward cannot be
  converted. ``server_to_utc`` returns ``None``; the caller leaves the row out and reports it.

Server times are naive ``datetime`` values (no ``tzinfo``) in the wall clock of the broker;
UTC times are aware ``datetime`` values with ``timezone.utc``.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

from pipwerk_fetch_mt5.gateway import RawSession, Weekday


def server_to_utc(server_time: datetime, zone: ZoneInfo) -> datetime | None:
    """The UTC time of a server time, or ``None`` if the wall clock time does not exist."""
    if server_time.tzinfo is not None:
        raise ValueError("a server time has no time zone")
    local = server_time.replace(tzinfo=zone, fold=0)
    utc = local.astimezone(UTC)
    if utc.astimezone(zone).replace(tzinfo=None) != server_time:
        return None  # the clocks jumped over this time
    return utc


def utc_to_server(utc_time: datetime, zone: ZoneInfo) -> datetime:
    """The server time (wall clock of the broker, naive) of an aware UTC time."""
    if utc_time.tzinfo is None:
        raise ValueError("a UTC time has a time zone")
    return utc_time.astimezone(zone).replace(tzinfo=None)


@dataclass(frozen=True)
class ServerTime:
    """What a server time means in UTC.

    ``first`` is the UTC time by the rule of the import (``fold=0``). If the wall clock time
    does not exist (``exists`` is false) it is the nominal time: the one the clock before the
    jump would have for it; it only decides which step of a read owns the row. ``second`` is
    the UTC time of the later occurrence if the wall clock time occurs twice, else ``None``.
    """

    first: datetime
    exists: bool
    second: datetime | None


def resolve_server_time(server_time: datetime, zone: ZoneInfo) -> ServerTime:
    """The meaning of a server time in UTC (see ``ServerTime``)."""
    if server_time.tzinfo is not None:
        raise ValueError("a server time has no time zone")
    first = server_time.replace(tzinfo=zone, fold=0).astimezone(UTC)
    exists = first.astimezone(zone).replace(tzinfo=None) == server_time
    second: datetime | None = None
    if exists:
        later = server_time.replace(tzinfo=zone, fold=1).astimezone(UTC)
        second = later if later != first else None
    return ServerTime(first=first, exists=exists, second=second)


#: Distance between the samples when the offsets of a long period are looked at.
_SAMPLE_DISTANCE = timedelta(days=7)

#: How far beyond a limit of a period the offset is looked at: a change of the offset that
#: matters for the rows of the period is never farther away (a shift is a few hours).
_LOOK_AROUND = timedelta(days=1)


def server_window(start: datetime, end: datetime, zone: ZoneInfo) -> tuple[datetime, datetime]:
    """The server times ``[low, high)`` for a read of the period ``[start, end)`` (aware UTC
    times): they contain the server time of every row whose UTC time lies in the period, and,
    where the clocks are put back near the period, the whole repeated hour with both of its
    occurrences, so that the second occurrence is recognised by the order of the rows.

    The server time is the UTC time plus the offset of the zone, so it is not the server
    time of the limits when the offset changes in or near the period: after the clocks are put
    back the server time at ``end`` is lower than the one shortly before it. With ``shift``
    the largest difference of the offsets near the period, the window is widened by twice
    that on both sides (a step that holds a row of the repeated hour then holds all of it).
    Without a change of the offset it is exactly ``[server(start), server(end))``.
    """
    points = [start - _LOOK_AROUND, start, end, end + _LOOK_AROUND]
    cursor = start + _SAMPLE_DISTANCE
    while cursor < end:
        points.append(cursor)
        cursor += _SAMPLE_DISTANCE
    offsets: list[timedelta] = []
    for point in points:
        try:
            offset = point.astimezone(zone).utcoffset()
        except OverflowError, ValueError, OSError:
            continue
        if offset is not None:
            offsets.append(offset)
    shift = max(offsets) - min(offsets) if offsets else timedelta(0)
    return utc_to_server(start, zone) - 2 * shift, utc_to_server(end, zone) + 2 * shift


_WEEKDAYS: tuple[Weekday, ...] = (
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
)


def constant_offset(zone: ZoneInfo, year: int) -> timedelta | None:
    """The UTC offset of the zone if it is the same at the beginning of every month of the
    year (no summer time), else ``None``."""
    offsets = {
        datetime(year, month, 1, tzinfo=UTC).astimezone(zone).utcoffset() for month in range(1, 13)
    }
    return offsets.pop() if len(offsets) == 1 else None


def _minutes(text: str) -> int:
    hours, minutes = text.split(":")
    return int(hours) * 60 + int(minutes)


def _clock(minutes: int) -> str:
    return "24:00" if minutes == 1440 else f"{minutes // 60:02d}:{minutes % 60:02d}"


def sessions_to_utc(
    sessions: Sequence[RawSession], zone: ZoneInfo, year: int
) -> list[tuple[Weekday, str, str]] | None:
    """The weekly sessions of the server clock as sessions in UTC, split at midnight.

    A weekly session list can be moved to UTC only if the offset of the zone does not change
    during the year; with summer time the sessions in UTC differ between summer and winter and
    ``None`` is returned (the source then delivers no trading hours rather than wrong ones).
    """
    offset = constant_offset(zone, year)
    if offset is None:
        return None
    shift = int(offset.total_seconds() // 60)
    week = 7 * 1440
    result: list[tuple[Weekday, str, str]] = []
    for session in sessions:
        begin = _WEEKDAYS.index(session.weekday) * 1440 + _minutes(session.start) - shift
        length = _minutes(session.end) - _minutes(session.start)
        while length > 0:
            position = begin % week
            day, inside = divmod(position, 1440)
            taken = min(length, 1440 - inside)
            result.append((_WEEKDAYS[day], _clock(inside), _clock(inside + taken)))
            begin += taken
            length -= taken
    return result


def format_utc(utc_time: datetime) -> str:
    """ISO 8601 text of a UTC time with milliseconds, ending in ``Z``."""
    value = utc_time.astimezone(UTC)
    return value.strftime("%Y-%m-%dT%H:%M:%S.") + f"{value.microsecond // 1000:03d}Z"
