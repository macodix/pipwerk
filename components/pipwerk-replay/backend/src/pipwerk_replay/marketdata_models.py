"""Models of the requests and answers of the data stock (``/api/v1/market-data/``).

All models reject additional fields (``extra="forbid"``). The requests are checked strictly:
a time is ISO 8601 text with a time zone, a number is no time. The answers are built from the
value objects of ``pipwerk_marketdata`` (``from_attributes``); times in answers are UTC.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated, Literal

from pipwerk_marketdata import (
    CONTRACT,
    TICKS,
    TIME_UNITS,
    DeletionErrorCode,
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


# --- parts (a request for completeness) --------------------------------------------------------


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


#: A part that a test run needs: ``kind`` selects the form.
Part = Annotated[CandlesPart | TicksPart | InstrumentPart, Field(discriminator="kind")]


# --- list of series, details, brokers ---------------------------------------------------------

#: The identifier of the data of a row: a time unit (``m1`` to ``mn1``), ``ticks`` or ``contract``
#: (the instrument data of an instrument at a broker). The identifiers are lower case.
DATA_IDENTIFIERS: frozenset[str] = frozenset([*TIME_UNITS, TICKS, CONTRACT])

MAX_FILTER_LENGTH = MAX_NAME_LENGTH
MAX_DATA_LENGTH = 16


class SeriesQuery(ApiModel):
    """Parameters of the list of series: the filters and the section."""

    broker: str | None = Field(
        None,
        max_length=MAX_FILTER_LENGTH,
        description="Part of the name of the broker, without regard to case.",
    )
    instrument: str | None = Field(
        None,
        max_length=MAX_FILTER_LENGTH,
        description="Part of the name of the instrument, without regard to case.",
    )
    data: str | None = Field(
        None,
        max_length=MAX_DATA_LENGTH,
        description=(
            "Part of the identifier of the data (``m1`` to ``mn1``, ``ticks``, ``contract``), "
            "without regard to case. An identifier that no row has gives an empty list."
        ),
    )
    offset: int = Field(0, ge=0, le=1_000_000_000, description="Number of rows to skip.")
    limit: int | None = Field(
        None,
        ge=1,
        description=(
            "Largest number of rows. Without it, and at most, the limit of the startup "
            "configuration (``max_listed_items``, default 1000)."
        ),
    )


class SeriesDetailsQuery(ApiModel):
    """Parameters of the details of one row of the list."""

    broker: Name
    instrument: Name
    data: str = Field(
        max_length=MAX_DATA_LENGTH,
        description="Identifier of the data: ``m1`` to ``mn1``, ``ticks`` or ``contract``.",
    )


class SeriesRow(OutModel):
    """One row of the list: the candles of one time unit, the ticks, or - only for an instrument
    that has instrument data but no series - the instrument data (``data`` is ``contract``).

    ``first`` and ``last`` are the moments of the first and the last candle or tick (UTC);
    ``null`` for ``contract``. ``gap_count`` counts the gaps over the covered range of the
    series; 0 for ``contract``."""

    broker: str
    instrument: str
    data: str
    first: datetime | None
    last: datetime | None
    gap_count: int


class SeriesPage(OutModel):
    """A page of the list of series, sorted by broker, instrument and data (time units from short
    to long, then ticks, then contract). ``total`` counts all rows that match the filters."""

    items: list[SeriesRow]
    total: int
    offset: int
    limit: int


class Brokers(OutModel):
    """The brokers that occur in the data stock, sorted without regard to case."""

    items: list[str]


class Period(OutModel):
    """A period from ``start`` (included) to ``end`` (excluded), UTC."""

    start: datetime
    end: datetime


class MissingPeriod(OutModel):
    """A missing period and why it is missing."""

    start: datetime
    end: datetime
    reason: MissingReason


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


class SeriesDetails(OutModel):
    """The details of one row of the list: the gaps and the instrument data.

    ``gaps`` lists at most ``max_listed_items`` gaps in time order; ``row.gap_count`` counts all
    of them. A gap lies within the covered periods and within the trading time. ``contract`` is
    the newest instrument data of the instrument at this broker, ``null`` if there are none (the
    data are missing, and a test run does not start without them)."""

    row: SeriesRow
    gaps: list[MissingPeriod]
    contract: InstrumentInfo | None


# --- import -----------------------------------------------------------------------------------


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


class FileOutcome(OutModel):
    """The result for one file of an import, in the order of the files of the request.

    Either ``result`` is set (the file was taken over; single rows may be rejected, see
    ``result``) or ``error`` and ``message`` (the whole file is refused and nothing of it was
    changed). ``refused`` tells which. ``name`` is the name of the file without a directory.
    ``message`` is a fixed text that names fields, never content of the file."""

    name: str
    refused: bool
    result: ImportResult | None
    error: FileErrorCode | None
    message: str | None
    kept: bool = Field(
        description=(
            "``true`` if the uploaded file was written to the storage directory (the request "
            "asked to keep it, specification 5.6); always ``false`` for a file of the import "
            "directory, which is never copied."
        )
    )


class EmptyBody(ApiModel):
    """A body without fields: an empty JSON object. The requests that begin or end an import
    process have no data, but, like every request that changes something, need a JSON body, so
    that a web page of another origin cannot send them without a preflight request."""


class ImportProcess(OutModel):
    """An import process that was begun. It exists until it is ended or aborted, or until no
    request of it has arrived for ``idle_timeout_seconds``; then it ends by itself. While it
    exists, nothing can be deleted from the data stock."""

    id: str = Field(description="Identifier of the process; the path of its requests.")
    idle_timeout_seconds: int = Field(
        description="The process ends by itself when no request of it arrives for this long."
    )


class ImportProcessEnd(OutModel):
    """An import process that has ended. ``imported_count`` counts the files that were taken
    over, ``refused_count`` those that were refused, so far. Files that were taken over stay
    taken over, also after an abort."""

    id: str
    state: Literal["finished", "aborted"]
    imported_count: int
    refused_count: int


class FileTooLarge(ApiModel):
    """Error body (HTTP 413) of the request of a file that is larger than the limit per file.
    ``detail`` names the limit in the unit of the user, ``max_bytes`` is the limit in bytes
    (``max_upload_bytes`` of the startup configuration). The same reason as the code
    ``too_large`` of a refused file."""

    detail: str
    code: Literal["too_large"]
    max_bytes: int


class FileHint(OutModel):
    """What the backend recognizes about one file without importing it.

    ``format`` is ``json`` or ``csv`` (from the extension of the name, else from the first
    character of the content). ``instrument`` and ``data`` come from the content of a JSON file,
    else from the name; ``data`` is a time unit (``m1`` to ``mn1``), ``ticks`` or ``contract``.
    ``broker`` is the broker a JSON file names (``null`` for CSV). A value that the file does
    not name is ``null``. ``error`` is set if a JSON file cannot be read."""

    name: str
    format: Literal["json", "csv"]
    broker: str | None
    instrument: str | None
    data: str | None
    error: FileErrorCode | None


# --- import directory ---------------------------------------------------------------------------

#: Longest path relative to the import directory that a request may name.
MAX_RELATIVE_PATH_LENGTH = 4096

RelativePath = Annotated[
    str,
    Field(
        max_length=MAX_RELATIVE_PATH_LENGTH,
        description=(
            "Path relative to the import directory, parts separated by ``/``, without a "
            "leading ``/``, without ``..`` and without an empty part. The empty text is the "
            "import directory itself (listing only)."
        ),
    ),
]


class ImportDirectoryQuery(ApiModel):
    """Parameters of the listing of the import directory."""

    path: RelativePath = ""
    offset: int = Field(0, ge=0, le=1_000_000_000, description="Number of entries to skip.")
    limit: int | None = Field(
        None,
        ge=1,
        description=(
            "Largest number of entries. Without it, and at most, the limit of the startup "
            "configuration (``max_listed_items``, default 1000)."
        ),
    )


class ImportDirectoryEntry(OutModel):
    """A file or a subdirectory of the import directory. ``size`` is the size in bytes of a file
    (``null`` for a directory), ``modified_at`` the moment of the last change (UTC)."""

    name: str
    kind: Literal["file", "directory"]
    size: int | None
    modified_at: datetime


class ImportDirectoryPage(OutModel):
    """A page of the listing of a directory inside the import directory: first the
    subdirectories, then the files, each sorted by name without regard to case. ``total``
    counts all entries. Intermediate files of the backend are not listed."""

    items: list[ImportDirectoryEntry]
    total: int
    offset: int
    limit: int


class DirectoryFileRequest(ApiModel):
    """The request to import one file from the import directory: the path and what is known
    about the file, as in the form of an uploaded file (``broker`` and ``timezone`` are those of
    the whole import process). ``instrument`` and ``data`` are optional: a JSON file names them
    in its content, a CSV file in its name as far as it does (the patterns of the preview); a
    given value replaces what is found."""

    path: RelativePath = Field(min_length=1)
    broker: Name
    timezone: str | None = Field(None, max_length=MAX_TIMEZONE_LENGTH)
    instrument: str | None = Field(None, max_length=MAX_NAME_LENGTH)
    data: str | None = Field(None, max_length=MAX_DATA_LENGTH)


class DirectoryPreviewRequest(ApiModel):
    """The request for what a file of the import directory says about itself."""

    path: RelativePath = Field(min_length=1)


# --- deleting ---------------------------------------------------------------------------------

#: The data of a series: a time unit (``m1`` to ``mn1``) or ``ticks``.
SeriesData = TimeUnitName | Literal["ticks"]

CONFIRM_DESCRIPTION = (
    "``false``: only tell what would be deleted, nothing is changed. ``true``: delete, in one "
    "transaction, and tell what was deleted."
)


class SeriesDeletionRequest(ApiModel):
    """Delete a whole series: the candles of a time unit or the ticks of an instrument at a
    broker, with their covered periods."""

    broker: Name
    instrument: Name
    data: SeriesData
    confirm: bool = Field(description=CONFIRM_DESCRIPTION)


class PeriodDeletionRequest(ApiModel):
    """Delete a period of a series: the candles or ticks from ``start`` (included) to ``end``
    (excluded). The period is taken out of the covered periods of the series."""

    broker: Name
    instrument: Name
    data: SeriesData
    start: Moment = Field(
        description="Start of the period, included. ISO 8601 with time zone, on the minute."
    )
    end: Moment = Field(
        description="End of the period, excluded. ISO 8601 with time zone, on the minute."
    )
    confirm: bool = Field(description=CONFIRM_DESCRIPTION)

    @model_validator(mode="after")
    def _period(self) -> PeriodDeletionRequest:
        _check_period(self.start, self.end)
        for moment in (self.start, self.end):
            if moment.second != 0 or moment.microsecond != 0:
                raise ValueError("the period must begin and end on a minute")
        return self


class ContractDeletionRequest(ApiModel):
    """Delete all instrument data of an instrument at a broker."""

    broker: Name
    instrument: Name
    confirm: bool = Field(description=CONFIRM_DESCRIPTION)


class BrokerDeletionRequest(ApiModel):
    """Delete all data of a broker: all its series and all its instrument data. The broker no
    longer occurs in the data stock afterwards."""

    broker: Name
    confirm: bool = Field(description=CONFIRM_DESCRIPTION)


class BrokerForTestRuns(OutModel):
    """The broker for test runs: ``broker`` is the broker whose data a test run uses. It is the
    chosen broker if that occurs in the data stock (``chosen`` is ``true``), otherwise the first
    broker of the data stock in alphabetical order (``chosen`` is ``false``); ``null`` only if
    the data stock has no broker at all."""

    broker: str | None
    chosen: bool


class DeletionResult(OutModel):
    """What a deletion removes (``deleted`` is ``false``, nothing was changed) or removed
    (``deleted`` is ``true``).

    ``instrument`` and ``data`` are set for a series and a period (``data`` is a time unit or
    ``ticks``) and for instrument data (``instrument`` only); ``start`` and ``end`` for a
    period. ``candle_count`` and ``tick_count`` count the candles and ticks that are or were
    removed. ``series_count`` counts the series that no longer exist afterwards (a period
    removes its series if no candle or tick is left). ``instrument_count`` counts the instruments
    whose instrument data are or were removed. ``broker_removed`` tells whether the broker no
    longer occurs in the data stock afterwards.

    ``test_run_broker_reset`` is ``true`` if the broker is the one chosen for test runs and no
    longer occurs afterwards: then no broker is chosen afterwards (specification 5.1), and a
    later import of the same broker does not choose it again. ``test_run_broker`` is the broker
    for test runs after the deletion (with ``deleted`` ``false`` the current one)."""

    kind: Literal["series", "period", "contract", "broker"]
    deleted: bool
    broker: str
    instrument: str | None
    data: str | None
    start: datetime | None
    end: datetime | None
    candle_count: int
    tick_count: int
    series_count: int
    instrument_count: int
    broker_removed: bool
    test_run_broker_reset: bool
    test_run_broker: BrokerForTestRuns


class DeletionRefused(ApiModel):
    """Error body (HTTP 404) of a deletion that is refused because the broker, the instrument,
    the series or the period is unknown. Nothing was changed. ``code`` tells which; ``message``
    is a fixed text."""

    detail: str
    code: DeletionErrorCode
    message: str


class DeletionBlocked(ApiModel):
    """Error body (HTTP 409) of a deletion that is refused because something is going on that
    needs the data. ``reason`` is ``import_running`` while an import process exists. Nothing was
    changed. Later versions add reasons (a running backtest, a step-by-step session)."""

    detail: str
    reason: Literal["import_running"]


# --- completeness -----------------------------------------------------------------------------


class CompletenessRequest(ApiModel):
    """The parts a test run needs. The broker is the broker for test runs unless given."""

    broker: Name | None = Field(
        None, description="The broker to check; without it the broker for test runs."
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
