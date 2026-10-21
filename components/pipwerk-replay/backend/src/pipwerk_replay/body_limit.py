"""Limit of the size of a request body (specification 11, OWASP API4).

The middleware answers HTTP 413 for a body larger than the limit. It checks the
size before the application reads the body, and therefore before any JSON is
parsed:

- A ``Content-Length`` that names a size above the limit is answered at once,
  without reading the body.
- Otherwise the middleware reads the body itself and counts the bytes that
  arrive, whatever ``Content-Length`` says (it may be missing, wrong or the
  body may be sent in chunks). At most the limit plus one chunk is held in
  memory. It stops reading when the limit is exceeded.
- A body within the limit is handed on unchanged.

It applies to all requests below a path prefix. The limit is a setting of the
backend (``max_body_bytes`` in the startup configuration, ``config.py``). A path can have its
own limit (``overrides``, exact path): the upload of a file for the data stock is larger than
a JSON body (``max_upload_bytes``).
"""

from __future__ import annotations

from collections.abc import Mapping

from fastapi.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

BODY_TOO_LARGE_TEXT = "The request body is larger than the limit."


class BodyLimitMiddleware:
    """ASGI middleware that rejects a request body above ``limit`` bytes with HTTP 413."""

    def __init__(
        self,
        app: ASGIApp,
        *,
        limit: int,
        prefix: str,
        overrides: Mapping[str, int] | None = None,
    ) -> None:
        self._app = app
        self._limit = limit
        self._prefix = prefix.rstrip("/")
        self._overrides = dict(overrides or {})

    def _applies(self, scope: Scope) -> bool:
        if scope["type"] != "http":
            return False
        path: str = scope["path"]
        return path == self._prefix or path.startswith(self._prefix + "/")

    def _declared_size(self, scope: Scope) -> int | None:
        """The size ``Content-Length`` names, or ``None`` if there is none or it is no number."""
        for name, value in scope["headers"]:
            if name == b"content-length":
                text = value.decode("latin-1").strip()
                return int(text) if text.isascii() and text.isdigit() else None
        return None

    async def _reject(self, scope: Scope, receive: Receive, send: Send) -> None:
        response = JSONResponse(status_code=413, content={"detail": BODY_TOO_LARGE_TEXT})
        await response(scope, receive, send)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if not self._applies(scope):
            await self._app(scope, receive, send)
            return
        limit = self._overrides.get(scope["path"], self._limit)
        declared = self._declared_size(scope)
        if declared is not None and declared > limit:
            await self._reject(scope, receive, send)
            return
        chunks: list[bytes] = []
        size = 0
        more = True
        while more:
            message = await receive()
            if message["type"] == "http.disconnect":
                return  # the client has gone; there is nobody to answer
            body: bytes = message.get("body", b"")
            size += len(body)
            if size > limit:
                await self._reject(scope, receive, send)
                return
            chunks.append(body)
            more = bool(message.get("more_body", False))
        replayed = False

        async def replay() -> Message:
            nonlocal replayed
            if not replayed:
                replayed = True
                return {"type": "http.request", "body": b"".join(chunks), "more_body": False}
            return await receive()  # later: the disconnect of the client

        await self._app(scope, replay, send)
