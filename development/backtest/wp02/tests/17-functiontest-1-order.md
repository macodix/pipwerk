# Prüfauftrag Funktionstest, Auftrag 17, Durchlauf 1

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Funktion
- zu prüfender Commit: `f8564c0d57f3e97d3e653113025562674bafb79a` (Zweig `backtest/wp02-17`, aufgesetzt auf Auftrag 15)
- Auftrag: `development/backtest/wp02/orders/17.md` auf dem Zweig `backtest/wp02`

## Gegenstand

Prüfe den Commit gegen Auftrag 17 und die Spezifikation (5.2, 5.3, 5.5, 8.3 Zeile „Datenbestand“, 8.4, 10, 11, 12): Dialog „Datei importieren“ (beliebig viele Dateien, eine Anfrage je Datei, Stand je Datei, Abbrechen, Schließen während des Vorgangs, Datei über der Grenze je Datei, Fehler der Anfrage; kein Hinweis auf Gesamtgröße oder Zahl der Dateien in Code, Texten und Dokumentation), Löschen in den vier Formen mit Vorabangabe und Rückfrage, Aktualisierung von Tabelle und „Broker für Testläufe“, Darstellung der Lücken, Zweisprachigkeit, Erklärungen beim Zeigen, Texte nur als Text, Fenstergrößen nach 8.4 Punkt 1, Vitest und Browsertests (vollständiger Lauf gegen das echte Backend, im Hintergrund), Programmierregeln, technische Dokumentation (`docs/technical/pipwerk-replay.md`, README der Komponente) und Anwenderdokumentation `docs/user/pipwerk-replay.md` auf Richtigkeit gegenüber dem Verhalten (M1, M3, M5, M6; Verständlichkeit für Anwender ist Sache der QA).

Entscheidung des Entwicklungsleiters (kein Befund): Der Windows-Befehl zur Installation von `uv` in Abschnitt 9 der Anwenderdokumentation konnte auf dem Entwicklungsrechner nicht gegen die offizielle Anleitung abgeglichen werden; die QA und der Auftraggeber prüfen ihn. Nenne im Bericht nur, ob der Befehl dem entspricht, was dir aus der offiziellen Anleitung bekannt ist.

Prüfskripte: das der Komponente `components/pipwerk-replay` und, soweit betroffen, `packages/market-data/scripts/check`; halte sie aktuell, falls nötig, im Zweig `backtest/wp02-functiontest-17`, aufgesetzt auf dem zu prüfenden Commit, und nenne den Commit im Bericht. Befehle über 10 Minuten im Hintergrund laufen lassen.

Beachte die Regeln „Umfang der Prüfungen“ (erster Durchlauf vollständig, nur blockierende Befunde verhindern das Bestehen, Bericht höchstens etwa 60 Zeilen).

## Prüfgrundlagen

- `development/backtest/wp02/orders/17.md`, `development/backtest/wp02/acceptance/2.md`
- `development/backtest/specification.md`, `development/backtest/plan.md`
- `docs/technical/development-test-security-rules.md`, `contracts/api/pipwerk-replay/v1/openapi.json`
- Briefing Tester Funktion in `docs/technical/agentenrollen-und-briefings.md`
- Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `17-functiontest-1.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit und den Commit des Prüfskripts vollständig und alle Befunde mit Fundstelle.
