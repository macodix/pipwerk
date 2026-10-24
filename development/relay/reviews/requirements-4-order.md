# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 4 (Nachprüfung)

- Vorhaben: `relay`
- Phase: 1 Anforderung, Nachprüfung geänderter Stellen nach der Abstimmung der Präsentation der Spezifikation
- Rolle: QA
- zu prüfender Stand: `main`, Commit `11752e98abb25f42b24d36b3b5fce773193d952c`
- vorheriger Prüfbericht: `development/relay/reviews/requirements-3.md` (bestanden)

## Gegenstand

Dies ist eine Nachprüfung, beschränkt auf die geänderten Stellen. Der Auftraggeber hat bei der Abstimmung der Präsentation `development/relay/presentations/specification-1.html` festgelegt: Dateien werden als Anlage der Nachricht oder über einen eigenen Weg für Dateien übertragen (req-relay-012 neu), und „Abruf“ ersetzt „Beschaffung“ (`development/relay/scope.md`, Abschnitt „Stand“, letzter Eintrag).

Geänderte Stellen (nachvollziehbar mit `git diff 11752e98abb25f42b24d36b3b5fce773193d952c~1 11752e98abb25f42b24d36b3b5fce773193d952c`):

- `docs/design/requirements/anforderungen-nachrichtensystem.md`: Status, req-relay-005, req-relay-012 (neu), req-relay-007, Änderungsnachweis
- `docs/design/requirements/anforderungen-gesamtsystem.md`: req-system-027, Änderungsnachweis
- `docs/design/requirements/anforderungen-strategietester.md`: Abschnitt 1, req-test-001, req-test-003, Änderungsnachweis
- `docs/technical/glossar.md`: Eintrag Abruf, Änderungsnachweis
- `development/relay/scope.md`, `development/backtest/scope.md`: Bezeichnung

Prüfe nur:

1. ob req-relay-012 die Festlegung eindeutig wiedergibt und ob es neue Widersprüche zu den übrigen Anforderungen an das Nachrichtensystem enthält, insbesondere req-relay-002, req-relay-003, req-relay-007 und req-relay-010,
2. ob „Beschaffung“ an allen Stellen der geltenden Dokumente laut `development/relay/scope.md`, im Strategietester, im Glossar und in beiden `scope.md` vollständig und ohne Sinnänderung durch „Abruf“ ersetzt ist,
3. ob sich der Nachweis des Vorhabens laut `development/relay/scope.md` weiterhin abbilden lässt.

Nicht Gegenstand: alle übrigen Stellen, die Präsentationen, die Hinweise aus früheren Prüfberichten und die als offen gekennzeichneten Punkte. Melde sie nicht erneut. Die technischen Dokumente der Vorhaben (Spezifikationen, Pläne) sind nicht Gegenstand; der Softwarearchitekt passt sie nach dieser Prüfung an.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- In `docs/technical/entwicklungsverfahren.md`: Phase 1, „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“ und „Lücken“). Beachte besonders: Jeder weitere Durchlauf ist eine Nachprüfung. Nur blockierende Befunde verhindern das Bestehen, alles andere ist ein Hinweis in einer Zeile. Höchstens etwa 60 Zeilen.
- `development/relay/scope.md`

Ordne jeden Befund nach „Fragen an den Auftraggeber“ zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe. Nenne zu jedem Befund Fundstelle, Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-4.md` in das Berichtsverzeichnis `work/relay/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
