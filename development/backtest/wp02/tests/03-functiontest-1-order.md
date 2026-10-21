# Prüfauftrag Funktionstest, Auftrag 03, Durchlauf 1

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Funktion
- zu prüfender Commit: `f70759b3b9474c5814c734af058658a7246ef8d3` (Zweig `backtest/wp02-03`)
- Auftrag: `development/backtest/wp02/orders/03.md` auf dem Zweig `backtest/wp02`

## Gegenstand

Prüfe den Commit gegen Auftrag 03 und die Spezifikation (E5, 5.1 Absatz Zeitpunkte, 5.4, 10 Punkt Beschaffung, 11): Funktion, Grenzfälle, automatische Tests, Programmierregeln, Sicherheit des Schlüssels und technische Dokumentation.

Lege das Prüfskript `components/pipwerk-fetch-mt5/scripts/check` an (pytest, ruff check, ruff format --check, mypy; Muster: `components/pipwerk-studio/scripts/check`) und beschreibe Name und Aufruf in `docs/technical/pipwerk-fetch-mt5.md` in einem Abschnitt „Prüfskript“. Arbeite dafür im Zweig `backtest/wp02-functiontest-03`, aufgesetzt auf dem zu prüfenden Commit, übertrage ihn nach GitHub und nenne den Commit des Prüfskripts im Bericht. Setze das Ausführungsbit im Index (`git update-index --chmod=+x`) und versuche, das Skript über den absoluten Pfad als Programm zu starten.

Der Commit steht auf einem anderen Zweig als Auftrag 02. Vier Tests, die Dateien gegen `contracts/market-data/v1/` prüfen, werden übersprungen, bis Auftrag 02 zusammengeführt ist; das ist kein Befund. Der Abgleich der Antwortform mit den Schemata von Auftrag 02 ist Sache des Entwicklungsleiters beim Zusammenführen.

Entscheidungen des Entwicklungsleiters zu den Rückfragen des Entwicklers (kein Befund, sofern sonst richtig umgesetzt und dokumentiert):

- Die Hülle `file` und `omitted` der Antwort, `POST /api/v1/fetch` mit `kind`, die kleingeschriebene `time_unit`, `trading_hours` gleich `null`, `no_data` bei leerem Zeitraum und die in Punkt 8 genannten Festlegungen sind technische Festlegungen im Rahmen der Spezifikation.
- Die Auslassung der zweiten Stunde beim Zurückstellen der Uhr folgt der Regel in 5.1.
- Die fehlenden Felder `swap_mode` und Währung der Margin im Schema der Angaben zum Instrument beurteilt der Entwicklungsleiter selbst; kein Befund.
- Den Test gegen eine echte Installation von MetaTrader 5 macht der Auftraggeber in der Abnahme.

## Prüfgrundlagen

- `development/backtest/wp02/orders/03.md`
- `development/backtest/specification.md`, `development/backtest/plan.md`
- `docs/technical/pipwerk-fetch-mt5.md`, `docs/technical/development-test-security-rules.md`
- Briefing Tester Funktion in `docs/technical/agentenrollen-und-briefings.md`
- Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `03-functiontest-1.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit und den Commit des Prüfskripts vollständig und alle Befunde mit Fundstelle.
