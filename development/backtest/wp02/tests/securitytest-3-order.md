# Prüfauftrag Sicherheitstest, Arbeitspaket wp02, Durchlauf 3

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Sicherheit
- zu prüfender Commit: `ae414f2bb94ad6e06469e6087bc3d200f985c6ac` (Zweig `backtest/wp02`, Aufträge 15 bis 17 zusammengeführt)
- Aufträge: `development/backtest/wp02/orders/15.md` bis `17.md` auf dem Zweig `backtest/wp02`

## Gegenstand

Die Behebung der Mängel aus der Abnahme (Versuch 2, `development/backtest/wp02/acceptance/2.md`) hat den Code geändert. Durchlauf 2 (`tests/securitytest-2.md`, bestanden) galt dem Commit `2d4c78f82e307b328499aff66a6bca2280a902af`. Prüfe die Änderungen seit diesem Commit (`git diff 2d4c78f82e307b328499aff66a6bca2280a902af ae414f2bb94ad6e06469e6087bc3d200f985c6ac`) nach BSI-Grundschutz, OWASP und den Sicherheitsregeln in `docs/technical/development-test-security-rules.md` und Abschnitt 11 der Spezifikation, und ob sie bisher bestandene Prüfungen verschlechtern. Schwerpunkte:

- Import-Vorgang der Web-API (`/api/v1/market-data/import-processes`): Vorgangskennung (Erraten, Wiederverwendung), Frist und Ende von selbst, Zahl gleichzeitiger Vorgänge, Speicherbedarf einer Anfrage ohne Grenze für Zahl und Gesamtgröße (Größe je Datei bleibt begrenzt; Dauerbelastung durch viele Vorgänge oder Anfragen unter OWASP API4), Formularfelder, Herkunftsprüfung, Fehlerformat, Antwort 413 und 429.
- Löschen (`deletions/*`): Eingaben (Broker, Instrument, Zeitraum), Bestätigung `confirm`, Wirkung nur auf die genannten Daten, Transaktion, Ablehnung während eines Imports, Zurücksetzen des „Broker für Testläufe“, Fehlerantworten ohne Informationsabfluss, Rechenzeit bei großen Reihen.
- Tage ohne Handel und Frist als Konfiguration (Prüfung der Werte), Migration `v0002` der Bibliothek, Lückenberechnung (Rechenzeit).
- Oberfläche: Dialog „Datei importieren“ und Löschdialog (Dateinamen, Namen und Texte der Antworten als Text, nie als HTML; Wiederholung bei 429 ohne Endlosschleife), Abhängigkeiten (`npm audit`, `pip-audit`).
- `pipwerk-fetch-mt5`: Festlegung `requires-python` und neue `uv.lock` (Abhängigkeiten, `pip-audit`).
- Keine Zugangsdaten, Rechnernamen, Benutzernamen oder Pfade des Entwicklungsrechners im Repository.

Beachte die Regeln „Umfang der Prüfungen“ (Nachprüfung der Änderungen, nur blockierende Befunde verhindern das Bestehen, Bericht höchstens etwa 60 Zeilen). Lege Wegwerfdateien nur im Berichtsverzeichnis an, nie in einem Git-Arbeitsverzeichnis.

## Prüfgrundlagen

- `development/backtest/wp02/orders/15.md` bis `17.md`, `development/backtest/wp02/tests/securitytest-2.md`, die Berichte `tests/15-functiontest-1.md` bis `17-functiontest-1.md`
- `development/backtest/specification.md`, Abschnitte 5, 7, 11
- `docs/technical/development-test-security-rules.md`, `docs/technical/pipwerk-replay.md`, `docs/technical/pipwerk-marketdata.md`, `docs/technical/pipwerk-fetch-mt5.md`
- Briefing Tester Sicherheit in `docs/technical/agentenrollen-und-briefings.md`
- Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `securitytest-3.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde mit Fundstelle.
