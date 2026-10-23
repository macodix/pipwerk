"""Web API of pipwerk replay under ``/api/v1/`` (specification 7) and its installation.

The public web API is described in ``contracts/api/pipwerk-replay/v1/openapi.json``:

- the test accounts (``/api/v1/accounts``, specification 6.2), in this module,
- the data stock (``/api/v1/market-data/``), in ``marketdata_api.py``.

The settings and the revision are internal endpoints below ``/api/replay/``
(``internal_api.py``); they are no part of the public web API. This module only connects HTTP
with the services; it has no other logic. The rules for bodies, errors and texts are in
``api_support.py``.
"""

from __future__ import annotations

import logging
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, FastAPI, Path
from fastapi.responses import JSONResponse, Response

from pipwerk_replay import internal_api, marketdata_api
from pipwerk_replay.accounts import (
    Account,
    AccountInput,
    AccountNotFoundError,
    AccountService,
)
from pipwerk_replay.api_support import (
    INTERNAL_PREFIX,
    PUBLIC_PREFIX,
    ApiModel,
    Handler,
    JsonBody,
    api_error,
    body_description,
    error_responses,
    guarded,
    parse_body,
)
from pipwerk_replay.body_limit import BodyLimitMiddleware
from pipwerk_replay.marketdata_service import MarketDataService
from pipwerk_replay.revision import Revision
from pipwerk_replay.settings_service import SettingsService

logger = logging.getLogger(__name__)

API_PREFIX = PUBLIC_PREFIX
"""The path below which the public web API lives."""

ACCOUNT_NOT_FOUND_TEXT = "The test account does not exist."


class AccountList(ApiModel):
    """The test accounts, sorted by name (without regard to case)."""

    items: list[Account]


AccountId = Annotated[
    UUID,
    Path(alias="id", description="Identifier of the test account (a UUID)."),
]

_HANDLERS: dict[type[Exception], Handler] = {
    AccountNotFoundError: lambda _error: api_error(404, ACCOUNT_NOT_FOUND_TEXT),
}


def _not_found() -> dict[int | str, dict[str, Any]]:
    return error_responses(404, not_found="There is no such test account.")


def build_router(accounts: AccountService) -> APIRouter:
    """The router of the test accounts with the prefix ``/api/v1``."""
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
            **error_responses(413, 415, 422),
        },
        openapi_extra=body_description(AccountInput, "The values of the test account."),
    )
    def create_account(body: JsonBody) -> Response:
        def run() -> Response:
            created = accounts.create_account(parse_body(body, AccountInput))
            return JSONResponse(status_code=201, content=created.model_dump(mode="json"))

        return guarded(run, _HANDLERS)

    @router.get(
        "/accounts/{id}",
        operation_id="read_account",
        tags=["accounts"],
        summary="Read a test account",
        description="Returns the test account with the identifier.",
        responses={
            200: {"description": "The test account.", "model": Account},
            **_not_found(),
            **error_responses(422),
        },
    )
    def read_account(account_id: AccountId) -> Response:
        def run() -> Response:
            found = accounts.get_account(str(account_id))
            return JSONResponse(content=found.model_dump(mode="json"))

        return guarded(run, _HANDLERS)

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
            **_not_found(),
            **error_responses(413, 415, 422),
        },
        openapi_extra=body_description(AccountInput, "The new values of the test account."),
    )
    def update_account(account_id: AccountId, body: JsonBody) -> Response:
        def run() -> Response:
            data = parse_body(body, AccountInput)
            changed = accounts.update_account(str(account_id), data)
            return JSONResponse(content=changed.model_dump(mode="json"))

        return guarded(run, _HANDLERS)

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
            **_not_found(),
            **error_responses(422),
        },
    )
    def delete_account(account_id: AccountId) -> Response:
        def run() -> Response:
            accounts.delete_account(str(account_id))
            return Response(status_code=204)

        return guarded(run, _HANDLERS)

    return router


def install_api(
    app: FastAPI,
    *,
    accounts: AccountService,
    settings: SettingsService,
    marketdata: MarketDataService,
    revision: Revision | None,
    max_body_bytes: int,
) -> None:
    """Add the public web API, the internal endpoints and the limits of the body size.

    A body is at most ``max_body_bytes`` large; the request of an import (and of its preview)
    is at most as large as the files of an import together (``max_import_bytes`` of the data
    stock) plus the envelope of the form."""
    app.include_router(build_router(accounts))
    app.include_router(marketdata_api.build_router(marketdata))
    app.include_router(internal_api.build_router(settings, marketdata, revision))
    upload_limit = marketdata_api.import_body_limit(marketdata)
    app.add_middleware(
        BodyLimitMiddleware,
        limit=max_body_bytes,
        prefix=INTERNAL_PREFIX,
    )
    app.add_middleware(
        BodyLimitMiddleware,
        limit=max_body_bytes,
        prefix=API_PREFIX,
        overrides={
            marketdata_api.IMPORT_PATH: upload_limit,
            marketdata_api.PREVIEW_PATH: upload_limit,
        },
    )
