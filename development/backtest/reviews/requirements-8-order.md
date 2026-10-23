# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 8

- Vorhaben: `backtest`
- Phase: 1 Anforderung, Rückkopplung aus der Abnahme von `wp02`, Versuch 2 ([Abnahmebericht](../wp02/acceptance/2.md), M5)
- Rolle: QA
- zu prüfender Stand: `main`, Commit `cae3e0d61d1c528740987e2d04d34446fce80c8e`
- Vorheriger Durchlauf: [requirements-7.md](requirements-7.md), bestanden

## Gegenstand

Dies ist eine Prüfung beschränkt auf geänderte Stellen (Rückkopplung nach Phase 1). Prüfe nur, ob die geänderten Stellen Fehler enthalten: Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen und Umsetzungsdetails, auch Widersprüche zu nicht geänderten Stellen derselben Dokumente, zum Fachmodell, zum Glossar und zu den Testfällen laut `scope.md`.

Geänderte Stelle, sichtbar mit `git diff cae3e0d61d1c528740987e2d04d34446fce80c8e~1 cae3e0d61d1c528740987e2d04d34446fce80c8e -- docs/`:

- `docs/design/requirements/anforderungen-gesamtsystem.md`, req-system-025: Löschen aller Daten eines Brokers in einem Vorgang; ein Broker ergibt sich aus seinen Daten und ist nach dem Löschen aller seiner Daten nicht mehr vorhanden.

Nicht Gegenstand:

- nicht geänderte Stellen, außer die geänderte Stelle widerspricht ihnen
- der Abnahmebericht und die Mängel selbst. Wie Ansicht und Rückfrage aussehen, ist Sache der Spezifikation.
- Spezifikation, Plan, Prototyp und technische Dokumente unter `docs/technical/` außer dem Glossar

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“, „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“ und „Lücken“) und „Grenze der Durchläufe“ in `docs/technical/entwicklungsverfahren.md`. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis in einer Zeile. Eine Lücke ist nur blockierend, wenn ohne sie Betrieb, Umsetzung oder Sicherheit der Software beeinträchtigt sind. Der Bericht umfasst höchstens etwa 60 Zeilen.
- `development/backtest/scope.md`

Ordne jeden Befund nach „Fragen an den Auftraggeber“ zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe.

Nenne zu jedem Befund Fundstelle (Datei und Kennung), Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-8.md` in das Berichtsverzeichnis `work/backtest/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
