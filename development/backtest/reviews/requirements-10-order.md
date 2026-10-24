# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 10

- Vorhaben: `backtest`
- Phase: 1 Anforderung, Rückkopplung: Ergänzung der neuen Anforderung req-system-028 am 2026-10-24
- Rolle: QA
- zu prüfender Stand: `main`, Commit `d1ec3cc10f06408e45365bef90f4782695bf4655`
- Vorheriger Durchlauf: [requirements-9.md](requirements-9.md), bestanden (erste Fassung von req-system-028)

## Gegenstand

Dies ist eine Prüfung beschränkt auf geänderte Stellen (Rückkopplung nach Phase 1). Prüfe nur, ob die geänderten Stellen Fehler enthalten: Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen und Umsetzungsdetails, auch Widersprüche zu nicht geänderten Stellen derselben Dokumente, zum Fachmodell, zum Glossar und zu den Testfällen laut `scope.md`.

Geänderte Stellen, sichtbar mit `git diff d1ec3cc10f06408e45365bef90f4782695bf4655~1 d1ec3cc10f06408e45365bef90f4782695bf4655 -- docs/`:

- `docs/design/requirements/anforderungen-gesamtsystem.md`, req-system-028, zwei neue Absätze: effizientestes Format, wo pipwerk es festlegt, mit Begründung in der Spezifikation; genau eine Ablageform je Komponente, für Kursdaten der Datenbestand; beim Import Wahl des Anwenders, ob die Dateien behalten werden, behaltene Dateien in einem Ablageverzeichnis mit Pflege durch den Anwender. Dazu der Eintrag im Änderungsnachweis.

Nicht Gegenstand:

- der übrige Text von req-system-028 (in Durchlauf 9 bestanden), außer die neuen Absätze widersprechen ihm
- nicht geänderte Stellen, außer die geänderten Stellen widersprechen ihnen
- wie die Anforderung umgesetzt wird (Formate, Ort des Ablageverzeichnisses, Bedienung). Das ist Sache der Spezifikation.
- Spezifikation, Plan, Prototyp und technische Dokumente unter `docs/technical/` außer dem Glossar

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“, „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“ und „Lücken“) und „Grenze der Durchläufe“ in `docs/technical/entwicklungsverfahren.md`. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis in einer Zeile. Eine Lücke ist nur blockierend, wenn ohne sie Betrieb, Umsetzung oder Sicherheit der Software beeinträchtigt sind. Der Bericht umfasst höchstens etwa 60 Zeilen.
- `development/backtest/scope.md`

Ordne jeden Befund nach „Fragen an den Auftraggeber“ zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe.

Nenne zu jedem Befund Fundstelle (Datei und Kennung), Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-10.md` in das Berichtsverzeichnis `work/backtest/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
