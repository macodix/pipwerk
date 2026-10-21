"""The page ``/docs`` with Swagger UI in a fixed version and with Subresource Integrity.

FastAPI's own ``/docs`` loads Swagger UI from a content delivery network (CDN) by the major
version only, without a check of what arrives, and the icon from the server of FastAPI. The
page would run code of a third party in the origin of the backend (OWASP ASVS, integrity of
resources loaded from outside). This module replaces it, exactly as pipwerk Studio does:

- ``SWAGGER_UI_VERSION`` is one exact version of the npm package ``swagger-ui-dist``.
- The script and the stylesheet are loaded from the CDN ``cdn.jsdelivr.net`` under that
  version and carry the attributes ``integrity`` (SHA-384 of the file) and ``crossorigin``,
  so the browser refuses a file that differs. ``SWAGGER_UI_BUNDLE_INTEGRITY`` and
  ``SWAGGER_UI_CSS_INTEGRITY`` are the checksums of the files of that version.
- The icon is an empty data URI; nothing else is loaded from outside. The page ``/redoc`` of
  FastAPI (same CDN problem) is not offered.

The checksums are those of the files in the package ``swagger-ui-dist`` 5.33.1 of the npm
registry that pipwerk Studio uses (see ``docs/technical/pipwerk-studio.md``, section 2.11, for
how they were computed). A change of the version needs new checksums.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import HTMLResponse

SWAGGER_UI_VERSION = "5.33.1"
SWAGGER_UI_BASE_URL = f"https://cdn.jsdelivr.net/npm/swagger-ui-dist@{SWAGGER_UI_VERSION}"
SWAGGER_UI_BUNDLE_URL = f"{SWAGGER_UI_BASE_URL}/swagger-ui-bundle.js"
SWAGGER_UI_CSS_URL = f"{SWAGGER_UI_BASE_URL}/swagger-ui.css"
SWAGGER_UI_BUNDLE_INTEGRITY = (
    "sha384-ZPehFMQommnnuaZ4rpxgkgTT2DKFVp4hZC/7pLit+9Lek9T1YGSo23eHFbvNkXkw"
)
SWAGGER_UI_CSS_INTEGRITY = "sha384-Ov4/wv3j2bmct8cDc5X4ngJZohVPzEmc6uDPH8WeljUxO5vtoykvMEfbu9Vh6RaW"

DOCS_PATH = "/docs"
_EMPTY_ICON = "data:,"


def swagger_ui_page(openapi_url: str, title: str) -> str:
    """The HTML of the page: the one of FastAPI with our URLs, with ``integrity`` and
    ``crossorigin`` on the script and the stylesheet."""
    body = get_swagger_ui_html(
        openapi_url=openapi_url,
        title=title,
        swagger_js_url=SWAGGER_UI_BUNDLE_URL,
        swagger_css_url=SWAGGER_UI_CSS_URL,
        swagger_favicon_url=_EMPTY_ICON,
        oauth2_redirect_url=None,
    ).body
    html = bytes(body).decode("utf-8")
    script = f'<script src="{SWAGGER_UI_BUNDLE_URL}"></script>'
    style = f'<link type="text/css" rel="stylesheet" href="{SWAGGER_UI_CSS_URL}">'
    if script not in html or style not in html:
        raise RuntimeError("The page of Swagger UI of FastAPI has changed.")
    html = html.replace(
        script,
        f'<script src="{SWAGGER_UI_BUNDLE_URL}" integrity="{SWAGGER_UI_BUNDLE_INTEGRITY}" '
        'crossorigin="anonymous"></script>',
    )
    return html.replace(
        style,
        f'<link type="text/css" rel="stylesheet" href="{SWAGGER_UI_CSS_URL}" '
        f'integrity="{SWAGGER_UI_CSS_INTEGRITY}" crossorigin="anonymous">',
    )


def install_docs(app: FastAPI) -> None:
    """Add the page ``/docs``. The application is created with ``docs_url=None`` and
    ``redoc_url=None``."""

    @app.get(DOCS_PATH, include_in_schema=False)
    def docs() -> HTMLResponse:
        return HTMLResponse(swagger_ui_page(app.openapi_url or "/openapi.json", app.title))
