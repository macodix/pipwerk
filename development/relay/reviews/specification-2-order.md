# Prüfauftrag Spezifikation, Durchlauf 2 (Nachprüfung)

- Vorhaben: `relay`
- Phase: 2 Konzeption
- Rolle: QA
- zu prüfender Stand: `main`, Commit `90ac2bd6937c6b8b66a23f3f2e2e3c780c00e59b`
- vorheriger Prüfbericht: `development/relay/reviews/specification-1.md` (nicht bestanden, geprüfter Commit `ec024e38a87127acd8752a5620c9b41904f5b003`)

## Gegenstand

Nachprüfung von `development/relay/specification.md`. Die Änderungen sind sichtbar mit `git diff ec024e38a87127acd8752a5620c9b41904f5b003 90ac2bd6937c6b8b66a23f3f2e2e3c780c00e59b -- development/relay/specification.md`; der Änderungsnachweis nennt sie.

Prüfe nur:

1. ob B1 (Schleife und Wiederholung, Abschnitt 4.1 Schritt 3) und B2 (weitere Wege ohne Änderung von Komponenten und vorhandenen Wegen, Abschnitt 3.4) behoben sind,
2. ob die dafür und für die Hinweise geänderten Stellen (E2, E3, E5, 3.4, 4.1, 6.1, 6.2, 7, 8) neue Fehler enthalten oder einer nicht geänderten Stelle oder den Dokumenten laut `development/relay/scope.md` widersprechen.

Nicht Gegenstand: nicht geänderte Stellen, außer eine geänderte widerspricht ihnen. Melde Hinweise aus Durchlauf 1 nicht erneut.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- In `docs/technical/entwicklungsverfahren.md`: „Umfang der Prüfungen“, „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“) und „Grenze der Durchläufe“. Dies ist eine Nachprüfung: nur offene und neue Befunde. Nur blockierende Befunde verhindern das Bestehen, alles andere ist ein Hinweis in einer Zeile. Höchstens etwa 60 Zeilen. Spezifikation legt nur Bausteine, Entscheidungen und Abnahmekriterien fest.
- `development/relay/scope.md` mit den dort genannten Anforderungsdokumenten

Nenne zu jedem Befund Fundstelle, Sachverhalt und einen konkreten Kritikpunkt oder eine Frage. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-2.md` in das Berichtsverzeichnis `work/relay/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
