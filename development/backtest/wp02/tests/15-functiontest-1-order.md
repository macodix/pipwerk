# Prüfauftrag Funktionstest, Auftrag 15, Durchlauf 1

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Funktion
- zu prüfender Commit: `98808466e503a9ee1a67b7b6ee04c46dd76704cc` (Zweig `backtest/wp02-15`)
- Auftrag: `development/backtest/wp02/orders/15.md` auf dem Zweig `backtest/wp02`

## Gegenstand

Prüfe den Commit gegen Auftrag 15 und die Spezifikation (5.1, 5.2, 5.3, 5.5, 7, 10 Punkte Datenbestand, 11, 12): Lücken ohne Zeiten ohne Handel (Feiertage innerhalb eines abgedeckten Zeitraums, 24./26. Dezember, 31. Dezember/2. Januar, früher Handelsschluss am Ende einer CSV-Datei, nicht importierter Handelstag als Lücke, Prüfung vor dem Testlauf), Tage ohne Handel in der Startkonfiguration, Löschen (Reihe, Zeitraum, Kontraktdaten, alle Daten eines Brokers, „Broker für Testläufe“ danach nicht gewählt, Ablehnung während eines Imports), Import-Vorgang (beliebig viele Dateien, keine Grenze für Zahl oder Gesamtgröße, Grenze je Datei mit verständlicher Meldung, Abbrechen, Ende nach Frist), Migration, Web-API und ihre Beschreibung `contracts/api/pipwerk-replay/v1/openapi.json`, Grenzfälle, automatische Tests, Programmierregeln, technische Dokumentation (`docs/technical/pipwerk-marketdata.md`, `docs/technical/pipwerk-replay.md`), Sicherheit nach Abschnitt 11. Die Oberfläche ist nicht Gegenstand (Auftrag 17); ihre Import-Tests laufen bis dahin nicht und sind kein Befund.

Entscheidungen des Entwicklungsleiters (kein Befund, sofern richtig umgesetzt und dokumentiert): Die Vorabangabe vor dem Löschen wird wie das Löschen während eines Import-Vorgangs mit 409 abgelehnt. Tage ohne Handel sind Tage des Jahres (`MM-TT`); bewegliche Feiertage sind nicht vorgesehen. Tage ohne Handel gelten zusätzlich zu den Handelszeiten der Quelle.

Die Prüfskripte sind `packages/market-data/scripts/check` und die Prüfungen des Backends von `components/pipwerk-replay` (Skript der Komponente); halte sie aktuell, falls nötig, im Zweig `backtest/wp02-functiontest-15`, aufgesetzt auf dem zu prüfenden Commit, und nenne den Commit im Bericht. Befehle über 10 Minuten im Hintergrund laufen lassen.

Beachte die Regeln „Umfang der Prüfungen“ (erster Durchlauf vollständig, nur blockierende Befunde verhindern das Bestehen, Bericht höchstens etwa 60 Zeilen).

## Prüfgrundlagen

- `development/backtest/wp02/orders/15.md`, `development/backtest/wp02/acceptance/2.md`
- `development/backtest/specification.md`, `development/backtest/plan.md`
- `docs/technical/development-test-security-rules.md`, `contracts/market-data/`
- Briefing Tester Funktion in `docs/technical/agentenrollen-und-briefings.md`
- Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `15-functiontest-1.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit und den Commit des Prüfskripts vollständig und alle Befunde mit Fundstelle.
