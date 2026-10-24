# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 5 (Nachprüfung)

- Vorhaben: `relay`
- Phase: 1 Anforderung, Nachprüfung einer neuen Anforderung nach der Abstimmung der Präsentation der Spezifikation
- Rolle: QA
- zu prüfender Stand: `main`, Commit `f0aa53ba82e618d5a19fa42b32e8136dc1db5685`
- vorheriger Prüfbericht: `development/relay/reviews/requirements-4.md` (bestanden)

## Gegenstand

Dies ist eine Nachprüfung, beschränkt auf die geänderten Stellen. Der Auftraggeber hat bei der Abstimmung der Präsentation `development/relay/presentations/specification-1.html` eine Empfangsbestätigung auf Wunsch des Absenders festgelegt (req-relay-013 neu; `development/relay/scope.md`, Abschnitt „Stand“, letzter Eintrag).

Geänderte Stellen (nachvollziehbar mit `git show 8452354e09cbcb7c69f453ba9b1239299b5f116a` und `git show f0aa53ba82e618d5a19fa42b32e8136dc1db5685`):

- `docs/design/requirements/anforderungen-nachrichtensystem.md`: Status, req-relay-013 (neu), Änderungsnachweis
- `development/relay/scope.md`: Abschnitt „Stand“

Prüfe nur:

1. ob req-relay-013 die Festlegung eindeutig wiedergibt und ob es Widersprüche zu den übrigen Anforderungen an das Nachrichtensystem enthält, insbesondere req-relay-002, req-relay-005, req-relay-008 und req-relay-012, sowie zum Aufbau einer Nachricht in den Anforderungen an das Handelssystem req-grund-003 bis req-grund-006,
2. ob sich der Nachweis des Vorhabens laut `development/relay/scope.md` weiterhin abbilden lässt.

Nicht Gegenstand: alle übrigen Stellen, die Präsentationen, die Hinweise aus früheren Prüfberichten und die als offen gekennzeichneten Punkte. Melde sie nicht erneut. Die Spezifikation ist nicht Gegenstand; der Softwarearchitekt ergänzt sie nach dieser Prüfung. Wie die Empfangsbestätigung technisch umgesetzt wird (zum Beispiel Kennzeichen in der Nachricht, Nachrichtenart, Länge der Frist), ist Sache der Spezifikation und kein blockierender Befund.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- In `docs/technical/entwicklungsverfahren.md`: Phase 1, „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“ und „Lücken“). Beachte besonders: Jeder weitere Durchlauf ist eine Nachprüfung. Nur blockierende Befunde verhindern das Bestehen, alles andere ist ein Hinweis in einer Zeile. Höchstens etwa 60 Zeilen.
- `development/relay/scope.md`

Ordne jeden Befund nach „Fragen an den Auftraggeber“ zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe. Nenne zu jedem Befund Fundstelle, Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-5.md` in das Berichtsverzeichnis `work/relay/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
