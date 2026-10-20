# Prüfauftrag Spezifikation, Durchlauf 9

- Vorhaben: `strategiedesign`, ref `strategiedesign`
- Phase: 2, Einwände des Auftraggebers aus der Abstimmung (`revise`)
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, der diesen Prüfauftrag anlegt. Den vollständigen Commit liefert `git log -1 --format=%H -- development/strategiedesign/reviews/specification-9-order.md` auf `origin/main`.
- vorheriger Durchlauf: `development/strategiedesign/reviews/specification-8.md`, bestanden

## Gegenstand

Ein Durchlauf mit zwei Teilen:

1. Geänderte Stellen der Dokumente des Auftraggebers aus den Commits `48cea2d`, `cc89959` und `7680948` (`git show <commit>`): `docs/design/domain/fachmodell.md` (req-fach-046, req-fach-047, req-fach-051, req-fach-053), `docs/design/requirements/anforderungen-strategiedesigner.md` (req-fach-015, req-ablauf-007), `docs/design/requirements/anforderungen-strategietester-backtester.md` (Abschnitt 5). Prüfe sie nach dem Briefing QA für Phase 1, beschränkt auf diese Stellen und ihre Widerspruchsfreiheit zu den übrigen geltenden Dokumenten laut `development/strategiedesign/scope.md`. Ordne jeden Befund nach „Fragen an den Auftraggeber“ zu.
2. Überarbeitete Stellen der Spezifikation: `git diff 2fd4197c4c21fb603fa2fe26b2825e43af619743 <zu prüfender Commit> -- development/strategiedesign/specification.md`. Prüfe, ob sie die geänderten Dokumente des Auftraggebers vollständig und richtig umsetzen und ob die geänderten Stellen neue Fehler enthalten. Der Änderungsnachweis der Spezifikation, erste Zeile, nennt die Stellen. Abschnitt 10 Punkt 20 ist neu.

Anlass: Einwände des Auftraggebers zu Abschnitt 10 Punkte 16, 17 und 19 der Spezifikation, Vermerk auf der letzten Folie von `development/strategiedesign/presentations/specification-2.html`.

Nicht Gegenstand: unveränderte Stellen, Glossar, Arbeitspaketplan, Code.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md`: Teil 1 ist ein erster Durchlauf zu den geänderten Stellen, Teil 2 prüft nur die überarbeiteten Stellen. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis. Eine Lücke ist nur mit gutem technischem Grund blockierend.
- `development/strategiedesign/scope.md` und die dort genannten Dokumente

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-9.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise, je Teil getrennt.
