# Prüfauftrag Funktionstest, Auftrag 01, Durchlauf 1

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Funktion
- zu prüfender Commit: `fe512964794d36ea59e91fa4c017e2697453ff84` (Zweig `backtest/wp02-01`)
- Auftrag: `development/backtest/wp02/orders/01.md` auf dem Zweig `backtest/wp02`

## Gegenstand

Prüfe den Commit gegen Auftrag 01 und die Spezifikation: Funktion, Grenzfälle, automatische Tests, Programmierregeln und technische Dokumentation.

Lege das Prüfskript `components/pipwerk-replay/scripts/check` nach dem Muster von `components/pipwerk-studio/scripts/check` an (pytest, ruff check, ruff format --check, mypy des Backends; Oberfläche, Typprüfung, Vitest, Build und Browsertests, sobald `frontend/` vorhanden ist, bis dahin überspringt das Skript sie mit Hinweis) und beschreibe Name, Aufruf und Parameter in `docs/technical/pipwerk-replay.md` in einem Abschnitt „Prüfskript“. Arbeite dafür im Zweig `backtest/wp02-functiontest`, aufgesetzt auf dem zu prüfenden Commit, übertrage ihn nach GitHub und nenne den Commit des Prüfskripts im Bericht.

Entscheidungen des Entwicklungsleiters (kein Befund):

- Die Einstellung Sprache und der Stand (Commit) gehören nach Spezifikation Abschnitt 7 zu den internen Endpunkten (wie `/api/studio/settings/language` und `/api/studio/revision` in pipwerk Studio). Die Umstellung von `/api/v1/settings` auf `/api/replay/settings/language` und der Endpunkt für den Stand folgen in Auftrag 04; kein Befund zu Auftrag 01.
- Die Oberfläche folgt in Auftrag 05; das Testumgebungsskript startet bis dahin nur das Backend.

## Prüfgrundlagen

- `development/backtest/wp02/orders/01.md`
- `development/backtest/specification.md`, `development/backtest/plan.md`
- `docs/technical/pipwerk-replay.md`, `docs/technical/pipwerk-studio.md`, `docs/technical/development-test-security-rules.md`
- Briefing Tester Funktion in `docs/technical/agentenrollen-und-briefings.md`
- Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `01-functiontest-1.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit und den Commit des Prüfskripts vollständig und alle Befunde mit Fundstelle.
