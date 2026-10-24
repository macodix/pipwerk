# Testbericht Funktionstest, Auftrag 17, Durchlauf 1

- Ergebnis: **bestanden**
- geprüfter Commit: `f8564c0d57f3e97d3e653113025562674bafb79a` (Zweig `backtest/wp02-17`), vor der Prüfung per `git rev-parse HEAD` kontrolliert
- Commit des Prüfskripts: `f8564c0d57f3e97d3e653113025562674bafb79a` (`components/pipwerk-replay/scripts/check` unverändert, keine Änderung nötig, kein Zweig `backtest/wp02-functiontest-17` angelegt). `packages/market-data/scripts/check` ist von diesem Commit nicht betroffen (nur Oberfläche und Dokumentation geändert) und wurde nicht ausgeführt.

## Prüfskript `components/pipwerk-replay/scripts/check --backend-port 8217 --frontend-port 5217`

Exitcode 0, alle Schritte bestanden:
- Backend: `uv sync --frozen`, pytest (867 bestanden), ruff check, ruff format --check, mypy, `openapi.json` gleich der Anwendung, Suche nach alten Namen, keine Beschaffung.
- Oberfläche: `npm ci`, Typprüfung, Vitest (20 Dateien, 360 Tests), Build.
- Browsertests (Playwright, vollständiger Lauf im Hintergrund, echtes Backend): 95 bestanden in 4,7 Minuten.

## Prüfung gegen Auftrag und Spezifikation (Code und Dokumentation gelesen)

- Dialog (`ImportDialog.tsx`, `importProcess.ts`): ein Vorgang, eine Anfrage je Datei, Stand je Datei (wartet, wird importiert, übernommen, abgelehnt, nicht importiert), Zahl der erledigten Dateien. „Abbrechen“ beendet nach der laufenden Datei und bricht den Vorgang im Backend ab, die übrigen Dateien stehen als „nicht importiert“. Schließen und Escape während des Vorgangs fragen nach. Datei über der Grenze: je Datei abgelehnt mit Grenze, die übrigen laufen weiter. Fehler der Anfrage und Ende durch die Frist (404): Meldung mit nächstem Schritt, Datei „abgelehnt“, übrige „nicht importiert“. Wiederholung bei 429. Ergebnis je Datei mit Zeilen, Zeitraum, abgelehnten Zeilen mit Grund.
- Kein Hinweis auf Gesamtgröße oder Dateizahl: `checks/forbiddenTexts.ts`, `checks/noTotalLimit.test.ts` (Quelltext, Übersetzungen, Anwenderdokumentation) und `e2e/texts.spec.ts` (gebaute Oberfläche, Bildschirme des Dialogs) bestanden. Die Dokumentation sagt nur, dass es keine solche Grenze gibt.
- Löschen (`DeleteDialog.tsx`): vier Formen, erst Vorabangabe (`confirm` false), Rückfrage mit Broker, Instrument, Daten, Zeitraum, Zahl und Hinweis „nicht rückgängig“, gelöscht erst nach Bestätigung. Danach werden Tabelle, Einzelheiten, Broker und „Broker für Testläufe“ aktualisiert; 409 erscheint als Meldung mit Grund. Aufrufe stimmen mit den Pfaden in `openapi.json` überein.
- Lücken: Texte in `de.json` (`gapsExplain`, `columnGaps`) sagen, dass Wochenenden, Feiertage und andere Zeiten ohne Handel keine Lücken sind (5.2).
- Zweisprachigkeit, Erklärungen beim Zeigen, Texte nur als Text, Fenstergrößen nach 8.4 Punkt 1 für Import- und Löschdialoge: durch `language.spec.ts`, `layout.spec.ts`, `delete.spec.ts`, `datastock.spec.ts` und die Vitest-Tests abgedeckt, alle bestanden; Code zeigt keine HTML-Einbettung.
- Technische Dokumentation `docs/technical/pipwerk-replay.md` (Abschnitt 6.2, Teststand Auftrag 17, Testdateien, Grenze von 64 KiB im Browsertest) und README der Komponente stimmen mit Verhalten und Beispielkonfiguration überein (`max_upload_bytes`, `no_trading_days = 12-25, 01-01`, `import_idle_timeout_seconds = 300`).
- Anwenderdokumentation `docs/user/pipwerk-replay.md` auf Richtigkeit: M1 Abschnitt 9, M3 Abschnitt 8, M5 „Daten löschen“, M6 „Was eine Lücke ist“ stimmen mit dem Verhalten überein (Grenze je Datei 32 MiB und 500 000 Zeilen wie in der Beispielkonfiguration, Frist 5 Minuten, vier Formen des Löschens, „– keiner gewählt –“).
- `uv`-Befehl unter Windows (Abschnitt 9): `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"` entspricht dem Befehl, der mir aus der offiziellen Anleitung von `uv` bekannt ist; nicht gegen die Quelle abgeglichen (Entscheidung des Entwicklungsleiters).

## Befunde

Blockierend: keine.

Hinweise (verhindern das Bestehen nicht):
1. Das Prüfskript führt keinen Lint der Oberfläche aus, `frontend/package.json` hat kein `lint` (Auftrag Abnahmekriterium 1 nennt „Lint“). Typprüfung mit `tsc` ist vorhanden; die Technikregeln sehen für die Oberfläche kein Lint-Skript in der Komponente vor, das ich hätte ausführen können.
2. Im Arbeitsverzeichnis des Testers liegt die nicht versionierte Datei `probe_ft11.py` aus einem früheren Auftrag; sie gehört nicht zum geprüften Commit und hat keinen Einfluss.
