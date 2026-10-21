# Testbericht Funktionstest, Auftrag 04, Durchlauf 1

- Ergebnis: **bestanden**
- geprüfter Commit: `72308c0ad60c7c5399524b319eaaa4fff7114f4c` (Zweig `backtest/wp02-04`), ausgecheckt und mit `git rev-parse HEAD` kontrolliert
- Commit des Prüfskripts: `98b77bb0244940848dc0f82fef28784f90f4b6bf` (Zweig `backtest/wp02-functiontest-04`, auf GitHub; aufgesetzt auf dem geprüften Commit, übernimmt `components/pipwerk-replay/scripts/check` aus `2c3214e758bf33710643e631cdc9ddf9b9cb04b6`)

## Prüfskript

`components/pipwerk-replay/scripts/check` auf dem geprüften Commit (Stand 98b77bb): alle Schritte bestanden, Exitcode 0.

- `uv sync --frozen`; pytest: 779 bestanden; `ruff check`; `ruff format --check` (47 Dateien); `mypy` (47 Dateien, keine Fehler).
- Neuer Schritt: `python -m pipwerk_replay.contract … --check` (`openapi.json` gleicht der Anwendung).
- Suche nach alten Bezeichnern: keine Treffer. Oberfläche: übersprungen (kein `frontend/`, kommt mit Auftrag 05).
- Änderung am Skript und neuer Abschnitt 6.2 „Prüfskript“ in `docs/technical/pipwerk-replay.md` (der geprüfte Commit hatte ihn nicht).
- `pip-audit` lief nicht (kein Parameter `--with-audit`, nicht verlangt).

## Zusammenspiel (selbst ausgeführt, echte Verbindungen auf 127.0.0.1)

- `pipwerk-fetch-mt5` als Programm mit nachgebildetem Modul `MetaTrader5` (`FakeMt5Module` aus `tests/support.py`, Starter außerhalb des Repositorys), pipwerk replay mit `[source]` dagegen.
- Beschaffung von 4 Teilen (Kerzen M5, Ticks, Instrument, unbekanntes Symbol): HTTP 202, danach `finished`; drei Teile `succeeded` mit Ergebnis (12 Kerzen, 10 Ticks, 1 Instrument), `GBPUSD` `failed` mit `symbol_unknown` / „Symbol beim Broker unbekannt“.
- Zu großer Zeitraum (M1, 3 Monate): `range_too_large` mit Text der Quelle. Quelle beendet: `source_unreachable` / „Quelle nicht erreichbar“.
- Übersicht, Vollständigkeit (vorhanden / `not_covered`, 409 ohne Broker und Standardquelle), Standardquelle setzen, Stand (`revision` = `72308c0`).
- CSV-Import: 1 Zeile übernommen, 2 mit Grund abgelehnt (`high_below_low`, `time_invalid`); unbekannter Parameter 422; falscher Medientyp 415; JSON ohne `kind` 422 `document_invalid`.
- `/api/v1/settings` antwortet 404. Datei `openapi.json` enthält nur `/api/v1/…`.
- Schlüssel: nicht in Protokoll von pipwerk replay, Protokoll der Quelle, Datenbank von pipwerk replay und in keiner Antwort; nur in den INI-Dateien.
- Nicht ausgeführt: Upload über 32 MiB und gleichzeitige Last mit echten Verbindungen (durch pytest abgedeckt: Größe, Zeilen, 429, Teile). Echtes MetaTrader 5 / Windows nicht möglich.

## Abnahmekriterien Auftrag 04

1 bis 7 erfüllt: Vorgänge gegen nachgebildete Quelle und Alembic-Datenbank (Tests und Zusammenspiel), `/api/v1/settings` entfallen, Schlüssel nirgends außer in der INI, Begrenzungen getestet, Prüfwerkzeuge bestehen, Dokumentation (`pipwerk-replay.md`, `contracts/api/README.md`, Beispiel-INI) konsistent mit dem Verhalten, Commit auf GitHub.

## Befunde

Blockierend: keine.

Hinweise (nicht blockierend):

1. `docs/technical/pipwerk-replay.md` Abschnitt 8, Punkt 3: Rechenzeit der Übersicht nicht begrenzt; Beurteilung beim Entwicklungsleiter (laut Prüfauftrag).
2. Offener Punkt 2 (Abschnitt 8): Testumgebung kennt keine Quelle (`scripts/testenv` unverändert, nicht Gegenstand von Auftrag 04).
3. Der Import der Beschaffung (`acquisition.py`, `_import`) zählt nicht gegen `max_concurrent_imports`; gleichzeitige Last ist durch `max_concurrent_acquisitions` begrenzt. Die Dokumentation nennt das nicht ausdrücklich.
4. Das Arbeitsverzeichnis enthielt vor dem Lauf Reste früherer Prüfungen (`ft-probe-*.py`, nicht versioniert); sie sind nicht Teil des Commits.
