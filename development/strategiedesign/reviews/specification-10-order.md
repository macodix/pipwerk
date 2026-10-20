# Prüfauftrag Spezifikation, Durchlauf 10

- Vorhaben: `strategiedesign`, ref `strategiedesign`
- Phase: 2, Einwand des Auftraggebers aus der Abstimmung (`revise`)
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, der diesen Prüfauftrag anlegt. Den vollständigen Commit liefert `git log -1 --format=%H -- development/strategiedesign/reviews/specification-10-order.md` auf `origin/main`.
- vorheriger Durchlauf: `development/strategiedesign/reviews/specification-9.md`, bestanden

## Gegenstand

Eine Nachprüfung mit zwei Teilen, beschränkt auf diese Stellen:

1. Geänderte Stelle des Fachmodells aus Commit `adf784e` (`git show adf784e`): `docs/design/domain/fachmodell.md`, req-fach-053, Satz zu `Instrument` ohne Instanz. Prüfe sie nach dem Briefing QA für Phase 1, beschränkt auf diese Stelle und ihre Widerspruchsfreiheit zu den übrigen geltenden Dokumenten laut `development/strategiedesign/scope.md`, insbesondere req-fach-051. Ordne jeden Befund nach „Fragen an den Auftraggeber“ zu.
2. Dafür geänderte Stellen der Spezifikation: `git diff 51a2810 <zu prüfender Commit> -- development/strategiedesign/specification.md`. Das sind 3.1 (`Instrument` ohne Instanz), Abschnitt 10 Punkt 19, die Folgen in Abschnitt 10, Status und Änderungsnachweis (erste Zeile). Prüfe, ob sie req-fach-053 in der Fassung von `adf784e` vollständig und richtig umsetzen und ob die geänderten Stellen neue Fehler enthalten.

Anlass: Einwand des Auftraggebers zu Abschnitt 10 Punkt 19 der Spezifikation, Nachtrag im Vermerk auf der letzten Folie von `development/strategiedesign/presentations/specification-2.html`. Hinweis T2-H4 aus `specification-9.md` entfällt damit.

Nicht Gegenstand: alle übrigen Stellen, auch die übrigen Hinweise aus `specification-9.md`, Glossar, Arbeitspaketplan, Code.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md`: Dies ist eine Nachprüfung. Prüfe nur die genannten Stellen. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis. Eine Lücke ist nur mit gutem technischem Grund blockierend.
- `development/strategiedesign/scope.md` und die dort genannten Dokumente

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-10.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise, je Teil getrennt.
