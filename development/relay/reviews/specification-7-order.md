# Prüfauftrag Spezifikation, Durchlauf 7 (Nachprüfung)

- Vorhaben: `relay`
- Phase: 2 Konzeption, Nachprüfung nach `specification-6.md`
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, der diesen Prüfauftrag enthält (`git log -1 --format=%H -- development/relay/reviews/specification-7-order.md`); nenne ihn im Bericht vollständig
- vorheriger Prüfbericht: `development/relay/reviews/specification-6.md` (nicht bestanden, B1)

## Gegenstand

Dies ist eine Nachprüfung. Prüfe nur, ob B1 aus `specification-6.md` behoben ist (Einrichtung des Abrufs aus Sicht des Anwenders ohne Handarbeit an Dateien: E1, 4.7 neu, 6.1, 9) und ob die dafür und für die Hinweise geänderten Stellen neue Fehler enthalten, auch gegen Entwicklungsregeln Abschnitt 5 Nr. 15. Änderungen sichtbar mit `git diff 69b324edb7ff607d4798399771bf30eaf6105be3 <geprüfter Commit> -- development/relay/specification.md`; der letzte Eintrag des Änderungsnachweises und Abschnitt 10 nennen die Stellen.

Nicht Gegenstand: alle übrigen Stellen, Hinweise aus früheren Durchläufen (melde sie nicht erneut), der Plan, der Code.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- In `docs/technical/entwicklungsverfahren.md`: „Umfang der Prüfungen“ (Nachprüfung; nur blockierende Befunde verhindern das Bestehen; Hinweise in einer Zeile; höchstens etwa 60 Zeilen; die Nachprüfung nennt nur offene und neue Befunde), „Fragen an den Auftraggeber“
- `docs/technical/development-test-security-rules.md`, Abschnitt 5 Nr. 15
- `development/relay/scope.md`, `development/relay/wp01/acceptance/1.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt und einen konkreten Kritikpunkt oder eine Frage. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-7.md` in das Berichtsverzeichnis `work/relay/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
