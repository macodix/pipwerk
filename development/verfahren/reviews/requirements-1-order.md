# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 1

- Vorhaben: `verfahren` (Entwicklungsverfahren verbessern)
- Phase: 2 Konzeption, Prüfung der Dokumente des Auftraggebers zu Beginn mit `specify`
- Rolle: QA
- zu prüfender Stand: `main`, Commit `b2ed4d6b14704836597ab91102b1d1144830a931`

Zu diesem Vorhaben gibt es keinen Prüfbericht aus Phase 1. Eine Nachprüfung ist deshalb nicht möglich. Dies ist der erste, vollständige Durchlauf.

## Gegenstand

Prüfe die Festlegungen 1 bis 7 des Auftraggebers in `development/verfahren/scope.md`, Abschnitt „Festlegungen des Auftraggebers“. Sie sind das Dokument des Auftraggebers für dieses Vorhaben.

1. Sind die Festlegungen untereinander widerspruchsfrei?
2. Lässt sich jede Festlegung umsetzen, ohne dass der Auftraggeber noch etwas entscheiden muss? Suche Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen und Umsetzungsdetails.
3. Widersprechen sie Stellen in `docs/technical/entwicklungsverfahren.md` und `docs/technical/agentenrollen-und-briefings.md`? Diese beiden Dokumente werden in diesem Vorhaben an die Festlegungen angepasst. Ein Widerspruch dort ist deshalb ein Befund der Gruppe „Folgt aus einer Festlegung“ oder „Sache der Spezifikation“, kein Befund gegen die Festlegung, außer die Festlegung selbst lässt mehrere Deutungen zu.

Nicht Gegenstand:

- der in `scope.md` unter „Offene Punkte des Auftraggebers“ genannte Punkt (Präsentationen und Ablauf der Abnahme). Er wird nicht als Befund gemeldet, außer eine Festlegung ist ohne ihn nicht umsetzbar.
- die Anforderungsdokumente der Software unter `docs/design/requirements/`. Das Vorhaben ändert pipwerk nicht.
- technische Einzelheiten der Umsetzung (Skripte, Dateiformate, Abstände). Sie entscheidet die Spezifikation.

## Prüfgrundlagen

- Briefing QA, Phase 1, in `docs/technical/agentenrollen-und-briefings.md`
- In `docs/technical/entwicklungsverfahren.md`: „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“ und „Lücken“). Dies ist der erste Durchlauf: Melde alle Befunde auf einmal. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis, je Hinweis eine Zeile. Eine Lücke ist nur blockierend, wenn ohne sie Betrieb, Umsetzung oder Sicherheit beeinträchtigt sind. Der Bericht umfasst höchstens etwa 60 Zeilen.
- `development/verfahren/scope.md`

Ordne jeden Befund nach „Fragen an den Auftraggeber“ zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe.

Nenne zu jedem Befund Fundstelle, Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-1.md` in das Berichtsverzeichnis `work/verfahren/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
