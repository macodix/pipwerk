# Prüfauftrag Funktionstest, Auftrag 02, Durchlauf 2 (Nachprüfung)

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Funktion
- zu prüfender Commit: `3e983095a3c6d6ab70a34d4a7e717f1b82099f45` (Zweig `backtest/wp02-07`, enthält Auftrag 02 und die Korrektur Auftrag 07)
- Aufträge: `development/backtest/wp02/orders/02.md` und `orders/07.md` auf dem Zweig `backtest/wp02`
- Vorbericht: `02-functiontest-1.md` (Befund 1: Obergrenze von `volume` und `spread` im JSON-Import)

## Gegenstand

Nachprüfung nach den Regeln „Umfang der Prüfungen“: Ist Befund 1 behoben, und enthalten die dafür geänderten Stellen neue Fehler? Prüfe auch, dass kein Zahlenfeld des JSON-Imports mit extremem Wert eine unbehandelte Ausnahme auslöst. Führe das Prüfskript `packages/market-data/scripts/check` (Zweig `backtest/wp02-functiontest-02`, Commit `28b21bbf329aacc204079f55e00f72a50387e4f0`) auf dem zu prüfenden Commit aus; versuche, es als Programm über den absoluten Pfad zu starten, und nenne im Bericht, ob das gelang. Ändere am Prüfskript nur, was die Prüfung verlangt.

## Prüfgrundlagen

- `development/backtest/wp02/orders/02.md`, `orders/07.md`
- `development/backtest/specification.md`
- `docs/technical/pipwerk-marketdata.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `02-functiontest-2.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit und den Commit des Prüfskripts vollständig und nur die noch offenen und neuen Befunde.
