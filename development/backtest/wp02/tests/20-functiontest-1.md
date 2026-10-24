# Testbericht Funktionstest, Auftrag 20, Durchlauf 1

- Ergebnis: **nicht bestanden**
- geprüfter Commit: `3d7dae2f0bcecdad79d21071340350371a7c04dc` (Zweig `backtest/wp02-20`), vor der Prüfung ausgecheckt und mit `git rev-parse HEAD` kontrolliert
- Prüfskript: `components/pipwerk-replay/scripts/check --backend-port 18101 --frontend-port 18102`, Exitcode 1; unverändert, kein Zweig `…-functiontest` angelegt

## Ergebnis des Prüfskripts

Bestanden: `uv sync --frozen`, pytest (948 Tests), ruff check, ruff format --check, mypy, openapi.json, Suche nach alten Namen, keine Beschaffung im Backend, `npm ci`, Typprüfung, Vitest (430 Tests), Build.
Fehlgeschlagen: Browsertest. Alle 127 Browsertests scheitern vor dem Start: `browserType.launch: Executable doesn't exist at /var/lib/codesrv/.cache/ms-playwright/chromium_headless_shell-1243/…` (ebenso Firefox und WebKit).

## Befunde

**B1 (blockierend, Umgebungsgrenze): Browsertests nicht ausgeführt.**
Die neuen Browsertests (`e2e/settings.spec.ts`, `e2e/importdirectory.spec.ts`, Ergänzungen in `layout`, `language`, `texts`) sind nicht gelaufen und gelten nicht als bestanden. Abnahmekriterium 1 und 2 des Auftrags sind damit nicht nachgewiesen.
Suche nach einem Browser: kein `chromium`, `chromium-browser`, `google-chrome`, `chrome` oder `firefox` im Suchpfad (`which`). Den Playwright-Cache unter dem genannten Pfad und weitere Ablageorte konnte ich nicht auflisten: Die Sitzung lehnte diese Verzeichnisabfragen ab. Ein Browser an anderer Stelle ist damit weder gefunden noch ausgeschlossen. Nötig: ein Playwright-Browser (`npx playwright install` mit Netz) oder ein Hinweis, wo einer liegt.

**B2 (blockierend, technische Dokumentation veraltet): `docs/technical/pipwerk-replay.md`, Abschnitt 9, Zeile 770.**
Dort steht „öffnet der Knopf „Dateien wählen …“ mit der Tastatur wie mit der Maus“. Der Knopf heißt seit Auftrag 20 „Dateien hochladen …“ (`locales/de.json` Zeile 272, `en.json` Zeile 272 „Upload files …“; derselbe Abschnitt Zeile 740 und 770 weiter vorn nennen den neuen Namen). Die Dokumentationspflicht verbietet die Freigabe bei veralteter technischer Dokumentation.

## Ersatzprüfung (ohne Browser)

- Das echte Backend ist durch pytest (948 Tests, darunter `test_file_settings.py`, `test_import_directory.py`, `test_import_processes.py`) geprüft. Gegen ein laufendes Backend über `curl` habe ich nicht geprüft: Es war keine Testumgebung bereitgestellt, und ich habe keine gestartet.
- Die Texte, nach denen `importProcess.ts` Gründe je Datei bestimmt, passen zu den Texten des Backends (`marketdata_api.py` Zeilen 116 bis 119): „no such file or directory“ (404), „import directory“ (409), „could not be kept“ (503), 422 mit Ort `path`. Gründe der Einstellungen (`not_absolute` bis `not_readable`) in `fileSettingsApi.ts` stimmen mit der Liste des Auftrags überein.
- Standardverzeichnisse der Anwenderdokumentation (`/var/lib/pipwerk/replay`, `.local/share/pipwerk/replay`, `%PROGRAMDATA%`, `%LOCALAPPDATA%`) stimmen mit `directories.py` Zeilen 11 bis 14 überein.
- Die Festlegungen des Entwicklers (`null` als Standard, Gründe über `detail`, „Zu den Einstellungen“ schließt den Dialog) widersprechen weder der Spezifikation noch dem Backend, soweit ich es geprüft habe.

## Code und Dokumentation (durchgesehen)

- Keine festen Pfade, Ports oder Namen im Programmcode der Oberfläche (Suche in `frontend/src` ohne Tests: nur die Hinweistexte „127.0.0.1 oder localhost“ in den Sprachdateien, bereits vorher vorhanden). Kein `innerHTML`, kein Browserspeicher.
- Anwenderdokumentation `docs/user/pipwerk-replay.md`: Einstellungen (vier Werte, Standard, Ablehnung relativer Pfade, Gründe), Import aus dem Importverzeichnis zusammen mit hochgeladenen Dateien, „Dateien behalten“ (Vorbelegung, Pflege, Importverzeichnis nie verändert) sind vollständig und verständlich beschrieben; keine überholte Aussage gefunden außer B2 in der technischen Dokumentation.
- README: Beschreibung der Oberfläche um „Einstellungen“ und Auswahl im Importverzeichnis ergänzt; Änderungsnachweis der technischen Dokumentation vorhanden (2026-10-24).
- Der Unterschied am Komponentenverzeichnis `pipwerk-fetch-mt5` im Vergleich mit dem Vorgänger (Auftrag 19) gehört nicht zu Auftrag 20 und wurde nicht geprüft.

## Nicht geprüft

Verhalten in den Fenstergrößen nach 8.4, Anzeige, Tastaturbedienung und alle Fälle des Umfangs 5 im Browser (Einstellungen ändern und erneut öffnen, relativer Pfad abgelehnt, gemischter Vorgang, „Dateien behalten“ mit Dateien im Ablageverzeichnis): wegen B1 nicht belegt.
