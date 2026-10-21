"""Models of the requests and answers of the data stock (``/api/v1/market-data/``).

All models reject additional fields (``extra="forbid"``). The requests are checked strictly:
a time is ISO 8601 text with a time zone, a number is no time. The answers are built from the
value objects of ``pipwerk_marketdata`` (``from_attributes``); times in answers are UTC.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated, Literal
from uuid import UUID

from pipwerk_marketdata import (
    FileErrorCode,
    MissingReason,
    RejectReason,
    Weekday,
)
from pipwerk_marketdata.limits import MAX_MOMENT, MIN_MOMENT
from pydantic import (
    AwareDatetime,
    BeforeValidator,
    ConfigDict,
    Field,
    StringConstraints,
    model_validator,
)

from pipwerk_replay.api_support import ApiModel, parse_moment
from pipwerk_replay.names import MAX_NAME_LENGTH, NAME_PATTERN

#: The designation of a broker or an instrument (``names.py``).
Name = Annotated[
    str,
    StringConstraints(min_length=1, max_length=MAX_NAME_LENGTH, pattern=NAME_PATTERN),
]

#: The time units of candles, as in MetaTrader 5 and in ``pipwerk_marketdata.TIME_UNITS``.
TimeUnitName = Literal[
    "m1",
    "m2",
    "m3",
    "m4",
    "m5",
    "m6",
    "m10",
    "m12",
    "m15",
    "m20",
    "m30",
    "h1",
    "h2",
    "h3",
    "h4",
    "h6",
    "h8",
    "h12",
    "d1",
    "w1",
    "mn1",
]

#: A moment with a time zone, given as ISO 8601 text.
Moment = Annotated[AwareDatetime, BeforeValidator(parse_moment)]

MAX_TIMEZONE_LENGTH = 64


class OutModel(ApiModel):
    """Base of the answers: built from the value objects of the library."""

    model_config = ConfigDict(extra="forbid", from_attributes=True)


# --- parts (a request for completeness or acquisition) ----------------------------------------


def _check_period(start: datetime, end: datetime) -> None:
    """The period of a part: ``start`` before ``end``, both within the supported times of the
    data stock (1970-01-01 to 2100-01-01, UTC)."""
    start_utc, end_utc = start.astimezone(UTC), end.astimezone(UTC)
    if not MIN_MOMENT <= start_utc < end_utc <= MAX_MOMENT:
        raise ValueError(
            "the period must start before it ends and lie between 1970-01-01T00:00:00Z "
            "and 2100-01-01T00:00:00Z"
        )


class CandlesPart(ApiModel):
    """Candles of one instrument and one time unit in the period ``[start, end)``."""

    kind: Literal["candles"]
    instrument: Name
    time_unit: TimeUnitName
    start: Moment = Field(description="Start of the period, included. ISO 8601 with time zone.")
    end: Moment = Field(description="End of the period, excluded. ISO 8601 with time zone.")

    @model_validator(mode="after")
    def _period(self) -> CandlesPart:
        _check_period(self.start, self.end)
        return self


class TicksPart(ApiModel):
    """Ticks of one instrument in the period ``[start, end)``."""

    kind: Literal["ticks"]
    instrument: Name
    start: Moment = Field(description="Start of the period, included. ISO 8601 with time zone.")
    end: Moment = Field(description="End of the period, excluded. ISO 8601 with time zone.")

    @model_validator(mode="after")
    def _period(self) -> TicksPart:
        _check_period(self.start, self.end)
        return self


class InstrumentPart(ApiModel):
    """The details of one instrument (no period)."""

    kind: Literal["instrument"]
    instrument: Name


#: A part that a test run needs, or that is acquired: ``kind`` selects the form.
Part = Annotated[CandlesPart | TicksPart | InstrumentPart, Field(discriminator="kind")]


# --- overview and instrument ------------------------------------------------------------------


class OverviewQuery(ApiModel):
    """Parameters of the overview: the section of the lists (series and instruments)."""

    offset: int = Field(0, ge=0, description="Number of items to skip in each list.")
    limit: int | None = Field(
        None,
        ge=1,
        description=(
            "Largest number of items in each list. Without it, and at most, the limit of "
            "the startup configuration (``max_listed_items``, default 1000)."
        ),
    )


class Period(OutModel):
    """A period from ``start`` (included) to ``end`` (excluded), UTC."""

    start: datetime
    end: datetime


class MissingPeriod(OutModel):
    """A missing period and why it is missing."""

    start: datetime
    end: datetime
    reason: MissingReason


class SeriesOverview(OutModel):
    """One series: candles of one time unit (``unit``) or ticks (``unit`` is ``ticks``).

    ``covered`` and ``missing`` list at most ``max_listed_items`` periods; ``covered_count`` and
    ``missing_count`` count all of them. A gap lies within the covered periods and within the
    trading time; ``missing`` of a series holds gaps only.
    """

    broker: str
    instrument: str
    unit: str
    count: int
    first: datetime | None
    last: datetime | None
    covered: list[Period]
    covered_count: int
    missing: list[MissingPeriod]
    missing_count: int
    has_trading_hours: bool


class InstrumentEntry(OutModel):
    """The newest instrument data of one instrument at one broker (moment of the acquisition)."""

    broker: str
    instrument: str
    acquired_at: datetime


class Overview(OutModel):
    """The data stock: its series and the instruments with data about them.

    Both lists are sorted by broker, instrument and unit and cut to the section of the request;
    ``series_total`` and ``instruments_total`` count all items."""

    series: list[SeriesOverview]
    series_total: int
    instruments: list[InstrumentEntry]
    instruments_total: int
    offset: int
    limit: int


class InstrumentQuery(ApiModel):
    """Parameters of the instrument data."""

    broker: Name
    instrument: Name
    as_of: Annotated[AwareDatetime, BeforeValidator(parse_moment)] | None = Field(
        None,
        description="Only data obtained not after this moment (ISO 8601 with time zone).",
    )


class InstrumentInfo(OutModel):
    """The newest data of an instrument at a broker (``contracts/market-data/v1/``)."""

    broker: str
    instrument: str
    acquired_at: datetime
    tick_size: float
    tick_value: float
    tick_value_currency: str
    point: float
    pip: float
    spread: float = Field(description="Usual spread as price difference.")
    min_volume: float
    volume_step: float
    contract_size: float
    swap_long: float
    swap_short: float
    swap_triple_weekday: Weekday
    margin_per_lot: float | None


# --- import -----------------------------------------------------------------------------------


class CsvImportQuery(ApiModel):
    """What the caller says about an uploaded CSV file, because the file does not contain it."""

    kind: Literal["candles", "ticks"]
    broker: Name
    instrument: Name
    time_unit: TimeUnitName | None = Field(
        None, description="The time unit of the candles; needed for ``candles``, not for ``ticks``."
    )
    timezone: Annotated[str, StringConstraints(min_length=1, max_length=MAX_TIMEZONE_LENGTH)] = (
        Field(
            description="IANA name of the time zone of the times in the file, e.g. Europe/Athens."
        )
    )


class RejectedRow(OutModel):
    """A rejected row: the line number in a CSV file (the header is line 1), the position of
    the entry in a JSON file, and why."""

    row: int
    reason: RejectReason


class ImportResult(OutModel):
    """The result of an import.

    ``accepted`` counts the rows taken over, ``replaced`` those of them that replaced an existing
    row of the same moment. ``rejected`` lists at most the first ``max_reported_rejections``
    rejected rows; ``rejected_count`` counts all. ``period_start`` and ``period_end`` span the rows
    taken over (``null`` if there are none).
    """

    kind: Literal["candles", "ticks", "instrument"]
    broker: str
    instrument: str
    unit: str | None
    accepted: int
    replaced: int
    period_start: datetime | None
    period_end: datetime | None
    rejected: list[RejectedRow]
    rejected_count: int


class FileRefused(ApiModel):
    """Error body for a file that is refused as a whole (nothing was changed). ``message`` is a
    fixed text that names fields, never content of the file."""

    detail: str
    code: FileErrorCode
    message: str


# --- completeness -----------------------------------------------------------------------------


class CompletenessRequest(ApiModel):
    """The parts a test run needs. The broker is the default source unless given."""

    broker: Name | None = Field(
        None, description="The broker to check; without it the default source."
    )
    parts: Annotated[list[Part], Field(min_length=1)] = Field(
        description="The needed parts; at most ``max_parts_per_request`` (default 100)."
    )


class PartCompleteness(OutModel):
    """One needed part: what is needed, what is present, what is missing.

    For candles and ticks ``present`` and ``missing`` split the needed period (times in which
    the market is closed count as present); ``complete`` is true if nothing is missing. For
    ``instrument`` both lists are empty and ``complete`` tells whether data exist. The lists hold
    at most ``max_listed_items`` periods, the counts count all of them."""

    needed: Part
    complete: bool
    present: list[Period]
    present_count: int
    missing: list[MissingPeriod]
    missing_count: int


class Completeness(OutModel):
    """The completeness of the needed parts at one broker, in the order of the request."""

    broker: str
    results: list[PartCompleteness]


# --- acquisition ------------------------------------------------------------------------------


class AcquisitionRequest(ApiModel):
    """The parts to acquire from the source: one for an acquisition by hand, several for the
    missing parts of a test run."""

    parts: Annotated[list[Part], Field(min_length=1)] = Field(
        description="The parts to acquire; at most ``max_parts_per_request`` (default 100)."
    )


class PartFailure(OutModel):
    """Why a part could not be acquired.

    ``code`` is a code of the source (``unauthorized``, ``symbol_unknown``, ``no_data``,
    ``range_too_large``, ``terminal_unavailable``, ``broker_error``, ``broker_unknown``,
    ``invalid_broker_data``, ``invalid_request``, ``host_not_allowed``, ``body_too_large``,
    ``not_found``, ``internal_error``) with the reason the source gave, or a code of pipwerk
    replay: ``source_unreachable``, ``source_response_invalid``, ``source_response_too_large``,
    ``import_refused`` (``file_error`` names why), ``data_store_error``, ``acquisition_failed``.
    ``reason`` is a readable German text."""

    code: str
    reason: str
    file_error: FileErrorCode | None = None


class AcquisitionPart(OutModel):
    """The state of one part of an acquisition.

    ``queued`` (not yet asked), ``running``, ``succeeded`` (``result`` holds the import, and
    ``omitted_count`` the rows the source left out) or ``failed`` (``error`` says why)."""

    request: Part
    state: Literal["queued", "running", "succeeded", "failed"]
    result: ImportResult | None
    omitted_count: int | None
    error: PartFailure | None


class Acquisition(OutModel):
    """An acquisition: its parts are worked off one after the other; a failed part does not stop
    the others. ``running`` until every part has succeeded or failed, then ``finished``."""

    id: UUID
    state: Literal["running", "finished"]
    created_at: datetime
    finished_at: datetime | None
    parts: list[AcquisitionPart]


class AcquisitionRefused(ApiModel):
    """Error body when no acquisition can start because no source is set up (HTTP 409)."""

    detail: str
    code: Literal["no_source"]
    reason: str
