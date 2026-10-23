# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 7

- Vorhaben: `backtest`
- Phase: 1 Anforderung, Rückkopplung aus der Abnahme von `wp02`, Versuch 2 ([Abnahmebericht](../wp02/acceptance/2.md))
- Rolle: QA
- zu prüfender Stand: `main`, Commit `d1943301dc121ddf21d8ef6d0dc761214531a52e`
- Vorheriger Durchlauf: [requirements-6.md](requirements-6.md), bestanden

## Gegenstand

Dies ist eine Prüfung beschränkt auf geänderte Stellen (Rückkopplung nach Phase 1). Prüfe nur, ob die geänderten Stellen Fehler enthalten: Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen und Umsetzungsdetails, auch Widersprüche zu nicht geänderten Stellen derselben Dokumente, zum Fachmodell, zum Glossar und zu den Testfällen laut `scope.md`.

Geänderte Stellen, sichtbar mit `git diff d1943301dc121ddf21d8ef6d0dc761214531a52e~1 d1943301dc121ddf21d8ef6d0dc761214531a52e -- docs/`:

- `docs/design/requirements/anforderungen-gesamtsystem.md`: req-system-025 (Löschen einer Reihe ganz oder für einen Zeitraum und der Angaben zu einem Instrument je Broker, nach Rückfrage), req-system-026 (beliebig viele Dateien in einem Vorgang, Größe einer Datei nur durch den Speicherplatz begrenzt, Fortschritt und Abbrechen)

Nicht Gegenstand:

- nicht geänderte Stellen, außer eine geänderte Stelle widerspricht ihnen
- der Abnahmebericht und die Mängel M1 bis M5 selbst. Wie Ansicht, Rückfrage, Fortschritt und Speicherung aussehen, ist Sache der Spezifikation.
- Spezifikation, Plan, Prototyp und technische Dokumente unter `docs/technical/` außer dem Glossar

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“, „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“ und „Lücken“) und „Grenze der Durchläufe“ in `docs/technical/entwicklungsverfahren.md`. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis in einer Zeile. Eine Lücke ist nur blockierend, wenn ohne sie Betrieb, Umsetzung oder Sicherheit der Software beeinträchtigt sind. Der Bericht umfasst höchstens etwa 60 Zeilen.
- `development/backtest/scope.md`

Ordne jeden Befund nach „Fragen an den Auftraggeber“ zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe.

Nenne zu jedem Befund Fundstelle (Datei und Kennung), Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-7.md` in das Berichtsverzeichnis `work/backtest/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
