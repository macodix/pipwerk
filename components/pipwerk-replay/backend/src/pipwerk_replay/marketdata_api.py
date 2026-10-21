"""Web API of the data stock and the acquisition under ``/api/v1/market-data/``.

Specification 7, 5.1 to 5.4 and 11. The module only connects HTTP with the services
(``marketdata_service.py``, ``acquisition.py``); it has no other logic.

| Method | Path | Purpose |
| --- | --- | --- |
| ``GET`` | ``/market-data/overview`` | series with periods and gaps, instruments |
| ``GET`` | ``/market-data/instrument`` | the newest data of an instrument |
| ``POST`` | ``/market-data/imports/json`` | import of a JSON file (the body is the file) |
| ``POST`` | ``/market-data/imports/csv`` | import of a CSV file (the body is the file) |
| ``POST`` | ``/market-data/completeness`` | needed, present, missing for a list of parts |
| ``POST`` | ``/market-data/acquisitions`` | start an acquisition from the source (HTTP 202) |
| ``GET`` | ``/market-data/acquisitions/{id}`` | state of an acquisition, part by part |

An uploaded file is the body of the request, not a form: ``Content-Type: application/json`` for
JSON and ``text/csv`` for CSV (HTTP 415 otherwise), at most ``max_upload_bytes`` (HTTP 413).
"""

from __future__ import annotations

import logging
from enum import Enum
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Path, Query
from fastapi.responses import JSONResponse, Response
from pipwerk_marketdata import FileErrorCode, ImportFileError, MarketDataStoreError

from pipwerk_replay import marketdata_models as models
from pipwerk_replay.acquisition import (
    NO_SOURCE,
    REASONS,
    AcquisitionManager,
    AcquisitionNotFoundError,
    NoSourceError,
)
from pipwerk_replay.api_support import (
    PUBLIC_PREFIX,
    Handler,
    JsonBody,
    api_error,
    body_description,
    error_responses,
    file_description,
    guarded,
    invalid_place,
    parse_body,
    uploaded_file,
)
from pipwerk_replay.marketdata_service import MarketDataService, NoBrokerError, TooManyRunningError
from pipwerk_replay.settings_service import StoredDefaultSourceInvalidError

logger = logging.getLogger(__name__)

IMPORT_JSON_PATH = f"{PUBLIC_PREFIX}/market-data/imports/json"
IMPORT_CSV_PATH = f"{PUBLIC_PREFIX}/market-data/imports/csv"

TAGS: list[str | Enum] = ["market-data"]

FILE_REFUSED_TEXT = "The file is refused."
INSTRUMENT_NOT_FOUND_TEXT = "There are no data of this instrument."
ACQUISITION_NOT_FOUND_TEXT = "The acquisition does not exist."
DATA_STORE_TEXT = "The data stock could not be read or changed."
TOO_MANY_IMPORTS_TEXT = "Too many imports are running. Try again later."
TOO_MANY_ACQUISITIONS_TEXT = "Too many acquisitions are running. Try again later."
NO_BROKER_TEXT = "No broker is given and no default source is set."
NO_SOURCE_TEXT = "No source is set up."
STORED_DEFAULT_SOURCE_INVALID_TEXT = "The stored pipwerk replay default source is invalid."

JsonFile = Annotated[bytes, Depends(uploaded_file("application/json"))]
CsvFile = Annotated[bytes, Depends(uploaded_file("text/csv"))]
AcquisitionId = Annotated[
    UUID,
    Path(alias="id", description="Identifier of the acquisition (a UUID)."),
]


def _file_refused(error: ImportFileError) -> Response:
    status = 413 if error.code is FileErrorCode.TOO_LARGE else 422
    return JSONResponse(
        status_code=status,
        content={"detail": FILE_REFUSED_TEXT, "code": error.code.value, "message": error.message},
    )


def _data_store_failed(error: MarketDataStoreError) -> Response:
    cause = error.__cause__
    logger.error("The data stock failed (%s).", type(cause).__name__ if cause else "unknown")
    return api_error(503, DATA_STORE_TEXT)


def _stored_default_source_invalid(error: StoredDefaultSourceInvalidError) -> Response:
    logger.error("%s", error)
    return api_error(503, STORED_DEFAULT_SOURCE_INVALID_TEXT)


def _no_source(_error: NoSourceError) -> Response:
    return JSONResponse(
        status_code=409,
        content={"detail": NO_SOURCE_TEXT, "code": NO_SOURCE, "reason": REASONS[NO_SOURCE]},
    )


_HANDLERS: dict[type[Exception], Handler] = {
    ImportFileError: _file_refused,
    MarketDataStoreError: _data_store_failed,
    StoredDefaultSourceInvalidError: _stored_default_source_invalid,
    TooManyRunningError: lambda _error: api_error(429, TOO_MANY_IMPORTS_TEXT),
    NoBrokerError: lambda _error: api_error(409, NO_BROKER_TEXT),
    NoSourceError: _no_source,
    AcquisitionNotFoundError: lambda _error: api_error(404, ACQUISITION_NOT_FOUND_TEXT),
}


def build_router(service: MarketDataService, acquisitions: AcquisitionManager) -> APIRouter:
    """The router of the data stock with the prefix ``/api/v1``."""
    router = APIRouter(prefix=PUBLIC_PREFIX, tags=TAGS)
    limits = service.settings

    @router.get(
        "/market-data/overview",
        operation_id="read_market_data_overview",
        summary="Read the overview of the data stock",
        description=(
            "Lists the series (candles of a time unit, or ticks) of every broker and instrument "
            "with count, first and last time, covered periods and gaps, and the instruments "
            "with data about them. Both lists are cut to the section of the request "
            "(``offset``, ``limit``; at most ``max_listed_items``, default 1000, each); the "
            "lists of periods in a series are cut to ``max_listed_items`` as well and counted "
            "completely. The gaps are computed over the whole covered range of each series."
        ),
        responses={
            200: {"description": "The overview.", "model": models.Overview},
            **error_responses(422, 503),
        },
    )
    def read_overview(query: Annotated[models.OverviewQuery, Query()]) -> Response:
        def run() -> Response:
            if query.limit is not None and query.limit > limits.max_listed_items:
                return invalid_place(["query", "limit"], "less_than_equal")
            return JSONResponse(content=service.overview(query).model_dump(mode="json"))

        return guarded(run, _HANDLERS)

    @router.get(
        "/market-data/instrument",
        operation_id="read_market_data_instrument",
        summary="Read the data of an instrument",
        description=(
            "Returns the newest data of an instrument at a broker (contract size, tick value, "
            "swap, margin and the moment of the acquisition); with ``as_of`` the newest data "
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
        "/market-data/imports/json",
        operation_id="import_market_data_json",
        summary="Import a JSON file",
        description=(
            "Imports a file in the JSON format of ``contracts/market-data/v1/`` (candles, ticks "
            "or the data of an instrument). The body is the file, with the media type "
            "``application/json``; it is at most ``max_upload_bytes`` large (default 32 MiB) and "
            "has at most ``max_rows`` rows (default 500 000). Rows of the same time replace "
            "those that exist. Rows that fail the checks are rejected and named in the result "
            "with a reason; a file that is refused as a whole (HTTP 422) changes nothing."
        ),
        responses={
            200: {"description": "The result of the import.", "model": models.ImportResult},
            422: {"description": "The file is refused as a whole.", "model": models.FileRefused},
            **error_responses(413, 415, 429, 503),
        },
        openapi_extra=file_description("application/json", "The JSON file."),
    )
    def import_json(file: JsonFile) -> Response:
        def run() -> Response:
            return JSONResponse(content=service.import_json(file).model_dump(mode="json"))

        return guarded(run, _HANDLERS)

    @router.post(
        "/market-data/imports/csv",
        operation_id="import_market_data_csv",
        summary="Import a CSV file",
        description=(
            "Imports a CSV file in the export format of MetaTrader 5 (candles or ticks). The "
            "body is the file, with the media type ``text/csv``; it is limited like a JSON file. "
            "The file does not name its series, so the request does: ``kind``, ``broker``, "
            "``instrument``, for candles ``time_unit``, and ``timezone`` (IANA name of the time "
            "zone of the times in the file; a local time that occurs twice at a change of the "
            "clock counts as the earlier one, one that does not exist is a rejected row). A "
            "file that is refused as a whole (HTTP 422, ``FileRefused``, for example an unknown "
            "time zone or a header without the needed columns) changes nothing; query parameters "
            "that do not fit the schema are answered with HTTP 422, too, in the form of "
            "``InvalidRequest``."
        ),
        responses={
            200: {"description": "The result of the import.", "model": models.ImportResult},
            422: {
                "description": "The file is refused as a whole (``FileRefused``) or the "
                "parameters do not fit the schema (``InvalidRequest``).",
                "model": models.FileRefused,
            },
            **error_responses(413, 415, 429, 503),
        },
        openapi_extra=file_description("text/csv", "The CSV file."),
    )
    def import_csv(file: CsvFile, query: Annotated[models.CsvImportQuery, Query()]) -> Response:
        def run() -> Response:
            return JSONResponse(content=service.import_csv(file, query).model_dump(mode="json"))

        return guarded(run, _HANDLERS)

    @router.post(
        "/market-data/completeness",
        operation_id="check_market_data_completeness",
        summary="Check the completeness for a list of needed parts",
        description=(
            "For every needed part (candles of a time unit or ticks of an instrument in a "
            "period, or the data of an instrument) tells what is needed, what is present and "
            "what is missing, in the order of the request. The broker is the default source "
            "unless the request names one (HTTP 409 if there is neither). At most "
            "``max_parts_per_request`` parts (default 100)."
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

    @router.post(
        "/market-data/acquisitions",
        operation_id="start_market_data_acquisition",
        status_code=202,
        summary="Start an acquisition from the source",
        description=(
            "Asks the source for the given parts and imports what it delivers. One part is an "
            "acquisition by hand, several are the missing parts of a test run. The acquisition "
            "runs in the background (it can take minutes), part by part; a failed part does "
            "not stop the others. The answer holds the identifier; ``GET`` on the acquisition "
            "shows the state of each part. HTTP 409 with the code ``no_source`` if no source is "
            "set up, HTTP 429 if too many acquisitions run. A period that is too large for the "
            "source fails with the code ``range_too_large``; pipwerk replay does not split it."
        ),
        responses={
            202: {"description": "The acquisition was started.", "model": models.Acquisition},
            409: {"description": "No source is set up.", "model": models.AcquisitionRefused},
            **error_responses(413, 415, 422, 429),
        },
        openapi_extra=body_description(models.AcquisitionRequest, "The parts to acquire."),
    )
    def start_acquisition(body: JsonBody) -> Response:
        def run() -> Response:
            request = parse_body(body, models.AcquisitionRequest)
            if len(request.parts) > limits.max_parts_per_request:
                return invalid_place(["parts"], "too_long")
            started = acquisitions.start(request.parts)
            return JSONResponse(status_code=202, content=started.model_dump(mode="json"))

        def too_many(_error: TooManyRunningError) -> Response:
            return api_error(429, TOO_MANY_ACQUISITIONS_TEXT)

        return guarded(run, {**_HANDLERS, TooManyRunningError: too_many})

    @router.get(
        "/market-data/acquisitions/{id}",
        operation_id="read_market_data_acquisition",
        summary="Read the state of an acquisition",
        description=(
            "Returns the state of the acquisition: for every part ``queued``, ``running``, "
            "``succeeded`` (with the result of the import) or ``failed`` (with the code and the "
            "reason). The state of the last acquisitions is kept in memory (at most "
            "``max_kept_acquisitions``, default 100); it is gone after a restart."
        ),
        responses={
            200: {"description": "The acquisition.", "model": models.Acquisition},
            **error_responses(404, 422, not_found=ACQUISITION_NOT_FOUND_TEXT),
        },
    )
    def read_acquisition(acquisition_id: AcquisitionId) -> Response:
        def run() -> Response:
            found = acquisitions.get(acquisition_id)
            return JSONResponse(content=found.model_dump(mode="json"))

        return guarded(run, _HANDLERS)

    return router
