# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 2 (Nachprüfung)

- Vorhaben: `strategiedesign`
- Phase: 2 Konzeption, Nachprüfung der Dokumente des Auftraggebers
- Rolle: QA
- zu prüfender Stand: `main`, Commit `77dc527d7f411f7ae0470de98d75b600f964a283`

## Gegenstand

Nachprüfung der Dokumente laut `development/strategiedesign/scope.md`, Abschnitt „Geltende Dokumente“:

- `docs/design/requirements/anforderungen-gesamtsystem.md`
- `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/domain/fachmodell.md`
- `docs/design/domain/indikator-markttechnik.md`
- `docs/design/strategies/str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md` (Testfall `str-01`)
- `docs/design/strategies/str-03-fachlich-ema-trendfolge.md` (Testfall `str-03`)

Anlass: Der Prüfbericht Durchlauf 1 (`development/strategiedesign/reviews/requirements-1.md`, geprüfter Commit `e9d5b044735bfaf90369ef4b3d9ceaf76b61ed22`) war nicht bestanden, 43 Befunde. Der Projektleiter hat 18 Befunde selbst korrigiert, die übrigen hat der Auftraggeber in 20 Fragen entschieden. Bearbeitung und Entscheidungen stehen in `development/strategiedesign/reviews/requirements-1-response.md`, die Präsentation mit Vermerk der Bestätigung in `development/strategiedesign/presentations/requirements-1.html`.

## Umfang der Nachprüfung

1. Prüfe für jeden Befund aus Durchlauf 1, ob er erledigt ist: durch die Korrektur des Projektleiters oder durch die Einarbeitung der Entscheidung des Auftraggebers laut `requirements-1-response.md`. Maßstab ist die Entscheidung, nicht der Vorschlag aus der Präsentation.
2. Prüfe, ob die dafür geänderten Stellen neue Fehler enthalten: Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen, Umsetzungsdetails. Die Änderungen zeigt `git diff e9d5b044735bfaf90369ef4b3d9ceaf76b61ed22 77dc527d7f411f7ae0470de98d75b600f964a283 -- docs/design docs/technical/glossar.md`.
3. Prüfe für die geänderten Stellen, ob sich beide Testfälle weiterhin vollständig mit den beschriebenen Objekten und Arbeitsabläufen abbilden lassen.
4. Neue Befunde an unveränderten Stellen meldest du nur, wenn sie einer Anforderung widersprechen oder die Gestaltung, das Speichern oder das Laden eines Testfalls verhindern.

Nicht Gegenstand:

- `docs/design/requirements/anforderungen-handelssystem.md` und die Stellen des Fachmodells, die die Ausführung von Strategien betreffen (Debuggen, Testen, Handeln)
- die Vorlagen unter `docs/design/planning/`
- die in `scope.md` unter „Offene Punkte des Auftraggebers“ genannten, in den Dokumenten als offen gekennzeichneten Punkte. Ein Befund ist es nur, wenn ein solcher Punkt doch für Gestaltung, Speichern oder Laden eines Testfalls nötig ist oder in den Dokumenten nicht als offen gekennzeichnet ist.

## Prüfgrundlagen

- Briefing QA, Phase 2 Nachprüfung, in `docs/technical/agentenrollen-und-briefings.md`
- Phase 2 und „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Dies ist eine Nachprüfung. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis.
- `development/strategiedesign/scope.md`
- `development/strategiedesign/reviews/requirements-1.md` und `requirements-1-response.md`

Nenne zu jedem Befund Fundstelle (Datei und Abschnitt oder Kennung), Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-2.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, je Befund aus Durchlauf 1 „erledigt“ oder „nicht erledigt“, alle neuen Befunde und getrennt davon die Hinweise.
