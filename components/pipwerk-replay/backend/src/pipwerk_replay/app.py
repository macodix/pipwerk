"""HTTP application of pipwerk replay.

The application provides a technical health check, the public web API under ``/api/v1/`` (test
accounts and data stock; ``web_api.py``, ``marketdata_api.py``) and the internal endpoints under
``/api/replay/`` (language, broker for test runs, revision; ``internal_api.py``). The
language is a component-wide, backend-authoritative setting that is never stored in the browser
(req-ui-008). No other domain logic lives in this module.
"""

from __future__ import annotations

import logging
from collections.abc import Callable, Sequence
from typing import Literal

from fastapi import FastAPI, Request
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.responses import Response
from pipwerk_marketdata import CompletenessRules, MarketDataStore
from pydantic import BaseModel, ConfigDict

from pipwerk_replay.accounts import AccountService
from pipwerk_replay.api_support import is_api_path, request_validation_response
from pipwerk_replay.config import (
    DEFAULT_MAX_BODY_BYTES,
    MarketDataSettings,
    load_startup_config,
)
from pipwerk_replay.docs_page import install_docs
from pipwerk_replay.host_check import HostCheckMiddleware, build_allowed_hosts
from pipwerk_replay.import_processes import ImportProcesses
from pipwerk_replay.marketdata_examples import keep_nulls_in_examples
from pipwerk_replay.marketdata_service import MarketDataService
from pipwerk_replay.revision import (
    CommitDateLookup,
    RevisionLookup,
    determine_revision,
    lookup_git_commit_date,
    lookup_git_revision,
)
from pipwerk_replay.settings_service import SettingsService
from pipwerk_replay.storage import (
    create_database_engine,
    create_replay_engine,
    create_session_factory,
    migrate_marketdata,
)
from pipwerk_replay.web_api import install_api

logger = logging.getLogger(__name__)


class HealthStatus(BaseModel):
    """Response of the health check endpoint."""

    model_config = ConfigDict(extra="forbid", strict=True)

    status: Literal["ok"]


def create_app(
    database_url: str | None = None,
    allowed_hosts: Sequence[str] = (),
    max_body_bytes: int | None = None,
    *,
    marketdata: MarketDataSettings | None = None,
    revision_lookup: RevisionLookup = lookup_git_revision,
    commit_date_lookup: CommitDateLookup = lookup_git_commit_date,
    import_clock: Callable[[], float] | None = None,
) -> FastAPI:
    """Create the pipwerk replay HTTP application.

    ``database_url`` lets callers (notably the CLI entry point and tests)
    provide an explicit SQLAlchemy database URL. When omitted, the documented
    automatic startup configuration search (req-system-016/req-system-017) is
    used, and then ``allowed_hosts``, ``max_body_bytes`` and ``marketdata`` default
    to the values of the startup configuration unless given. If no valid startup
    configuration is found, ``StartupConfigError`` is raised; there is no
    implicit replacement database.

    The database is brought to the newest schema, the data stock (``pipwerk_marketdata``) in
    its own database - the one of ``marketdata``, else the one of pipwerk replay - to its
    own newest schema, and the default test account is created if it is missing
    (specification 6.2).

    ``allowed_hosts`` lists the names (and IP addresses) allowed in the ``Host``
    header of a request in addition to the default names ``127.0.0.1``,
    ``localhost`` and ``::1`` (``host_check.py``); every other request is
    answered with HTTP 400.

    ``max_body_bytes`` is the largest request body below ``/api/v1/`` and ``/api/replay/``
    (default 2 MiB); the request of a file of an import has the limit of ``marketdata`` (the
    size of one file plus the envelope of the form). ``revision_lookup`` and
    ``commit_date_lookup`` determine the revision (tests). ``import_clock`` is the clock of the
    idle time of the import processes (seconds; tests); default is the monotonic clock.
    """
    if database_url is None:
        startup_config = load_startup_config()
        resolved_database_url = startup_config.database_url
        resolved_hosts = [*startup_config.allowed_hosts, *allowed_hosts]
        resolved_limit = startup_config.max_body_bytes if max_body_bytes is None else max_body_bytes
        resolved_marketdata = startup_config.marketdata if marketdata is None else marketdata
    else:
        resolved_database_url = database_url
        resolved_hosts = list(allowed_hosts)
        resolved_limit = DEFAULT_MAX_BODY_BYTES if max_body_bytes is None else max_body_bytes
        resolved_marketdata = MarketDataSettings() if marketdata is None else marketdata
    engine = create_replay_engine(resolved_database_url)
    marketdata_url = resolved_marketdata.database_url
    if marketdata_url is None or marketdata_url == resolved_database_url:
        marketdata_engine = engine
    else:
        marketdata_engine = create_database_engine(marketdata_url)
    migrate_marketdata(marketdata_engine)
    session_factory = create_session_factory(engine)
    settings_service = SettingsService(session_factory)
    account_service = AccountService(session_factory)
    if account_service.ensure_default_account():
        logger.info("The default test account was created.")

    store = MarketDataStore(
        marketdata_engine,
        max_page_size=resolved_marketdata.max_listed_items,
        rules=CompletenessRules(no_trading_days=resolved_marketdata.no_trading_days),
    )
    processes = (
        ImportProcesses(resolved_marketdata.import_idle_timeout_seconds)
        if import_clock is None
        else ImportProcesses(resolved_marketdata.import_idle_timeout_seconds, import_clock)
    )
    marketdata_service = MarketDataService(store, resolved_marketdata, settings_service, processes)
    revision = determine_revision(revision_lookup, commit_date_lookup)

    # One schema per model for requests and responses together.
    app = FastAPI(
        title="pipwerk replay",
        separate_input_output_schemas=False,
        docs_url=None,  # /docs is added by docs_page.py (fixed version, Subresource Integrity)
        redoc_url=None,
    )
    install_docs(app)
    keep_nulls_in_examples(app)
    install_api(
        app,
        accounts=account_service,
        settings=settings_service,
        marketdata=marketdata_service,
        revision=revision,
        max_body_bytes=resolved_limit,
    )

    # The outermost middleware (added last): every request on every path is checked.
    app.add_middleware(HostCheckMiddleware, allowed_hosts=build_allowed_hosts(resolved_hosts))

    @app.get("/api/health")
    def read_health() -> HealthStatus:
        return HealthStatus(status="ok")

    @app.exception_handler(RequestValidationError)
    async def handle_invalid_request(request: Request, error: RequestValidationError) -> Response:
        if is_api_path(request.url.path):
            return request_validation_response(error)
        return await request_validation_exception_handler(request, error)

    return app
