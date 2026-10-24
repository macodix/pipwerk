# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 9

- Vorhaben: `backtest`
- Phase: 1 Anforderung, Rückkopplung: neue Anforderung des Auftraggebers vom 2026-10-24
- Rolle: QA
- zu prüfender Stand: `main`, Commit `da8c2966c8fb467c474a83251b9be395db5d9fb8`
- Vorheriger Durchlauf: [requirements-8.md](requirements-8.md), bestanden

## Gegenstand

Dies ist eine Prüfung beschränkt auf geänderte Stellen (Rückkopplung nach Phase 1). Prüfe nur, ob die geänderte Stelle Fehler enthält: Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen und Umsetzungsdetails, auch Widersprüche zu nicht geänderten Stellen derselben Dokumente, zum Fachmodell, zum Glossar und zu den Testfällen laut `scope.md`.

Geänderte Stelle, sichtbar mit `git diff da8c2966c8fb467c474a83251b9be395db5d9fb8~1 da8c2966c8fb467c474a83251b9be395db5d9fb8 -- docs/`:

- `docs/design/requirements/anforderungen-gesamtsystem.md`, req-system-028 (neu): sparsamer Umgang mit Speicherplatz; Daten, die eine Komponente nur für einen Vorgang anlegt, entfernt sie selbst, auch nach Abbruch, Fehler oder Absturz. Dazu der Eintrag im Änderungsnachweis vom 2026-10-24.

Nicht Gegenstand:

- nicht geänderte Stellen, außer die geänderte Stelle widerspricht ihnen
- wie die Anforderung umgesetzt wird (Formate, Aufräumverfahren, Grenzen des Platzbedarfs). Das ist Sache der Spezifikation.
- Spezifikation, Plan, Prototyp und technische Dokumente unter `docs/technical/` außer dem Glossar

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“, „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“ und „Lücken“) und „Grenze der Durchläufe“ in `docs/technical/entwicklungsverfahren.md`. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis in einer Zeile. Eine Lücke ist nur blockierend, wenn ohne sie Betrieb, Umsetzung oder Sicherheit der Software beeinträchtigt sind. Der Bericht umfasst höchstens etwa 60 Zeilen.
- `development/backtest/scope.md`

Ordne jeden Befund nach „Fragen an den Auftraggeber“ zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe.

Nenne zu jedem Befund Fundstelle (Datei und Kennung), Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-9.md` in das Berichtsverzeichnis `work/backtest/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
