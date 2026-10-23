# Prüfauftrag Funktionstest, Auftrag 13, Durchlauf 1

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Funktion
- zu prüfender Commit: `1018c9d39dacf38b496e3935884dc18fe67f045f` (Zweig `backtest/wp02-13`)
- Auftrag: `development/backtest/wp02/orders/13.md` auf dem Zweig `backtest/wp02`

## Gegenstand

Prüfe den Commit gegen Auftrag 13 und die Spezifikation (E5, 5.1, 5.4, 10 Punkt Beschaffung, 11, 12): Aufruf an der Befehlszeile, Dateinamen und Inhalt, Broker als Name des Handelsservers, Zeitzone, Zuordnungstabelle, Fehler mit Grund und Exitcode, atomares Schreiben, Ersetzen, Zielverzeichnis, unzulässige Zeichen im Instrument, kein Server und kein Port, Importierbarkeit der Dateien, Grenzfälle, automatische Tests, Programmierregeln, technische Dokumentation (`docs/technical/pipwerk-fetch-mt5.md`, README, Verständlichkeit der Einrichtung als Entwurfsvorlage für die Anwenderdokumentation ist Sache der QA).

Entscheidungen des Entwicklungsleiters (kein Befund, sofern richtig umgesetzt und dokumentiert): Verweise auf die frühere Schnittstelle in `components/pipwerk-replay`, `docs/technical/pipwerk-replay.md`, `docs/technical/glossar.md` und `docs/user/pipwerk-replay.md` ändern die Aufträge 12 und 14. Hilfetext und Meldungen zu Aufruf und Startkonfiguration bleiben englisch, Dateien, Fehler mit Grund und Zusammenfassung sind deutsch. Prüfe, ob dies zu den bisherigen Festlegungen des Programms passt. `pip-audit` gehört zum Prüfskript mit `--with-audit`, soweit es dafür vorgesehen ist.

Das Prüfskript ist `components/pipwerk-fetch-mt5/scripts/check`; halte es aktuell, falls nötig, im Zweig `backtest/wp02-functiontest-13`, aufgesetzt auf dem zu prüfenden Commit, und nenne den Commit im Bericht.

Beachte die Regeln „Umfang der Prüfungen“ (erster Durchlauf vollständig, nur blockierende Befunde verhindern das Bestehen, Bericht höchstens etwa 60 Zeilen).

## Prüfgrundlagen

- `development/backtest/wp02/orders/13.md`
- `development/backtest/specification.md`, `development/backtest/plan.md`
- `docs/technical/pipwerk-fetch-mt5.md`, `docs/technical/development-test-security-rules.md`, `contracts/market-data/`
- Briefing Tester Funktion in `docs/technical/agentenrollen-und-briefings.md`
- Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `13-functiontest-1.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit und den Commit des Prüfskripts vollständig und alle Befunde mit Fundstelle.
