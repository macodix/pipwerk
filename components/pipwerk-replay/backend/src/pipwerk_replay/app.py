"""HTTP application of pipwerk replay.

The application provides a technical health check and the web API under
``/api/v1/`` (test accounts and settings, ``web_api.py``). The language is a
component-wide, backend-authoritative setting that is never stored in the browser
(req-ui-008). No other domain logic lives in this module.
"""

from __future__ import annotations

import logging
from collections.abc import Sequence
from typing import Literal

from fastapi import FastAPI, Request
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.responses import Response
from pydantic import BaseModel, ConfigDict

from pipwerk_replay.accounts import AccountService
from pipwerk_replay.config import DEFAULT_MAX_BODY_BYTES, load_startup_config
from pipwerk_replay.docs_page import install_docs
from pipwerk_replay.host_check import HostCheckMiddleware, build_allowed_hosts
from pipwerk_replay.settings_service import SettingsService
from pipwerk_replay.storage import create_replay_engine, create_session_factory
from pipwerk_replay.web_api import (
    install_public_api,
    is_public_path,
    request_validation_response,
)

logger = logging.getLogger(__name__)


class HealthStatus(BaseModel):
    """Response of the health check endpoint."""

    model_config = ConfigDict(extra="forbid", strict=True)

    status: Literal["ok"]


def create_app(
    database_url: str | None = None,
    allowed_hosts: Sequence[str] = (),
    max_body_bytes: int | None = None,
) -> FastAPI:
    """Create the pipwerk replay HTTP application.

    ``database_url`` lets callers (notably the CLI entry point and tests)
    provide an explicit SQLAlchemy database URL. When omitted, the documented
    automatic startup configuration search (req-system-016/req-system-017) is
    used, and then ``allowed_hosts`` and ``max_body_bytes`` default to the
    values of the startup configuration unless given. If no valid startup
    configuration is found, ``StartupConfigError`` is raised; there is no
    implicit replacement database.

    The database is brought to the newest schema, and the default test account is
    created if it is missing (specification 6.2).

    ``allowed_hosts`` lists the names (and IP addresses) allowed in the ``Host``
    header of a request in addition to the default names ``127.0.0.1``,
    ``localhost`` and ``::1`` (``host_check.py``); every other request is
    answered with HTTP 400.

    ``max_body_bytes`` is the largest request body below ``/api/v1/`` (default 2 MiB).
    """
    if database_url is None:
        startup_config = load_startup_config()
        resolved_database_url = startup_config.database_url
        resolved_hosts = [*startup_config.allowed_hosts, *allowed_hosts]
        resolved_limit = startup_config.max_body_bytes if max_body_bytes is None else max_body_bytes
    else:
        resolved_database_url = database_url
        resolved_hosts = list(allowed_hosts)
        resolved_limit = DEFAULT_MAX_BODY_BYTES if max_body_bytes is None else max_body_bytes
    engine = create_replay_engine(resolved_database_url)
    session_factory = create_session_factory(engine)
    settings_service = SettingsService(session_factory)
    account_service = AccountService(session_factory)
    if account_service.ensure_default_account():
        logger.info("The default test account was created.")

    # One schema per model for requests and responses together.
    app = FastAPI(
        title="pipwerk replay",
        separate_input_output_schemas=False,
        docs_url=None,  # /docs is added by docs_page.py (fixed version, Subresource Integrity)
        redoc_url=None,
    )
    install_docs(app)
    install_public_api(app, account_service, settings_service, max_body_bytes=resolved_limit)

    # The outermost middleware (added last): every request on every path is checked.
    app.add_middleware(HostCheckMiddleware, allowed_hosts=build_allowed_hosts(resolved_hosts))

    @app.get("/api/health")
    def read_health() -> HealthStatus:
        return HealthStatus(status="ok")

    @app.exception_handler(RequestValidationError)
    async def handle_invalid_request(request: Request, error: RequestValidationError) -> Response:
        if is_public_path(request.url.path):
            return request_validation_response(error)
        return await request_validation_exception_handler(request, error)

    return app
