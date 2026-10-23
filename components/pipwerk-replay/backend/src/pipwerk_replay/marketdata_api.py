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
| ``POST`` | ``/market-data/imports`` | import of several files in one process (multipart) |
| ``POST`` | ``/market-data/imports/preview`` | what the files say about themselves (multipart) |
| ``POST`` | ``/market-data/completeness`` | needed, present, missing for a list of parts |

The broker for test runs is a setting and therefore an internal endpoint
(``/api/replay/settings/test-run-broker``, ``internal_api.py``).

The files of an import are the parts ``file`` of a ``multipart/form-data`` body
(``import_form.py``). The body is at most ``max_import_bytes`` plus the envelope of the form
large (HTTP 413, checked before it is read), a file at most ``max_upload_bytes``, an import at
most ``max_files_per_import`` files.
"""

from __future__ import annotations

import logging
from enum import Enum
from typing import Annotated, Any

from fastapi import APIRouter, Query, Request
from fastapi.responses import JSONResponse, Response
from pipwerk_marketdata import ImportBatchError, MarketDataStoreError
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
from pipwerk_replay.import_form import (
    FIELD_BROKER,
    FIELD_DATA,
    FIELD_FILE,
    FIELD_INSTRUMENT,
    FIELD_TIMEZONE,
    ImportForm,
    body_limit,
    import_refused,
    read_form,
)
from pipwerk_replay.marketdata_examples import json_examples
from pipwerk_replay.marketdata_service import MarketDataService, NoBrokerError, TooManyRunningError
from pipwerk_replay.settings_service import StoredTestRunBrokerInvalidError

logger = logging.getLogger(__name__)

IMPORT_PATH = f"{PUBLIC_PREFIX}/market-data/imports"
PREVIEW_PATH = f"{PUBLIC_PREFIX}/market-data/imports/preview"

TAGS: list[str | Enum] = ["market-data"]

SERIES_NOT_FOUND_TEXT = "There is no such row in the list of series."
INSTRUMENT_NOT_FOUND_TEXT = "There are no data of this instrument."
DATA_STORE_TEXT = "The data stock could not be read or changed."
TOO_MANY_IMPORTS_TEXT = "Too many imports are running. Try again later."
NO_BROKER_TEXT = "The data stock has no broker yet. Import data first."
STORED_TEST_RUN_BROKER_INVALID_TEXT = "The stored pipwerk replay broker for test runs is invalid."


def import_body_limit(service: MarketDataService) -> int:
    """The largest request body of an import and of its preview, from the settings."""
    settings = service.settings
    return body_limit(settings.max_files_per_import, settings.max_import_bytes)


def _data_store_failed(error: MarketDataStoreError) -> Response:
    cause = error.__cause__
    logger.error("The data stock failed (%s).", type(cause).__name__ if cause else "unknown")
    return api_error(503, DATA_STORE_TEXT)


def _stored_test_run_broker_invalid(error: StoredTestRunBrokerInvalidError) -> Response:
    logger.error("%s", error)
    return api_error(503, STORED_TEST_RUN_BROKER_INVALID_TEXT)


_HANDLERS: dict[type[Exception], Handler] = {
    ImportBatchError: lambda error: import_refused(error.code, error.message),
    MarketDataStoreError: _data_store_failed,
    StoredTestRunBrokerInvalidError: _stored_test_run_broker_invalid,
    TooManyRunningError: lambda _error: api_error(429, TOO_MANY_IMPORTS_TEXT),
    NoBrokerError: lambda _error: api_error(409, NO_BROKER_TEXT),
}


def _form_description(
    description: str, *, with_settings: bool, example: dict[str, Any]
) -> dict[str, Any]:
    """The description of the multipart body of an import or its preview, with an example (the
    files are shown by their names)."""
    text: dict[str, Any] = {"type": "string"}
    properties: dict[str, Any] = {
        FIELD_FILE: {
            "type": "array",
            "items": {"type": "string", "format": "binary"},
            "description": "The files, one part each; the file name of the part names the file.",
        },
        FIELD_INSTRUMENT: {
            "type": "array",
            "items": text,
            "description": (
                "Optional: one value per file in the order of the files, an empty value for "
                "none. The instrument of the file at the same position."
            ),
        },
        FIELD_DATA: {
            "type": "array",
            "items": text,
            "description": (
                "Optional: one value per file in the order of the files, an empty value for "
                "none. The data of the file at the same position: a time unit (m1 to mn1), "
                "ticks or contract (a JSON file only)."
            ),
        },
    }
    required = [FIELD_FILE]
    if with_settings:
        properties[FIELD_BROKER] = {
            **text,
            "description": "The broker of all files of the import, also of JSON files.",
        }
        properties[FIELD_TIMEZONE] = {
            **text,
            "description": (
                "IANA name of the time zone of the times in all CSV files, for example "
                "Europe/Athens; needed if there is a CSV file."
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
                    **ex.form_examples(form=("The form, files shown by their names", example)),
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
        "/market-data/imports",
        operation_id="import_market_data_files",
        summary="Import several files in one process",
        description=(
            "Imports any number of files (at most ``max_files_per_import``, default 100; "
            "together at most ``max_import_bytes``, default 256 MiB; each at most "
            "``max_upload_bytes``, default 32 MiB and ``max_rows`` rows, default 500 000). "
            "The body is a ``multipart/form-data`` form: ``broker`` once for all files (it "
            "also replaces the broker named in a JSON file), ``timezone`` once for all CSV "
            "files, and the parts ``file``; optionally ``instrument`` and ``data`` once per "
            "file in the order of the files (an empty value for none). JSON files (JSON format "
            "of ``contracts/market-data/v1/``, candles, ticks or instrument data) name "
            "instrument and data in their content; a given ``instrument`` replaces the one "
            "of the content, a given ``data`` must equal the one of the content. CSV files "
            "(export format of MetaTrader 5, candles or ticks) need ``instrument`` and ``data`` "
            "(a time unit or ``ticks``). Every file is taken over in a transaction of its own; "
            "rows of the same time replace those that exist; rows that fail the checks are "
            "rejected and named with a reason. A file that is refused as a whole (wrong "
            "format, nothing readable, unknown time zone, missing or unknown data) changes "
            "nothing and does not stop the others: the answer (HTTP 200) has a result per "
            "file, in the order of the files. HTTP 422 if the form is wrong or has no file, "
            "HTTP 413 if there are too many files or they are too large together, HTTP 403 "
            "if a web page of another origin sends the form (the header ``Origin`` is not "
            "the address of the backend)."
        ),
        responses={
            200: {
                "description": "The result for every file.",
                "model": models.ImportOutcome,
                "content": json_examples(
                    one_refused=("Three files, one of them refused", ex.IMPORT_OUTCOME)
                ),
            },
            413: {
                "description": "Too many files or too large together (``ImportRefused``), or "
                "the request body is larger than the limit (``ApiError``).",
                "model": models.ImportRefused | ApiError,
                "content": json_examples(
                    too_many_files=("More files than allowed", ex.IMPORT_REFUSED_TOO_MANY)
                ),
            },
            422: {
                "description": "No file (``ImportRefused``) or the form is wrong "
                "(``InvalidRequest``).",
                "model": models.ImportRefused | InvalidRequest,
                "content": json_examples(
                    no_files=("The form has no file", ex.IMPORT_REFUSED_NO_FILES),
                    missing_broker=(
                        "The broker is missing",
                        {
                            "detail": "The request body does not fit the schema.",
                            "errors": [{"location": ["broker"], "type": "missing"}],
                        },
                    ),
                ),
            },
            **error_responses(403, 415, 429, 503),
        },
        openapi_extra=_form_description(
            "The files and what is known about them.", with_settings=True, example=ex.IMPORT_FORM
        ),
    )
    async def import_files(request: Request) -> Response:
        form = await read_form(
            request,
            max_files=limits.max_files_per_import,
            fields=frozenset({FIELD_BROKER, FIELD_TIMEZONE}),
        )
        if isinstance(form, Response):
            return form
        return await run_in_threadpool(_run_import, form)

    def _run_import(form: ImportForm) -> Response:
        def run() -> Response:
            return JSONResponse(content=service.import_files(form).model_dump(mode="json"))

        return guarded(run, _HANDLERS)

    @router.post(
        "/market-data/imports/preview",
        operation_id="preview_market_data_import",
        summary="Read what files say about themselves",
        description=(
            "For the dialog of the import: tells for each file, without importing anything, "
            "its format (``json`` or ``csv``), and the broker, instrument and data it names. "
            "A JSON file names them in its content; a CSV file in its name, as far as the name "
            "follows ``<Instrument>_<Data>_<from>_<to>`` (the export of MetaTrader 5 and the "
            "files meant for the import, for example ``EURUSD_H1_202301020000_202312292300.csv``) "
            "or ``<Instrument>,<Data>`` (also with ``_`` or a space, for example "
            "``EURUSD,H1.csv``), with ``<Data>`` a time unit, ``TICKS`` or ``CONTRACT``, "
            "without regard to case. The content of a CSV file is not read, so the client may "
            "send it empty. ``broker`` of the answer is the broker that all JSON files name "
            "(``null`` if there is none, or they name none or different ones). The form is "
            "that of the import, with the parts ``file`` only; the limits are those of the "
            "import."
        ),
        responses={
            200: {
                "description": "The hints, per file.",
                "model": models.ImportPreview,
                "content": json_examples(
                    hints=(
                        "A JSON file, a CSV file with a known name, one with an unknown",
                        ex.IMPORT_PREVIEW,
                    )
                ),
            },
            413: {
                "description": "Too many files (``ImportRefused``) or the request body is "
                "larger than the limit (``ApiError``).",
                "model": models.ImportRefused | ApiError,
            },
            422: {
                "description": "The form is wrong (``InvalidRequest``).",
                "model": InvalidRequest,
            },
            **error_responses(403, 415, 429, 503),
        },
        openapi_extra=_form_description("The files.", with_settings=False, example=ex.PREVIEW_FORM),
    )
    async def preview_import(request: Request) -> Response:
        form = await read_form(request, max_files=limits.max_files_per_import, fields=frozenset())
        if isinstance(form, Response):
            return form
        return await run_in_threadpool(_run_preview, form)

    def _run_preview(form: ImportForm) -> Response:
        def run() -> Response:
            return JSONResponse(content=service.preview(form.files).model_dump(mode="json"))

        return guarded(run, _HANDLERS)

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
