"""Internal endpoints of pipwerk replay below ``/api/replay/``.

Like ``/api/studio/`` of pipwerk Studio they are connections within pipwerk replay (its own user
interface uses them). They are no part of the public web API and no versioned definition under
``contracts/``; they stay visible in ``/docs``, but are not in the file under ``contracts/api/``.

- ``GET``, ``PUT`` ``/api/replay/settings/language``: language of the user interface (``de``,
  ``en``)
- ``GET``, ``PUT`` ``/api/replay/settings/test-run-broker``: broker whose data a test run uses
- ``GET`` ``/api/replay/revision``: the commit pipwerk replay runs from

The rules for bodies, errors and texts are those of the public web API (``api_support.py``).
"""

from __future__ import annotations

import logging
from enum import Enum

from fastapi import APIRouter
from fastapi.responses import JSONResponse, Response
from pipwerk_marketdata import MarketDataStoreError
from pydantic import ConfigDict, model_validator

from pipwerk_replay.api_support import (
    INTERNAL_PREFIX,
    ApiModel,
    Handler,
    JsonBody,
    api_error,
    body_description,
    error_responses,
    guarded,
    invalid_place,
    parse_body,
)
from pipwerk_replay.marketdata_models import Name
from pipwerk_replay.marketdata_service import (
    BrokerForTestRuns,
    BrokerNotInDataStockError,
    MarketDataService,
)
from pipwerk_replay.revision import REVISION_LENGTH, Revision
from pipwerk_replay.settings_service import (
    InvalidBrokerNameError,
    Language,
    SettingsService,
    StoredLanguageInvalidError,
    StoredTestRunBrokerInvalidError,
)

logger = logging.getLogger(__name__)

TAGS: list[str | Enum] = ["internal"]

STORED_LANGUAGE_INVALID_TEXT = "The stored pipwerk replay language is invalid."
STORED_TEST_RUN_BROKER_INVALID_TEXT = "The stored pipwerk replay broker for test runs is invalid."
BROKER_NOT_IN_DATA_STOCK_TEXT = "The broker has no data in the data stock."
DATA_STORE_TEXT = "The data stock could not be read or changed."


class ReplayLanguage(ApiModel):
    """The language of the user interface."""

    language: Language


class ReplayLanguageUpdate(ApiModel):
    """Write model of the language. Only the languages German and English are accepted;
    unknown fields are rejected rather than silently ignored."""

    model_config = ConfigDict(extra="forbid", strict=True)

    language: Language


class ReplayBrokerForTestRuns(ApiModel):
    """The broker for test runs: ``broker`` is the broker whose data a test run uses. It is the
    chosen broker if that still occurs in the data stock (``chosen`` is ``true``), otherwise the
    first broker of the data stock in alphabetical order (``chosen`` is ``false``); ``null`` only
    if the data stock has no broker at all."""

    broker: Name | None
    chosen: bool


class ReplayBrokerForTestRunsUpdate(ApiModel):
    """Write model of the broker for test runs: a broker that occurs in the data stock, or
    ``null`` to remove the choice (then the first broker of the data stock applies)."""

    model_config = ConfigDict(extra="forbid", strict=True)

    broker: Name | None


def _applying(state: BrokerForTestRuns) -> ReplayBrokerForTestRuns:
    return ReplayBrokerForTestRuns(broker=state.broker, chosen=state.chosen)


class ReplayRevision(ApiModel):
    """Read model of the revision pipwerk replay runs from.

    ``revision`` is the 7-character short form of the Git commit, ``commit`` the full commit,
    ``committed_at`` the committer date as ISO 8601 string with offset. ``revision`` and
    ``commit`` are both ``null`` if the revision is not determinable; ``committed_at`` is
    ``null`` if the date is not determinable."""

    model_config = ConfigDict(extra="forbid", strict=True)

    revision: str | None
    commit: str | None
    committed_at: str | None

    @model_validator(mode="after")
    def _consistent(self) -> ReplayRevision:
        if (self.revision is None) != (self.commit is None):
            raise ValueError("revision and commit must both be null or both be set")
        if self.commit is not None and self.revision != self.commit[:REVISION_LENGTH]:
            raise ValueError("revision must be the first 7 characters of commit")
        if self.commit is None and self.committed_at is not None:
            raise ValueError("committed_at needs a commit")
        return self


def _stored_language_invalid(error: StoredLanguageInvalidError) -> Response:
    logger.error("%s", error)
    return api_error(503, STORED_LANGUAGE_INVALID_TEXT)


def _stored_test_run_broker_invalid(error: StoredTestRunBrokerInvalidError) -> Response:
    logger.error("%s", error)
    return api_error(503, STORED_TEST_RUN_BROKER_INVALID_TEXT)


def _invalid_broker_name(_error: InvalidBrokerNameError) -> Response:
    return invalid_place(["broker"], "value_error")


def _broker_not_in_data_stock(_error: BrokerNotInDataStockError) -> Response:
    place = {"location": ["broker"], "type": "broker_not_in_data_stock"}
    return JSONResponse(
        status_code=422, content={"detail": BROKER_NOT_IN_DATA_STOCK_TEXT, "errors": [place]}
    )


def _data_store_failed(error: MarketDataStoreError) -> Response:
    cause = error.__cause__
    logger.error("The data stock failed (%s).", type(cause).__name__ if cause else "unknown")
    return api_error(503, DATA_STORE_TEXT)


_HANDLERS: dict[type[Exception], Handler] = {
    BrokerNotInDataStockError: _broker_not_in_data_stock,
    InvalidBrokerNameError: _invalid_broker_name,
    MarketDataStoreError: _data_store_failed,
    StoredLanguageInvalidError: _stored_language_invalid,
    StoredTestRunBrokerInvalidError: _stored_test_run_broker_invalid,
}


def build_router(
    settings: SettingsService, marketdata: MarketDataService, revision: Revision | None
) -> APIRouter:
    """The router of the internal endpoints with the prefix ``/api/replay``."""
    router = APIRouter(prefix=INTERNAL_PREFIX, tags=TAGS)

    @router.get(
        "/settings/language",
        operation_id="read_language",
        summary="Read the language of pipwerk replay",
        description=(
            "Returns the language of the user interface, German ('de') as long as none is "
            "stored. Responds with HTTP 503 if the stored value is not a supported language; "
            "a valid write repairs it."
        ),
        responses={
            200: {"description": "The language.", "model": ReplayLanguage},
            **error_responses(503),
        },
    )
    def read_language() -> Response:
        def run() -> Response:
            body = ReplayLanguage(language=settings.get_language())
            return JSONResponse(content=body.model_dump(mode="json"))

        return guarded(run, _HANDLERS)

    @router.put(
        "/settings/language",
        operation_id="write_language",
        summary="Change the language of pipwerk replay",
        description=(
            "Stores the language of the user interface. Only 'de' and 'en' are accepted; "
            "unknown fields are rejected."
        ),
        responses={
            200: {"description": "The language as stored.", "model": ReplayLanguage},
            **error_responses(413, 415, 422),
        },
        openapi_extra=body_description(ReplayLanguageUpdate, "The new language."),
    )
    def write_language(body: JsonBody) -> Response:
        def run() -> Response:
            update = parse_body(body, ReplayLanguageUpdate)
            stored = ReplayLanguage(language=settings.set_language(update.language))
            return JSONResponse(content=stored.model_dump(mode="json"))

        return guarded(run, _HANDLERS)

    @router.get(
        "/settings/test-run-broker",
        operation_id="read_test_run_broker",
        summary="Read the broker for test runs",
        description=(
            "Returns the broker whose data a test run uses: the chosen broker if it still "
            "occurs in the data stock, otherwise the first broker of the data stock in "
            "alphabetical order (``chosen`` tells which); ``null`` only if the data stock has "
            "no broker. Responds with HTTP 503 if the stored choice is no valid name; a valid "
            "write repairs it."
        ),
        responses={
            200: {"description": "The broker for test runs.", "model": ReplayBrokerForTestRuns},
            **error_responses(503),
        },
    )
    def read_test_run_broker() -> Response:
        def run() -> Response:
            body = _applying(marketdata.test_run_broker())
            return JSONResponse(content=body.model_dump(mode="json"))

        return guarded(run, _HANDLERS)

    @router.put(
        "/settings/test-run-broker",
        operation_id="write_test_run_broker",
        summary="Choose the broker for test runs",
        description=(
            "Stores the broker whose data a test run uses. Only a broker that occurs in the "
            "data stock is accepted (HTTP 422 otherwise); ``null`` removes the choice. The "
            "answer is the broker that applies afterwards."
        ),
        responses={
            200: {
                "description": "The broker for test runs that applies.",
                "model": ReplayBrokerForTestRuns,
            },
            **error_responses(413, 415, 422, 503),
        },
        openapi_extra=body_description(
            ReplayBrokerForTestRunsUpdate, "The broker chosen for test runs."
        ),
    )
    def write_test_run_broker(body: JsonBody) -> Response:
        def run() -> Response:
            update = parse_body(body, ReplayBrokerForTestRunsUpdate)
            stored = _applying(marketdata.set_test_run_broker(update.broker))
            return JSONResponse(content=stored.model_dump(mode="json"))

        return guarded(run, _HANDLERS)

    @router.get(
        "/revision",
        operation_id="read_revision",
        summary="Read the revision pipwerk replay runs from",
        description=(
            "Returns the Git commit of the working tree pipwerk replay runs from, determined "
            "once at startup. The revision and the commit are null if the revision is not "
            "determinable; the date is null if it is not determinable."
        ),
        responses={200: {"description": "The revision.", "model": ReplayRevision}},
    )
    def read_revision() -> ReplayRevision:
        if revision is None:
            return ReplayRevision(revision=None, commit=None, committed_at=None)
        return ReplayRevision(
            revision=revision.short, commit=revision.commit, committed_at=revision.committed_at
        )

    return router
