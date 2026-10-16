# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 6 (Nachprüfung)

- Vorhaben: `strategiedesign`
- Phase: 2 Konzeption, Nachprüfung der Dokumente des Auftraggebers
- Rolle: QA
- zu prüfender Stand: `main`, Commit `d0d888cac5ec9b5332d09a0c8dded8da9a8fbcae`

## Gegenstand

Nachprüfung der Dokumente laut `development/strategiedesign/scope.md`, Abschnitt „Geltende Dokumente“:

- `docs/design/requirements/anforderungen-gesamtsystem.md`
- `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/domain/fachmodell.md`
- `docs/design/domain/indikator-markttechnik.md`
- `docs/design/strategies/str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md` (Testfall `str-01`)
- `docs/design/strategies/str-03-fachlich-ema-trendfolge.md` (Testfall `str-03`)

Anlass: Der Prüfbericht Durchlauf 5 (`development/strategiedesign/reviews/requirements-5.md`, geprüfter Commit `737541a294355d7a77788b76164191fd0297e7a9`) war nicht bestanden: blockierend N8, dazu die Hinweise H13 bis H18. N8 ging auf eine Bearbeitung des Projektleiters zurück und ist von ihm korrigiert. Die Hinweise hat er laut seiner Meldung bearbeitet.

Die Meldung des Projektleiters verweist für seine Bearbeitung auf `development/strategiedesign/reviews/requirements-5-response.md`. Diese Datei liegt auf `main` nicht vor. Die Commit-Nachricht von `d0d888c` nennt außerdem Änderungen an `docs/technical/glossar.md` und `scope.md`, der Commit enthält sie nicht. Maßstab der Bearbeitung ist deshalb der Inhalt der Änderungen selbst, also `git diff 737541a294355d7a77788b76164191fd0297e7a9 d0d888cac5ec9b5332d09a0c8dded8da9a8fbcae -- docs/design docs/technical/glossar.md development/strategiedesign/scope.md`, zusammen mit den Einträgen vom 2026-10-16 (Durchlauf 5) in den Änderungsnachweisen von Fachmodell und Anforderungen an den Strategiedesigner.

## Umfang der Nachprüfung

1. Prüfe, ob N8 erledigt ist. Maßstab sind die geänderten Stellen und der Grundsatz des Auftraggebers „keine Einschränkung ohne klare Notwendigkeit“ (`requirements-2-response.md`).
2. Prüfe für H13 bis H18, ob sie bearbeitet sind. Ein Hinweis ist kein blockierender Befund.
3. Prüfe, ob die geänderten Stellen neue Fehler enthalten: Widersprüche, auch zu nicht geänderten Stellen wie dem Glossar, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen, Umsetzungsdetails.
4. Prüfe für die geänderten Stellen, ob sich beide Testfälle weiterhin vollständig mit den beschriebenen Objekten und Arbeitsabläufen gestalten, speichern und wieder laden lassen.
5. Neue Befunde an unveränderten Stellen meldest du nur, wenn sie einer Anforderung widersprechen oder die Gestaltung, das Speichern oder das Laden eines Testfalls verhindern.

Nicht Gegenstand:

- `docs/design/requirements/anforderungen-handelssystem.md` und die Stellen des Fachmodells, die die Ausführung von Strategien betreffen (Debuggen, Testen, Handeln)
- die Vorlagen unter `docs/design/planning/`
- die in `scope.md` unter „Offene Punkte des Auftraggebers“ und in den Dokumenten ausdrücklich als offen gekennzeichneten Punkte. Ein Befund ist es nur, wenn ein solcher Punkt doch für Gestaltung, Speichern oder Laden eines Testfalls nötig ist.
- die Frage, ob die Prüfschleife eine Ebene höher geht. Das entscheidet nicht die QA.

## Prüfgrundlagen

- Briefing QA, Phase 2 Nachprüfung, in `docs/technical/agentenrollen-und-briefings.md`
- Phase 2 und „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Dies ist eine Nachprüfung. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis.
- `development/strategiedesign/scope.md`
- `development/strategiedesign/reviews/requirements-5.md`

Nenne zu jedem Befund Fundstelle (Datei und Abschnitt oder Kennung), Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-6.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, für N8 „erledigt“ oder nicht, für H13 bis H18 jeweils „bearbeitet“ oder nicht, alle neuen Befunde und getrennt davon die Hinweise.
