# Prüfauftrag Spezifikation, Durchlauf 9 (Nachprüfung)

- Vorhaben: `strategiedesign`, ref `strategiedesign`
- Phase: 2
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, der diesen Prüfauftrag anlegt. Den vollständigen Commit liefert `git log -1 --format=%H -- development/strategiedesign/reviews/specification-9-order.md` auf `origin/main`.
- vorheriger Durchlauf: `development/strategiedesign/reviews/specification-8.md` auf Commit `33551f516126a952af5c8edfb9b1c9a0fbecb60e`, bestanden, Hinweise H1 bis H8

## Gegenstand

Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Sind H1 bis H8 erledigt, und enthalten die dafür geänderten Stellen neue Fehler? Maßstab ist `git diff 33551f516126a952af5c8edfb9b1c9a0fbecb60e <zu prüfender Commit> -- development/strategiedesign/specification.md`.

Erledigung laut Softwarearchitekt: Änderungsnachweis der Spezifikation, zweite Zeile, nennt zu jedem Hinweis die Stellen.

Nicht Gegenstand: Dokumente des Auftraggebers, Glossar, Arbeitspaketplan, Code, unveränderte Stellen, N4 und N10 aus `specification-7.md` (beim Projektleiter).

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md`: Dies ist eine Nachprüfung. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis.
- `development/strategiedesign/reviews/specification-8.md` und die dort genannten Grundlagen

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-9.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
