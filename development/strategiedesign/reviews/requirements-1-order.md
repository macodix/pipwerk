# Prüfauftrag Anforderungsdokumente, Durchlauf 1

- Vorhaben: `strategiedesign`
- Phase: 2 Konzeption, Prüfung der Anforderungsdokumente
- Rolle: QA
- zu prüfender Stand: `main`, Commit `e9d5b044735bfaf90369ef4b3d9ceaf76b61ed22`

## Gegenstand

Prüfe die Dokumente laut `development/strategiedesign/scope.md`, Abschnitt „Geltende Dokumente“:

Anforderungsdokumente:

- `docs/design/requirements/anforderungen-gesamtsystem.md`
- `docs/design/requirements/anforderungen-strategiedesigner.md`, einschließlich seiner Widerspruchsfreiheit zum Anforderungsdokument des Gesamtsystems

Fachmodell und Strategiebeschreibungen des Auftraggebers, ebenfalls auf Widersprüche, Lücken und mehrdeutige Begriffe sowie auf Widerspruchsfreiheit untereinander und zu den Anforderungsdokumenten:

- `docs/design/domain/fachmodell.md`
- `docs/design/domain/indikator-markttechnik.md`
- `docs/design/strategies/str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md` (Testfall `str-01`)
- `docs/design/strategies/str-03-fachlich-ema-trendfolge.md` (Testfall `str-03`)

Nachweis des Vorhabens ist, dass sich jeder der beiden Testfälle vollständig im Strategiedesigner gestalten, speichern und wieder laden lässt. Prüfe deshalb auch, ob Anforderungsdokumente und Fachmodell alles beschreiben, was dafür nötig ist, und nenne jede Stelle eines Testfalls, die sich mit den beschriebenen Objekten und Abläufen nicht abbilden lässt.

Nicht Gegenstand:

- `docs/design/requirements/anforderungen-handelssystem.md` und die Stellen des Fachmodells, die dorthin verweisen und die Ausführung von Strategien betreffen (Debuggen, Testen, Handeln)
- die Vorlagen unter `docs/design/planning/`; sie sind keine Festlegung
- die in `scope.md` unter „Offene Punkte des Auftraggebers“ genannten, in den Dokumenten als offen gekennzeichneten Punkte. Sie werden nicht erneut als Befund gemeldet. Ein Befund ist es, wenn ein solcher Punkt doch für Gestaltung, Speichern oder Laden eines Testfalls nötig ist oder in den Dokumenten nicht als offen gekennzeichnet ist.

## Prüfgrundlagen

- Briefing QA, Phase 2 Anforderungsdokumente, in `docs/technical/agentenrollen-und-briefings.md`
- Phase 2 in `docs/technical/entwicklungsverfahren.md`
- `development/strategiedesign/scope.md`

Suche Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen und Umsetzungsdetails. Nenne zu jedem Befund Fundstelle (Datei und Abschnitt oder Kennung), Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `requirements-1.md` in dein Arbeitsverzeichnis `work/strategiedesign/qa/` im Entwicklungsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde.
