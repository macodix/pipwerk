# Prüfauftrag Spezifikation, Durchlauf 5 (Nachprüfung der Ergänzung nach amend)

- Vorhaben: `verfahren` (Entwicklungsverfahren verbessern)
- Phase: 4 Umsetzung, Ergänzung der Spezifikation nach `amend`
- Rolle: QA
- zu prüfender Stand: `main`, Commit `8b112fb2be725390568de9ae315ccee30ca8ce96`
- vorheriger Prüfbericht: `development/verfahren/reviews/specification-4.md` (geprüfter Commit `8c57396b62e2b81a5420f1f781ae083288823fa7`)

Dies ist eine Nachprüfung, kein vollständiger Durchlauf. Es gilt „Grenze der Durchläufe“ in `docs/technical/entwicklungsverfahren.md`: Rein technische Befunde entscheidet der Softwarearchitekt selbst. Prüfe nur Befunde, die Dokumente des Auftraggebers, bestätigte Festlegungen, Abnahmekriterien oder den Umfang berühren.

## Gegenstand

`development/verfahren/specification.md`. Die Änderungen zeigt `git diff 8c57396b62e2b81a5420f1f781ae083288823fa7 8b112fb2be725390568de9ae315ccee30ca8ce96 -- development/verfahren/specification.md`. Der Änderungsnachweis nennt, wo B1 und die Hinweise erledigt sind.

Prüfe nur:

1. Ist B1 erledigt?
2. Enthalten die geänderten Stellen neue Fehler im Sinne des Satzes oben?

Nicht Gegenstand: unveränderte Stellen, die Festlegungen selbst, die Umsetzung auf dem Zweig `verfahren/umsetzung`.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- In `docs/technical/entwicklungsverfahren.md` die Regeln „Umfang der Prüfungen“, „Fragen an den Auftraggeber“ und „Grenze der Durchläufe“. Nenne nur noch offene und neue Befunde. Nur blockierende Befunde verhindern das Bestehen, alles andere als Hinweis, je Hinweis eine Zeile. Der Bericht umfasst höchstens etwa 40 Zeilen.
- `development/verfahren/scope.md`, `development/verfahren/umsetzung/amend-01.md`, `development/verfahren/reviews/specification-4.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-5.md` in das Berichtsverzeichnis `work/verfahren/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, die noch offenen und neuen blockierenden Befunde und getrennt davon die Hinweise.
