# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 7 (Nachprüfung)

- Vorhaben: `strategiedesign`
- Phase: 2 Konzeption, Nachprüfung der Dokumente des Auftraggebers
- Rolle: QA
- zu prüfender Stand: `main`, Commit `15fcc2e511277baf7601a5ff6a1b9de7fb121584`

## Gegenstand

Nachprüfung der Dokumente laut `development/strategiedesign/scope.md`, Abschnitt „Geltende Dokumente“:

- `docs/design/requirements/anforderungen-gesamtsystem.md`
- `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/domain/fachmodell.md`
- `docs/design/domain/indikator-markttechnik.md`
- `docs/design/strategies/str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md` (Testfall `str-01`)
- `docs/design/strategies/str-03-fachlich-ema-trendfolge.md` (Testfall `str-03`)

Anlass: Der Prüfbericht Durchlauf 6 (`development/strategiedesign/reviews/requirements-6.md`, geprüfter Commit `d0d888cac5ec9b5332d09a0c8dded8da9a8fbcae`) war nicht bestanden: blockierend N9 und N10, dazu die Hinweise H19 bis H22. Die Bearbeitung steht in `development/strategiedesign/reviews/requirements-6-response.md`. N9 und N10 hat der Auftraggeber entschieden: req-core-002 ist auf die fachliche Festlegung zurückgeführt, die Abbildung im fachlichen Ausdruck der Regelvorlage legt die Spezifikation fest.

Maßstab der Bearbeitung sind die Änderungen selbst: `git diff d0d888cac5ec9b5332d09a0c8dded8da9a8fbcae 15fcc2e511277baf7601a5ff6a1b9de7fb121584 -- docs/design docs/technical/glossar.md development/strategiedesign/scope.md`, zusammen mit den Einträgen zu Durchlauf 6 in den Änderungsnachweisen von Fachmodell und Anforderungen an den Strategiedesigner.

## Umfang der Nachprüfung

1. Prüfe, ob N9 und N10 erledigt sind. Maßstab ist die Entscheidung des Auftraggebers in `requirements-6-response.md`: Die Dokumente des Auftraggebers legen die Regelvorlage „Risiko je Trade“ nur fachlich fest, die Abbildung im Ausdruck für Orders, Positionen und Ordertypen ist ausdrücklich der Spezifikation zugewiesen. Erledigt heißt: Die Dokumente enthalten an diesen Stellen keinen Widerspruch mehr, der eine solche Abbildung ausschließt. Wie die Spezifikation sie festlegt, ist nicht Gegenstand dieser Prüfung.
2. Prüfe für H19 bis H22, ob sie bearbeitet oder begründet verworfen sind. Ein Hinweis ist kein blockierender Befund.
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
- `development/strategiedesign/reviews/requirements-6.md`
- `development/strategiedesign/reviews/requirements-6-response.md`

Nenne zu jedem Befund Fundstelle (Datei und Abschnitt oder Kennung), Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-7.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, für N9 und N10 jeweils „erledigt“ oder nicht, für H19 bis H22 jeweils „bearbeitet“, „verworfen“ oder nicht, alle neuen Befunde und getrennt davon die Hinweise.
