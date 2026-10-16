"""HTTP application of pipwerk Studio.

The application provides a technical health check, the internal pipwerk Studio
settings endpoints and the internal pipwerk Studio revision endpoint. The
operational settings kept are the pipwerk Studio user interface language
(req-ui-008) and the object directory (specification 4.1): component-wide,
backend-authoritative settings that are never stored in the browser and never
part of strategy data. No other domain logic lives in this module.
"""

from __future__ import annotations

import logging
from typing import Literal

from fastapi import FastAPI, HTTPException, Request
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, ConfigDict, Field, model_validator

from pipwerk_studio.config import ConfigOrigin, load_startup_config
from pipwerk_studio.object_store import (
    ObjectConflictError,
    ObjectMoveError,
    ObjectMoveRollbackError,
)
from pipwerk_studio.revision import (
    CommitDateLookup,
    RevisionLookup,
    determine_revision,
    lookup_git_commit_date,
    lookup_git_revision,
)
from pipwerk_studio.settings_service import (
    MAX_OBJECT_DIRECTORY_LENGTH,
    InvalidObjectDirectoryError,
    Language,
    ObjectDirectorySetting,
    SettingsService,
    StoredLanguageInvalidError,
    StoredObjectDirectoryInvalidError,
)
from pipwerk_studio.storage import create_session_factory, create_studio_engine

logger = logging.getLogger(__name__)


class HealthStatus(BaseModel):
    """Response of the health check endpoint."""

    model_config = ConfigDict(extra="forbid", strict=True)

    status: Literal["ok"]


class StudioLanguage(BaseModel):
    """Read model of the current pipwerk Studio user interface language.

    Returned by the read endpoint. Read and write models are separate and strictly
    validated; unknown fields are rejected.
    """

    model_config = ConfigDict(extra="forbid", strict=True)

    language: Language


class StudioLanguageUpdate(BaseModel):
    """Write model to change the pipwerk Studio user interface language.

    Only the supported languages German and English are accepted; unknown fields are
    rejected rather than silently ignored.
    """

    model_config = ConfigDict(extra="forbid", strict=True)

    language: Language


class StudioObjectDirectory(BaseModel):
    """Read model of the object directory (specification 4.1).

    ``path`` is the stored absolute path or the default; it is ``null`` if
    nothing is stored and the default cannot be determined ("not set").
    ``is_default`` is true as long as nothing is stored.
    """

    model_config = ConfigDict(extra="forbid", strict=True)

    path: str | None
    is_default: bool


class StudioObjectDirectoryUpdate(BaseModel):
    """Write model to change the object directory.

    ``path`` must be an absolute path. With ``move`` true the object files are
    moved to the new directory before the setting is saved.
    """

    model_config = ConfigDict(extra="forbid", strict=True)

    path: str = Field(max_length=MAX_OBJECT_DIRECTORY_LENGTH)
    move: bool


class ObjectDirectoryError(BaseModel):
    """Error body of the object directory endpoints: a fixed text only."""

    model_config = ConfigDict(extra="forbid", strict=True)

    detail: str


class ObjectMoveRestoreFailure(BaseModel):
    """Error body if moving failed and the files could not be brought back.

    ``source_directory`` is the old and ``target_directory`` the new object
    directory; ``files`` are the names of the files that are now in the new
    directory and could not be brought back.
    """

    model_config = ConfigDict(extra="forbid", strict=True)

    detail: str
    source_directory: str
    target_directory: str
    files: list[str]


OBJECT_DIRECTORY_PATH = "/api/studio/settings/object-directory"
INVALID_OBJECT_DIRECTORY_BODY_TEXT = (
    "The request body must be a JSON object with the fields path (text) and move (true or false)."
)
INVALID_OBJECT_DIRECTORY_TEXT = "The object directory must be an absolute path."
STORED_OBJECT_DIRECTORY_INVALID_TEXT = "The stored pipwerk Studio object directory is invalid."
OBJECT_CONFLICT_TEXT = (
    "The new object directory already contains files with the same names. Nothing was moved."
)
OBJECT_MOVE_FAILED_TEXT = (
    "Moving the object files failed. The files were brought back and the object directory "
    "is unchanged."
)
OBJECT_MOVE_NOT_RESTORED_TEXT = (
    "Moving the object files failed and some files could not be brought back. "
    "The object directory is unchanged."
)


def _object_directory_model(setting: ObjectDirectorySetting) -> StudioObjectDirectory:
    return StudioObjectDirectory(
        path=None if setting.path is None else str(setting.path),
        is_default=setting.is_default,
    )


class StudioRevision(BaseModel):
    """Read model of the revision pipwerk Studio runs from.

    ``revision`` is the 7-character short form of the Git commit, ``commit`` the
    full 40-character hash and ``committed_at`` the committer date as ISO 8601
    string with offset. ``revision`` and ``commit`` are both ``null`` if the
    revision is not determinable; ``committed_at`` is ``null`` if the date is not
    determinable and always ``null`` without a commit.
    """

    model_config = ConfigDict(extra="forbid", strict=True)

    revision: str | None
    commit: str | None
    committed_at: str | None

    @model_validator(mode="after")
    def _check_invariants(self) -> StudioRevision:
        if (self.revision is None) != (self.commit is None):
            raise ValueError("revision and commit must both be null or both be set")
        if self.commit is not None and self.revision != self.commit[:7]:
            raise ValueError("revision must be the first 7 characters of commit")
        if self.commit is None and self.committed_at is not None:
            raise ValueError("committed_at requires a commit")
        return self


def create_app(
    database_url: str | None = None,
    revision_lookup: RevisionLookup = lookup_git_revision,
    commit_date_lookup: CommitDateLookup = lookup_git_commit_date,
    config_origin: ConfigOrigin | None = None,
) -> FastAPI:
    """Create the pipwerk Studio HTTP application.

    ``database_url`` lets callers (notably the CLI entry point and tests)
    provide an explicit SQLAlchemy database URL. When omitted, the
    documented automatic startup configuration search
    (req-system-016/req-system-017) is used. If no valid startup
    configuration is found, ``StartupConfigError`` is raised; there is no
    implicit replacement database.

    ``config_origin`` tells where the startup configuration was found; it
    decides the default of the object directory. It is taken from the startup
    configuration if that is loaded here. A caller that passes ``database_url``
    without ``config_origin`` is treated like a startup configuration given
    with ``-c``.

    ``revision_lookup`` determines the full commit hash and ``commit_date_lookup``
    its committer date, once at creation; tests replace them to stay independent
    of a real Git working tree.
    """
    if database_url is None:
        startup_config = load_startup_config()
        resolved_database_url = startup_config.database_url
        resolved_origin: ConfigOrigin = startup_config.origin
    else:
        resolved_database_url = database_url
        resolved_origin = config_origin if config_origin is not None else "explicit"
    engine = create_studio_engine(resolved_database_url)
    session_factory = create_session_factory(engine)
    settings_service = SettingsService(session_factory, resolved_origin)
    studio_revision = determine_revision(revision_lookup, commit_date_lookup)

    app = FastAPI(title="pipwerk Studio")

    @app.get("/api/health")
    def read_health() -> HealthStatus:
        return HealthStatus(status="ok")

    @app.get(
        "/api/studio/settings/language",
        summary="Read the current pipwerk Studio user interface language",
        description=(
            "Internal pipwerk Studio settings endpoint used by the "
            "pipwerk Studio user interface. Returns the single, "
            "backend-authoritative pipwerk Studio "
            "language. Defaults to German when no language has been "
            "stored yet. Responds with HTTP 503 if the stored value is not "
            "a supported language; a valid write repairs it."
        ),
    )
    def read_language() -> StudioLanguage:
        try:
            return StudioLanguage(language=settings_service.get_language())
        except StoredLanguageInvalidError as error:
            logger.error("%s", error)
            raise HTTPException(
                status_code=503,
                detail="The stored pipwerk Studio language is invalid.",
            ) from error

    @app.put(
        "/api/studio/settings/language",
        summary="Change the current pipwerk Studio user interface language",
        description=(
            "Internal pipwerk Studio settings endpoint used by the "
            "pipwerk Studio user interface. Persists the single, "
            "backend-authoritative pipwerk Studio "
            "language. Only 'de' and 'en' are accepted; unknown fields are "
            "rejected. Changing the language never changes strategy "
            "content or other domain configuration."
        ),
    )
    def write_language(update: StudioLanguageUpdate) -> StudioLanguage:
        stored = settings_service.set_language(update.language)
        return StudioLanguage(language=stored)

    @app.exception_handler(RequestValidationError)
    async def handle_invalid_request(request: Request, error: RequestValidationError) -> Response:
        # The object directory endpoints answer with a fixed text that does not
        # repeat the input; the other endpoints keep the default answer.
        if request.url.path == OBJECT_DIRECTORY_PATH:
            body = ObjectDirectoryError(detail=INVALID_OBJECT_DIRECTORY_BODY_TEXT)
            return JSONResponse(status_code=422, content=body.model_dump())
        return await request_validation_exception_handler(request, error)

    @app.exception_handler(ObjectMoveRollbackError)
    def handle_object_move_not_restored(
        _request: Request, error: ObjectMoveRollbackError
    ) -> JSONResponse:
        logger.error("Moving the object files failed and they could not be restored.")
        body = ObjectMoveRestoreFailure(
            detail=OBJECT_MOVE_NOT_RESTORED_TEXT,
            source_directory=str(error.source),
            target_directory=str(error.target),
            files=error.names,
        )
        return JSONResponse(status_code=500, content=body.model_dump())

    @app.get(
        OBJECT_DIRECTORY_PATH,
        summary="Read the object directory of pipwerk Studio",
        description=(
            "Internal pipwerk Studio settings endpoint used by the pipwerk Studio "
            "user interface. Returns the absolute path of the object directory and "
            "whether it is the default. The default depends on where the startup "
            "configuration was found. The path is null if nothing is stored and "
            "the default cannot be determined. Responds with HTTP 503 if the "
            "stored value is not an absolute path; a valid write repairs it."
        ),
        responses={503: {"model": ObjectDirectoryError}},
    )
    def read_object_directory() -> StudioObjectDirectory:
        try:
            return _object_directory_model(settings_service.get_object_directory())
        except StoredObjectDirectoryInvalidError as error:
            logger.error("%s", error)
            raise HTTPException(
                status_code=503, detail=STORED_OBJECT_DIRECTORY_INVALID_TEXT
            ) from error

    @app.put(
        OBJECT_DIRECTORY_PATH,
        summary="Change the object directory of pipwerk Studio",
        description=(
            "Internal pipwerk Studio settings endpoint used by the pipwerk Studio "
            "user interface. Changes the object directory to an absolute path. "
            "With move set to true all object files are moved to the new "
            "directory first and the setting is saved afterwards; without it only "
            "the setting is saved. Responds with HTTP 422 for an invalid body or "
            "a path that is not absolute, HTTP 409 if the new directory already "
            "contains a file of the same name (nothing is moved), and HTTP 500 if "
            "moving failed. After a failed move the moved files are brought back "
            "and the setting is unchanged; if that fails too, the response names "
            "both directories and the files concerned. A file is never overwritten."
        ),
        responses={
            409: {"model": ObjectDirectoryError},
            422: {"model": ObjectDirectoryError},
            500: {"model": ObjectMoveRestoreFailure},
        },
    )
    def write_object_directory(update: StudioObjectDirectoryUpdate) -> StudioObjectDirectory:
        try:
            setting = settings_service.set_object_directory(update.path, move=update.move)
        except InvalidObjectDirectoryError as error:
            raise HTTPException(status_code=422, detail=INVALID_OBJECT_DIRECTORY_TEXT) from error
        except ObjectConflictError as error:
            raise HTTPException(status_code=409, detail=OBJECT_CONFLICT_TEXT) from error
        except ObjectMoveError as error:
            logger.error("Moving the object files failed.", exc_info=error)
            raise HTTPException(status_code=500, detail=OBJECT_MOVE_FAILED_TEXT) from error
        return _object_directory_model(setting)

    @app.get(
        "/api/studio/revision",
        summary="Read the revision pipwerk Studio runs from",
        description=(
            "Internal pipwerk Studio endpoint used by the pipwerk Studio "
            "user interface. "
            "Returns the 7-character short form, the full hash and the committer "
            "date (ISO 8601 with offset) of the Git commit determined once at "
            "startup. The revision and commit are null if the revision is not "
            "determinable; the date is null if it is not determinable."
        ),
    )
    def read_revision() -> StudioRevision:
        if studio_revision is None:
            return StudioRevision(revision=None, commit=None, committed_at=None)
        return StudioRevision(
            revision=studio_revision.short,
            commit=studio_revision.commit,
            committed_at=studio_revision.committed_at,
        )

    return app
