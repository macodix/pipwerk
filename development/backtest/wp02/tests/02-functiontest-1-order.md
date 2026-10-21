# Prüfauftrag Funktionstest, Auftrag 02, Durchlauf 1

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Funktion
- zu prüfender Commit: `f01929341030104b7612d795154ab19069823c1b` (Zweig `backtest/wp02-02`)
- Auftrag: `development/backtest/wp02/orders/02.md` auf dem Zweig `backtest/wp02`

## Gegenstand

Prüfe den Commit gegen Auftrag 02 und die Spezifikation (E4, 5.1 bis 5.3, 10 Punkt Datenbestand): Funktion, Grenzfälle, automatische Tests, Programmierregeln und technische Dokumentation.

Lege das Prüfskript `packages/market-data/scripts/check` an (pytest, ruff check, ruff format --check, mypy des Pakets; Muster: `components/pipwerk-studio/scripts/check`) und beschreibe Name und Aufruf in `docs/technical/pipwerk-marketdata.md` in einem Abschnitt „Prüfskript“. Arbeite dafür im Zweig `backtest/wp02-functiontest-02`, aufgesetzt auf dem zu prüfenden Commit, übertrage ihn nach GitHub und nenne den Commit des Prüfskripts im Bericht.

Entscheidungen des Entwicklungsleiters zu den Rückfragen des Entwicklers (kein Befund, sofern sonst richtig umgesetzt):

- Das CSV-Format von MetaTrader 5 ist im Repository nicht belegt. Die Umsetzung nach dem Wissen des Entwicklers gilt vorläufig; der Auftraggeber prüft in der Abnahme mit einer echten Exportdatei. Prüfe, ob die Dokumentation das Format und diese Einschränkung nennt.
- Abgelehnte zweite Fassung einer doppelten Ortszeit, abgelehnte Ticks mit leerem Geld oder Brief, die zusätzlichen Prüfungen der Kerzen und das feste Wochenende in UTC sind technische Festlegungen im Rahmen der Spezifikation. Prüfe, ob sie dokumentiert und getestet sind.

## Prüfgrundlagen

- `development/backtest/wp02/orders/02.md`
- `development/backtest/specification.md`, `development/backtest/plan.md`
- `docs/technical/pipwerk-marketdata.md`, `docs/technical/development-test-security-rules.md`
- Briefing Tester Funktion in `docs/technical/agentenrollen-und-briefings.md`
- Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `02-functiontest-1.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit und den Commit des Prüfskripts vollständig und alle Befunde mit Fundstelle.
