"""Web API of pipwerk replay under ``/api/v1/`` (specification 7).

So far: the test accounts (``/api/v1/accounts``, specification 6.2) and the
settings (``/api/v1/settings``, so far the language). Later orders add the
paths for the data stock and the test runs. This module only connects HTTP with
the services; it has no other logic.

Rules (as in pipwerk Studio, specification 11):

- A body is JSON (``Content-Type: application/json``, HTTP 415 otherwise) and
  at most as large as the limit of the startup configuration (HTTP 413, checked by
  ``BodyLimitMiddleware`` before any JSON is read). It is read as a whole and
  checked by Pydantic with ``extra="forbid"`` and strict types. A body that does not
  fit the schema is answered with HTTP 422. A duplicate key and the values ``NaN`` and
  ``Infinity`` are errors, too.
- ``{id}`` must be a UUID (HTTP 422 otherwise).
- Error texts are fixed. They name no path and no exception text; for a body that
  does not fit the schema the answer names the place of each error in the body and its
  error type, never the value.
"""

from __future__ import annotations

import json
import logging
from collections.abc import Callable
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, FastAPI, HTTPException, Path, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, ConfigDict, ValidationError

from pipwerk_replay.accounts import (
    Account,
    AccountInput,
    AccountNotFoundError,
    AccountService,
)
from pipwerk_replay.body_limit import BodyLimitMiddleware
from pipwerk_replay.settings_service import (
    Language,
    SettingsService,
    StoredLanguageInvalidError,
)

logger = logging.getLogger(__name__)

API_PREFIX = "/api/v1"
"""The path below which the web API lives."""

MAX_LISTED_ERRORS = 50
MAX_LOCATION_TEXT = 100

ACCOUNT_NOT_FOUND_TEXT = "The test account does not exist."
REQUEST_INVALID_TEXT = "The request is invalid."
BODY_INVALID_TEXT = "The request body does not fit the schema."
UNSUPPORTED_MEDIA_TEXT = "The request body must be JSON (Content-Type: application/json)."
STORED_LANGUAGE_INVALID_TEXT = "The stored pipwerk replay language is invalid."


# --- models ------------------------------------------------------------------------------


class _Model(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ApiError(_Model):
    """Error body with a fixed text. It names no path, no exception text and no input."""

    detail: str


class ErrorPlace(_Model):
    """One error of a request: the place in the request or body and the error type."""

    location: list[str | int]
    type: str


class InvalidRequest(_Model):
    """Error body for a request or body that does not fit the schema (HTTP 422). Names
    at most 50 places and the error type of each, never the values."""

    detail: str
    errors: list[ErrorPlace]


class AccountList(_Model):
    """The test accounts, sorted by name (without regard to case)."""

    items: list[Account]


class Settings(_Model):
    """Read model of the settings of pipwerk replay: the user interface language."""

    language: Language


class SettingsUpdate(BaseModel):
    """Write model to change the settings. Only the languages German and English are
    accepted; unknown fields are rejected rather than silently ignored."""

    model_config = ConfigDict(extra="forbid", strict=True)

    language: Language


# --- errors ------------------------------------------------------------------------------


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


def _error(status: int, text: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"detail": text})


def request_validation_response(error: RequestValidationError) -> JSONResponse:
    """The answer to a request below ``/api/v1/`` that does not fit its parameters."""
    return invalid_request(REQUEST_INVALID_TEXT, error)


class _BodyError(Exception):
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


def _parse_body[ModelT: BaseModel](body: bytes, model: type[ModelT]) -> ModelT:
    """The body as the model, or ``_BodyError`` with the answer of HTTP 422."""
    try:
        data = json.loads(
            body.decode("utf-8"),
            object_pairs_hook=_reject_duplicates,
            parse_constant=_reject_constant,
        )
    except (ValueError, RecursionError) as error:  # includes UnicodeDecodeError
        place = {"location": [], "type": "json_invalid"}
        raise _BodyError(
            JSONResponse(status_code=422, content={"detail": BODY_INVALID_TEXT, "errors": [place]})
        ) from error
    try:
        return model.model_validate(data, strict=True)
    except ValidationError as error:
        raise _BodyError(invalid_request(BODY_INVALID_TEXT, error)) from error


async def _json_body(request: Request) -> bytes:
    """The body of the request; the media type must be JSON. (A request from a web page
    of another origin needs a preflight request for this media type.)"""
    media_type = request.headers.get("content-type", "").split(";")[0].strip().lower()
    if media_type != "application/json":
        raise HTTPException(status_code=415, detail=UNSUPPORTED_MEDIA_TEXT)
    return await request.body()


JsonBody = Annotated[bytes, Depends(_json_body)]
AccountId = Annotated[
    UUID,
    Path(alias="id", description="Identifier of the test account (a UUID)."),
]


def _error_responses(*statuses: int) -> dict[int | str, dict[str, Any]]:
    texts: dict[int, tuple[str, type[BaseModel]]] = {
        404: ("There is no such test account.", ApiError),
        413: ("The request body is larger than the limit.", ApiError),
        415: ("The request body is not JSON.", ApiError),
        422: ("The request or the body does not fit the schema.", InvalidRequest),
        503: ("The stored value is invalid.", ApiError),
    }
    return {
        status: {"description": texts[status][0], "model": texts[status][1]} for status in statuses
    }


def _body_description(model: type[BaseModel], description: str) -> dict[str, Any]:
    """The description of a request body. The body is read and checked by this module, so
    FastAPI does not know it; the schema of the model is written into the description."""
    return {
        "requestBody": {
            "required": True,
            "description": description,
            "content": {"application/json": {"schema": model.model_json_schema()}},
        }
    }


def _guarded(call: Callable[[], Response]) -> Response:
    """Run an endpoint and answer the errors of the services with fixed texts."""
    try:
        return call()
    except _BodyError as error:
        return error.response
    except AccountNotFoundError:
        return _error(404, ACCOUNT_NOT_FOUND_TEXT)
    except StoredLanguageInvalidError as error:
        logger.error("%s", error)
        return _error(503, STORED_LANGUAGE_INVALID_TEXT)


# --- routes ------------------------------------------------------------------------------


def build_router(accounts: AccountService, settings: SettingsService) -> APIRouter:
    """The router of the web API with the prefix ``/api/v1``."""
    router = APIRouter(prefix=API_PREFIX)

    @router.get(
        "/accounts",
        operation_id="list_accounts",
        tags=["accounts"],
        summary="List the test accounts",
        description="Lists all test accounts, sorted by name without regard to case.",
        responses={200: {"description": "The test accounts.", "model": AccountList}},
    )
    def list_accounts() -> AccountList:
        return AccountList(items=accounts.list_accounts())

    @router.post(
        "/accounts",
        operation_id="create_account",
        tags=["accounts"],
        status_code=201,
        summary="Create a test account",
        description=(
            "Creates a test account under a new identifier. The identifier and the mark "
            "is_default are set by pipwerk replay and not accepted in the body."
        ),
        responses={
            201: {"description": "The test account was created.", "model": Account},
            **_error_responses(413, 415, 422),
        },
        openapi_extra=_body_description(AccountInput, "The values of the test account."),
    )
    def create_account(body: JsonBody) -> Response:
        def run() -> Response:
            created = accounts.create_account(_parse_body(body, AccountInput))
            return JSONResponse(status_code=201, content=created.model_dump(mode="json"))

        return _guarded(run)

    @router.get(
        "/accounts/{id}",
        operation_id="read_account",
        tags=["accounts"],
        summary="Read a test account",
        description="Returns the test account with the identifier.",
        responses={
            200: {"description": "The test account.", "model": Account},
            **_error_responses(404, 422),
        },
    )
    def read_account(account_id: AccountId) -> Response:
        def run() -> Response:
            found = accounts.get_account(str(account_id))
            return JSONResponse(content=found.model_dump(mode="json"))

        return _guarded(run)

    @router.put(
        "/accounts/{id}",
        operation_id="update_account",
        tags=["accounts"],
        summary="Change a test account",
        description=(
            "Replaces all values of the test account with the identifier. It never creates "
            "a test account. The default test account can be changed like any other."
        ),
        responses={
            200: {"description": "The changed test account.", "model": Account},
            **_error_responses(404, 413, 415, 422),
        },
        openapi_extra=_body_description(AccountInput, "The new values of the test account."),
    )
    def update_account(account_id: AccountId, body: JsonBody) -> Response:
        def run() -> Response:
            data = _parse_body(body, AccountInput)
            changed = accounts.update_account(str(account_id), data)
            return JSONResponse(content=changed.model_dump(mode="json"))

        return _guarded(run)

    @router.delete(
        "/accounts/{id}",
        operation_id="delete_account",
        tags=["accounts"],
        status_code=204,
        summary="Delete a test account",
        description=(
            "Deletes the test account with the identifier. The default test account can be "
            "deleted; pipwerk replay creates it again at the next start."
        ),
        responses={
            204: {"description": "The test account was deleted."},
            **_error_responses(404, 422),
        },
    )
    def delete_account(account_id: AccountId) -> Response:
        def run() -> Response:
            accounts.delete_account(str(account_id))
            return Response(status_code=204)

        return _guarded(run)

    @router.get(
        "/settings",
        operation_id="read_settings",
        tags=["settings"],
        summary="Read the settings of pipwerk replay",
        description=(
            "Returns the settings that pipwerk replay keeps in its database: the user "
            "interface language, German ('de') as long as none is stored. Responds with "
            "HTTP 503 if the stored value is not a supported language; a valid write "
            "repairs it."
        ),
        responses={
            200: {"description": "The settings.", "model": Settings},
            **_error_responses(503),
        },
    )
    def read_settings() -> Response:
        def run() -> Response:
            body = Settings(language=settings.get_language())
            return JSONResponse(content=body.model_dump(mode="json"))

        return _guarded(run)

    @router.put(
        "/settings",
        operation_id="write_settings",
        tags=["settings"],
        summary="Change the settings of pipwerk replay",
        description=(
            "Stores the user interface language. Only 'de' and 'en' are accepted; unknown "
            "fields are rejected."
        ),
        responses={
            200: {"description": "The settings as stored.", "model": Settings},
            **_error_responses(413, 415, 422),
        },
        openapi_extra=_body_description(SettingsUpdate, "The new settings."),
    )
    def write_settings(body: JsonBody) -> Response:
        def run() -> Response:
            update = _parse_body(body, SettingsUpdate)
            stored = Settings(language=settings.set_language(update.language))
            return JSONResponse(content=stored.model_dump(mode="json"))

        return _guarded(run)

    return router


def install_public_api(
    app: FastAPI,
    accounts: AccountService,
    settings: SettingsService,
    *,
    max_body_bytes: int,
) -> None:
    """Add the web API and its limit of the body size to the application."""
    app.include_router(build_router(accounts, settings))
    app.add_middleware(BodyLimitMiddleware, limit=max_body_bytes, prefix=API_PREFIX)


def is_public_path(path: str) -> bool:
    """Whether the path belongs to the web API under ``/api/v1/``."""
    return path == API_PREFIX or path.startswith(API_PREFIX + "/")
