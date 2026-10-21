# Testbericht Funktionstest, Auftrag 01, Durchlauf 2 (Nachprüfung)

- Ergebnis: **bestanden** (keine offenen und keine neuen Befunde)
- geprüfter Commit: `71b53f02b552357ad022370040debfd9b8f7d003` (Zweig `backtest/wp02-06`), ausgecheckt und mit `git rev-parse HEAD` kontrolliert
- Commit des Prüfskripts: `2c3214e758bf33710643e631cdc9ddf9b9cb04b6` (Zweig `backtest/wp02-functiontest`); unverändert, kein neuer Commit

## Befunde

Keine.

Befund 1 aus Durchlauf 1 ist behoben: `components/pipwerk-replay/scripts/testenv` hat im Commit den Modus `100755` (`git ls-files -s`).

## Geprüft

- Prüfskript `components/pipwerk-replay/scripts/check` (Dateien aus Commit `2c3214e…` auf den geprüften Commit gelegt, ohne Parameter): `uv sync --frozen`, pytest (393 bestanden, vorher 391), `ruff check`, `ruff format --check` (31 Dateien), `mypy` (31 Dateien), Suche nach alten Bezeichnern: alles bestanden. Oberfläche übersprungen, weil `frontend/` fehlt. Meldung „all checks passed“.
- `testenv` als Programm über den absoluten Pfad, Ports 18101 (Oberfläche) und 18102 (Backend):
  - `status` vor dem Start: „not running“, Exitcode 1.
  - `start` bei nicht sauberem Arbeitsverzeichnis: bricht mit Exitcode 1 ab und nennt die Dateien.
  - `start` bei sauberem Arbeitsverzeichnis: „running: backend only … (this commit has no user interface)“.
  - `status`: „running (backend only …)“ mit Adresse; `GET /api/v1/accounts` liefert das Standard-Testkonto (10 000 EUR, Hebel 30, Spread `candle`, Kommission 0, `is_default` true).
  - zweiter `start` bei laufender Umgebung: bricht mit Exitcode 1 ab („already running“).
  - `start` ohne `--frontend-port` und mit nicht numerischem `--backend-port`: Exitcode 1 mit Ursache.
  - `stop`: „stopped“; danach `status` Exitcode 1, Port 18102 antwortet nicht mehr, Arbeitsverzeichnis ohne Änderungen.
- Die für Befund 1 geänderten Stellen (Dateimodus, neuer Test) enthalten keine neuen Fehler.

## Nicht geprüft

- Oberfläche (`frontend/` existiert in diesem Commit nicht).
- Belegter Port als Abbruchfall von `start` (nur die Tests in `test_testenv.py`).
