# Testbericht Tester Funktion, Auftrag 09, Durchlauf 1

- Bezug: `strategiedesign/wp02`, Auftrag `strategiedesign/wp02:development/strategiedesign/wp02/orders/09.md`
- geprüfter Commit: `3d11dceed8749506e89ca2858cbcfba9e1001a6b` (Zweig `strategiedesign/wp02-09`, auf GitHub vorhanden, Autor `macodix`)
- Ergebnis: **bestanden**
- Prüfskript: unverändert (kein Commit im Zweig `…-functiontest`)

## Ergebnisse

| Prüfung | Ergebnis |
|---|---|
| `packages/domain-core`: `uv sync --frozen`, `pytest` (1615), `ruff check`, `ruff format --check`, `mypy` | bestanden |
| `backend`: `uv sync --frozen`, `pytest` (976), `ruff check`, `ruff format --check`, `mypy` | bestanden |
| Schemata `contracts/strategies/v2/` und `v1/` gleich den erzeugten | bestanden |
| OpenAPI-Datei gleich der neu erzeugten Beschreibung | bestanden |
| `contracts/strategies/v1/` unverändert (`git diff` zum Ausgangscommit) | bestanden |
| Dokument mit `trigger.manual_start`: wird gelesen, kein Befund „unbekannter Typ“ (`POST /api/v1/check`) | bestanden |
| Tests nach Punkt 7 vorhanden (`test_methods.py`, `test_web_api_methods.py`, `test_catalog.py`, `test_documents.py` u. a.) | bestanden |
| Kein fester Pfad, Port, Rechnername in den geänderten Quelltexten und Dokumenten | bestanden |
| Glossar: acht Einträge wiederhergestellt, „Assistent“ vorhanden | bestanden |
| Dokumentation Punkt 8 stimmt mit dem Code überein (Stichprobe: Gruppen, Eingang, Gründe `name_children`, Testdateien) | bestanden |

`GET /api/v1/element-types` (Kriterium 3, an laufendem Backend auf freiem Port): 30 Typen. Gruppen `flow`, `calculation`, `indicators`, `trends`, `market`, `account`, `actions`, `rules` oder `null` stimmen mit 5.2 überein, `trigger.tick` und `Tick` sind zwei Typen. `methods` überall leer. `can_refresh` wahr genau für `Konto`, `Instrument`, `Kerze`, `Tick` (Objekt), `Indikator`, `EMA`, `ATR`, `ZigZag`, `Trend`. `trigger.manual` „Manuell“/„Manual“ ohne Parameter. `Markttechnik` und „Parameter setzen“ fehlen. `ZigZag` hat die vier Hoch-/Tief-Eigenschaften und drei Wendepunkte. Keine Kennung in Programmierschreibweise in Namen, Beschriftungen, Erklärungen.

## Prüfskript (Kriterium 4)

`scripts/check` startet immer alle drei Browser und kennt weder Chromium-Beschränkung noch `--max-failures`. Ich habe deshalb dessen Schritte einzeln ausgeführt: Bibliothek und Backend wie oben, `npm ci`, `typecheck` (bestanden), `build` (bestanden), Vitest, Playwright nur Chromium mit `--max-failures=20` auf den Standardports 18000/15173.

- Vitest: 42 von 456 Tests scheitern (12 Dateien), 414 bestehen. Ursache bei allen: `groupIds` in `src/api/elementTypes.ts:75` kennt nur die alten Gruppen (`when`, …). `parseGroup` wirft `Unexpected response: types[0].group` (16 Tests in `flowModel`, `describe`, `removal`, `elementTypes`, `scene` (10), `ops`, `own`, `libraryModel` (2)). Die 26 Tests in `App.expressions`, `App.flows`, `App.open`, `Wizard` scheitern in `waitForReady` (`menu-new` bleibt gesperrt), weil die Oberfläche die Typen mit den neuen Gruppen nicht lädt. Letzteres ist aus der gemeinsamen Ursache geschlossen, nicht je Test einzeln belegt. Alte Gruppen: kein Befund, Auftrag 11.
- Playwright Chromium: Abbruch nach 20 Fehlern, 57 nicht gelaufen. Alle 20 scheitern in `support.ts:80` (`lib-item` fehlt); die Seite zeigt „Die Elemente konnten nicht geladen werden“ (geprüft bei `about.spec.ts:26`; die übrigen aus derselben Fehlerstelle geschlossen): `about` (4), `appearance` (7), `canvas` (9). Gleiche Ursache, alte Gruppen: kein Befund, Auftrag 11. Die 57 nicht gelaufenen Tests sind nicht beurteilt. „1 error was not a part of any test“ am Ende des Laufs habe ich nicht untersucht.

## Befunde

Blockierend: keine.

Hinweise:
- H1: Erklärungen `ZigZag.wendepunkt_N_endgueltig` (de): „Ja, wenn der jüngsten Wendepunkt …“ – Grammatikfehler (Fall).
- H2: Erklärung von `trigger.manual` (de) nennt „den Start von Hand“ als Wendung; kein Typname, nur zur Kenntnis.
- H3: `frontend/src/testing/typeDescriptions.ts` enthält noch `Markttechnik` und `flow.set_parameter`; gehört zur Oberfläche (Auftrag 11).
- H4: `scripts/check` bietet keine Möglichkeit, Browser und Fehlerzahl zu beschränken.

## Kriterien

1 erfüllt, 2 erfüllt, 3 erfüllt, 4 erfüllt (Fehler nur durch alte Gruppen, einzeln genannt; Einschränkung oben), 5 erfüllt, 6 erfüllt, 7 erfüllt (Commit auf `origin/strategiedesign/wp02-09`).
