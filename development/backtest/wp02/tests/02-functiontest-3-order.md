# Prüfauftrag Funktionstest, Auftrag 02, Durchlauf 3 (Nachprüfung)

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Funktion
- zu prüfender Commit: `de74b5f6bb9b7706a352ca612c8f19e96a7c0ad7` (Zweig `backtest/wp02-08`, enthält die Aufträge 02, 07 und 08)
- Aufträge: `development/backtest/wp02/orders/02.md`, `orders/07.md`, `orders/08.md` auf dem Zweig `backtest/wp02`
- Vorbericht: `02-functiontest-2.md` (Befund 1: Zeit am Ende des darstellbaren Bereichs)

## Gegenstand

Nachprüfung nach den Regeln „Umfang der Prüfungen“: Ist Befund 1 behoben, und enthalten die dafür geänderten Stellen neue Fehler? Prüfe Zeiten an und neben den neuen Grenzen (1970-01-01 und 2100-01-01 UTC) in Kerzen und Ticks, JSON und CSV, jede Zeiteinheit, auch mit Zeitzonen, sowie Lesen, Vollständigkeit und Übersicht. Der Entwickler hat `completeness` so geändert, dass es bei einem Zeitraum außerhalb der Grenzen `ValueError` wirft; das ist im Dokument genannt und kein Befund, sofern dokumentiert und getestet. Führe das Prüfskript `packages/market-data/scripts/check` (Zweig `backtest/wp02-functiontest-02`, Commit `28b21bbf329aacc204079f55e00f72a50387e4f0`) auf dem zu prüfenden Commit aus. Ändere am Prüfskript nur, was die Prüfung verlangt. Lösche deine Probeskripte aus der Vorprüfung nicht und lege sie nicht in das Repository.

## Prüfgrundlagen

- `development/backtest/wp02/orders/02.md`, `orders/07.md`, `orders/08.md`
- `development/backtest/specification.md`
- `docs/technical/pipwerk-marketdata.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `02-functiontest-3.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit und den Commit des Prüfskripts vollständig und nur die noch offenen und neuen Befunde.
