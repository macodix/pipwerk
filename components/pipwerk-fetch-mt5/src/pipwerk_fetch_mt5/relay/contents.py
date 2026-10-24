"""The contents of the messages of the retrieval (specification relay 6.2).

Three kinds of messages, every content a JSON object with a strict model (additional fields are
rejected, ``extra="forbid"``); the JSON schemas under ``contracts/messages/v1/`` are generated
from these models (``schemas.py``):

``fetch.request``
    The request: broker, symbol, optionally a designation (``instrument``), time units, ticks
    yes or no, period (``from`` included, ``to`` excluded, UTC).
``fetch.file``
    One file as the attachment of the message: its name, the kind of data, the number of rows
    and the rows that were left out, by reason.
``fetch.result``
    The end of an answer: the names of all files that were delivered and every part that could
    not be fetched, or, if the request as a whole is refused, the reason in ``error``.

The names of the files, the kinds of data, the reasons of the parts and the omitted rows are
those of the program on the command line (``files.py``, ``errors.py``, ``models.py``).
"""

from __future__ import annotations

import json
import re
from collections.abc import Mapping
from datetime import UTC, datetime
from typing import Annotated, Any, Literal, Self, cast

from pydantic import BaseModel, ConfigDict, Field, JsonValue, ValidationError, model_validator

from pipwerk_fetch_mt5.errors import REASONS, ErrorCode
from pipwerk_fetch_mt5.fetch import FIRST_YEAR, LAST_YEAR
from pipwerk_fetch_mt5.files import INSTRUMENT_PATTERN
from pipwerk_fetch_mt5.gateway import TimeUnit
from pipwerk_fetch_mt5.models import OmittedReason

KIND_REQUEST = "fetch.request"
KIND_FILE = "fetch.file"
KIND_RESULT = "fetch.result"

TimeUnitName = Literal[
    "M1",
    "M2",
    "M3",
    "M4",
    "M5",
    "M6",
    "M10",
    "M12",
    "M15",
    "M20",
    "M30",
    "H1",
    "H2",
    "H3",
    "H4",
    "H6",
    "H8",
    "H12",
    "D1",
    "W1",
    "MN1",
]
"""The 21 time units of MetaTrader 5, in upper case as in the names of the files."""

DataName = Literal[
    "M1",
    "M2",
    "M3",
    "M4",
    "M5",
    "M6",
    "M10",
    "M12",
    "M15",
    "M20",
    "M30",
    "H1",
    "H2",
    "H3",
    "H4",
    "H6",
    "H8",
    "H12",
    "D1",
    "W1",
    "MN1",
    "TICKS",
    "CONTRACT",
]
"""The kind of data of a file: a time unit, ``TICKS`` or ``CONTRACT``."""

PartErrorCode = Literal[
    "symbol_unknown",
    "no_data",
    "range_too_large",
    "terminal_unavailable",
    "broker_error",
    "broker_unknown",
    "invalid_broker_data",
    "write_failed",
    "internal_error",
]
"""Why a part could not be fetched."""

RequestErrorCode = Literal[
    "request_invalid",
    "broker_mismatch",
    "terminal_unavailable",
    "broker_unknown",
    "internal_error",
]
"""Why the request as a whole was not carried out."""

#: A broker as the schemas of the import define it (1 to 128 characters, no control characters,
#: no blank at either end).
_BROKER = r"^\S(?:[^\x00-\x1f\x7f]*\S)?$"
_SYMBOL = r"^[^\x00-\x1f\x7f]{1,64}$"
_INSTRUMENT = r"^[A-Za-z0-9][A-Za-z0-9._#+-]{0,63}$"
_MOMENT = r"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$"
_STAMP = r"[0-9]{8}(?:T[0-9]{6})?"
_FILE_NAME = (
    r"^[A-Za-z0-9][A-Za-z0-9._#+-]{0,63}_[A-Z][A-Z0-9]{1,7}_" + _STAMP + "_" + _STAMP + r"\.json$"
)
_MAX_FILES = 64
_MAX_TEXT = 200
_MOMENT_FORMAT = "%Y-%m-%dT%H:%M:%SZ"

Moment = Annotated[str, Field(pattern=_MOMENT, examples=["2026-01-05T00:00:00Z"])]
FileName = Annotated[str, Field(pattern=_FILE_NAME, examples=["EURUSD_H1_20260105_20260106.json"])]


def format_moment(moment: datetime) -> str:
    """A moment as it stands in a message: UTC, whole seconds, trailing ``Z``."""
    return moment.astimezone(UTC).strftime(_MOMENT_FORMAT)


def parse_moment(text: str) -> datetime:
    """The moment of a text in the form of ``format_moment``; raises ``ValueError``."""
    if re.fullmatch(_MOMENT, text) is None:
        raise ValueError("not a moment in UTC")
    moment = datetime.strptime(text, _MOMENT_FORMAT).replace(tzinfo=UTC)
    if not FIRST_YEAR <= moment.year <= LAST_YEAR:
        raise ValueError("the year is out of range")
    return moment


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, frozen=True)


def _check_moments(start: str, end: str) -> None:
    if not parse_moment(start) < parse_moment(end):
        raise ValueError("'from' must lie before 'to'")


class FetchRequestContent(_Strict):
    """Content of ``fetch.request`` (specification relay 6.2)."""

    broker: Annotated[str, Field(min_length=1, max_length=128, pattern=_BROKER)]
    symbol: Annotated[str, Field(pattern=_SYMBOL)]
    instrument: Annotated[str, Field(pattern=_INSTRUMENT)] | None = None
    time_units: Annotated[list[TimeUnitName], Field(max_length=21)]
    ticks: bool
    start: Annotated[Moment, Field(alias="from")]
    end: Annotated[Moment, Field(alias="to")]

    @model_validator(mode="after")
    def _check(self) -> Self:
        if len(set(self.time_units)) != len(self.time_units):
            raise ValueError("a time unit is named twice")
        _check_moments(self.start, self.end)
        if INSTRUMENT_PATTERN.fullmatch(self.designation) is None:
            raise ValueError("the symbol cannot be the designation; name an instrument")
        return self

    @property
    def designation(self) -> str:
        """The designation that the files carry: ``instrument``, else the symbol."""
        return self.instrument if self.instrument is not None else self.symbol

    @property
    def start_time(self) -> datetime:
        return parse_moment(self.start)

    @property
    def end_time(self) -> datetime:
        return parse_moment(self.end)

    @property
    def units(self) -> tuple[TimeUnit, ...]:
        """The time units as the program names them inside (lower case)."""
        return tuple(cast(TimeUnit, name.lower()) for name in self.time_units)

    @classmethod
    def of(
        cls,
        *,
        broker: str,
        symbol: str,
        instrument: str | None,
        time_units: list[TimeUnitName],
        ticks: bool,
        start: datetime,
        end: datetime,
    ) -> Self:
        """The content for a request; raises ``ValidationError`` if it is not valid."""
        values: dict[str, Any] = {
            "broker": broker,
            "symbol": symbol,
            "time_units": time_units,
            "ticks": ticks,
            "from": format_moment(start),
            "to": format_moment(end),
        }
        if instrument is not None:
            values["instrument"] = instrument
        return cls.model_validate(values)


class FetchFileContent(_Strict):
    """Content of ``fetch.file``: the one file in the attachment of the message."""

    name: FileName
    data: DataName
    rows: Annotated[int, Field(ge=0)] | None = None
    omitted: dict[OmittedReason, Annotated[int, Field(ge=1)]] = Field(default_factory=dict)

    @model_validator(mode="after")
    def _check(self) -> Self:
        parts = self.name.removesuffix(".json").rsplit("_", 3)
        if len(parts) != 4 or parts[1] != self.data:
            raise ValueError("the name of the file does not belong to the kind of data")
        return self


class FailedPart(_Strict):
    """A part that could not be fetched: the kind of data, the period and the reason."""

    data: DataName
    start: Annotated[Moment, Field(alias="from")]
    end: Annotated[Moment, Field(alias="to")]
    code: PartErrorCode
    text: Annotated[str, Field(min_length=1, max_length=_MAX_TEXT)]

    @model_validator(mode="after")
    def _check(self) -> Self:
        _check_moments(self.start, self.end)
        return self


class RequestError(_Strict):
    """Why the request as a whole was not carried out."""

    code: RequestErrorCode
    text: Annotated[str, Field(min_length=1, max_length=_MAX_TEXT)]

    @classmethod
    def of(cls, code: ErrorCode) -> Self:
        """The reason for a code, with its fixed text."""
        return cls.model_validate({"code": code, "text": REASONS[code]})


class FetchResultContent(_Strict):
    """Content of ``fetch.result``: the end of an answer."""

    files: Annotated[list[FileName], Field(max_length=_MAX_FILES)]
    failed: Annotated[list[FailedPart], Field(max_length=_MAX_FILES)]
    error: RequestError | None = None

    @model_validator(mode="after")
    def _check(self) -> Self:
        if self.error is not None and (self.files or self.failed):
            raise ValueError("a refused request has neither files nor failed parts")
        return self


CONTENT_MODELS: Mapping[str, type[BaseModel]] = {
    KIND_REQUEST: FetchRequestContent,
    KIND_FILE: FetchFileContent,
    KIND_RESULT: FetchResultContent,
}
"""The model of the content by kind."""


def dump_content(content: BaseModel) -> dict[str, JsonValue]:
    """The content as the JSON object of a message."""
    dumped = content.model_dump(mode="json", by_alias=True, exclude_none=True)
    return cast(dict[str, JsonValue], dumped)


def load_content[M: BaseModel](model: type[M], content: Mapping[str, JsonValue]) -> M:
    """Check the content of a message against its model; raises ``ValidationError``.

    The content is checked as JSON text (like a content that arrives from the wire)."""
    return model.model_validate_json(json.dumps(dict(content), ensure_ascii=False))


MAX_PLAIN_TEXT = 300
"""The longest text of a message that is shown on the terminal."""


def plain_text(value: object) -> str:
    """A text from a message for the terminal: control characters replaced by ``?``, shortened.

    The text of a notice comes from the network; escape sequences must not reach the terminal.
    """
    text = str(value)
    return "".join(character if character.isprintable() else "?" for character in text)[
        :MAX_PLAIN_TEXT
    ]


__all__ = [
    "CONTENT_MODELS",
    "KIND_FILE",
    "KIND_REQUEST",
    "KIND_RESULT",
    "MAX_PLAIN_TEXT",
    "DataName",
    "FailedPart",
    "FetchFileContent",
    "FetchRequestContent",
    "FetchResultContent",
    "PartErrorCode",
    "RequestError",
    "RequestErrorCode",
    "TimeUnitName",
    "ValidationError",
    "dump_content",
    "format_moment",
    "load_content",
    "parse_moment",
    "plain_text",
]
