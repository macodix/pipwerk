"""HTTP application of pipwerk-fetch-mt5 (specification backtest 5.4).

Two endpoints below ``/api/v1/``, both only with the shared key:

- ``POST /api/v1/fetch``: a request with instrument, kind (candles of a time unit, ticks, or
  the details of the instrument) and period; the answer is the file in the format of the
  import or an error with code and reason.
- ``GET /api/v1/health``: checks that MetaTrader 5 is reachable.

There is no ``/docs``, no ``/openapi.json`` and no other page: what the program offers is in
``contracts/api/pipwerk-fetch/v1/openapi.json``, generated from this module (``contract.py``).
No logic of the acquisition lives here; it is in ``service.py``.

Protection (middleware, outermost first): the ``Host`` header (``host_check.py``), the shared
key (``auth.py``), the size of the body (``body_limit.py``). Every error has the form of
``errors.py``; no text of an error names a value of the request.
"""

from __future__ import annotations

import logging
from collections.abc import Sequence

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from pipwerk_fetch_mt5 import __version__
from pipwerk_fetch_mt5.auth import SharedKeyMiddleware
from pipwerk_fetch_mt5.body_limit import MAX_BODY_BYTES, BodyLimitMiddleware
from pipwerk_fetch_mt5.errors import FetchError, error_response
from pipwerk_fetch_mt5.host_check import HostCheckMiddleware, build_allowed_hosts
from pipwerk_fetch_mt5.models import (
    CandlesRequest,
    ErrorResponse,
    FetchRequest,
    FetchResponse,
    HealthResponse,
    InstrumentRequest,
    TicksRequest,
)
from pipwerk_fetch_mt5.service import FetchService

logger = logging.getLogger(__name__)

API_PREFIX = "/api/v1"

#: The names that may appear in the list of invalid fields: the fields of the requests and
#: the kinds (the validation names the kind that was tried).
KNOWN_LOCATIONS = frozenset({"kind", "instrument", "time_unit", "start", "end", "candles", "ticks"})

APP_TITLE = "pipwerk-fetch"
APP_DESCRIPTION = (
    "Acquisition of historical market data from a source (version 1). A source delivers "
    "candles, ticks and the details of an instrument as files in the JSON format of the "
    "import of pipwerk replay. pipwerk-fetch-mt5 is the source for MetaTrader 5. Every "
    "request carries the shared key as `Authorization: Bearer <key>`; without it the program "
    "answers 401 and tells nothing about its instruments."
)

_ERROR_TEXTS: dict[int, str] = {
    400: "The Host header is not allowed (error host_not_allowed).",
    401: "The shared key is missing or wrong (error unauthorized).",
    404: "Symbol unknown at the broker (symbol_unknown) or no data (no_data).",
    413: "The request is larger than 8 KiB (body_too_large).",
    422: "Invalid request (invalid_request) or period too large (range_too_large).",
    500: "Internal error (internal_error).",
    502: (
        "MetaTrader 5 ended the call with an error (broker_error), gives no name of the "
        "broker (broker_unknown) or values that cannot be used (invalid_broker_data)."
    ),
    503: "MetaTrader 5 is not reachable (terminal_unavailable).",
}


def _error_responses(*statuses: int) -> dict[int | str, dict[str, object]]:
    return {
        status: {"model": ErrorResponse, "description": _ERROR_TEXTS[status]} for status in statuses
    }


_FETCH_ERRORS = _error_responses(400, 401, 404, 413, 422, 500, 502, 503)
_HEALTH_ERRORS = _error_responses(400, 401, 500, 503)


def create_app(
    service: FetchService,
    *,
    shared_key: str,
    allowed_hosts: Sequence[str] = (),
) -> FastAPI:
    """Create the application.

    ``service`` does the acquisition, ``shared_key`` is the key of the startup configuration,
    ``allowed_hosts`` the names allowed in the ``Host`` header in addition to ``127.0.0.1``,
    ``localhost`` and ``::1``.
    """
    app = FastAPI(
        title=APP_TITLE,
        version=__version__,
        description=APP_DESCRIPTION,
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
        separate_input_output_schemas=False,
    )

    @app.exception_handler(FetchError)
    def handle_fetch_error(_request: Request, error: FetchError) -> JSONResponse:
        return error_response(error.code)

    @app.exception_handler(RequestValidationError)
    def handle_invalid_request(_request: Request, error: RequestValidationError) -> JSONResponse:
        # Only the names of the fields of the interface, never the input (not even the name
        # of a field that does not exist) and never the texts of the validation.
        fields = sorted(
            {
                ".".join(
                    str(part) if part in KNOWN_LOCATIONS else "(unknown)"
                    for part in item["loc"]
                    if part != "body"
                )
                for item in error.errors()
            }
        )
        return error_response("invalid_request", fields=fields)

    @app.exception_handler(StarletteHTTPException)
    def handle_http_error(_request: Request, _error: StarletteHTTPException) -> JSONResponse:
        return error_response("not_found")

    @app.post(
        f"{API_PREFIX}/fetch",
        operation_id="fetch",
        summary="Fetch candles, ticks or the details of an instrument",
        description=(
            "Reads from the source and answers with the file in the JSON format of the import. "
            "`candles`: the candles of one time unit with an open time in `[start, end)`. "
            "`ticks`: the ticks in `[start, end)`. `instrument`: the details of the "
            "instrument at the time of the call. `start` and `end` carry a time zone and are "
            "converted to UTC; times in the answer are UTC. Candles and ticks are limited to "
            "the largest number of rows of the startup configuration; a larger period is "
            "answered with `range_too_large`. The answer holds the file in `file` and the "
            "rows that were left out, with the reason, in `omitted`."
        ),
        responses=_FETCH_ERRORS,
    )
    def fetch(request: FetchRequest) -> FetchResponse:
        try:
            match request:
                case CandlesRequest():
                    return service.candles(
                        request.instrument, request.time_unit, request.start, request.end
                    )
                case TicksRequest():
                    return service.ticks(request.instrument, request.start, request.end)
                case InstrumentRequest():
                    return service.instrument_details(request.instrument)
        except FetchError:
            raise
        except Exception:
            logger.exception("The acquisition failed with an unexpected error.")
            raise FetchError("internal_error") from None

    @app.get(
        f"{API_PREFIX}/health",
        operation_id="health",
        summary="Check that MetaTrader 5 is reachable",
        description=(
            "Answers `ok` if MetaTrader 5 is running and connected to its trade server, "
            "otherwise 503 with the error `terminal_unavailable`."
        ),
        responses=_HEALTH_ERRORS,
    )
    def health() -> HealthResponse:
        try:
            service.check_terminal()
        except FetchError:
            raise
        except Exception:
            logger.exception("The check of MetaTrader 5 failed with an unexpected error.")
            raise FetchError("internal_error") from None
        return HealthResponse(status="ok")

    # The last middleware added is the outermost one.
    app.add_middleware(BodyLimitMiddleware, limit=MAX_BODY_BYTES, prefix=API_PREFIX)
    app.add_middleware(SharedKeyMiddleware, shared_key=shared_key)
    app.add_middleware(HostCheckMiddleware, allowed_hosts=build_allowed_hosts(allowed_hosts))
    return app
