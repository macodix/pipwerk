"""Reading of CSV files in the export format of MetaTrader 5.

The format is described in ``docs/technical/pipwerk-marketdata.md``, section "CSV". In short: a
header line names the columns; the delimiter is the tab (MetaTrader 5), or semicolon or comma;
the time is the server time of the broker and is converted to UTC with the IANA time zone the
caller names.
"""

import csv
import io
import re
from dataclasses import dataclass
from datetime import UTC, datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pipwerk_marketdata.errors import ImportFileError
from pipwerk_marketdata.filetext import decode_text
from pipwerk_marketdata.limits import ImportLimits
from pipwerk_marketdata.parsed import (
    KIND_CANDLES,
    KIND_TICKS,
    ParsedImport,
    Rejections,
    candle_violation,
    check_series_names,
    is_finite,
)
from pipwerk_marketdata.records import Candle, FileErrorCode, RejectReason, Tick

_DELIMITERS = ("\t", ";", ",")

_NUMBER = re.compile(r"^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$")
_INTEGER = re.compile(r"^\d{1,18}$")
_MOMENT = re.compile(
    r"^(\d{4})[.\-/](\d{2})[.\-/](\d{2})"
    r"(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,6}))?)?)?$"
)

# normalised header name -> role of the column
_ROLES = {
    "date": "date",
    "time": "time",
    "datetime": "time",
    "open": "open",
    "high": "high",
    "low": "low",
    "close": "close",
    "tickvol": "tickvol",
    "tickvolume": "tickvol",
    "vol": "vol",
    "volume": "vol",
    "realvolume": "vol",
    "spread": "spread",
    "bid": "bid",
    "ask": "ask",
}

_CANDLE_PRICES = ("open", "high", "low", "close")
_TICK_PRICES = ("bid", "ask")


@dataclass(frozen=True, slots=True)
class CsvSeries:
    """What the caller says about the file, because the file does not contain it."""

    kind: str
    broker: str
    instrument: str
    time_unit: str | None
    timezone: str


def load_zone(name: str) -> ZoneInfo:
    """The time zone with this IANA name; ``ImportFileError`` if it is not known."""
    try:
        return ZoneInfo(name)
    except ZoneInfoNotFoundError, ValueError, OSError:
        raise ImportFileError(
            FileErrorCode.TIMEZONE_UNKNOWN, "The time zone is not an IANA time zone name."
        ) from None


def local_to_utc(local: datetime, zone: ZoneInfo) -> datetime | None:
    """Convert a local time to UTC.

    A local time that occurs twice (clock set back) is the earlier one. A local time that does
    not exist (clock set forward) gives ``None``.
    """
    aware = local.replace(tzinfo=zone, fold=0)
    utc = aware.astimezone(UTC)
    if utc.astimezone(zone).replace(tzinfo=None) != local:
        return None
    return utc


def _normalise(name: str) -> str:
    return re.sub(r"[\s_<>]", "", name).lower()


def _split_header(line: str) -> tuple[str, list[str]]:
    for delimiter in _DELIMITERS:
        if delimiter in line:
            return delimiter, next(csv.reader([line], delimiter=delimiter))
    raise ImportFileError(
        FileErrorCode.HEADER_INVALID,
        "The header line has no tab, semicolon or comma between its columns.",
    )


def _roles(columns: list[str], kind: str) -> dict[str, int]:
    roles: dict[str, int] = {}
    for index, name in enumerate(columns):
        role = _ROLES.get(_normalise(name))
        if role is None:
            continue
        if role in roles:
            raise ImportFileError(
                FileErrorCode.HEADER_INVALID, f"The column {role} occurs twice in the header."
            )
        roles[role] = index
    required = _CANDLE_PRICES if kind == KIND_CANDLES else _TICK_PRICES
    missing = [role for role in required if role not in roles]
    if "date" not in roles and "time" not in roles:
        missing.insert(0, "date or time")
    if missing:
        raise ImportFileError(
            FileErrorCode.HEADER_INVALID, "The header lacks the columns: " + ", ".join(missing)
        )
    return roles


def _local_moment(date_text: str, time_text: str) -> datetime | None:
    match = _MOMENT.match(f"{date_text} {time_text}".strip())
    if match is None:
        return None
    year, month, day, hour, minute, second, fraction = match.groups()
    try:
        return datetime(
            int(year),
            int(month),
            int(day),
            int(hour or 0),
            int(minute or 0),
            int(second or 0),
            int((fraction or "").ljust(6, "0")),
        )
    except ValueError:
        return None


class _RowError(Exception):
    def __init__(self, reason: RejectReason) -> None:
        super().__init__(reason.value)
        self.reason = reason


def _price(cells: list[str], index: int) -> float:
    text = cells[index].strip()
    if not text:
        raise _RowError(RejectReason.FIELD_MISSING)
    if not _NUMBER.match(text):
        raise _RowError(RejectReason.VALUE_INVALID)
    value = float(text)
    if not is_finite(value):
        raise _RowError(RejectReason.VALUE_INVALID)
    if value <= 0:
        raise _RowError(RejectReason.PRICE_NOT_POSITIVE)
    return value


def _optional_integer(cells: list[str], index: int | None) -> int | None:
    if index is None:
        return None
    text = cells[index].strip()
    if not text:
        return None
    if not _INTEGER.match(text):
        raise _RowError(RejectReason.VALUE_INVALID)
    return int(text)


def _moment(cells: list[str], roles: dict[str, int], zone: ZoneInfo) -> datetime:
    date_text = cells[roles["date"]].strip() if "date" in roles else ""
    time_text = cells[roles["time"]].strip() if "time" in roles else ""
    local = _local_moment(date_text, time_text)
    if local is None:
        raise _RowError(RejectReason.TIME_INVALID)
    utc = local_to_utc(local, zone)
    if utc is None:
        raise _RowError(RejectReason.LOCAL_TIME_NOT_EXISTING)
    return utc


def parse_csv(data: bytes, series: CsvSeries, limits: ImportLimits | None = None) -> ParsedImport:
    """Read a CSV file of candles or ticks. ``ImportFileError`` if the file is refused."""
    limits = limits or ImportLimits()
    if series.kind not in (KIND_CANDLES, KIND_TICKS):
        raise ImportFileError(FileErrorCode.SERIES_INVALID, "The kind must be candles or ticks.")
    check_series_names(
        series.broker,
        series.instrument,
        series.time_unit,
        candles=series.kind == KIND_CANDLES,
    )
    zone = load_zone(series.timezone)
    text = decode_text(data, limits)
    lines = text.splitlines()
    first = next((line for line in lines if line.strip()), None)
    if first is None:
        raise ImportFileError(FileErrorCode.NO_ROWS, "The file is empty.")
    delimiter, columns = _split_header(first)
    roles = _roles(columns, series.kind)
    rejections = Rejections(limits)
    candles: list[Candle] = []
    ticks: list[Tick] = []
    data_rows = 0
    header_seen = False
    try:
        reader = csv.reader(io.StringIO(text, newline=""), delimiter=delimiter)
        for cells in reader:
            if not header_seen:
                if any(cell.strip() for cell in cells):
                    header_seen = True
                continue
            if not any(cell.strip() for cell in cells):
                continue
            data_rows += 1
            if data_rows > limits.max_rows:
                raise ImportFileError(
                    FileErrorCode.TOO_MANY_ROWS, f"The file has more than {limits.max_rows} rows."
                )
            number = reader.line_num
            try:
                _read_row(cells, number, roles, zone, series, rejections, candles, ticks)
            except _RowError as error:
                rejections.reject(number, error.reason)
    except csv.Error:
        raise ImportFileError(
            FileErrorCode.DOCUMENT_INVALID, "The file is not a valid CSV file."
        ) from None
    if data_rows == 0:
        raise ImportFileError(FileErrorCode.NO_ROWS, "The file has a header but no data rows.")
    return ParsedImport(
        kind=series.kind,
        broker=series.broker,
        instrument=series.instrument,
        unit=series.time_unit,
        candles=candles,
        ticks=ticks,
        rejected=rejections.rows,
        rejected_count=rejections.count,
    )


def _read_row(
    cells: list[str],
    number: int,
    roles: dict[str, int],
    zone: ZoneInfo,
    series: CsvSeries,
    rejections: Rejections,
    candles: list[Candle],
    ticks: list[Tick],
) -> None:
    if len(cells) <= max(roles.values()):
        raise _RowError(RejectReason.COLUMNS_MISMATCH)
    moment = _moment(cells, roles, zone)
    if series.kind == KIND_CANDLES:
        open_, high, low, close = (_price(cells, roles[name]) for name in _CANDLE_PRICES)
        volume_index = roles.get("tickvol", roles.get("vol"))
        volume = _optional_integer(cells, volume_index)
        spread = _optional_integer(cells, roles.get("spread"))
        violation = candle_violation(open_, high, low, close)
        if violation is not None:
            raise _RowError(violation)
        if rejections.accept_time(number, moment):
            candles.append(Candle(moment, open_, high, low, close, volume, spread))
    else:
        bid, ask = (_price(cells, roles[name]) for name in _TICK_PRICES)
        if rejections.accept_time(number, moment):
            ticks.append(Tick(moment, bid, ask))
