"""Shared parts of the HTTP interfaces of pipwerk replay (public web API and internal endpoints).

The public web API (``web_api.py``, ``marketdata_api.py``, paths below ``/api/v1/``) and the
internal endpoints (``internal_api.py``, paths below ``/api/replay/``) follow the same rules
(specification 11, as in pipwerk Studio):

- A body is JSON (``Content-Type: application/json``, HTTP 415 otherwise) and at most as large
  as the limit of the startup configuration (HTTP 413, checked by ``BodyLimitMiddleware``
  before any JSON is read). It is read as a whole and checked by Pydantic with
  ``extra="forbid"`` and strict types. A body that does not fit the schema is answered with
  HTTP 422. A duplicate key and the values ``NaN`` and ``Infinity`` are errors, too.
- The files of an import are the parts of a ``multipart/form-data`` body with its own, larger
  limit (``import_form.py``).
- ``{id}`` must be a UUID (HTTP 422 otherwise).
- Error texts are fixed. They name no path and no exception text; for a body that does not fit
  the schema the answer names the place of each error in the body and its error type, never
  the value.
"""

from __future__ import annotations

import json
import re
from collections.abc import Callable, Mapping
from datetime import datetime
from typing import Annotated, Any

from fastapi import Depends, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, ConfigDict, ValidationError

PUBLIC_PREFIX = "/api/v1"
"""The path below which the public web API lives."""

INTERNAL_PREFIX = "/api/replay"
"""The path below which the internal endpoints of pipwerk replay live."""

MAX_LISTED_ERRORS = 50
MAX_LOCATION_TEXT = 100

REQUEST_INVALID_TEXT = "The request is invalid."
BODY_INVALID_TEXT = "The request body does not fit the schema."
UNSUPPORTED_MEDIA_TEXT = "The request body must be JSON (Content-Type: application/json)."


class ApiModel(BaseModel):
    """Base of the models of requests and answers: additional fields are rejected."""

    model_config = ConfigDict(extra="forbid")


class ApiError(ApiModel):
    """Error body with a fixed text. It names no path, no exception text and no input."""

    detail: str


class ErrorPlace(ApiModel):
    """One error of a request: the place in the request or body and the error type."""

    location: list[str | int]
    type: str


class InvalidRequest(ApiModel):
    """Error body for a request or body that does not fit the schema (HTTP 422). Names
    at most 50 places and the error type of each, never the values."""

    detail: str
    errors: list[ErrorPlace]


def _short(text: str) -> str:
    return text if len(text) <= MAX_LOCATION_TEXT else text[:MAX_LOCATION_TEXT] + "…"


def invalid_request(
    detail: str, error: ValidationError | RequestValidationError | None = None
) -> JSONResponse:
    """HTTP 422 with the places of the errors and their types, never the values. At most
    ``MAX_LISTED_ERRORS`` errors are named; each text in a place is shortened."""
    places: list[dict[str, Any]] = []
    if error is not None:
        items = (
            error.errors()
            if isinstance(error, RequestValidationError)
            else error.errors(include_url=False, include_context=False, include_input=False)
        )
        for item in items[:MAX_LISTED_ERRORS]:
            location = [
                part if isinstance(part, int) else _short(str(part)) for part in item["loc"]
            ]
            places.append({"location": location, "type": str(item["type"])})
    return JSONResponse(status_code=422, content={"detail": detail, "errors": places})


def invalid_place(location: list[str | int], error_type: str) -> JSONResponse:
    """HTTP 422 for one place that the schema alone cannot check (for example a list that is
    longer than the configured limit)."""
    place = {"location": location, "type": error_type}
    return JSONResponse(status_code=422, content={"detail": BODY_INVALID_TEXT, "errors": [place]})


def api_error(status: int, text: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"detail": text})


def request_validation_response(error: RequestValidationError) -> JSONResponse:
    """The answer to a request below an API prefix that does not fit its parameters."""
    return invalid_request(REQUEST_INVALID_TEXT, error)


class BodyError(Exception):
    """The body is no JSON object that the schema accepts (carries the answer)."""

    def __init__(self, response: JSONResponse) -> None:
        super().__init__("invalid body")
        self.response = response


def _reject_duplicates(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("duplicate key")
        result[key] = value
    return result


def _reject_constant(_name: str) -> Any:
    raise ValueError("NaN and Infinity are no JSON")


def parse_body[ModelT: BaseModel](body: bytes, model: type[ModelT]) -> ModelT:
    """The body as the model, or ``BodyError`` with the answer of HTTP 422."""
    try:
        data = json.loads(
            body.decode("utf-8"),
            object_pairs_hook=_reject_duplicates,
            parse_constant=_reject_constant,
        )
    except (ValueError, RecursionError) as error:  # includes UnicodeDecodeError
        place = {"location": [], "type": "json_invalid"}
        raise BodyError(
            JSONResponse(status_code=422, content={"detail": BODY_INVALID_TEXT, "errors": [place]})
        ) from error
    try:
        return model.model_validate(data, strict=True)
    except ValidationError as error:
        raise BodyError(invalid_request(BODY_INVALID_TEXT, error)) from error


def _media_type(request: Request) -> str:
    return request.headers.get("content-type", "").split(";")[0].strip().lower()


async def _json_body(request: Request) -> bytes:
    """The body of the request; the media type must be JSON. (A request from a web page
    of another origin needs a preflight request for this media type.)"""
    if _media_type(request) != "application/json":
        raise HTTPException(status_code=415, detail=UNSUPPORTED_MEDIA_TEXT)
    return await request.body()


JsonBody = Annotated[bytes, Depends(_json_body)]


def error_responses(
    *statuses: int, not_found: str = "The object does not exist."
) -> dict[int | str, dict[str, Any]]:
    """The documented error answers of an endpoint (fixed texts, see the module description)."""
    texts: dict[int, tuple[str, type[BaseModel]]] = {
        403: ("The request comes from a web page of another origin.", ApiError),
        404: (not_found, ApiError),
        409: ("The request cannot be served in the current state.", ApiError),
        413: ("The request body is larger than the limit.", ApiError),
        415: ("The request body has the wrong media type.", ApiError),
        422: ("The request or the body does not fit the schema.", InvalidRequest),
        429: ("Too many imports are running.", ApiError),
        503: ("The stored value is invalid or the data store failed.", ApiError),
    }
    return {
        status: {"description": texts[status][0], "model": texts[status][1]} for status in statuses
    }


def body_description(model: type[BaseModel], description: str) -> dict[str, Any]:
    """The description of a request body. The body is read and checked by this module, so
    FastAPI does not know it; the schema of the model is written into the description."""
    return {
        "requestBody": {
            "required": True,
            "description": description,
            "content": {"application/json": {"schema": model.model_json_schema()}},
        }
    }


Handler = Callable[[Any], Response]


def guarded(call: Callable[[], Response], handlers: Mapping[type[Exception], Handler]) -> Response:
    """Run an endpoint and answer the errors of the services with fixed texts.

    ``BodyError`` is answered by every endpoint; ``handlers`` maps the other errors of an
    endpoint to its answers. An error that is neither one is a defect and goes on."""
    try:
        return call()
    except BodyError as error:
        return error.response
    except Exception as error:
        for kind, handler in handlers.items():
            if isinstance(error, kind):
                return handler(error)
        raise


def is_api_path(path: str) -> bool:
    """Whether the path belongs to the public web API or to the internal endpoints."""
    return any(
        path == prefix or path.startswith(prefix + "/")
        for prefix in (PUBLIC_PREFIX, INTERNAL_PREFIX)
    )


def is_public_path(path: str) -> bool:
    """Whether the path belongs to the public web API under ``/api/v1/``."""
    return path == PUBLIC_PREFIX or path.startswith(PUBLIC_PREFIX + "/")


_ISO_MOMENT = re.compile(
    r"\d{4}-\d{2}-\d{2}[Tt ]\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?([Zz]|[+-]\d{2}:\d{2})"
)


def parse_moment(value: object) -> datetime:
    """A moment with a time zone from ISO 8601 text (a number or another type is no moment).

    This is the ``BeforeValidator`` of the moments in requests: the strict check of Pydantic
    does not take text for a date, and no implicit conversion of numbers is wanted either."""
    if not isinstance(value, str) or _ISO_MOMENT.fullmatch(value) is None:
        raise ValueError("a moment must be ISO 8601 text with a time zone")
    return datetime.fromisoformat(value)
