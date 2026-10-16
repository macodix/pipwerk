# Prüfauftrag Arbeitspaketplan, Durchlauf 2 (Nachprüfung)

- Vorhaben: `strategiedesign`
- Phase: 3 Planung
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, mit dem dieser Prüfauftrag auf `main` gekommen ist. Nenne ihn vollständig im Bericht.
- Vergleichsstand: `cf61a6675e4debea316894aefd3b0bd04f86badb` (Stand von Durchlauf 1)

## Gegenstand

`development/strategiedesign/plan.md`, nur die Stellen, die seit dem Vergleichsstand für die Hinweise P1 bis P9 aus `development/strategiedesign/reviews/plan-1.md` geändert wurden. Maßstab ist `git diff cf61a6675e4debea316894aefd3b0bd04f86badb <geprüfter Commit> -- development/strategiedesign/plan.md`. Die Zuordnung der Änderungen zu den Hinweisen steht im Änderungsnachweis des Plans.

## Umfang der Nachprüfung

1. Prüfe, ob die Hinweise P1 bis P9 erledigt sind.
2. Prüfe, ob die geänderten Stellen neue Fehler enthalten, auch Widersprüche zu nicht geänderten Stellen des Plans, zur Spezifikation und zu den Dokumenten laut `scope.md`.
3. Prüfe, ob jedes geänderte Abnahmekriterium vom Auftraggeber in der Testumgebung selbst geprüft werden kann.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Dies ist eine Nachprüfung, beschränkt auf die geänderten Stellen. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis. Testdetails, vollständige Listen von Kennungen, Grenzwerte und Formulierungen gehören in die Aufträge.
- `development/strategiedesign/reviews/plan-1.md`, `development/strategiedesign/specification.md`, `development/strategiedesign/scope.md` und die dort genannten Dokumente

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `plan-2.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, den Stand jedes Hinweises P1 bis P9, alle neuen Befunde und getrennt davon die Hinweise.
