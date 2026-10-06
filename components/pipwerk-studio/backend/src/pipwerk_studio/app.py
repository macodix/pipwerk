"""HTTP application of Pipwerk Studio.

The application provides a technical health check and the internal Studio
settings endpoints. The only operational setting kept today is the Studio
user interface language (req-ui-008): a component-wide, backend-authoritative
setting that is never stored in the browser and never part of strategy data.
No other domain logic lives in this module.
"""

from __future__ import annotations

import logging
from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict

from pipwerk_studio.config import load_database_url
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


def create_app(database_url: str | None = None) -> FastAPI:
    """Create the Pipwerk Studio HTTP application.

    ``database_url`` lets callers (notably the CLI entry point and tests)
    provide an explicit SQLAlchemy database URL. When omitted, the
    documented automatic startup configuration search
    (req-system-016/req-system-017) is used. If no valid startup
    configuration is found, ``StartupConfigError`` is raised; there is no
    implicit replacement database.
    """
    resolved_database_url = database_url if database_url is not None else load_database_url()
    engine = create_studio_engine(resolved_database_url)
    session_factory = create_session_factory(engine)
    settings_service = SettingsService(session_factory)

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

    return app
