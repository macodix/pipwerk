"""Web API of the data stock under ``/api/v1/market-data/``.

Specification 5.1, 5.3, 7, 8.3 and 11. The module only connects HTTP with the service
(``marketdata_service.py``); it has no other logic. pipwerk replay does not acquire data
(specification 5.4): data come into the data stock only through the import.

| Method | Path | Purpose |
| --- | --- | --- |
| ``GET`` | ``/market-data/series`` | the list of series, filtered, page by page, with the total |
| ``GET`` | ``/market-data/series/details`` | the gaps and the instrument data of one row |
| ``GET`` | ``/market-data/brokers`` | the brokers that occur in the data stock |
| ``GET`` | ``/market-data/instrument`` | the newest data of an instrument |
| ``POST`` | ``/market-data/import-processes`` | begin an import process |
| ``POST`` | ``…/import-processes/{id}/files`` | import one file of the process (multipart) |
| ``POST`` | ``…/import-processes/{id}/finish`` | end the process |
| ``POST`` | ``…/import-processes/{id}/abort`` | abort the process |
| ``POST`` | ``/market-data/import-preview`` | what one file says about itself (multipart) |
| ``POST`` | ``/market-data/deletions/series`` | what deleting a series removes, or delete it |
| ``POST`` | ``/market-data/deletions/period`` | the same for a period of a series |
| ``POST`` | ``/market-data/deletions/contract`` | the same for the instrument data |
| ``POST`` | ``/market-data/deletions/broker`` | the same for all data of a broker |
| ``POST`` | ``/market-data/completeness`` | needed, present, missing for a list of parts |

The broker for test runs is a setting and therefore an internal endpoint
(``/api/replay/settings/test-run-broker``, ``internal_api.py``).

The file of an import is the part ``file`` of a ``multipart/form-data`` body
(``import_form.py``), one file per request. The body is at most ``max_upload_bytes`` plus the
envelope of the form large (HTTP 413, checked before it is read); there is no limit for the number
of files or the total size of an import process (specification 5.3).
"""

from __future__ import annotations

import logging
import re
from collections.abc import Callable
from enum import Enum
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Path, Query, Request
from fastapi.responses import JSONResponse, Response
from pipwerk_marketdata import DeletionError, DeletionErrorCode, MarketDataStoreError
from starlette.concurrency import run_in_threadpool

from pipwerk_replay import marketdata_examples as ex
from pipwerk_replay import marketdata_models as models
from pipwerk_replay.api_support import (
    PUBLIC_PREFIX,
    ApiError,
    Handler,
    InvalidRequest,
    JsonBody,
    api_error,
    body_description,
    error_responses,
    guarded,
    invalid_place,
    parse_body,
)
from pipwerk_replay.body_limit import PathRule
from pipwerk_replay.import_form import (
    FIELD_BROKER,
    FIELD_DATA,
    FIELD_FILE,
    FIELD_INSTRUMENT,
    FIELD_TIMEZONE,
    ImportForm,
    file_too_large,
    read_form,
    request_limit,
)
from pipwerk_replay.marketdata_examples import json_examples
from pipwerk_replay.marketdata_service import (
    ImportGoingOnError,
    ImportProcessNotFoundError,
    MarketDataService,
    NoBrokerError,
    TooManyRunningError,
)
from pipwerk_replay.settings_service import StoredTestRunBrokerInvalidError

logger = logging.getLogger(__name__)

EmptyBody = models.EmptyBody

PROCESSES_PATH = f"{PUBLIC_PREFIX}/market-data/import-processes"
PREVIEW_PATH = f"{PUBLIC_PREFIX}/market-data/import-preview"
#: The path of the request of one file of an import process (the identifier is part of it).
FILE_PATH_PATTERN = re.compile(re.escape(PROCESSES_PATH) + r"/[^/]+/files")

TAGS: list[str | Enum] = ["market-data"]

SERIES_NOT_FOUND_TEXT = "There is no such row in the list of series."
INSTRUMENT_NOT_FOUND_TEXT = "There are no data of this instrument."
DATA_STORE_TEXT = "The data stock could not be read or changed."
TOO_MANY_IMPORTS_TEXT = "Too many files are being imported. Try again later."
NO_BROKER_TEXT = "The data stock has no broker yet. Import data first."
STORED_TEST_RUN_BROKER_INVALID_TEXT = "The stored pipwerk replay broker for test runs is invalid."
PROCESS_NOT_FOUND_TEXT = "The import process does not exist. It has ended or its time has run out."
DELETION_REFUSED_TEXT = "The data cannot be deleted: the broker, the data or the period is unknown."
IMPORT_RUNNING_TEXT = "Data cannot be deleted while an import process exists. End it first."

ProcessId = Annotated[
    UUID, Path(alias="id", description="Identifier of the import process (from its beginning).")
]


def file_path_rules(service: MarketDataService) -> list[PathRule]:
    """The limit of the request of one file and of its preview: the file plus the envelope of the
    form; a body above it is answered with the limit per file (``FileTooLarge``)."""
    limit = service.settings.max_upload_bytes
    return [
        PathRule(pattern, request_limit(limit), lambda: file_too_large(limit))
        for pattern in (FILE_PATH_PATTERN, re.compile(re.escape(PREVIEW_PATH)))
    ]


def _data_store_failed(error: MarketDataStoreError) -> Response:
    cause = error.__cause__
    logger.error("The data stock failed (%s).", type(cause).__name__ if cause else "unknown")
    return api_error(503, DATA_STORE_TEXT)


def _stored_test_run_broker_invalid(error: StoredTestRunBrokerInvalidError) -> Response:
    logger.error("%s", error)
    return api_error(503, STORED_TEST_RUN_BROKER_INVALID_TEXT)


def _deletion_refused(error: DeletionError) -> Response:
    body = models.DeletionRefused(
        detail=DELETION_REFUSED_TEXT, code=error.code, message=error.message
    )
    status = 422 if error.code is DeletionErrorCode.PERIOD_INVALID else 404
    return JSONResponse(status_code=status, content=body.model_dump(mode="json"))


def _import_running(_error: ImportGoingOnError) -> Response:
    body = models.DeletionBlocked(detail=IMPORT_RUNNING_TEXT, reason="import_running")
    return JSONResponse(status_code=409, content=body.model_dump(mode="json"))


_HANDLERS: dict[type[Exception], Handler] = {
    DeletionError: _deletion_refused,
    ImportGoingOnError: _import_running,
    ImportProcessNotFoundError: lambda _error: api_error(404, PROCESS_NOT_FOUND_TEXT),
    MarketDataStoreError: _data_store_failed,
    StoredTestRunBrokerInvalidError: _stored_test_run_broker_invalid,
    TooManyRunningError: lambda _error: api_error(429, TOO_MANY_IMPORTS_TEXT),
    NoBrokerError: lambda _error: api_error(409, NO_BROKER_TEXT),
}


def _form_description(
    description: str, *, with_settings: bool, example: dict[str, Any]
) -> dict[str, Any]:
    """The description of the multipart body of the request of a file or of its preview, with
    an example (the file is shown by its name)."""
    text: dict[str, Any] = {"type": "string"}
    properties: dict[str, Any] = {
        FIELD_FILE: {
            "type": "string",
            "format": "binary",
            "description": "The file, exactly one part; the file name of the part names the file.",
        },
        FIELD_INSTRUMENT: {
            **text,
            "description": "Optional: the instrument of the file; an empty value says none.",
        },
        FIELD_DATA: {
            **text,
            "description": (
                "Optional: the data of the file; an empty value says none. A time unit (m1 to "
                "mn1), ticks or contract (a JSON file only)."
            ),
        },
    }
    required = [FIELD_FILE]
    if with_settings:
        properties[FIELD_BROKER] = {
            **text,
            "description": "The broker of all files of the import process, also of JSON files.",
        }
        properties[FIELD_TIMEZONE] = {
            **text,
            "description": (
                "IANA name of the time zone of the times in all CSV files of the process, for "
                "example Europe/Athens; needed if the file is a CSV file."
            ),
        }
        required = [FIELD_BROKER, FIELD_FILE]
    return {
        "requestBody": {
            "required": True,
            "description": description,
            "content": {
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "properties": properties,
                        "required": required,
                        "additionalProperties": False,
                    },
                    **ex.form_examples(form=("The form, the file shown by its name", example)),
                }
            },
        }
    }


def build_router(service: MarketDataService) -> APIRouter:
    """The router of the data stock with the prefix ``/api/v1``."""
    router = APIRouter(prefix=PUBLIC_PREFIX, tags=TAGS)
    limits = service.settings

    @router.get(
        "/market-data/series",
        operation_id="list_market_data_series",
        summary="List the series of the data stock",
        description=(
            "Lists the rows of the data stock page by page: one row per broker, instrument and "
            "data (candles of a time unit, ticks, or - for an instrument that has instrument "
            "data and no series - the instrument data, ``contract``), with the first and the "
            "last moment and the number of gaps. The filters ``broker``, ``instrument`` and "
            "``data`` each match a part of the text without regard to case; a filter that "
            "no row matches (for example an unknown identifier of data) gives an empty list. "
            "``total`` counts all rows that match. The rows are sorted by broker, instrument "
            "and data (time units from short to long, then ticks, then contract). ``limit`` "
            "is at most ``max_listed_items`` (default 1000)."
        ),
        responses={
            200: {
                "description": "The page of rows.",
                "model": models.SeriesPage,
                "content": json_examples(
                    page=(
                        "Three rows: candles M1 with gaps, ticks, instrument data only",
                        ex.SERIES_PAGE,
                    ),
                    empty=(
                        "An empty data stock",
                        {"items": [], "total": 0, "offset": 0, "limit": 1000},
                    ),
                ),
            },
            **error_responses(422, 503),
        },
    )
    def list_series(query: Annotated[models.SeriesQuery, Query()]) -> Response:
        def run() -> Response:
            if query.limit is not None and query.limit > limits.max_listed_items:
                return invalid_place(["query", "limit"], "less_than_equal")
            return JSONResponse(content=service.series(query).model_dump(mode="json"))

        return guarded(run, _HANDLERS)

    @router.get(
        "/market-data/series/details",
        operation_id="read_market_data_series_details",
        summary="Read the details of a row of the list of series",
        description=(
            "Returns the gaps of the row (at most ``max_listed_items``, in time order; "
            "``row.gap_count`` counts all) and the newest instrument data of the instrument at "
            "this broker (``contract``; ``null`` if there are none). The row is named by "
            "``broker``, ``instrument`` and ``data`` exactly as the list shows them. HTTP 404 if "
            "the list has no such row, also for an identifier of data that does not exist."
        ),
        responses={
            200: {
                "description": "The details.",
                "model": models.SeriesDetails,
                "content": json_examples(
                    with_contract=("Gaps and instrument data", ex.SERIES_DETAILS),
                    without_contract=(
                        "No gaps, and the instrument data are missing",
                        ex.SERIES_DETAILS_WITHOUT_CONTRACT,
                    ),
                ),
            },
            **error_responses(404, 422, 503, not_found=SERIES_NOT_FOUND_TEXT),
        },
    )
    def read_series_details(query: Annotated[models.SeriesDetailsQuery, Query()]) -> Response:
        def run() -> Response:
            found = service.series_details(query)
            if found is None:
                return api_error(404, SERIES_NOT_FOUND_TEXT)
            return JSONResponse(content=found.model_dump(mode="json"))

        return guarded(run, _HANDLERS)

    @router.get(
        "/market-data/brokers",
        operation_id="list_market_data_brokers",
        summary="List the brokers of the data stock",
        description=(
            "Lists the brokers that occur in the data stock (in a series or in instrument "
            "data), sorted without regard to case. The import dialog proposes them; the "
            "broker for test runs is chosen among them."
        ),
        responses={
            200: {
                "description": "The brokers.",
                "model": models.Brokers,
                "content": json_examples(brokers=("Two brokers", ex.BROKERS)),
            },
            **error_responses(503),
        },
    )
    def list_brokers() -> Response:
        def run() -> Response:
            return JSONResponse(content=service.brokers().model_dump(mode="json"))

        return guarded(run, _HANDLERS)

    @router.get(
        "/market-data/instrument",
        operation_id="read_market_data_instrument",
        summary="Read the data of an instrument",
        description=(
            "Returns the newest data of an instrument at a broker (contract size, tick value, "
            "swap, margin and the moment they were obtained); with ``as_of`` the newest data "
            "obtained not after that moment."
        ),
        responses={
            200: {"description": "The data of the instrument.", "model": models.InstrumentInfo},
            **error_responses(404, 422, 503, not_found=INSTRUMENT_NOT_FOUND_TEXT),
        },
    )
    def read_instrument(query: Annotated[models.InstrumentQuery, Query()]) -> Response:
        def run() -> Response:
            found = service.instrument(query)
            if found is None:
                return api_error(404, INSTRUMENT_NOT_FOUND_TEXT)
            return JSONResponse(content=found.model_dump(mode="json"))

        return guarded(run, _HANDLERS)

    @router.post(
        "/market-data/import-processes",
        operation_id="begin_market_data_import",
        status_code=201,
        summary="Begin an import process",
        description=(
            "Begins an import process (specification 5.3 and 5.5). The client sends the files of "
            "the process one after the other, each in a request of its own to "
            "``/market-data/import-processes/{id}/files``, and ends the process with "
            "``finish`` or ``abort``. A process exists in the backend from its beginning to its "
            "end or abort, also between the requests of its files. It ends by itself when no "
            "request of it arrives for ``idle_timeout_seconds`` (``import_idle_timeout_seconds`` "
            "of the startup configuration, default 300); a later request of it is answered with "
            "HTTP 404. While a process exists, nothing can be deleted from the data stock "
            "(HTTP 409). There is no limit for the number of files of a process or their total "
            "size. The body is a JSON object without fields (``{}``)."
        ),
        responses={
            201: {
                "description": "The process was begun.",
                "model": models.ImportProcess,
                "content": json_examples(begun=("A process", ex.IMPORT_PROCESS)),
            },
            **error_responses(413, 415, 422),
        },
        openapi_extra=body_description(EmptyBody, "No fields: an empty JSON object."),
    )
    def begin_import(body: JsonBody) -> Response:
        def run() -> Response:
            parse_body(body, EmptyBody)
            return JSONResponse(
                status_code=201, content=service.begin_import().model_dump(mode="json")
            )

        return guarded(run, _HANDLERS)

    @router.post(
        "/market-data/import-processes/{id}/files",
        operation_id="import_market_data_file",
        summary="Import one file of an import process",
        description=(
            "Imports one file of the process, in a transaction of its own (specification 5.3). "
            "The body is a ``multipart/form-data`` form with exactly one part ``file`` and: "
            "``broker`` (the same for all files of the process; it also replaces the broker "
            "named in a JSON file), ``timezone`` (the same for all CSV files of the process), "
            "and optionally ``instrument`` and ``data``. JSON files (JSON format of "
            "``contracts/market-data/v1/``, candles, ticks or instrument data) name instrument "
            "and data in their content; a given ``instrument`` replaces the one of the content, "
            "a given ``data`` must equal the one of the content. CSV files (export format of "
            "MetaTrader 5, candles or ticks) need ``instrument`` and ``data`` (a time unit or "
            "``ticks``) and ``timezone``. Rows of the same time replace those that exist; rows "
            "that fail the checks are rejected and named with a reason; a CSV file covers whole "
            "days of its time zone. A file that is refused as a whole (wrong format, nothing "
            "readable, unknown time zone, missing or unknown data, larger than the limit per "
            "file or with more rows than the limit) changes nothing and does not stop the "
            "process: the answer (HTTP 200) has ``refused`` true and ``error`` and ``message``. "
            "The limit per file is ``max_upload_bytes`` (default 32 MiB) and ``max_rows`` rows "
            "(default 500 000); ``message`` names it in the unit of the user. A request whose "
            "body is larger than the file limit plus the envelope of the form is answered with "
            "HTTP 413 (``FileTooLarge``) before it is read; the client treats it as the "
            "refusal ``too_large`` of that file. Each request starts the idle time of the "
            "process again. HTTP 404 if the process does not exist (any more), HTTP 422 if the "
            "form is wrong or has no or more than one file, HTTP 403 if a web page of another "
            "origin sends the form (the header ``Origin`` is not the address of the backend), "
            "HTTP 429 if too many files are being imported at the same time."
        ),
        responses={
            200: {
                "description": "The result for the file.",
                "model": models.FileOutcome,
                "content": json_examples(
                    imported=("A file that was taken over", ex.FILE_IMPORTED),
                    refused=("A file that was refused", ex.FILE_REFUSED),
                ),
            },
            413: {
                "description": "The body is larger than the limit per file plus the envelope "
                "of the form (``FileTooLarge``), or the request is not a file request "
                "(``ApiError``).",
                "model": models.FileTooLarge | ApiError,
                "content": json_examples(too_large=("A file over the limit", ex.FILE_TOO_LARGE)),
            },
            422: {
                "description": "The form is wrong (``InvalidRequest``).",
                "model": InvalidRequest,
                "content": json_examples(
                    missing_broker=(
                        "The broker is missing",
                        {
                            "detail": "The request body does not fit the schema.",
                            "errors": [{"location": ["broker"], "type": "missing"}],
                        },
                    ),
                ),
            },
            **error_responses(403, 404, 415, 429, 503, not_found=PROCESS_NOT_FOUND_TEXT),
        },
        openapi_extra=_form_description(
            "The file and what is known about it.", with_settings=True, example=ex.IMPORT_FORM
        ),
    )
    async def import_file(process_id: ProcessId, request: Request) -> Response:
        form = await read_form(request, fields=frozenset({FIELD_BROKER, FIELD_TIMEZONE}))
        if isinstance(form, Response):
            return form
        return await run_in_threadpool(_run_import, str(process_id), form)

    def _run_import(process_id: str, form: ImportForm) -> Response:
        def run() -> Response:
            return JSONResponse(
                content=service.import_file(process_id, form).model_dump(mode="json")
            )

        return guarded(run, _HANDLERS)

    @router.post(
        "/market-data/import-processes/{id}/finish",
        operation_id="finish_market_data_import",
        summary="End an import process",
        description=(
            "Ends the process after its last file. The answer counts the files that were taken "
            "over and the files that were refused. The data stock can be deleted from again when "
            "no other process exists. The body is a JSON object without fields (``{}``). HTTP "
            "404 if the process does not exist (any more)."
        ),
        responses={
            200: {
                "description": "The process has ended.",
                "model": models.ImportProcessEnd,
                "content": json_examples(finished=("A process that was finished", ex.IMPORT_END)),
            },
            **error_responses(404, 413, 415, 422, not_found=PROCESS_NOT_FOUND_TEXT),
        },
        openapi_extra=body_description(EmptyBody, "No fields: an empty JSON object."),
    )
    def finish_import(process_id: ProcessId, body: JsonBody) -> Response:
        return _end(process_id, body, aborted=False)

    @router.post(
        "/market-data/import-processes/{id}/abort",
        operation_id="abort_market_data_import",
        summary="Abort an import process",
        description=(
            "Aborts the process: it ends, and the files that were taken over stay taken over "
            "(each was a transaction of its own). A file that is being imported at this moment "
            "is finished by its own request. Files that were not begun are not imported; the "
            "client names them 'not imported'. The body is a JSON object without fields "
            "(``{}``). HTTP 404 if the process does not exist (any more)."
        ),
        responses={
            200: {
                "description": "The process has ended.",
                "model": models.ImportProcessEnd,
                "content": json_examples(aborted=("A process that was aborted", ex.IMPORT_ABORT)),
            },
            **error_responses(404, 413, 415, 422, not_found=PROCESS_NOT_FOUND_TEXT),
        },
        openapi_extra=body_description(EmptyBody, "No fields: an empty JSON object."),
    )
    def abort_import(process_id: ProcessId, body: JsonBody) -> Response:
        return _end(process_id, body, aborted=True)

    def _end(process_id: UUID, body: bytes, *, aborted: bool) -> Response:
        def run() -> Response:
            parse_body(body, EmptyBody)
            ended = service.end_import(str(process_id), aborted=aborted)
            return JSONResponse(content=ended.model_dump(mode="json"))

        return guarded(run, _HANDLERS)

    @router.post(
        "/market-data/import-preview",
        operation_id="preview_market_data_import",
        summary="Read what a file says about itself",
        description=(
            "For the dialog of the import: tells for one file, without importing anything, its "
            "format (``json`` or ``csv``), and the broker, instrument and data it names. A JSON "
            "file names them in its content; a CSV file in its name, as far as the name follows "
            "``<Instrument>_<Data>_<from>_<to>`` (the export of MetaTrader 5 and the files meant "
            "for the import, for example ``EURUSD_H1_202301020000_202312292300.csv``) or "
            "``<Instrument>,<Data>`` (also with ``_`` or a space, for example "
            "``EURUSD,H1.csv``), with ``<Data>`` a time unit, ``TICKS`` or ``CONTRACT``, "
            "without regard to case. The content of a CSV file is not read, so the client may "
            "send it empty. The dialog asks once per file and compares the brokers that JSON "
            "files name: if all name the same, it is the broker of the process. The form is "
            "that of the request of a file, with the part ``file`` only (exactly one); the "
            "limit per file and the answers 413 and 422 are those of the import of a file. No "
            "import process is needed."
        ),
        responses={
            200: {
                "description": "What the file says about itself.",
                "model": models.FileHint,
                "content": json_examples(
                    json=("A JSON file", ex.HINT_JSON),
                    csv=("A CSV file with a known name", ex.HINT_CSV),
                    unknown=("A CSV file with an unknown name", ex.HINT_UNKNOWN),
                ),
            },
            413: {
                "description": "The body is larger than the limit per file plus the envelope "
                "of the form (``FileTooLarge``).",
                "model": models.FileTooLarge | ApiError,
                "content": json_examples(too_large=("A file over the limit", ex.FILE_TOO_LARGE)),
            },
            422: {
                "description": "The form is wrong (``InvalidRequest``).",
                "model": InvalidRequest,
            },
            **error_responses(403, 415, 429, 503),
        },
        openapi_extra=_form_description("The file.", with_settings=False, example=ex.PREVIEW_FORM),
    )
    async def preview_import(request: Request) -> Response:
        form = await read_form(request, fields=frozenset())
        if isinstance(form, Response):
            return form
        return await run_in_threadpool(_run_preview, form)

    def _run_preview(form: ImportForm) -> Response:
        def run() -> Response:
            return JSONResponse(content=service.preview(form.file).model_dump(mode="json"))

        return guarded(run, _HANDLERS)

    # --- deleting (specification 5.5) ---------------------------------------------------------

    def _deletion(
        operation: Callable[[Any], models.DeletionResult], body: bytes, model: type[Any]
    ) -> Response:
        def run() -> Response:
            result = operation(parse_body(body, model))
            return JSONResponse(content=result.model_dump(mode="json"))

        return guarded(run, _HANDLERS)

    deletion_responses: dict[int | str, dict[str, Any]] = {
        200: {
            "description": "What is deleted (``deleted`` true) or would be deleted (``deleted`` "
            "false, nothing was changed).",
            "model": models.DeletionResult,
        },
        404: {
            "description": "The broker, the instrument, the series or the period is unknown: "
            "nothing was changed (``DeletionRefused``, ``code`` tells which).",
            "model": models.DeletionRefused,
            "content": json_examples(unknown=("An unknown broker", ex.DELETION_REFUSED)),
        },
        409: {
            "description": "An import process exists: nothing was changed (``DeletionBlocked``).",
            "model": models.DeletionBlocked,
            "content": json_examples(running=("An import process exists", ex.DELETION_BLOCKED)),
        },
        **error_responses(413, 415, 422, 503),
    }

    @router.post(
        "/market-data/deletions/series",
        operation_id="delete_market_data_series",
        summary="Delete a whole series",
        description=(
            "Deletes the candles of a time unit or the ticks of an instrument at a broker with "
            "their covered periods and trading hours (specification 5.5). With ``confirm`` false "
            "it only tells what would be deleted (broker, instrument, data, number of candles or "
            "ticks); with ``confirm`` true it deletes, in one transaction, and tells what was "
            "deleted. The deletion cannot be undone; the client asks the user first. Refused "
            "with HTTP 409 while an import process exists (the preview, too). If this removes "
            "the last data of the broker, the broker no longer occurs in the data stock, and if "
            "it was the broker for test runs, no broker is chosen afterwards "
            "(``test_run_broker_reset``). Saved backtests stay unchanged."
        ),
        responses={
            **deletion_responses,
            200: {
                **deletion_responses[200],
                "content": json_examples(
                    preview=("What deleting a series would remove", ex.DELETION_SERIES_PREVIEW),
                    deleted=("A series that was deleted", ex.DELETION_SERIES),
                ),
            },
        },
        openapi_extra=body_description(
            models.SeriesDeletionRequest, "The series, and whether to delete."
        ),
    )
    def delete_series(body: JsonBody) -> Response:
        return _deletion(service.delete_series, body, models.SeriesDeletionRequest)

    @router.post(
        "/market-data/deletions/period",
        operation_id="delete_market_data_period",
        summary="Delete a period of a series",
        description=(
            "Deletes the candles or ticks from ``start`` (included) to ``end`` (excluded), UTC "
            "and on the minute, and takes the period out of the covered periods of the series "
            "(specification 5.5). A period inside the series becomes a gap if it contains "
            "trading time. A series without a candle or tick left no longer exists. With "
            "``confirm`` false it only tells what would be deleted. HTTP 404 with the code "
            "``period_empty`` if the series has neither data nor a covered period in the "
            "period. The other rules are those of the deletion of a series."
        ),
        responses={
            **deletion_responses,
            200: {
                **deletion_responses[200],
                "content": json_examples(
                    deleted=("A period that was deleted", ex.DELETION_PERIOD),
                ),
            },
        },
        openapi_extra=body_description(
            models.PeriodDeletionRequest, "The series, the period, and whether to delete."
        ),
    )
    def delete_period(body: JsonBody) -> Response:
        return _deletion(service.delete_period, body, models.PeriodDeletionRequest)

    @router.post(
        "/market-data/deletions/contract",
        operation_id="delete_market_data_contract",
        summary="Delete the instrument data of an instrument",
        description=(
            "Deletes all instrument data (contract size, tick value, swap, margin; every "
            "version) of an instrument at a broker (specification 5.5). They have no time and "
            "are deleted as a whole. With ``confirm`` false it only tells what would be "
            "deleted. The other rules are those of the deletion of a series."
        ),
        responses={
            **deletion_responses,
            200: {
                **deletion_responses[200],
                "content": json_examples(
                    deleted=("Instrument data that were deleted", ex.DELETION_CONTRACT),
                ),
            },
        },
        openapi_extra=body_description(
            models.ContractDeletionRequest, "The instrument, and whether to delete."
        ),
    )
    def delete_contract(body: JsonBody) -> Response:
        return _deletion(service.delete_contract, body, models.ContractDeletionRequest)

    @router.post(
        "/market-data/deletions/broker",
        operation_id="delete_market_data_broker",
        summary="Delete all data of a broker",
        description=(
            "Deletes all series and all instrument data of a broker (specification 5.5). The "
            "broker no longer occurs in the data stock afterwards (``broker_removed``). If it "
            "was the broker for test runs, no broker is chosen afterwards "
            "(``test_run_broker_reset`` true; ``test_run_broker`` is then the first broker of "
            "the data stock, ``chosen`` false), and a later import of the same broker does not "
            "choose it again. With ``confirm`` false it only tells what would be deleted "
            "(number of series, candles, ticks, instruments). The other rules are those of the "
            "deletion of a series."
        ),
        responses={
            **deletion_responses,
            200: {
                **deletion_responses[200],
                "content": json_examples(
                    preview=("What deleting a broker would remove", ex.DELETION_BROKER_PREVIEW),
                    deleted=("A broker that was deleted", ex.DELETION_BROKER),
                ),
            },
        },
        openapi_extra=body_description(
            models.BrokerDeletionRequest, "The broker, and whether to delete."
        ),
    )
    def delete_broker(body: JsonBody) -> Response:
        return _deletion(service.delete_broker, body, models.BrokerDeletionRequest)

    @router.post(
        "/market-data/completeness",
        operation_id="check_market_data_completeness",
        summary="Check the completeness for a list of needed parts",
        description=(
            "For every needed part (candles of a time unit or ticks of an instrument in a "
            "period, or the data of an instrument) tells what is needed, what is present and "
            "what is missing, in the order of the request. The broker is the broker for test "
            "runs unless the request names one (HTTP 409 if the data stock has no broker at "
            "all). At most ``max_parts_per_request`` parts (default 100)."
        ),
        responses={
            200: {"description": "Needed, present and missing.", "model": models.Completeness},
            **error_responses(409, 413, 415, 422, 503),
        },
        openapi_extra=body_description(models.CompletenessRequest, "The needed parts."),
    )
    def check_completeness(body: JsonBody) -> Response:
        def run() -> Response:
            request = parse_body(body, models.CompletenessRequest)
            if len(request.parts) > limits.max_parts_per_request:
                return invalid_place(["parts"], "too_long")
            return JSONResponse(content=service.completeness(request).model_dump(mode="json"))

        return guarded(run, _HANDLERS)

    return router
