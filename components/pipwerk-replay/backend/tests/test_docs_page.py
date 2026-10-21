"""Tests of the page ``/docs``.

The page loads Swagger UI in one exact version and every resource from a foreign server with
the attribute ``integrity`` (Subresource Integrity) and ``crossorigin``. Nothing else is loaded
from outside (no icon from the server of FastAPI, no unpinned version, no ``/redoc``).
"""

import base64
import re
from html.parser import HTMLParser
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from pipwerk_replay import docs_page
from pipwerk_replay.app import create_app

DOCUMENTS = Path(__file__).resolve().parents[4] / "docs" / "technical"
TECHNICAL_DOCUMENT = DOCUMENTS / "pipwerk-replay.md"
STUDIO_DOCUMENT = DOCUMENTS / "pipwerk-studio.md"
INTEGRITY = re.compile(r"sha384-[A-Za-z0-9+/]{64}")


class Resources(HTMLParser):
    """Collects every element with ``src`` or ``href`` and the inline scripts."""

    def __init__(self) -> None:
        super().__init__()
        self.elements: list[tuple[str, dict[str, str | None]]] = []
        self.inline_scripts: list[str] = []
        self._in_script = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if "src" in values or "href" in values:
            self.elements.append((tag, values))
        self._in_script = tag == "script" and "src" not in values

    def handle_endtag(self, tag: str) -> None:
        if tag == "script":
            self._in_script = False

    def handle_data(self, data: str) -> None:
        if self._in_script and data.strip():
            self.inline_scripts.append(data)


def page(tmp_path: Path) -> str:
    client = TestClient(create_app(f"sqlite:///{tmp_path / 'replay.db'}"))
    response = client.get("/docs")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    return response.text


def external(url: str | None) -> bool:
    return url is not None and (url.startswith(("http:", "https:", "//")))


def test_every_foreign_resource_has_a_fixed_version_and_integrity(tmp_path: Path) -> None:
    parser = Resources()
    parser.feed(page(tmp_path))
    foreign = [
        (tag, values)
        for tag, values in parser.elements
        if external(values.get("src")) or external(values.get("href"))
    ]
    assert {tag for tag, _ in foreign} == {"script", "link"}
    assert len(foreign) == 2
    for tag, values in foreign:
        url = values.get("src") or values.get("href") or ""
        assert url.startswith("https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.33.1/"), url
        assert INTEGRITY.fullmatch(values.get("integrity") or ""), (tag, values)
        assert values.get("crossorigin") == "anonymous", (tag, values)
    by_url = {values.get("src") or values.get("href"): values for _, values in foreign}
    assert (
        by_url[docs_page.SWAGGER_UI_BUNDLE_URL]["integrity"]
        == docs_page.SWAGGER_UI_BUNDLE_INTEGRITY
    )
    assert by_url[docs_page.SWAGGER_UI_CSS_URL]["integrity"] == docs_page.SWAGGER_UI_CSS_INTEGRITY


def test_nothing_else_is_loaded_from_outside(tmp_path: Path) -> None:
    text = page(tmp_path)
    assert "fastapi.tiangolo.com" not in text
    assert "@5/" not in text
    parser = Resources()
    parser.feed(text)
    for _tag, values in parser.elements:
        for url in (values.get("src"), values.get("href")):
            assert url is None or not external(url) or url.startswith(docs_page.SWAGGER_UI_BASE_URL)
    # the icon is an empty data URI; the only inline script starts Swagger UI on the own file
    icons = [
        values["href"] for tag, values in parser.elements if values.get("rel") == "shortcut icon"
    ]
    assert icons == ["data:,"]
    assert len(parser.inline_scripts) == 1
    assert "SwaggerUIBundle(" in parser.inline_scripts[0]
    assert "url: '/openapi.json'" in parser.inline_scripts[0]
    assert "http" not in parser.inline_scripts[0]


def test_the_version_is_one_exact_version_and_the_checksums_are_sha384_of_48_bytes() -> None:
    assert re.fullmatch(r"\d+\.\d+\.\d+", docs_page.SWAGGER_UI_VERSION)
    assert docs_page.SWAGGER_UI_BASE_URL.endswith(f"@{docs_page.SWAGGER_UI_VERSION}")
    for value in (docs_page.SWAGGER_UI_BUNDLE_INTEGRITY, docs_page.SWAGGER_UI_CSS_INTEGRITY):
        assert value.startswith("sha384-")
        assert len(base64.b64decode(value.removeprefix("sha384-"), validate=True)) == 48


def test_the_technical_documentation_names_version_and_checksums() -> None:
    text = TECHNICAL_DOCUMENT.read_text(encoding="utf-8")
    assert docs_page.SWAGGER_UI_VERSION in text
    assert docs_page.SWAGGER_UI_BUNDLE_INTEGRITY in text
    assert docs_page.SWAGGER_UI_CSS_INTEGRITY in text


def test_version_and_checksums_are_those_of_pipwerk_studio() -> None:
    """The checksums were computed for pipwerk Studio and are documented there as well."""
    text = STUDIO_DOCUMENT.read_text(encoding="utf-8")
    assert docs_page.SWAGGER_UI_VERSION in text
    assert docs_page.SWAGGER_UI_BUNDLE_INTEGRITY in text
    assert docs_page.SWAGGER_UI_CSS_INTEGRITY in text


def test_redoc_and_the_redirect_page_of_fastapi_are_not_offered(tmp_path: Path) -> None:
    client = TestClient(create_app(f"sqlite:///{tmp_path / 'replay.db'}"))
    assert client.get("/redoc").status_code == 404
    assert client.get("/docs/oauth2-redirect").status_code == 404
    description = client.get("/openapi.json")
    assert description.status_code == 200
    assert "/docs" not in description.json()["paths"]  # the page is not an endpoint of the API


def test_the_page_refuses_an_unexpected_change_of_the_page_of_fastapi(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    class Broken:
        body = b"<html><script src='other'></script></html>"

    monkeypatch.setattr(docs_page, "get_swagger_ui_html", lambda **kwargs: Broken())
    with pytest.raises(RuntimeError):
        docs_page.swagger_ui_page("/openapi.json", "pipwerk replay")
