"""HTTP application of Pipwerk Studio.

The application currently only provides a technical health check. It lets the
Studio user interface verify that it can reach its backend. No domain logic
lives in this module.
"""

from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel, ConfigDict


class HealthStatus(BaseModel):
    """Response of the health check endpoint."""

    model_config = ConfigDict(extra="forbid", strict=True)

    status: Literal["ok"]


def create_app() -> FastAPI:
    """Create the Pipwerk Studio HTTP application."""
    app = FastAPI(title="Pipwerk Studio")

    @app.get("/api/health")
    def read_health() -> HealthStatus:
        return HealthStatus(status="ok")

    return app
