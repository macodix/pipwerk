"""The shared key (specification backtest 5.4 and 11, OWASP API2).

The program serves only requests that carry the shared key in the header
``Authorization: Bearer <key>``, on every path and for every method. The comparison takes
the same time whatever the key looks like (``hmac.compare_digest`` over the SHA-256 digests of
both keys, which also gives both the same length). A request without the key, with a wrong
key, with a repeated header or with another scheme gets the same answer, HTTP 401 with the
error ``unauthorized`` and no information about instruments, paths or the cause.

The middleware runs before the body is read and before the request is routed, so that an
unknown path gives the same answer as a known one.
"""

from __future__ import annotations

import hashlib
import hmac

from starlette.types import ASGIApp, Receive, Scope, Send

from pipwerk_fetch_mt5.errors import error_response

BEARER_PREFIX = "bearer "


def _digest(key: str) -> bytes:
    return hashlib.sha256(key.encode("utf-8")).digest()


class SharedKeyMiddleware:
    """ASGI middleware that answers HTTP 401 unless the request carries the shared key."""

    def __init__(self, app: ASGIApp, *, shared_key: str) -> None:
        self._app = app
        self._expected = _digest(shared_key)

    def _allows(self, scope: Scope) -> bool:
        values = [value for name, value in scope["headers"] if name == b"authorization"]
        if len(values) != 1:
            return False
        text = values[0].decode("latin-1")
        if text[: len(BEARER_PREFIX)].lower() != BEARER_PREFIX:
            return False
        offered = text[len(BEARER_PREFIX) :].strip()
        return hmac.compare_digest(_digest(offered), self._expected)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] not in ("http", "websocket") or self._allows(scope):
            await self._app(scope, receive, send)
            return
        if scope["type"] == "websocket":
            await send({"type": "websocket.close", "code": 1008})
            return
        response = error_response("unauthorized", headers={"WWW-Authenticate": "Bearer"})
        await response(scope, receive, send)
