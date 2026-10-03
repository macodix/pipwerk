"""HTTP application of Pipwerk Studio.

The application currently only provides technical endpoints: a health check
that lets the Studio user interface verify that it can reach its backend, and
an information endpoint that reports the application name and version. No
domain logic lives in this module.
"""

from importlib.metadata import PackageNotFoundError, version
from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel, ConfigDict

# Visible product name of the component. It is not translated.
APPLICATION_NAME = "Pipwerk Studio"

# Name of the Python distribution that carries the version of this backend.
# The version itself is declared once in pyproject.toml and read from the
# installed package metadata, so it is not maintained a second time here.
DISTRIBUTION_NAME = "pipwerk-studio"

# Reported version if the backend runs without installed package metadata.
UNKNOWN_VERSION = "0+unknown"


class HealthStatus(BaseModel):
    """Response of the health check endpoint."""

    model_config = ConfigDict(extra="forbid", strict=True)

    status: Literal["ok"]


class ApplicationInfo(BaseModel):
    """Response of the application information endpoint."""

    model_config = ConfigDict(extra="forbid", strict=True)

    name: str
    version: str


def application_version() -> str:
    """Return the version of the backend from its package metadata."""
    try:
        return version(DISTRIBUTION_NAME)
    except PackageNotFoundError:
        return UNKNOWN_VERSION


def create_app() -> FastAPI:
    """Create the Pipwerk Studio HTTP application."""
    app = FastAPI(title=APPLICATION_NAME)

    @app.get("/api/health")
    def read_health() -> HealthStatus:
        return HealthStatus(status="ok")

    @app.get("/api/info")
    def read_info() -> ApplicationInfo:
        return ApplicationInfo(name=APPLICATION_NAME, version=application_version())

    return app
