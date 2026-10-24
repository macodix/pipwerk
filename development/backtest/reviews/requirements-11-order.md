# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 11

- Vorhaben: `backtest`
- Phase: 1 Anforderung, Rückkopplung: neue Anforderung des Auftraggebers vom 2026-10-24
- Rolle: QA
- zu prüfender Stand: `main`, Commit `aa8617c41cf5a4d60b7c6af70962fe3a6425059b`
- Vorheriger Durchlauf: [requirements-10.md](requirements-10.md), bestanden

## Gegenstand

Dies ist eine Prüfung beschränkt auf geänderte Stellen (Rückkopplung nach Phase 1). Prüfe nur, ob die geänderten Stellen Fehler enthalten: Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen und Umsetzungsdetails, auch Widersprüche zu nicht geänderten Stellen derselben Dokumente, zum Anforderungsdokument des Gesamtsystems (besonders req-system-016 und req-system-028), zum Fachmodell, zum Glossar und zu den Testfällen laut `scope.md`.

Geänderte Stellen, sichtbar mit `git diff aa8617c41cf5a4d60b7c6af70962fe3a6425059b~1 aa8617c41cf5a4d60b7c6af70962fe3a6425059b -- docs/`:

- `docs/design/requirements/anforderungen-strategietester.md`: req-test-009 (neu) Einstellungsbereich mit Voreinstellungen für Import und Export; offener Punkt 2 (Aufbau und Gestaltung); Status und Änderungsnachweis.

Nicht Gegenstand:

- nicht geänderte Stellen, außer die geänderten Stellen widersprechen ihnen
- der als offen gekennzeichnete Aufbau und die Gestaltung des Einstellungsbereichs
- wie die Anforderung umgesetzt wird. Das ist Sache der Spezifikation.
- Spezifikation, Plan, Prototyp und technische Dokumente unter `docs/technical/` außer dem Glossar

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“, „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“ und „Lücken“) und „Grenze der Durchläufe“ in `docs/technical/entwicklungsverfahren.md`. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis in einer Zeile. Eine Lücke ist nur blockierend, wenn ohne sie Betrieb, Umsetzung oder Sicherheit der Software beeinträchtigt sind. Der Bericht umfasst höchstens etwa 60 Zeilen.
- `development/backtest/scope.md`

Ordne jeden Befund nach „Fragen an den Auftraggeber“ zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe.

Nenne zu jedem Befund Fundstelle (Datei und Kennung), Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-11.md` in das Berichtsverzeichnis `work/backtest/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
