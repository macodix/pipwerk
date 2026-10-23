# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 3 (Nachprüfung)

- Vorhaben: `relay`
- Phase: 1 Anforderung, Nachprüfung geänderter Stellen nach der Abstimmung der Präsentation
- Rolle: QA
- zu prüfender Stand: `main`, Commit `75af0d53cc7146f783c186b391a857845ddd7fed`
- vorheriger Prüfbericht: `development/relay/reviews/requirements-2.md` (bestanden, geprüfter Commit `2736fa181ea1b072c2e80bbb7f58a9ed7f24ed49`)

## Gegenstand

Dies ist eine Nachprüfung, beschränkt auf die geänderten Stellen. Der Auftraggeber hat bei der Abstimmung der Präsentation festgelegt: Auch zwischen Komponente und Relay laufen Nachrichten über einen austauschbaren Übertragungsweg (`development/relay/scope.md`, Abschnitt „Stand“, letzter Eintrag).

Geänderte Stellen (nachvollziehbar mit `git diff 0383393c5e8f8d45df3b947f83a6d0285fa3020b~1 75af0d53cc7146f783c186b391a857845ddd7fed`):

- `docs/design/requirements/anforderungen-nachrichtensystem.md`: req-relay-002, req-relay-003, Änderungsnachweis
- `docs/technical/glossar.md`: Eintrag Übertragungsweg, Änderungsnachweis

Prüfe nur:

1. ob req-relay-002 und req-relay-003 die Festlegung eindeutig wiedergeben,
2. ob sie neue Widersprüche zu den übrigen Anforderungen an das Nachrichtensystem (insbesondere req-relay-001, req-relay-004, req-relay-006), zum Glossar oder zu `development/relay/scope.md` enthalten,
3. ob sich der Nachweis des Vorhabens laut `scope.md` weiterhin abbilden lässt.

Nicht Gegenstand: alle übrigen Stellen, die Präsentation, die Hinweise aus `requirements-1.md` und `requirements-2.md` und die als offen gekennzeichneten Punkte. Melde sie nicht erneut.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- In `docs/technical/entwicklungsverfahren.md`: Phase 1, „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“ und „Lücken“). Beachte besonders: Jeder weitere Durchlauf ist eine Nachprüfung. Nur blockierende Befunde verhindern das Bestehen, alles andere ist ein Hinweis in einer Zeile. Höchstens etwa 60 Zeilen.
- `development/relay/scope.md`

Ordne jeden Befund nach „Fragen an den Auftraggeber“ zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe. Nenne zu jedem Befund Fundstelle, Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-3.md` in das Berichtsverzeichnis `work/relay/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
