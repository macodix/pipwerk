# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 3 (Nachprüfung)

- Vorhaben: `strategiedesign`
- Phase: 2 Konzeption, Nachprüfung der Dokumente des Auftraggebers
- Rolle: QA
- zu prüfender Stand: `main`, Commit `3169bc31049c5ff38bcea5398c47918604e2884f`

## Gegenstand

Nachprüfung der Dokumente laut `development/strategiedesign/scope.md`, Abschnitt „Geltende Dokumente“:

- `docs/design/requirements/anforderungen-gesamtsystem.md`
- `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/domain/fachmodell.md`
- `docs/design/domain/indikator-markttechnik.md`
- `docs/design/strategies/str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md` (Testfall `str-01`)
- `docs/design/strategies/str-03-fachlich-ema-trendfolge.md` (Testfall `str-03`)

Anlass: Der Prüfbericht Durchlauf 2 (`development/strategiedesign/reviews/requirements-2.md`, geprüfter Commit `77dc527d7f411f7ae0470de98d75b600f964a283`) war nicht bestanden: blockierend A6, B2, N1, N2, N3, nicht blockierend D1, D5 und die Hinweise H1 bis H17. Der Auftraggeber hat A6, N2, B2, N1 und N3 entschieden, der Projektleiter hat D1, D5 und die Hinweise bearbeitet. Entscheidungen und Bearbeitung stehen in `development/strategiedesign/reviews/requirements-2-response.md`.

## Umfang der Nachprüfung

1. Prüfe für jeden blockierenden Befund aus Durchlauf 2 (A6, B2, N1, N2, N3), ob er erledigt ist. Maßstab ist die Entscheidung des Auftraggebers laut `requirements-2-response.md`, Abschnitt „Entscheidungen des Auftraggebers“, einschließlich seines dort genannten Grundsatzes „keine Einschränkung ohne klare Notwendigkeit“.
2. Prüfe für D1, D5 und H1 bis H17, ob die Bearbeitung laut `requirements-2-response.md` eingearbeitet ist. Ein verworfener Hinweis ist kein Befund.
3. Prüfe, ob die dafür geänderten Stellen neue Fehler enthalten: Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen, Umsetzungsdetails. Die Änderungen zeigt `git diff 77dc527d7f411f7ae0470de98d75b600f964a283 3169bc31049c5ff38bcea5398c47918604e2884f -- docs/design docs/technical/glossar.md`.
4. Prüfe für die geänderten Stellen, ob sich beide Testfälle weiterhin vollständig mit den beschriebenen Objekten und Arbeitsabläufen gestalten, speichern und wieder laden lassen.
5. Neue Befunde an unveränderten Stellen meldest du nur, wenn sie einer Anforderung widersprechen oder die Gestaltung, das Speichern oder das Laden eines Testfalls verhindern.

Nicht Gegenstand:

- `docs/design/requirements/anforderungen-handelssystem.md` und die Stellen des Fachmodells, die die Ausführung von Strategien betreffen (Debuggen, Testen, Handeln)
- die Vorlagen unter `docs/design/planning/`
- die in `scope.md` unter „Offene Punkte des Auftraggebers“ genannten und die in `requirements-2-response.md` ausdrücklich als offen gekennzeichneten Punkte (Geltungsdauer eines mit `Parameter setzen` gesetzten Werts in req-fach-047, Bezug von `VORHER` in req-fach-014, H4 in `str-01`). Ein Befund ist es nur, wenn ein solcher Punkt doch für Gestaltung, Speichern oder Laden eines Testfalls nötig ist oder in den Dokumenten nicht als offen gekennzeichnet ist.

## Prüfgrundlagen

- Briefing QA, Phase 2 Nachprüfung, in `docs/technical/agentenrollen-und-briefings.md`
- Phase 2 und „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Dies ist eine Nachprüfung. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis.
- `development/strategiedesign/scope.md`
- `development/strategiedesign/reviews/requirements-2.md` und `requirements-2-response.md`

Nenne zu jedem Befund Fundstelle (Datei und Abschnitt oder Kennung), Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-3.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, je Befund aus Durchlauf 2 „erledigt“ oder „nicht erledigt“, alle neuen Befunde und getrennt davon die Hinweise.
