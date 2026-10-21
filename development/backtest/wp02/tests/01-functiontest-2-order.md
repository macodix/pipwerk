# Prüfauftrag Funktionstest, Auftrag 01, Durchlauf 2 (Nachprüfung)

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Funktion
- zu prüfender Commit: `71b53f02b552357ad022370040debfd9b8f7d003` (Zweig `backtest/wp02-06`, enthält Auftrag 01 und die Korrektur Auftrag 06)
- Aufträge: `development/backtest/wp02/orders/01.md` und `orders/06.md` auf dem Zweig `backtest/wp02`
- Vorbericht: `01-functiontest-1.md` (Befund 1: Dateimodus von `testenv`)

## Gegenstand

Nachprüfung nach den Regeln „Umfang der Prüfungen“: Ist Befund 1 behoben, und enthalten die dafür geänderten Stellen neue Fehler? Führe `testenv start`, `status` und `stop` als Programm über den absoluten Pfad mit dem Backend aus (freie Ports, Parameter). Führe das Prüfskript `components/pipwerk-replay/scripts/check` (Zweig `backtest/wp02-functiontest`, Commit `2c3214e758bf33710643e631cdc9ddf9b9cb04b6`) auf dem zu prüfenden Commit aus. Ändere am Prüfskript nur, was die Prüfung verlangt; ein neuer Commit auf `backtest/wp02-functiontest` ist dann im Bericht zu nennen.

## Prüfgrundlagen

- `development/backtest/wp02/orders/01.md`, `orders/06.md`
- `development/backtest/specification.md`
- `docs/technical/pipwerk-replay.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `01-functiontest-2.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit und den Commit des Prüfskripts vollständig und nur die noch offenen und neuen Befunde.
