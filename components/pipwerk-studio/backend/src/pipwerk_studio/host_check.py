"""Check of the ``Host`` header against DNS rebinding (specification 8, OWASP API8).

A web page of another origin can make the browser resolve its own name to the address of
this backend (DNS rebinding). The browser then treats the backend as the origin of the page and
sends requests without a preflight request. The request still carries the name of the page in
the ``Host`` header. The middleware therefore accepts a request, on every path, only if the
name in ``Host`` (without the port) is in a list of allowed names; otherwise it answers
HTTP 400 with a fixed text.

The list is a setting of the backend (startup configuration and command line, see
``config.py`` and ``cli.py``). The names that always belong to it are
``DEFAULT_ALLOWED_HOSTS``. Entries are lower case names or IP addresses (IPv6 without
brackets). The entry ``*ip`` stands for every IP address: a request to an IP address cannot be
a rebinding of a name (the test environment adds it for ``--host 0.0.0.0`` and ``--host ::``,
where the machine is reached under addresses that cannot be listed).
"""

from __future__ import annotations

import ipaddress
import re
from collections.abc import Iterable, Sequence

from starlette.types import ASGIApp, Receive, Scope, Send

from pipwerk_studio.errors import error_response

#: Names that are always allowed.
DEFAULT_ALLOWED_HOSTS: tuple[str, ...] = ("127.0.0.1", "localhost", "::1")

#: Entry that allows every IP address.
ANY_IP_ENTRY = "*ip"

_ENTRY_RE = re.compile(r"[a-z0-9._:-]+")
_PORT_RE = re.compile(r"[0-9]{1,5}")


class InvalidAllowedHostError(ValueError):
    """An entry of the list of allowed names is not a name or an IP address."""


def normalize_entry(entry: str) -> str:
    """The entry in the form the check compares: lower case, IPv6 without brackets, no
    trailing dot. Raises ``InvalidAllowedHostError`` for anything that is no name, no IP
    address and not ``*ip``."""
    text = entry.strip().lower()
    if text.startswith("[") and text.endswith("]") and ":" in text:
        text = text[1:-1]
    text = text.removesuffix(".")
    if text == ANY_IP_ENTRY:
        return text
    if _ENTRY_RE.fullmatch(text) is None:
        raise InvalidAllowedHostError("An allowed host must be a name or an IP address.")
    if ":" in text:
        try:
            return str(ipaddress.IPv6Address(text))  # the compressed form
        except ValueError as error:
            raise InvalidAllowedHostError(
                "An allowed host must be a name or an IP address."
            ) from error
    return text


def build_allowed_hosts(*lists: Iterable[str]) -> frozenset[str]:
    """The default names together with the entries of the given lists."""
    names = set(DEFAULT_ALLOWED_HOSTS)
    for entries in lists:
        names.update(normalize_entry(entry) for entry in entries)
    return frozenset(names)


def host_name(header: str) -> str | None:
    """The name of a ``Host`` header without the port, lower case, IPv6 without brackets, or
    ``None`` if the header is not a valid host with an optional port."""
    text = header.strip().lower()
    if not text:
        return None
    if text.startswith("["):
        end = text.find("]")
        if end == -1:
            return None
        name, rest = text[1:end], text[end + 1 :]
        if rest and not (rest.startswith(":") and _PORT_RE.fullmatch(rest[1:])):
            return None
        try:
            return str(ipaddress.IPv6Address(name))  # the compressed form
        except ValueError:
            return None
    if text.count(":") > 1:
        return None  # an IPv6 address without brackets is no valid Host header
    name, _, port = text.partition(":")
    if ":" in text and not _PORT_RE.fullmatch(port):
        return None
    name = name.removesuffix(".")
    return name if name and _ENTRY_RE.fullmatch(name) else None


def is_ip_address(name: str) -> bool:
    try:
        ipaddress.ip_address(name)
    except ValueError:
        return False
    return True


class HostCheckMiddleware:
    """ASGI middleware that answers HTTP 400 unless the name in ``Host`` is allowed."""

    def __init__(self, app: ASGIApp, *, allowed_hosts: Sequence[str] | frozenset[str]) -> None:
        self._app = app
        self._allowed = frozenset(normalize_entry(item) for item in allowed_hosts)
        self._any_ip = ANY_IP_ENTRY in self._allowed

    def _allows(self, scope: Scope) -> bool:
        values = [value for name, value in scope["headers"] if name == b"host"]
        if len(values) != 1:
            return False  # a missing or repeated Host header
        name = host_name(values[0].decode("latin-1"))
        if name is None:
            return False
        return name in self._allowed or (self._any_ip and is_ip_address(name))

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] not in ("http", "websocket") or self._allows(scope):
            await self._app(scope, receive, send)
            return
        if scope["type"] == "websocket":
            await send({"type": "websocket.close", "code": 1008})
            return
        response = error_response("host.not_allowed")
        await response(scope, receive, send)
