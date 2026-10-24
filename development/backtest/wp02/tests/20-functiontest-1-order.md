# Prüfauftrag Funktionstest, Auftrag 20, Durchlauf 1

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Funktion
- zu prüfender Commit: `3d7dae2f0bcecdad79d21071340350371a7c04dc` (Zweig `backtest/wp02-20`)
- Auftrag: `development/backtest/wp02/orders/20.md` auf dem Zweig `backtest/wp02`

## Gegenstand

Prüfe den Commit gegen Auftrag 20 und die Spezifikation (5.3 „Herkunft der Dateien“, 5.6 „Dateien behalten“, 5.7, 8.3 Zeilen „Datenbestand“ und „Einstellungen“, 8.4, 10): Ansicht „Einstellungen“ (vier Werte, Erklärungen, Ablehnung mit Grund, erneutes Öffnen), Dialog „Datei importieren“ mit Auswahl aus dem Importverzeichnis (Unterverzeichnisse, mehrere Dateien, gemischter Vorgang mit hochgeladenen Dateien), „Dateien behalten“ (Vorbelegung, Erklärung, `keep`, `kept`), Texte in beiden Sprachen, Programmierregeln, Tests, technische Dokumentation (`docs/technical/pipwerk-replay.md`, README) und Anwenderdokumentation (`docs/user/pipwerk-replay.md`, Vollständigkeit und Verständlichkeit).

Das Prüfskript `components/pipwerk-replay/scripts/check` führst du selbst aus. Der Entwickler meldet, dass der Playwright-Browser fehlt und sich nicht installieren ließ (Download-Zeitüberschreitung); die neuen Browsertests (`e2e/settings.spec.ts`, `e2e/importdirectory.spec.ts`, Ergänzungen in `layout`, `language`, `texts`) sind nie gelaufen. Suche, ob ein Browser auf dem Rechner vorhanden ist (zum Beispiel ein System-Chromium oder ein Playwright-Cache an anderer Stelle, Umgebungsvariable `PLAYWRIGHT_BROWSERS_PATH`), und führe die Browsertests damit aus. Gelingt das nicht, nenne es als Umgebungsgrenze und prüfe das Verhalten ersatzweise gegen das laufende echte Backend über die Web-API sowie über die Vitest-Tests; die Browsertests dann nicht als bestanden werten. Befehle über 10 Minuten im Hintergrund.

Die Festlegungen des Entwicklers (Standardwert als `null`, Gründe abgelehnter Anfragen anhand der `detail`-Texte der Web-API, Schaltfläche „Zu den Einstellungen“ schließt den Dialog) gelten als technische Entscheidung des Entwicklungsleiters; melde nur, wenn sie der Spezifikation widersprechen oder nicht zum echten Backend passen.

Beachte die Regeln „Umfang der Prüfungen“ (erster Durchlauf vollständig, nur blockierende Befunde verhindern das Bestehen, Bericht höchstens etwa 60 Zeilen).

## Prüfgrundlagen

- `development/backtest/wp02/orders/20.md`, `development/backtest/specification.md`, `development/backtest/plan.md`
- `docs/technical/development-test-security-rules.md`
- Briefing Tester Funktion in `docs/technical/agentenrollen-und-briefings.md`
- Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `20-functiontest-1.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde mit Fundstelle.
