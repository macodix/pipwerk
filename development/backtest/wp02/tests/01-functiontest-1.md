# Testbericht Funktionstest, Auftrag 01, Durchlauf 1

- Ergebnis: **nicht bestanden** (ein blockierender Befund)
- geprüfter Commit: `fe512964794d36ea59e91fa4c017e2697453ff84` (Zweig `backtest/wp02-01`), ausgecheckt und mit `git rev-parse HEAD` kontrolliert
- Commit des Prüfskripts: `2c3214e758bf33710643e631cdc9ddf9b9cb04b6` (Zweig `backtest/wp02-functiontest`, auf GitHub; aufgesetzt auf dem geprüften Commit, enthält `components/pipwerk-replay/scripts/check` und den Abschnitt 6.2 „Prüfskript“ in `docs/technical/pipwerk-replay.md`)

## Befunde

### Blockierend

1. `components/pipwerk-replay/scripts/testenv` hat im Commit den Dateimodus `100644` (nicht ausführbar). Das Muster `components/pipwerk-studio/scripts/testenv` hat `100755`. Die Dokumentation (`pipwerk-replay.md`, Abschnitt 4a) verlangt den Aufruf mit absolutem Pfad. Der Aufruf endet mit `Permission denied` (Exitcode 126). Verletzt Abnahmekriterium 4 („verhält sich wie im Muster“). Die 43 Tests in `test_testenv.py` bestehen trotzdem, weil sie das Skript offenbar nicht als Programm aufrufen. Folge: `testenv start|stop|status` konnte ich nicht selbst ausführen.

### Hinweise

1. Der Test für `testenv` prüft den Dateimodus nicht (Anlass von Befund 1).
2. Abschnitt 8 der Dokumentation nennt offene Punkte 1 und 2 (Pfad Sprache, Endpunkt Stand). Laut Entscheidung des Entwicklungsleiters in Auftrag 04 zu erledigen. Kein Befund.

## Geprüft

- Prüfskript `check` ohne Parameter (`frontend/` fehlt, Oberfläche übersprungen mit Hinweis): `uv sync --frozen`, pytest (391 bestanden), `ruff check`, `ruff format --check` (31 Dateien), `mypy` (31 Dateien, strict), Suche nach alten Bezeichnern: alles bestanden, Exitcode 0. Der Lauf auf dem Commit des Prüfskripts liefert dasselbe.
- Abnahmekriterium 1: `git grep` nach `pipwerk[-_ ]?backtest` außerhalb von `docs/design` und `development` ohne Treffer. Erfüllt.
- Abnahmekriterien 2, 3 (Backend gestartet aus INI mit `uv run pipwerk-replay -c … --port …`, Datenbank per Alembic angelegt, Anfragen mit `curl`): Standard-Testkonto beim Start vorhanden (10 000 EUR, Hebel 30, Spread `candle`, Kommission 0, `is_default` true); `Host: evil.example` ergibt 400; Anlegen eines Kontos 201; ungültige Werte, zusätzliches Feld, ungültige Sprache und ungültige Kennung ergeben 422 im Format `detail`/`errors` ohne Werte. Erfüllt.
- Abnahmekriterium 5: siehe Prüfskript. Erfüllt.
- Abnahmekriterium 6: `test_contract.py` (13 Tests) besteht; `openapi.json` und `contracts/api/README.md` vorhanden. Erfüllt.
- Abnahmekriterium 7: Dokumentation nach Punkt 8 vorhanden (Abschnitte 1 bis 8), `docs/technical/README.md` ergänzt, Entscheidung zur Erkennung des Standard-Testkontos in Abschnitt 2.6 und 8 dokumentiert; in Code und Dokumentation keine Pfade oder Rechnernamen des Entwicklungsrechners (Treffer für `/srv/` nur in Tests als Verbotsprüfung).
- Abnahmekriterium 8: Commit im Zweig `backtest/wp02-01` benannt.

## Nicht geprüft

- `testenv` (Ablauf `start`, `status`, `stop`) wegen Befund 1; nur über die Tests von `test_testenv.py`.
