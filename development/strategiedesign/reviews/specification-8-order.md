# Prüfauftrag Spezifikation, Durchlauf 8 (Nachprüfung)

- Vorhaben: `strategiedesign`, ref `strategiedesign`
- Phase: 2
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, der diesen Prüfauftrag anlegt. Den vollständigen Commit liefert `git log -1 --format=%H -- development/strategiedesign/reviews/specification-8-order.md` auf `origin/main`.
- vorheriger Durchlauf: `development/strategiedesign/reviews/specification-7.md` auf Commit `7e98ac51cd72e70d9a560bcbfda17a671c364d3f`, bestanden, Hinweise N1 bis N22

## Gegenstand

Nachprüfung nach „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Sind die eingearbeiteten Hinweise erledigt, und enthalten die dafür geänderten Stellen neue Fehler? Maßstab ist `git diff 7e98ac51cd72e70d9a560bcbfda17a671c364d3f <zu prüfender Commit> -- development/strategiedesign/specification.md`.

Erledigung laut Softwarearchitekt: Änderungsnachweis der Spezifikation, zweite Zeile, nennt zu jedem Hinweis die Stellen. Eingearbeitet sind N1 bis N3, N5 bis N9 und N11 bis N22. N4 und N10 betreffen Dokumente des Auftraggebers und liegen beim Projektleiter; sie sind nicht Gegenstand.

Nicht Gegenstand: Dokumente des Auftraggebers, Glossar, Arbeitspaketplan, Code, unveränderte Stellen.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md`: Dies ist eine Nachprüfung. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis.
- `development/strategiedesign/reviews/specification-7.md` und die dort genannten Grundlagen

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-8.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
