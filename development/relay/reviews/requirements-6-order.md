# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 6 (Nachprüfung)

- Vorhaben: `relay`
- Phase: 2 Konzeption, erster Schritt: Nachprüfung der Dokumente des Auftraggebers vor der Überarbeitung der Spezifikation nach der Abnahme von `wp01`
- Rolle: QA
- zu prüfender Stand: `main`, Commit `5871ed93f1d26e96a50c3d53bfd0da58a8cd395d`
- vorheriger Prüfbericht: `development/relay/reviews/requirements-5.md` (bestanden)

## Gegenstand

Dies ist eine Nachprüfung, beschränkt auf die seit dem letzten Prüfbericht geänderten Stellen der Dokumente laut `development/relay/scope.md`. Sichtbar mit `git diff f0aa53ba82e618d5a19fa42b32e8136dc1db5685 5871ed93f1d26e96a50c3d53bfd0da58a8cd395d -- docs/design/requirements/anforderungen-nachrichtensystem.md docs/design/requirements/anforderungen-gesamtsystem.md development/relay/scope.md`.

Prüfe nur:

1. ob die Befunde aus `requirements-5.md` erledigt sind,
2. ob die geänderten Stellen (in den Anforderungen an das Gesamtsystem req-system-028, in den Anforderungen an das Nachrichtensystem der Status, in `scope.md` der Abschnitt „Stand“) einen Widerspruch zu req-relay-001 bis req-relay-013 oder zu req-system-005, req-system-026 und req-system-027 enthalten,
3. ob sich der Nachweis des Vorhabens laut `scope.md` weiterhin abbilden lässt.

Nicht Gegenstand: alle übrigen Stellen, die Anforderungen an den Strategietester, der Abnahmebericht `development/relay/wp01/acceptance/1.md` und seine Mängel (sie betreffen die Spezifikation, die der Softwarearchitekt danach überarbeitet), Präsentationen, Hinweise aus früheren Prüfberichten und als offen gekennzeichnete Punkte. Melde sie nicht erneut.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- In `docs/technical/entwicklungsverfahren.md`: „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“ und „Lücken“). Jeder weitere Durchlauf ist eine Nachprüfung. Nur blockierende Befunde verhindern das Bestehen, alles andere ist ein Hinweis in einer Zeile. Höchstens etwa 60 Zeilen.
- `development/relay/scope.md`

Ordne jeden Befund nach „Fragen an den Auftraggeber“ zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe. Nenne zu jedem Befund Fundstelle, Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-6.md` in das Berichtsverzeichnis `work/relay/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
