# Prüfauftrag Funktionstest, Auftrag 14, Durchlauf 1

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Funktion
- zu prüfender Commit: `85f271635a86ce0eae28581f4d79b5fde841c7c7` (Zweig `backtest/wp02-14`)
- Auftrag: `development/backtest/wp02/orders/14.md` auf dem Zweig `backtest/wp02`

## Gegenstand

Prüfe den Commit gegen Auftrag 14 und die Spezifikation (5.1, 5.3, 5.4, 8.1, 8.3 Zeile „Datenbestand“, 8.4 Bedienerführung, 10, 11, 12): Ansicht „Datenbestand“ (Leiste, Tabelle mit Filter und Seiten, Einzelheiten), Dialog „Datei importieren“ (mehrere Dateien, Broker und Zeitzone einmal, Instrument und Daten je Datei mit Vorbelegung, Sperre, Ergebnis je Datei), vollständiger Entfall der Beschaffung in der Oberfläche, Texte nach M2 in Deutsch und Englisch, Erklärungen beim Zeigen, Fenstergrößen, Grenzfälle (viele Dateien, große Dateien, Dateinamen mit Sonderzeichen, Texte als Text und nie als HTML), Vitest, Browsertests, Programmierregeln, `npm audit`, technische Dokumentation und, ob die Anwenderdokumentation `docs/user/pipwerk-replay.md` zu dem passt, was die Oberfläche tut (die Beurteilung der Verständlichkeit macht die QA). Die Ansicht entspricht dem Prototyp (Auftrag `development/backtest/prototype/order-03.md`, Stand Commit `d9c2edac0ec78555d43f587635e8bf1a37b4d762`); prüfe die Abweichungen im Aufbau und melde sie.

Entscheidungen des Entwicklungsleiters (kein Befund, sofern richtig umgesetzt und dokumentiert): Filter sind Textfelder, weil die Web-API Teilzeichenfolgen sucht. Hinweis 4 des Testers zu Auftrag 12 (Fehlertexte der Abfrage) bleibt Hinweis. `vite` und `vitest` wurden gehoben; pipwerk Studio bleibt unverändert.

Lege Wegwerfdateien und Wegwerfskripte nur im Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/` an, nie in einem Git-Arbeitsverzeichnis (die Datei `probe_ft11.py` aus früheren Läufen steht ungetrackt in deinem Arbeitsverzeichnis `functiontest`: Wenn dir das Löschen nicht möglich ist, lege sie mit `git -C /srv/aixlab/dev/pipwerk/work/backtest/wp02/functiontest` nicht an, sondern nutze `.git/info/exclude` für diese Datei, falls erlaubt, oder prüfe in einem eigenen frischen Arbeitsverzeichnis `functiontest2`). Das Prüfskript ist `components/pipwerk-replay/scripts/check`; halte es aktuell, falls nötig, im Zweig `backtest/wp02-functiontest-14`, aufgesetzt auf dem zu prüfenden Commit, und nenne den Commit im Bericht. Beachte die Regeln „Umfang der Prüfungen“ (erster Durchlauf vollständig, nur blockierende Befunde verhindern das Bestehen, Bericht höchstens etwa 60 Zeilen).

## Prüfgrundlagen

- `development/backtest/wp02/orders/14.md`, `development/backtest/wp02/acceptance/1.md`
- `development/backtest/specification.md`, `development/backtest/plan.md`, Prototyp unter `development/backtest/prototype/`
- `docs/technical/pipwerk-replay.md`, `docs/user/pipwerk-replay.md`, `docs/technical/development-test-security-rules.md`
- Briefing Tester Funktion in `docs/technical/agentenrollen-und-briefings.md`
- Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `14-functiontest-1.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit und den Commit des Prüfskripts vollständig und alle Befunde mit Fundstelle.
