# Prüfauftrag Spezifikation und Plan, Durchlauf 4 (Spezifikation) und 5 (Plan)

- Vorhaben: `backtest`
- Anlass: Abnahme von `wp02`, Versuch 2, nicht bestanden ([Abnahmebericht](../wp02/acceptance/2.md), Mängel M1, M2, M3, M5, M6); geänderte Anforderungen req-system-025 und req-system-026, Prüfung bestanden in [requirements-7.md](requirements-7.md) und [requirements-8.md](requirements-8.md)
- Rolle: QA
- zu prüfender Stand: `main`, Commit `8ca391262012564dfdbf5b2fb99739453b00a6cf`
- Vorherige Durchläufe: [specification-3.md](specification-3.md), [plan-4.md](plan-4.md), beide bestanden

## Gegenstand

Prüfung beschränkt auf die geänderten Stellen. Sichtbar mit `git diff 859254c5491712f28fadea38e31d14ea9d51e644 8ca391262012564dfdbf5b2fb99739453b00a6cf -- development/backtest/specification.md development/backtest/plan.md`.

Prüfe:

1. Spezifikation (Änderungsnachweis, letzter Eintrag vom 2026-10-23; 5.1, 5.2, 5.3, 5.5, 7, 8.3, 10, 11, 12, 13): Setzt sie req-system-025, req-system-026, req-test-003 und die Festlegungen des Auftraggebers in den Mängeln M1, M2, M3, M5 und M6 des Abnahmeberichts vollständig und ohne Widerspruch um? Widerspricht eine geänderte Stelle einer nicht geänderten?
2. Plan (Änderungsnachweis, letzter Eintrag vom 2026-10-23; `wp02`, `wp03`, `wp04`, Abdeckung, Abschnitt „Offen“): Ist jede geänderte Stelle der Spezifikation durch ein Paket abgedeckt? Lassen sich die geänderten und neuen Abnahmekriterien vom Auftraggeber selbst prüfen?

Zurückgestellt vom Auftraggeber am 2026-10-23 (Vermerk im Abnahmebericht unter M4): M4, große Dateien, und die Probeumsetzung `prototype/order-04.md`. Dass Spezifikation 5.3 bis dahin eine Grenze je Datei behält und der Plan M4 unter „Offen“ führt, folgt aus dieser Entscheidung und ist kein Befund. Prüfe nur, ob es richtig und widerspruchsfrei beschrieben ist.

Nicht Gegenstand:

- nicht geänderte Stellen, außer eine geänderte Stelle widerspricht ihnen
- M4 und die Probeumsetzung `order-04`
- Prototyp und Umsetzung auf dem Arbeitszweig `backtest/wp02`
- die Dokumente des Auftraggebers

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“, „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“) und „Grenze der Durchläufe“ in `docs/technical/entwicklungsverfahren.md`. Spezifikation und Plan legen nur Bausteine, Entscheidungen und Abnahmekriterien fest; Testdetails und Formulierungen gehören in die Aufträge. Nur blockierende Befunde verhindern das Bestehen, alles andere als Hinweis in einer Zeile. Jeder Bericht höchstens etwa 60 Zeilen.
- `development/backtest/scope.md`, Abnahmebericht `development/backtest/wp02/acceptance/2.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt und einen konkreten Kritikpunkt oder eine Frage. Lege keine Korrekturlösung fest.

Befehle, die länger als 10 Minuten laufen können, lässt du im Hintergrund laufen und fragst ihren Stand in kürzeren Abständen ab. Für diese Prüfung ist kein solcher Befehl nötig.

## Ablage

Schreibe zwei Berichte in das Berichtsverzeichnis `work/backtest/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis:

- `specification-4.md` zu Punkt 1
- `plan-5.md` zu Punkt 2

Jeder Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
