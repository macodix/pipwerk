"""Grenzen nach 7.3: keine Pfade, Ports, Rechner- oder Benutzernamen, keine fremden Ziele."""

from __future__ import annotations

import re
from html.parser import HTMLParser

import generate

from .support import RepoCase, plan_text

# Liste verbotener Muster. Sie gilt für den sichtbaren Text und die Werte der Attribute.
FORBIDDEN = {
    "absoluter Pfad": re.compile(r"(?<![\w.:])/(?:srv|home|var|etc|usr|tmp|opt|root|mnt|run)\b"),
    "Laufwerkspfad": re.compile(r"\b[A-Za-z]:\\"),
    "Pfad im Benutzerverzeichnis": re.compile(r"~/"),
    "Portangabe": re.compile(r":\d{3,5}\b"),
    "IP-Adresse": re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b"),
    "localhost": re.compile(r"localhost", re.IGNORECASE),
    "Adresse mit Schema": re.compile(r"\b[a-z][a-z0-9+.-]*://", re.IGNORECASE),
    "Adresse ohne Schema": re.compile(r"(?<![\w.])(?://|www\.)[\w.-]+", re.IGNORECASE),
    "Mailadresse": re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+"),
    "Rechnername": re.compile(r"entwicklungsrechner|rechner01", re.IGNORECASE),
    "Benutzername": re.compile(r"codesrv|macodix", re.IGNORECASE),
}

# Was die Seite nie laden darf, auch nicht in Stilen und Skripten.
EXTERNAL_RESOURCES = re.compile(r"url\(|@import|<link\b|<img\b|<iframe\b|<script[^>]*\bsrc=|\bsrc=")

TRAPS = (
    "/srv/aixlab/dev/pipwerk/work/x",
    "localhost:8080",
    "http://beispiel.example/pfad",
    "rechner01",
    "codesrv",
    "10.0.0.7:22",
)


class Scan(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.texts: list[str] = []
        self.values: list[str] = []
        self.hrefs: list[str] = []
        self.ids: set[str] = set()
        self._hidden = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style"}:
            self._hidden += 1
        for key, value in attrs:
            if value is None:
                continue
            self.values.append(value)
            if key == "href":
                self.hrefs.append(value)
            if key == "id":
                self.ids.add(value)

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style"}:
            self._hidden -= 1

    def handle_data(self, data: str) -> None:
        if not self._hidden:
            self.texts.append(data)


def scan(page: str) -> Scan:
    scanner = Scan()
    scanner.feed(page)
    scanner.close()
    return scanner


class Limits(RepoCase):
    def setUp(self) -> None:
        super().setUp()
        self.repo.scope("abc", "Probe")
        self.repo.write(
            "development/abc/plan.md",
            plan_text(
                [
                    ("wp01", "Erstes", "–", "done"),
                    ("wp02", "Zweites", "`wp01`", "open"),
                    ("wp03", "Drittes", "`wp02`", "open"),
                ]
            ),
        )
        for index, trap in enumerate(TRAPS):
            self.repo.message(
                "devlead",
                index + 1,
                "abc/wp02",
                "implement",
                document=f"{trap}/plan.md",
                text=f"Rechner {trap}, Benutzer codesrv, Pfad {trap}",
                seq=index + 1,
            )
        self.repo.message("projectlead", 20, "abc/wp02", "acceptance", document="/srv/aixlab/x.md")
        self.repo.message("projectlead", 21, "abc/wp01", "integrated", document="/srv/aixlab/y.md")
        self.repo.waiting("abc", [("abc/wp02", "Abnahme durchführen", "2026-10-01T10:30:00Z")])
        self.repo.commit()

    def test_no_forbidden_pattern_in_text_and_attributes(self) -> None:
        scanner = scan(self.page())
        for name, pattern in FORBIDDEN.items():
            for item in [*scanner.texts, *scanner.values]:
                with self.subTest(muster=name, text=item[:40]):
                    self.assertIsNone(pattern.search(item), f"{name}: {item!r}")

    def test_traps_from_the_messages_do_not_appear(self) -> None:
        page = self.page()
        for trap in TRAPS:
            self.assertNotIn(trap, page)

    def test_links_only_point_into_the_page(self) -> None:
        scanner = scan(self.page())
        self.assertTrue(scanner.hrefs)
        for href in scanner.hrefs:
            self.assertTrue(href.startswith("#"), href)
            target = href[1:]
            self.assertTrue(target == "" or target in scanner.ids, f"Anker fehlt: {href}")

    def test_page_loads_nothing_from_outside(self) -> None:
        page = self.page()
        self.assertIsNone(EXTERNAL_RESOURCES.search(page))
        self.assertNotRegex(page, r"https?:")

    def test_template_itself_is_free_of_external_references(self) -> None:
        template = generate.TEMPLATE_PATH.read_text(encoding="utf-8")
        self.assertIsNone(EXTERNAL_RESOURCES.search(template))
        self.assertNotRegex(template, r"https?:|//[\w.-]+\.\w+")
        self.assertIn("{{ZEIT}}", template)
        self.assertIn("{{INHALT}}", template)

    def test_anchors_of_the_three_levels(self) -> None:
        scanner = scan(self.page())
        self.assertIn("abc", scanner.ids)
        for nr in range(1, 7):
            self.assertIn(f"abc/{nr}", scanner.ids)
        self.assertIn("#abc", scanner.hrefs)
        self.assertIn("#abc/4", scanner.hrefs)

    def test_head_contains_the_time_of_generation_in_utc(self) -> None:
        page = self.page()
        self.assertIn("Stand der Vorhaben", page)
        self.assertIn(
            '<time class="zeitpunkt" datetime="2026-10-24T12:00:00Z">2026-10-24 12:00 UTC</time>',
            page,
        )
        self.assertNotIn("Beispiel", page)

    def test_all_texts_are_escaped(self) -> None:
        self.repo.scope("abc", "<b>Fett</b> & mehr")
        self.repo.commit()
        page = self.page()
        self.assertNotIn("<b>Fett</b>", page)
        self.assertIn("&lt;b&gt;Fett&lt;/b&gt; &amp; mehr", page)
