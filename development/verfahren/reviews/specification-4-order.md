# Prüfauftrag Spezifikation, Durchlauf 4 (Ergänzung nach amend)

- Vorhaben: `verfahren` (Entwicklungsverfahren verbessern)
- Phase: 4 Umsetzung, Ergänzung der Spezifikation nach `amend`
- Rolle: QA
- zu prüfender Stand: `main`, Commit `8c57396b62e2b81a5420f1f781ae083288823fa7`
- vorheriger Prüfbericht: `development/verfahren/reviews/specification-3.md` (geprüfter Commit `bd564cfc4343badf94dbe0fe29ca9306e97f3394`, bestanden)

Dies ist eine Prüfung der Ergänzung, kein vollständiger Durchlauf. Es gilt „Grenze der Durchläufe“ in `docs/technical/entwicklungsverfahren.md`: Rein technische Befunde entscheidet der Softwarearchitekt selbst. Prüfe nur Befunde, die Dokumente des Auftraggebers, bestätigte Festlegungen, Abnahmekriterien oder den Umfang berühren.

## Gegenstand

`development/verfahren/specification.md`, geänderte Stellen nach dem Änderungsnachweis vom 2026-10-26: 3.2 Punkt 2, 3.3 Punkt 5, 7.1, Abschnitt 8. Die Änderungen zeigt `git diff 8c57396b62e2b81a5420f1f781ae083288823fa7~1 8c57396b62e2b81a5420f1f781ae083288823fa7 -- development/verfahren/specification.md`. Anlass ist `development/verfahren/umsetzung/amend-01.md` mit dem Abschnitt „Ergebnis“.

Prüfe nur:

1. Schließen die geänderten Stellen die Lücken aus `amend-01.md`, Punkte 1 bis 3?
2. Gibt 3.3 Punkt 5 die Folge für Festlegung 1 in `scope.md` vollständig und verständlich an, sodass der Auftraggeber sie bestätigen oder ablehnen kann?
3. Enthalten die geänderten Stellen Widersprüche zu den Festlegungen in `scope.md` oder zu unveränderten Stellen der Spezifikation?

Nicht Gegenstand: unveränderte Stellen, die Festlegungen selbst, die Umsetzung auf dem Zweig `verfahren/umsetzung`.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- In `docs/technical/entwicklungsverfahren.md` die Regeln „Umfang der Prüfungen“, „Fragen an den Auftraggeber“ und „Grenze der Durchläufe“. Nur blockierende Befunde verhindern das Bestehen, alles andere als Hinweis, je Hinweis eine Zeile. Der Bericht umfasst höchstens etwa 50 Zeilen.
- `development/verfahren/scope.md`, `development/verfahren/umsetzung/amend-01.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-4.md` in das Berichtsverzeichnis `work/verfahren/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, die blockierenden Befunde und getrennt davon die Hinweise.
