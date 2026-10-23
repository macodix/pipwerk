# Prüfauftrag Sicherheitstest, Arbeitspaket wp02, Durchlauf 2

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Sicherheit
- zu prüfender Commit: `2d4c78f82e307b328499aff66a6bca2280a902af` (Zweig `backtest/wp02`, Aufträge 11 bis 14 zusammengeführt)
- Aufträge: `development/backtest/wp02/orders/11.md` bis `14.md` auf dem Zweig `backtest/wp02`

## Gegenstand

Die Abnahme von `wp02` (Versuch 1, `development/backtest/wp02/acceptance/1.md`) hat den Code geändert. Der Durchlauf 1 (`tests/securitytest-1.md`, bestanden) galt dem Commit `6b952294f441dd5a8d2313ffc06b29884a21ca2d`. Prüfe die Änderungen seit diesem Commit (`git diff 6b952294f441dd5a8d2313ffc06b29884a21ca2d 2d4c78f82e307b328499aff66a6bca2280a902af`) nach BSI-Grundschutz, OWASP und den Sicherheitsregeln in `docs/technical/development-test-security-rules.md` und Abschnitt 11 der Spezifikation, und ob sie bisher bestandene Prüfungen verschlechtern. Schwerpunkte:

- `pipwerk-fetch-mt5` ohne Server und Port: Dateinamen und Zielverzeichnis (Pfad aus Instrument oder Symbol, Überschreiben, atomares Schreiben, Rechte der Dateien), Zuordnungstabelle, Startkonfiguration, Skripte für Windows, Abhängigkeiten (`pip-audit`), Wegfall der früheren Angriffsfläche (nichts mehr, was lauscht).
- pipwerk replay Web-API für den Import mehrerer Dateien (`multipart/form-data`): Größe je Datei, Zahl und Gesamtgröße, Speicherbedarf, Formularfelder und Ablehnung zusätzlicher oder doppelter Felder, Dateinamen (Pfad, Steuerzeichen, Zeichen in Antworten), Zeitzone als Eingabe, Vorschau, Herkunftsprüfung (`Origin` gegen `Host`, Umgehbarkeit), Fehlerformat ohne Informationsabfluss, Reihenliste und Einzelheiten (Filter als Eingabe, Suchmuster, Seitengröße, Rechenzeit der Lückenzahl bei großen Reihen unter OWASP API4), Broker für Testläufe, Migration `v0003`.
- `packages/market-data`: `import_files`, Erkennung aus Dateinamen (reguläre Ausdrücke, Rechenzeit), `inspect_json`, Grenzen.
- Oberfläche: Ausgabe von Dateinamen, Namen und Texten der Antworten als Text, nie als HTML; Abhängigkeiten (`npm audit`, `pip-audit`; `vite` und `vitest` wurden gehoben); gespeicherte Daten im Browser.
- Keine Zugangsdaten, Rechnernamen, Benutzernamen oder Pfade des Entwicklungsrechners im Repository.

Beachte die Regeln „Umfang der Prüfungen“ (zweiter Durchlauf: Nachprüfung der Änderungen, nur blockierende Befunde verhindern das Bestehen, Bericht höchstens etwa 60 Zeilen). Lege Wegwerfdateien nur im Berichtsverzeichnis an, nie in einem Git-Arbeitsverzeichnis.

## Prüfgrundlagen

- `development/backtest/wp02/orders/11.md` bis `14.md`, `development/backtest/wp02/tests/securitytest-1.md`, die Berichte `tests/11-functiontest-1.md` bis `14-functiontest-1.md`
- `development/backtest/specification.md`, Abschnitte 5, 7, 11
- `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-replay.md`, `docs/technical/pipwerk-marketdata.md`, `docs/technical/pipwerk-fetch-mt5.md`
- Briefing Tester Sicherheit in `docs/technical/agentenrollen-und-briefings.md`
- Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `securitytest-2.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde mit Fundstelle.
