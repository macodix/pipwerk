"""Request and response models of the HTTP interface (version 1).

Pydantic rejects additional fields everywhere (``extra="forbid"``). A request names the kind
(``candles`` of a time unit, ``ticks``, or the details of the ``instrument``), the instrument
and, for candles and ticks, the period ``[start, end)``. The answer is an envelope: ``file`` is
the file in the JSON format of the import (``contracts/market-data/v1/``, the models are the
ones of ``pipwerk_marketdata.documents`` written out here, so the program needs no other
component), ``omitted`` names the rows that were left out and why. Times in the answer are UTC,
ISO 8601 with milliseconds and a trailing ``Z``.
"""

from __future__ import annotations

from datetime import UTC
from typing import Annotated, Literal

from pydantic import AwareDatetime, BaseModel, BeforeValidator, ConfigDict, Field, model_validator

from pipwerk_fetch_mt5.errors import ErrorCode
from pipwerk_fetch_mt5.gateway import TimeUnit, Weekday

#: The designation of an instrument and the name of a broker, as the schemas of the import
#: define them: 1 to 128 characters, no control characters, no blank at either end.
Name = Annotated[
    str,
    Field(min_length=1, max_length=128, pattern=r"^\S(?:[^\x00-\x1f\x7f]*\S)?$"),
]

#: A time in UTC as text: ISO 8601 with milliseconds and a trailing ``Z``.
UtcTimestamp = Annotated[
    str,
    Field(
        pattern=r"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$",
        examples=["2026-01-05T10:00:00.000Z"],
    ),
]

_FIRST_YEAR = 1970
_LAST_YEAR = 2100


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


# --- requests --------------------------------------------------------------------------------


def _require_text(value: object) -> object:
    """A time is given as text; a number is not taken for a moment (no implicit conversion)."""
    if not isinstance(value, str):
        raise ValueError("a time must be given as text")
    return value


#: A moment with a time zone, given as ISO 8601 text.
Moment = Annotated[AwareDatetime, BeforeValidator(_require_text)]


class _Period(_Strict):
    """The period ``[start, end)``; ``start`` must lie before ``end``. Both carry a time zone."""

    start: Moment = Field(description="Start of the period, included.")
    end: Moment = Field(description="End of the period, excluded.")

    @model_validator(mode="after")
    def _check_period(self) -> _Period:
        for value in (self.start, self.end):
            if not _FIRST_YEAR <= value.astimezone(UTC).year <= _LAST_YEAR:
                raise ValueError("the period must lie between the years 1970 and 2100")
        if not self.start < self.end:
            raise ValueError("start must lie before end")
        return self


class CandlesRequest(_Period):
    """Candles of one time unit."""

    kind: Literal["candles"]
    instrument: Name
    time_unit: TimeUnit


class TicksRequest(_Period):
    """Ticks with milliseconds."""

    kind: Literal["ticks"]
    instrument: Name


class InstrumentRequest(_Strict):
    """The details of the instrument."""

    kind: Literal["instrument"]
    instrument: Name


FetchRequest = Annotated[
    CandlesRequest | TicksRequest | InstrumentRequest, Field(discriminator="kind")
]


# --- the files of the import (contracts/market-data/v1) ---------------------------------------


class PeriodDocument(_Strict):
    """The period the source covers, even where it delivers no candle or tick."""

    start: UtcTimestamp
    end: UtcTimestamp


class TradingSessionDocument(_Strict):
    """A weekly trading session in UTC; a session across midnight is split at midnight."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    weekday: Weekday
    from_: Annotated[str, Field(alias="from", pattern=r"^([01][0-9]|2[0-3]):[0-5][0-9]$")]
    to: Annotated[str, Field(pattern=r"^(([01][0-9]|2[0-3]):[0-5][0-9]|24:00)$")]


class CandleEntry(_Strict):
    """A candle: open time (UTC), prices, tick volume and the spread in points if delivered."""

    time: UtcTimestamp
    open: float
    high: float
    low: float
    close: float
    volume: int | None
    spread: int | None


class TickEntry(_Strict):
    """A tick: time (UTC, milliseconds), bid and ask."""

    time: UtcTimestamp
    bid: float
    ask: float


class CandleSeriesDocument(_Strict):
    """The candles of one series: broker, instrument and time unit.

    ``trading_hours`` is ``null`` if the source delivers none (the import then leaves the
    stored trading hours of the series unchanged)."""

    version: Literal[1] = 1
    kind: Literal["candles"] = "candles"
    broker: Name
    instrument: Name
    time_unit: TimeUnit
    period: PeriodDocument
    trading_hours: list[TradingSessionDocument] | None
    candles: list[CandleEntry]


class TickSeriesDocument(_Strict):
    """The ticks of one series: broker and instrument."""

    version: Literal[1] = 1
    kind: Literal["ticks"] = "ticks"
    broker: Name
    instrument: Name
    period: PeriodDocument
    trading_hours: list[TradingSessionDocument] | None
    ticks: list[TickEntry]


class InstrumentDocument(_Strict):
    """The details of an instrument at the time of the acquisition.

    ``tick_value`` is the value of one tick per lot in ``tick_value_currency``. ``pip`` is
    ten points for a symbol with three or five digits and else one point. ``spread`` is the
    current spread as a price difference. ``margin_per_lot`` is ``null`` if it cannot be
    determined.
    """

    version: Literal[1] = 1
    kind: Literal["instrument"] = "instrument"
    broker: Name
    instrument: Name
    acquired_at: UtcTimestamp
    tick_size: float
    tick_value: float
    tick_value_currency: str
    point: float
    pip: float
    spread: float
    min_volume: float
    volume_step: float
    contract_size: float
    swap_long: float
    swap_short: float
    swap_triple_weekday: Weekday
    margin_per_lot: float | None


# --- answers ----------------------------------------------------------------------------------

OmittedReason = Literal[
    "time_does_not_exist", "double_local_time", "duplicate_time", "invalid_price"
]


class OmittedRow(_Strict):
    """A row that was left out: its server time (``YYYY-MM-DDTHH:MM:SS.mmm``) and why."""

    server_time: str
    reason: OmittedReason


class CandleSeriesResponse(_Strict):
    file: CandleSeriesDocument
    omitted_count: int
    omitted: list[OmittedRow]


class TickSeriesResponse(_Strict):
    file: TickSeriesDocument
    omitted_count: int
    omitted: list[OmittedRow]


class InstrumentResponse(_Strict):
    file: InstrumentDocument
    omitted_count: int = 0
    omitted: list[OmittedRow] = Field(default_factory=list)


FetchResponse = CandleSeriesResponse | TickSeriesResponse | InstrumentResponse


class HealthResponse(_Strict):
    status: Literal["ok"]


class ErrorDetail(_Strict):
    """An error: a stable ``code`` and a fixed readable ``reason``. ``fields`` names the
    invalid fields of a request that was rejected as ``invalid_request``."""

    code: ErrorCode
    reason: str
    fields: list[str] | None = None


class ErrorResponse(_Strict):
    error: ErrorDetail
