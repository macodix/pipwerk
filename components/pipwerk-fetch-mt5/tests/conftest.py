"""Fixtures shared by the tests."""

from collections.abc import Callable
from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from support import KEY, LOCAL, ScriptedGateway, make_config

from pipwerk_fetch_mt5.app import create_app
from pipwerk_fetch_mt5.fake_source import FakeGateway, create_fake_source_app
from pipwerk_fetch_mt5.gateway import TerminalGateway
from pipwerk_fetch_mt5.service import FetchService

AUTH = {"Authorization": f"Bearer {KEY}"}


@pytest.fixture
def make_client() -> Callable[..., TestClient]:
    """A client for the application on a gateway the test chooses.

    The client addresses the program as ``127.0.0.1`` (the test client would send
    ``Host: testserver``, which the program rejects) and carries the key, unless the test
    passes ``headers={}`` or other headers.
    """

    def build(
        gateway: TerminalGateway | None = None,
        *,
        headers: dict[str, str] | None = None,
        allowed_hosts: tuple[str, ...] = (),
        raise_server_exceptions: bool = False,
        **config: object,
    ) -> TestClient:
        service = FetchService(
            gateway or ScriptedGateway(), make_config(**config), clock=lambda: FIXED_CLOCK
        )
        app = create_app(service, shared_key=KEY, allowed_hosts=allowed_hosts)
        return TestClient(
            app,
            base_url=LOCAL,
            headers=AUTH if headers is None else headers,
            raise_server_exceptions=raise_server_exceptions,
        )

    return build


FIXED_CLOCK = datetime.fromisoformat("2026-01-05T08:00:00+00:00")


@pytest.fixture
def fake_gateway() -> FakeGateway:
    return FakeGateway()


@pytest.fixture
def fake_client(fake_gateway: FakeGateway) -> TestClient:
    """A client for the replica of the source, with the key of the replica."""
    app = create_fake_source_app(gateway=fake_gateway, clock=lambda: FIXED_CLOCK)
    return TestClient(
        app,
        base_url=LOCAL,
        headers={"Authorization": "Bearer fake-source-test-key-not-a-secret"},
        raise_server_exceptions=False,
    )
