"""Internal endpoints of pipwerk replay below ``/api/replay/``.

Like ``/api/studio/`` of pipwerk Studio they are connections within pipwerk replay (its own user
interface uses them). They are no part of the public web API and no versioned definition under
``contracts/``; they stay visible in ``/docs``, but are not in the file under ``contracts/api/``.

- ``GET``, ``PUT`` ``/api/replay/settings/language``: language of the user interface (``de``,
  ``en``)
- ``GET``, ``PUT`` ``/api/replay/settings/default-source``: broker whose data a test run uses
- ``GET`` ``/api/replay/revision``: the commit pipwerk replay runs from

The rules for bodies, errors and texts are those of the public web API (``api_support.py``).
"""

from __future__ import annotations

import logging
from enum import Enum

from fastapi import APIRouter
from fastapi.responses import JSONResponse, Response
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
from pipwerk_replay.revision import REVISION_LENGTH, Revision
from pipwerk_replay.settings_service import (
    InvalidBrokerNameError,
    Language,
    SettingsService,
    StoredDefaultSourceInvalidError,
    StoredLanguageInvalidError,
)

logger = logging.getLogger(__name__)

TAGS: list[str | Enum] = ["internal"]

STORED_LANGUAGE_INVALID_TEXT = "The stored pipwerk replay language is invalid."
STORED_DEFAULT_SOURCE_INVALID_TEXT = "The stored pipwerk replay default source is invalid."


class ReplayLanguage(ApiModel):
    """The language of the user interface."""

    language: Language


class ReplayLanguageUpdate(ApiModel):
    """Write model of the language. Only the languages German and English are accepted;
    unknown fields are rejected rather than silently ignored."""

    model_config = ConfigDict(extra="forbid", strict=True)

    language: Language


class DefaultSource(ApiModel):
    """The default source: the name of the broker whose data a test run uses, ``null`` if none
    is set."""

    broker: Name | None


class DefaultSourceUpdate(ApiModel):
    """Write model of the default source. ``null`` removes it. The broker need not exist in the
    data stock yet."""

    model_config = ConfigDict(extra="forbid", strict=True)

    broker: Name | None


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


def _stored_default_source_invalid(error: StoredDefaultSourceInvalidError) -> Response:
    logger.error("%s", error)
    return api_error(503, STORED_DEFAULT_SOURCE_INVALID_TEXT)


def _invalid_broker_name(_error: InvalidBrokerNameError) -> Response:
    return invalid_place(["broker"], "value_error")


_HANDLERS: dict[type[Exception], Handler] = {
    InvalidBrokerNameError: _invalid_broker_name,
    StoredLanguageInvalidError: _stored_language_invalid,
    StoredDefaultSourceInvalidError: _stored_default_source_invalid,
}


def build_router(settings: SettingsService, revision: Revision | None) -> APIRouter:
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
        "/settings/default-source",
        operation_id="read_default_source",
        summary="Read the default source",
        description=(
            "Returns the name of the broker whose data a test run uses, ``null`` as long as "
            "none is set. Responds with HTTP 503 if the stored value is no valid name; a valid "
            "write repairs it."
        ),
        responses={
            200: {"description": "The default source.", "model": DefaultSource},
            **error_responses(503),
        },
    )
    def read_default_source() -> Response:
        def run() -> Response:
            body = DefaultSource(broker=settings.get_default_source())
            return JSONResponse(content=body.model_dump(mode="json"))

        return guarded(run, _HANDLERS)

    @router.put(
        "/settings/default-source",
        operation_id="write_default_source",
        summary="Change the default source",
        description=(
            "Stores the name of the broker whose data a test run uses; ``null`` removes it. The "
            "broker need not have data in the data stock yet."
        ),
        responses={
            200: {"description": "The default source as stored.", "model": DefaultSource},
            **error_responses(413, 415, 422),
        },
        openapi_extra=body_description(DefaultSourceUpdate, "The new default source."),
    )
    def write_default_source(body: JsonBody) -> Response:
        def run() -> Response:
            update = parse_body(body, DefaultSourceUpdate)
            stored = DefaultSource(broker=settings.set_default_source(update.broker))
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
