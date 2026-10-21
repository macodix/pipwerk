# Prüfauftrag Funktionstest, Auftrag 03, Durchlauf 2 (Nachprüfung)

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Funktion
- zu prüfender Commit: `1f1226f623cba97fb5740e202935edb79f526603` (Zweig `backtest/wp02-09`, enthält die Aufträge 03 und 09)
- Aufträge: `development/backtest/wp02/orders/03.md` und `orders/09.md` auf dem Zweig `backtest/wp02`
- Vorbericht: `03-functiontest-1.md` (Befund 1: Zeilen der doppelten Stunde; Hinweise 2 und 4 hat der Entwicklungsleiter in Auftrag 09 aufgenommen)

## Gegenstand

Nachprüfung nach den Regeln „Umfang der Prüfungen“: Ist Befund 1 behoben, und enthalten die dafür geänderten Stellen neue Fehler? Wiederhole die Nachweisfälle aus dem Vorbericht (Europe/Athens, 25.10.2026, Ende 01:00Z, 01:30Z, 02:00Z, kurzer letzter Abschnitt 18:30Z bis 01:30Z) und prüfe weitere Schnitte, den Wechsel mit Vorstellen der Uhr, halbe Stunden und eine Zeitzone ohne Sommerzeit. Prüfe zusätzlich die Begrenzung der Zahl der Abrufe (Hinweis 2) und dass der Schlüssel in keinem Protokoll steht (Hinweis 4); beide Punkte sind jetzt Teil des Auftrags und blockierend, wenn sie nicht wie in `orders/09.md` beschrieben arbeiten. Die vier bisher übersprungenen Tests gegen `contracts/market-data/v1/` laufen nach dem Zusammenführen; sie gehören nicht zu dieser Prüfung. Führe das Prüfskript `components/pipwerk-fetch-mt5/scripts/check` (Zweig `backtest/wp02-functiontest-03`, Commit `dba32a9e5469dc9dd1116e0a1660cfab56aec1e6`) auf dem zu prüfenden Commit aus. Ändere am Prüfskript nur, was die Prüfung verlangt.

## Prüfgrundlagen

- `development/backtest/wp02/orders/03.md`, `orders/09.md`
- `development/backtest/specification.md`
- `docs/technical/pipwerk-fetch-mt5.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `03-functiontest-2.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit und den Commit des Prüfskripts vollständig und nur die noch offenen und neuen Befunde.
