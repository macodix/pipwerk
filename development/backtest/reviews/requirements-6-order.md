# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 6

- Vorhaben: `backtest`
- Phase: 1 Anforderung, Rückkopplung aus der Abnahme von `wp02` ([Abnahmebericht](../wp02/acceptance/1.md))
- Rolle: QA
- zu prüfender Stand: `main`, Commit `95d5bda70e36ebacc3d00cf94c9a2d0352e1a34d`
- Vorheriger Durchlauf: [requirements-5.md](requirements-5.md), bestanden

## Gegenstand

Dies ist eine Prüfung beschränkt auf geänderte Stellen (Rückkopplung nach Phase 1). Prüfe nur, ob die geänderten Stellen Fehler enthalten: Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen und Umsetzungsdetails, auch Widersprüche zu nicht geänderten Stellen derselben Dokumente, zum Fachmodell und zu den Testfällen laut `scope.md`.

Geänderte Stellen, sichtbar mit `git diff 95d5bda70e36ebacc3d00cf94c9a2d0352e1a34d~1 95d5bda70e36ebacc3d00cf94c9a2d0352e1a34d`:

- `docs/design/requirements/anforderungen-gesamtsystem.md`: req-system-026 (Import mehrerer Dateien in einem Vorgang), req-system-027 (Austausch über pipwerk relay, Broker als Name des Handelsservers, Übergangslösung)
- `docs/design/requirements/anforderungen-strategietester.md`: req-test-003 (keine automatische Beschaffung bis pipwerk relay)

Nicht Gegenstand:

- nicht geänderte Stellen, außer eine geänderte Stelle widerspricht ihnen
- der Abnahmebericht und die Mängel M1 bis M4 selbst. Wie Ansicht, Dialog und Programm aussehen, ist Sache der Spezifikation.
- Spezifikation, Plan, Prototyp und technische Dokumente unter `docs/technical/` außer dem Glossar

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“, „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“ und „Lücken“) und „Grenze der Durchläufe“ in `docs/technical/entwicklungsverfahren.md`. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis in einer Zeile. Eine Lücke ist nur blockierend, wenn ohne sie Betrieb, Umsetzung oder Sicherheit der Software beeinträchtigt sind. Der Bericht umfasst höchstens etwa 60 Zeilen.
- `development/backtest/scope.md`

Ordne jeden Befund nach „Fragen an den Auftraggeber“ zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe.

Nenne zu jedem Befund Fundstelle (Datei und Kennung), Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-6.md` in das Berichtsverzeichnis `work/backtest/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
