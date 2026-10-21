# Prüfauftrag Funktionstest, Auftrag 03, Durchlauf 3 (Nachprüfung)

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Funktion
- zu prüfender Commit: `1378ab5132ee5bf314280c170e26c8e538ef1634` (Zweig `backtest/wp02-10`, enthält die Aufträge 03, 09 und 10)
- Aufträge: `development/backtest/wp02/orders/03.md`, `orders/09.md`, `orders/10.md` auf dem Zweig `backtest/wp02`
- Vorbericht: `03-functiontest-2.md` (Befund 1: zweite Kerze der doppelten Stunde bei h1 und gröber; Hinweis 2: Rest-Risiko)

## Gegenstand

Nachprüfung nach den Regeln „Umfang der Prüfungen“: Ist Befund 1 behoben, und enthalten die dafür geänderten Stellen neue Fehler? Wiederhole deine Läufe aus Durchlauf 2 für Kerzen h1, h4, d1 sowie m1 und m30 und für Ticks (Athen, London, New York, Lord Howe, ohne Sommerzeit). Hinweis 2: Der Entwickler konnte den Fall „dünner Markt“ nicht erkennen und hat die Folge im Rest-Risiko (Abschnitt 5), in Abschnitt 7 Schritt 4 und in der Beispiel-INI beschrieben. Der Entwicklungsleiter nimmt das als technische Grenze der Quelle an; es ist kein Befund, wenn die Beschreibung vollständig und richtig ist. Ebenso die genannte Grenze bei Lord Howe mit Kerzen auf einem UTC-Raster. Führe das Prüfskript `components/pipwerk-fetch-mt5/scripts/check` (Zweig `backtest/wp02-functiontest-03`, Commit `dba32a9e5469dc9dd1116e0a1660cfab56aec1e6`) auf dem zu prüfenden Commit aus. Ändere am Prüfskript nur, was die Prüfung verlangt.

## Prüfgrundlagen

- `development/backtest/wp02/orders/03.md`, `orders/09.md`, `orders/10.md`
- `development/backtest/specification.md`
- `docs/technical/pipwerk-fetch-mt5.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `03-functiontest-3.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit und den Commit des Prüfskripts vollständig und nur die noch offenen und neuen Befunde.
