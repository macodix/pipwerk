# Prüfauftrag Funktionstest, Auftrag 11, Durchlauf 1

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Funktion
- zu prüfender Commit: `e46b90b00c28c1996500a6a7394cc00a31541100` (Zweig `backtest/wp02-11`)
- Auftrag: `development/backtest/wp02/orders/11.md` auf dem Zweig `backtest/wp02`

## Gegenstand

Prüfe den Commit gegen Auftrag 11 und die Spezifikation (E4, 5.1 bis 5.3, 8.3 Zeile „Datenbestand“, 10 Punkte Datenbestand, 11): Import eines Vorgangs mit mehreren Dateien, Begrenzungen, Erkennung aus Dateinamen, Reihenliste mit Filter, Seiten und Zeile „Kontraktdaten“, Einzelheiten einer Reihe, Brokerliste, Grenzfälle, automatische Tests, Programmierregeln, technische Dokumentation.

Entscheidungen des Entwicklungsleiters (kein Befund, sofern richtig umgesetzt und dokumentiert): `overview()` bleibt bis Auftrag 12, weil pipwerk replay sie noch verwendet. Bei JSON-Dateien ist das Instrument je Datei überschreibbar, die Daten sind durch den Inhalt bestimmt (abweichende Angabe lehnt die Datei ab). `gap_count` zählt auch Teile zwischen getrennt abgedeckten Zeiträumen.

Das Prüfskript ist `packages/market-data/scripts/check`; halte es aktuell, falls nötig, im Zweig `backtest/wp02-functiontest-11`, aufgesetzt auf dem zu prüfenden Commit, und nenne den Commit im Bericht.

Beachte die Regeln „Umfang der Prüfungen“ (erster Durchlauf vollständig, nur blockierende Befunde verhindern das Bestehen, Bericht höchstens etwa 60 Zeilen).

## Prüfgrundlagen

- `development/backtest/wp02/orders/11.md`
- `development/backtest/specification.md`, `development/backtest/plan.md`
- `docs/technical/pipwerk-marketdata.md`, `docs/technical/development-test-security-rules.md`
- Briefing Tester Funktion in `docs/technical/agentenrollen-und-briefings.md`
- Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `11-functiontest-1.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit und den Commit des Prüfskripts vollständig und alle Befunde mit Fundstelle.
