# Prüfauftrag Spezifikation, Durchlauf 11

- Vorhaben: `strategiedesign`, ref `strategiedesign/wp02`
- Phase: 4, Arbeitspaket `wp02`, rein technische Ergänzung der Spezifikation (Entwicklungsverfahren, Abschnitt „Meldungen“, Absatz zur Lücke in Phase 4)
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, der diesen Prüfauftrag anlegt. Den vollständigen Commit liefert `git log -1 --format=%H -- development/strategiedesign/reviews/specification-11-order.md` auf `origin/main`.
- vorheriger Durchlauf: `development/strategiedesign/reviews/specification-10.md`, bestanden

## Gegenstand

Eine Nachprüfung, beschränkt auf diese Stellen:

- Geänderte Stellen der Spezifikation: `git diff c63f37e <zu prüfender Commit> -- development/strategiedesign/specification.md`. Das sind 3.1 (Parameter `Instrument`, Tabelle „ohne Instanz“ und der Absatz darunter), Abschnitt 10 Punkt 19, Status und Änderungsnachweis (erste Zeile).
- Prüfe, ob sie das Fachmodell in der Fassung von Commit `d8077ed` (`git show d8077ed`, req-fach-010 und req-fach-051) vollständig und richtig umsetzen, ob die geänderten Stellen neue Fehler enthalten und ob die Spezifikation an anderer Stelle der geänderten Festlegung noch widerspricht.

Anlass: Hinweise T1-H1 und T1-H2 aus `specification-10.md`, vom Projektleiter im Fachmodell erledigt.

Nicht Gegenstand: alle übrigen Stellen der Spezifikation, das Fachmodell selbst, Glossar, Arbeitspaketplan, Code.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md`: Dies ist eine Nachprüfung. Prüfe nur die genannten Stellen. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis. Eine Lücke ist nur mit gutem technischem Grund blockierend.
- `development/strategiedesign/scope.md` und die dort genannten Dokumente

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-11.md` in das Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
