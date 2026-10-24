# Prüfauftrag Spezifikation, Durchlauf 13

- Vorhaben: `strategiedesign`, ref `strategiedesign`
- Phase: 2, Nachprüfung der Spezifikation vor der Vorlage beim Auftraggeber
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, der diesen Prüfauftrag anlegt. Den vollständigen Commit liefert `git log -1 --format=%H -- development/strategiedesign/reviews/specification-13-order.md` auf `origin/main`.
- vorheriger Durchlauf: `development/strategiedesign/reviews/specification-12.md`, nicht bestanden, geprüft auf Commit `bb5e5716eee7fe66d1198abe3ab3ec64c4df75ad`

## Gegenstand

Eine Nachprüfung, beschränkt auf diese Stellen:

- Ist B1 aus `specification-12.md` behoben? Geänderte Stellen: `git diff bb5e571 <zu prüfender Commit> -- development/strategiedesign/specification.md`, vor allem 3.3 „Stand einer Instanz“, dritter Punkt. Bilden `str-01`, `str-03` und die gesicherte „EMA-Trendfolge“ (3.7) damit ohne Fehler ab?
- Enthalten die für B1 und die Hinweise H1 bis H4 und H6 geänderten Stellen neue Fehler?

Nicht Gegenstand: alle übrigen Stellen der Spezifikation, die Dokumente des Auftraggebers, Glossar, Arbeitspaketplan, Prototyp, Code.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md`: Dies ist eine Nachprüfung. Prüfe nur die genannten Stellen. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis, je Hinweis eine Zeile. Nenne nur noch offene und neue Befunde.
- `development/strategiedesign/scope.md` und die dort genannten Dokumente

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-13.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
