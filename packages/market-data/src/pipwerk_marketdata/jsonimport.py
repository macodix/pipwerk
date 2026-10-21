"""Reading of the JSON files (schema ``contracts/market-data/v1/``).

The file is parsed with the standard library into plain data, never executed. The header of the
file is validated as a whole (a fault refuses the file); every entry of ``candles`` and ``ticks``
is validated on its own (a fault rejects the entry).
"""

import json
from datetime import UTC, datetime, timedelta
from typing import Any, NoReturn

from pydantic import BaseModel, ValidationError

from pipwerk_marketdata.documents import (
    CandleEntry,
    CandleSeriesEnvelope,
    InstrumentDocument,
    PeriodDocument,
    TickEntry,
    TickSeriesEnvelope,
    TradingSessionDocument,
)
from pipwerk_marketdata.errors import ImportFileError
from pipwerk_marketdata.filetext import decode_text
from pipwerk_marketdata.limits import ImportLimits
from pipwerk_marketdata.parsed import (
    KIND_CANDLES,
    KIND_INSTRUMENT,
    KIND_TICKS,
    ParsedImport,
    Rejections,
    candle_violation,
    check_series_names,
)
from pipwerk_marketdata.records import (
    Candle,
    FileErrorCode,
    InstrumentInfo,
    Interval,
    RejectReason,
    Tick,
    TradingSession,
    Weekday,
)
from pipwerk_marketdata.timeunits import time_unit

_PRICE_FIELDS = frozenset({"open", "high", "low", "close", "bid", "ask"})
_MAX_REPORTED_ERRORS = 5
_MAX_LOCATION_LENGTH = 60


def _reject_constant(_name: str) -> NoReturn:
    raise ValueError("NaN and infinity are no JSON values")


def _describe(error: ValidationError) -> str:
    parts: list[str] = []
    for item in error.errors(include_url=False, include_context=False, include_input=False)[
        :_MAX_REPORTED_ERRORS
    ]:
        location = ".".join(str(part) for part in item["loc"])[:_MAX_LOCATION_LENGTH]
        parts.append(f"{location or 'document'}: {item['msg']}")
    return "; ".join(parts)


def _document_error(error: ValidationError) -> ImportFileError:
    return ImportFileError(
        FileErrorCode.DOCUMENT_INVALID, f"The file does not follow the schema. {_describe(error)}"
    )


def _entry_reason(error: ValidationError) -> RejectReason:
    first = error.errors(include_url=False, include_context=False, include_input=False)[0]
    kind = first["type"]
    field_name = first["loc"][0] if first["loc"] else ""
    if kind == "model_type":
        return RejectReason.ENTRY_INVALID
    if kind == "extra_forbidden":
        return RejectReason.FIELD_UNKNOWN
    if kind == "missing":
        return RejectReason.FIELD_MISSING
    if kind == "greater_than" and field_name in _PRICE_FIELDS:
        return RejectReason.PRICE_NOT_POSITIVE
    if kind == "string_pattern_mismatch" and field_name == "time":
        return RejectReason.TIME_INVALID
    return RejectReason.VALUE_INVALID


def parse_moment(text: str) -> datetime | None:
    """Parse a moment of the schema (``...Z``); ``None`` for an impossible date or time."""
    try:
        moment = datetime.fromisoformat(text)
    except ValueError:
        return None
    return moment.astimezone(UTC)


def _sessions(documents: list[TradingSessionDocument]) -> list[TradingSession]:
    sessions: list[TradingSession] = []
    for document in documents:
        start = int(document.from_[:2]) * 60 + int(document.from_[3:])
        end = int(document.to[:2]) * 60 + int(document.to[3:])
        if start >= end:
            raise ImportFileError(
                FileErrorCode.DOCUMENT_INVALID,
                "A trading session must end after it starts; split sessions at midnight.",
            )
        sessions.append(TradingSession(Weekday(document.weekday), start, end))
    return sessions


def _period(document: PeriodDocument | None) -> Interval | None:
    if document is None:
        return None
    start, end = parse_moment(document.start), parse_moment(document.end)
    if start is None or end is None or start >= end:
        raise ImportFileError(FileErrorCode.PERIOD_INVALID, "The period must end after it starts.")
    return Interval(start, end)


def _check_period(
    period: Interval | None, first: datetime | None, last_end: datetime | None
) -> None:
    if period is None or first is None or last_end is None:
        return
    if first < period.start or last_end > period.end:
        raise ImportFileError(
            FileErrorCode.PERIOD_INVALID, "The period does not include all entries."
        )


def parse_json(data: bytes, limits: ImportLimits | None = None) -> ParsedImport:
    """Read a JSON file. ``ImportFileError`` if the file as a whole is refused."""
    limits = limits or ImportLimits()
    text = decode_text(data, limits)
    try:
        raw: Any = json.loads(text, parse_constant=_reject_constant)
    except ValueError, RecursionError:
        raise ImportFileError(FileErrorCode.JSON_INVALID, "The file is not valid JSON.") from None
    if not isinstance(raw, dict):
        raise ImportFileError(
            FileErrorCode.DOCUMENT_INVALID, "The file must contain one JSON object."
        )
    kind = raw.get("kind")
    if kind == KIND_CANDLES:
        return _parse_candles(raw, limits)
    if kind == KIND_TICKS:
        return _parse_ticks(raw, limits)
    if kind == KIND_INSTRUMENT:
        return _parse_instrument(raw)
    raise ImportFileError(
        FileErrorCode.DOCUMENT_INVALID, 'The field "kind" must be candles, ticks or instrument.'
    )


def _validate_entries(
    entries: list[object],
    model: type[BaseModel],
    limits: ImportLimits,
) -> tuple[list[tuple[int, Any]], Rejections]:
    if len(entries) > limits.max_rows:
        raise ImportFileError(
            FileErrorCode.TOO_MANY_ROWS, f"The file has more than {limits.max_rows} entries."
        )
    rejections = Rejections(limits)
    valid: list[tuple[int, Any]] = []
    for number, entry in enumerate(entries, start=1):
        try:
            valid.append((number, model.model_validate(entry)))
        except ValidationError as error:
            rejections.reject(number, _entry_reason(error))
    return valid, rejections


def _parse_candles(raw: dict[str, Any], limits: ImportLimits) -> ParsedImport:
    try:
        header = CandleSeriesEnvelope.model_validate(raw)
    except ValidationError as error:
        raise _document_error(error) from None
    check_series_names(header.broker, header.instrument, header.time_unit, candles=True)
    unit = time_unit(header.time_unit)
    period = _period(header.period)
    sessions = _sessions(header.trading_hours) if header.trading_hours is not None else None
    valid, rejections = _validate_entries(header.candles, CandleEntry, limits)
    candles: list[Candle] = []
    for number, entry in valid:
        moment = parse_moment(entry.time)
        if moment is None:
            rejections.reject(number, RejectReason.TIME_INVALID)
            continue
        violation = candle_violation(entry.open, entry.high, entry.low, entry.close)
        if violation is not None:
            rejections.reject(number, violation)
            continue
        if not rejections.accept_time(number, moment):
            continue
        candles.append(
            Candle(
                moment, entry.open, entry.high, entry.low, entry.close, entry.volume, entry.spread
            )
        )
    if not header.candles and period is None:
        raise ImportFileError(FileErrorCode.NO_ROWS, "The file has no entries and no period.")
    if candles:
        _check_period(period, candles[0].time, unit.add(candles[-1].time))
    return ParsedImport(
        kind=KIND_CANDLES,
        broker=header.broker,
        instrument=header.instrument,
        unit=header.time_unit,
        candles=candles,
        declared_period=period,
        trading_hours=sessions,
        rejected=rejections.rows,
        rejected_count=rejections.count,
    )


def _parse_ticks(raw: dict[str, Any], limits: ImportLimits) -> ParsedImport:
    try:
        header = TickSeriesEnvelope.model_validate(raw)
    except ValidationError as error:
        raise _document_error(error) from None
    check_series_names(header.broker, header.instrument, None, candles=False)
    period = _period(header.period)
    sessions = _sessions(header.trading_hours) if header.trading_hours is not None else None
    valid, rejections = _validate_entries(header.ticks, TickEntry, limits)
    ticks: list[Tick] = []
    for number, entry in valid:
        moment = parse_moment(entry.time)
        if moment is None:
            rejections.reject(number, RejectReason.TIME_INVALID)
            continue
        if not rejections.accept_time(number, moment):
            continue
        ticks.append(Tick(moment, entry.bid, entry.ask))
    if not header.ticks and period is None:
        raise ImportFileError(FileErrorCode.NO_ROWS, "The file has no entries and no period.")
    if ticks:
        _check_period(period, ticks[0].time, ticks[-1].time + timedelta(microseconds=1))
    return ParsedImport(
        kind=KIND_TICKS,
        broker=header.broker,
        instrument=header.instrument,
        unit=None,
        ticks=ticks,
        declared_period=period,
        trading_hours=sessions,
        rejected=rejections.rows,
        rejected_count=rejections.count,
    )


def _parse_instrument(raw: dict[str, Any]) -> ParsedImport:
    try:
        document = InstrumentDocument.model_validate(raw)
    except ValidationError as error:
        raise _document_error(error) from None
    check_series_names(document.broker, document.instrument, None, candles=False)
    acquired_at = parse_moment(document.acquired_at)
    if acquired_at is None:
        raise ImportFileError(
            FileErrorCode.DOCUMENT_INVALID, "The field acquired_at is not a valid moment."
        )
    info = InstrumentInfo(
        broker=document.broker,
        instrument=document.instrument,
        acquired_at=acquired_at,
        tick_size=document.tick_size,
        tick_value=document.tick_value,
        tick_value_currency=document.tick_value_currency,
        point=document.point,
        pip=document.pip,
        spread=document.spread,
        min_volume=document.min_volume,
        volume_step=document.volume_step,
        contract_size=document.contract_size,
        swap_long=document.swap_long,
        swap_short=document.swap_short,
        swap_triple_weekday=Weekday(document.swap_triple_weekday),
        margin_per_lot=document.margin_per_lot,
    )
    return ParsedImport(
        kind=KIND_INSTRUMENT, broker=info.broker, instrument=info.instrument, unit=None, info=info
    )
