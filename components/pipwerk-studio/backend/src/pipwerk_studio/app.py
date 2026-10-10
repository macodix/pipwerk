"""HTTP application of Pipwerk Studio.

The application provides a technical health check, the internal Studio
settings endpoints and the internal Studio revision endpoint. The only
operational setting kept today is the Studio user interface language
(req-ui-008): a component-wide, backend-authoritative setting that
is never stored in the browser and never part of strategy data.
No other domain logic lives in this module.
"""

from __future__ import annotations

import logging
from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, model_validator

from pipwerk_studio.config import load_database_url
from pipwerk_studio.revision import (
    CommitDateLookup,
    RevisionLookup,
    determine_revision,
    lookup_git_commit_date,
    lookup_git_revision,
)
from pipwerk_studio.settings_service import (
    Language,
    SettingsService,
    StoredLanguageInvalidError,
)
from pipwerk_studio.storage import create_session_factory, create_studio_engine

logger = logging.getLogger(__name__)


class HealthStatus(BaseModel):
    """Response of the health check endpoint."""

    model_config = ConfigDict(extra="forbid", strict=True)

    status: Literal["ok"]


class StudioLanguage(BaseModel):
    """Read model of the current Studio user interface language.

    Returned by the read endpoint. Read and write models are separate and strictly
    validated; unknown fields are rejected.
    """

    model_config = ConfigDict(extra="forbid", strict=True)

    language: Language


class StudioLanguageUpdate(BaseModel):
    """Write model to change the Studio user interface language.

    Only the supported languages German and English are accepted; unknown fields are
    rejected rather than silently ignored.
    """

    model_config = ConfigDict(extra="forbid", strict=True)

    language: Language


class StudioRevision(BaseModel):
    """Read model of the revision Studio runs from.

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
) -> FastAPI:
    """Create the Pipwerk Studio HTTP application.

    ``database_url`` lets callers (notably the CLI entry point and tests)
    provide an explicit SQLAlchemy database URL. When omitted, the
    documented automatic startup configuration search
    (req-system-016/req-system-017) is used. If no valid startup
    configuration is found, ``StartupConfigError`` is raised; there is no
    implicit replacement database.

    ``revision_lookup`` determines the full commit hash and ``commit_date_lookup``
    its committer date, once at creation; tests replace them to stay independent
    of a real Git working tree.
    """
    resolved_database_url = database_url if database_url is not None else load_database_url()
    engine = create_studio_engine(resolved_database_url)
    session_factory = create_session_factory(engine)
    settings_service = SettingsService(session_factory)
    studio_revision = determine_revision(revision_lookup, commit_date_lookup)

    app = FastAPI(title="Pipwerk Studio")

    @app.get("/api/health")
    def read_health() -> HealthStatus:
        return HealthStatus(status="ok")

    @app.get(
        "/api/studio/settings/language",
        summary="Read the current Studio user interface language",
        description=(
            "Internal Studio settings endpoint used by the Studio user "
            "interface. Returns the single, backend-authoritative Studio "
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
                detail="The stored Studio language is invalid.",
            ) from error

    @app.put(
        "/api/studio/settings/language",
        summary="Change the current Studio user interface language",
        description=(
            "Internal Studio settings endpoint used by the Studio user "
            "interface. Persists the single, backend-authoritative Studio "
            "language. Only 'de' and 'en' are accepted; unknown fields are "
            "rejected. Changing the language never changes strategy "
            "content or other domain configuration."
        ),
    )
    def write_language(update: StudioLanguageUpdate) -> StudioLanguage:
        stored = settings_service.set_language(update.language)
        return StudioLanguage(language=stored)

    @app.get(
        "/api/studio/revision",
        summary="Read the revision Studio runs from",
        description=(
            "Internal Studio endpoint used by the Studio user interface. "
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
