"""One call of the program: the parts to fetch, the outcome of each, and the files.

A call names instruments, time units, ticks or not, a period and a target directory
(``Request``). Its parts are, for every instrument in the order given: the details of the
instrument (``CONTRACT``, always), the candles of every time unit, and the ticks if asked
(``parts_of``). ``fetch`` runs the parts one after the other. A part that cannot be fetched is
reported with its reason (``PartOutcome.error``) and does not stop the others; the files of
the other parts are written.

If MetaTrader 5 is not reachable, the remaining parts are not tried again: each would wait for
the connection to time out. They get the same reason.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from pydantic import BaseModel

from pipwerk_fetch_mt5.errors import FetchError
from pipwerk_fetch_mt5.files import file_name, write_file
from pipwerk_fetch_mt5.gateway import TimeUnit
from pipwerk_fetch_mt5.models import OmittedRow
from pipwerk_fetch_mt5.service import FetchService

logger = logging.getLogger(__name__)

CONTRACT = "CONTRACT"
TICKS = "TICKS"


@dataclass(frozen=True)
class Request:
    """What the user asked for. ``start`` (included) and ``end`` (excluded) are aware."""

    instruments: tuple[str, ...]
    time_units: tuple[TimeUnit, ...]
    ticks: bool
    start: datetime
    end: datetime
    directory: Path


@dataclass(frozen=True)
class Part:
    """One file to write: the instrument and the data (a time unit in upper case, ``TICKS`` or
    ``CONTRACT``)."""

    instrument: str
    data: str


@dataclass(frozen=True)
class PartOutcome:
    """The outcome of a part: the file that was written, or why there is none."""

    part: Part
    path: Path | None = None
    rows: int | None = None
    omitted_count: int = 0
    omitted: tuple[OmittedRow, ...] = ()
    error: FetchError | None = None


def parts_of(request: Request) -> list[Part]:
    parts: list[Part] = []
    for instrument in request.instruments:
        parts.append(Part(instrument, CONTRACT))
        parts.extend(Part(instrument, unit.upper()) for unit in request.time_units)
        if request.ticks:
            parts.append(Part(instrument, TICKS))
    return parts


def _document_bytes(document: BaseModel) -> bytes:
    return document.model_dump_json(by_alias=True).encode("utf-8")


def _fetch_part(service: FetchService, request: Request, part: Part) -> PartOutcome:
    """Fetch one part and write its file; raises ``FetchError`` if that is not possible."""
    name = file_name(part.instrument, part.data, request.start, request.end)
    if part.data == CONTRACT:
        details = service.instrument_details(part.instrument)
        path = write_file(request.directory, name, _document_bytes(details.file))
        return PartOutcome(part, path=path)
    if part.data == TICKS:
        ticks = service.ticks(part.instrument, request.start, request.end)
        path = write_file(request.directory, name, _document_bytes(ticks.file))
        return PartOutcome(
            part,
            path=path,
            rows=len(ticks.file.ticks),
            omitted_count=ticks.omitted_count,
            omitted=tuple(ticks.omitted),
        )
    unit = next(unit for unit in request.time_units if unit.upper() == part.data)
    candles = service.candles(part.instrument, unit, request.start, request.end)
    path = write_file(request.directory, name, _document_bytes(candles.file))
    return PartOutcome(
        part,
        path=path,
        rows=len(candles.file.candles),
        omitted_count=candles.omitted_count,
        omitted=tuple(candles.omitted),
    )


def fetch(service: FetchService, request: Request) -> list[PartOutcome]:
    """Fetch every part of the request, one after the other, and write the files."""
    outcomes: list[PartOutcome] = []
    unreachable: FetchError | None = None
    for part in parts_of(request):
        if unreachable is not None:
            outcomes.append(PartOutcome(part, error=unreachable))
            continue
        try:
            outcomes.append(_fetch_part(service, request, part))
        except FetchError as error:
            if error.code == "terminal_unavailable":
                unreachable = error
            outcomes.append(PartOutcome(part, error=error))
        except Exception as error:  # a defect must not stop the other parts
            logger.error("A part failed with an unexpected error (%s).", type(error).__name__)
            outcomes.append(PartOutcome(part, error=FetchError("internal_error")))
    return outcomes
