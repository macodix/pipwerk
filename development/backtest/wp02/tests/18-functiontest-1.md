# Testbericht Funktionstest, Auftrag 18, Durchlauf 1

- Ergebnis: **bestanden**
- geprüfter Commit: `5ac6b147cc2aa5de41f63027346a4e75c33b94b1` (Zweig `backtest/wp02-18`), im Arbeitsverzeichnis ausgecheckt und mit `git rev-parse HEAD` kontrolliert
- Prüfskript: unverändert, kein Commit am Prüfskript

## Ausgeführte Prüfungen

- `packages/market-data/scripts/check`: Exitcode 0. 616 Tests bestanden (darunter `test_space.py`, 10), ruff check, ruff format, mypy bestanden.
- `components/pipwerk-replay/scripts/check --backend-port 18951 --frontend-port 18952`: Exitcode 1, allein wegen des Browsertests. Bestanden: uv sync, pytest (947 bestanden, 1 übersprungen), ruff check, ruff format, mypy, `openapi.json` gleich der Anwendung, Suche nach alten Namen, keine Abrufreste, npm ci, Typprüfung, Vitest, Build.
- Der eine übersprungene Test ist nur unter Windows gedacht (`test_file_settings.py:57`, Pfade von Windows); kein Befund.

## Umgebungsgrenze (kein Befund am Code)

Der Browsertest scheitert in allen 95 Fällen mit `browserType.launch: Executable doesn't exist` (Chromium, Firefox, WebKit unter `.cache/ms-playwright`). Der Playwright-Browser fehlt also auch bei mir, wie der Entwickler meldet. Auftrag 18 ändert die Oberfläche nicht. Der Browsertest ist deshalb nicht ausgeführt und nicht bewertet.

## Prüfung gegen Auftrag und Spezifikation (Durchsicht von Code, Tests, Dokumentation)

- Einstellungen 5.7: vier Werte in der Datenbank (Migration `v0004_file_settings.py`), Standard je Betriebssystem (`directories.py`), Prüfung beim Speichern (absolut, anlegbar, beschreibbar beziehungsweise lesbar), Ablehnung mit Grund und ohne Speichern (`settings_service.py:set_files`). Der Eintrag für das Ablageverzeichnis fehlt in Startkonfiguration und Beispielkonfiguration. Erfüllt.
- Importverzeichnis 5.3, 11: Liste mit Seiten, ohne Zwischendateien und ohne Verweise nach außen; relativer Pfad, `..`, absolut und Verweise werden abgelehnt (`import_directory.py:resolve`); Öffnen mit `O_NOFOLLOW`, Prüfung am offenen Zugriff, Lesen ohne Kopie; die Datei wird nie geschrieben. Erfüllt.
- Dateien behalten 5.6: Zwischendatei im Ablageverzeichnis, `os.replace`, Ersetzen gleichen Namens, Entfernen bei Fehler und beim Start (`file_keeping.py`, `app.py`); abgelehnte Datei wird behalten, weil vor dem Import geschrieben wird; Pfad-Import kennt `keep` nicht. Ohne Kreuz kein Rest (Formularteile im Arbeitsspeicher oder in `TemporaryFile`). Erfüllt.
- Platz der Datenbank 5.6: `auto_vacuum = INCREMENTAL`, einmal `VACUUM` für alte Dateien beim Start, `incremental_vacuum` in Schritten zu 4096 Seiten nach dem Commit von Löschen und Ersetzen (`space.py`, `store.py`); durch Test belegt. Dokumentiert mit Begründung. Erfüllt.
- Web-API: `openapi.json` ist gleich der Anwendung (Skriptschritt bestanden); Endpunkte und Fehlerfälle sind beschrieben.
- Tests nach Abschnitt 10: alle im Auftrag genannten Fälle haben Tests (`test_file_settings.py`, `test_import_directory.py`, `test_space_return.py`, `test_space.py`).
- Programmierregeln: ruff und mypy sauber; keine festen Pfade, Namen oder Ports im Programmcode gefunden.
- Technische Dokumentation (`pipwerk-replay.md` 2.7a und Endpunkttabellen, `pipwerk-marketdata.md`, README): vollständig und mit dem Code übereinstimmend.
- Festlegungen des Entwicklers widersprechen der Spezifikation nicht.

## Befunde

Keine blockierenden Befunde.

Nicht blockierende Hinweise (kein Einfluss auf das Bestehen):

1. `file_keeping.py:keep_file` und `directories.py:check_directory`: Nichts verhindert, dass Ablage- und Importverzeichnis dasselbe Verzeichnis sind. Dann ersetzt „Dateien behalten“ eine gleichnamige Datei im Importverzeichnis. Spezifikation 5.3 sagt, dass pipwerk replay solche Dateien nie ändert, auch nicht mit „Dateien behalten“. Die Spezifikation verlangt diese Prüfung beim Speichern nicht; der Hinweis geht an den Entwicklungsleiter zur Entscheidung. Ich habe den Fall nicht mit einem Lauf bestätigt, sondern aus dem Code gelesen.
2. `file_keeping.py:52`: Ein hochgeladener Dateiname mit dem Vorsatz `.pipwerk-replay-tmp-` kann nicht behalten werden. Der Vorgang endet mit HTTP 503 und die Datei wird nicht importiert. Randfall, nur aus dem Code gelesen.
