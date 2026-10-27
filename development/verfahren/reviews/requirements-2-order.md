# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 2 (Nachprüfung)

- Vorhaben: `verfahren` (Entwicklungsverfahren verbessern)
- Phase: 2 Konzeption, Nachprüfung der Dokumente des Auftraggebers zu Beginn mit `specify`
- Rolle: QA
- zu prüfender Stand: `main`, Commit `051e6c8dcdd1d7b58bbfc6f22337d05ba4cc7d2f`
- vorheriger Prüfbericht: `development/verfahren/reviews/requirements-1.md` (geprüfter Commit `b2ed4d6b14704836597ab91102b1d1144830a931`)

Dies ist eine Nachprüfung, kein vollständiger Durchlauf.

## Gegenstand

`development/verfahren/scope.md`, Abschnitt „Festlegungen des Auftraggebers“, Stand 2026-10-24. Der Auftraggeber hat B1 entschieden (Festlegung 5) und H16 und H17 beantwortet (Festlegungen 1 und 7). Die Änderungen zeigt `git diff b2ed4d6b14704836597ab91102b1d1144830a931 051e6c8dcdd1d7b58bbfc6f22337d05ba4cc7d2f -- development/verfahren/scope.md`.

Prüfe nur:

1. Ist B1 erledigt? Lässt Festlegung 5 jetzt nur noch eine Deutung zu, für welche Ansicht ein Oberflächenentwurf gilt und ab wann eine Ansicht als umgesetzt gilt?
2. Sind H16 und H17 durch die Festlegungen 1 und 7 beantwortet?
3. Enthalten die geänderten Stellen in Festlegungen 1, 5 und 7 neue Fehler: Widersprüche zu den übrigen Festlegungen, Mehrdeutigkeiten, sprachliche Fehler, die den Sinn verändern?

Nicht Gegenstand:

- die Hinweise H1 bis H15 aus Durchlauf 1. Sie betreffen technische Dokumente oder die Spezifikation und werden dort erledigt.
- unveränderte Stellen von `scope.md`, der offene Punkt „Präsentationen und Ablauf der Abnahme“, `docs/design/requirements/` und technische Einzelheiten der Umsetzung.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- In `docs/technical/entwicklungsverfahren.md`: „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“ und „Lücken“). Dies ist eine Nachprüfung: Nenne nur noch offene und neue Befunde. Nur blockierende Befunde verhindern das Bestehen, alles andere als Hinweis, je Hinweis eine Zeile. Der Bericht umfasst höchstens etwa 60 Zeilen.
- `development/verfahren/scope.md`, `development/verfahren/reviews/requirements-1.md`

Ordne jeden Befund nach „Fragen an den Auftraggeber“ zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe. Nenne zu jedem Befund Fundstelle, Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-2.md` in das Berichtsverzeichnis `work/verfahren/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, die noch offenen und neuen blockierenden Befunde und getrennt davon die Hinweise.
