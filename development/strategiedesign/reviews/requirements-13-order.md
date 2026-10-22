# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 13 (geänderte Stellen)

- Vorhaben: `strategiedesign`, Anlass Abnahme von Arbeitspaket `wp02`, Versuch 2 (nicht abgenommen, `development/strategiedesign/wp02/acceptance/2.md`)
- Phase: 1 Anforderung, Rückweg mit geänderten Anforderungen
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, mit dem dieser Prüfauftrag auf `main` gebracht wurde (der jüngste Commit, der diese Datei enthält: `git log -1 --format=%H -- development/strategiedesign/reviews/requirements-13-order.md`). Nenne ihn im Bericht vollständig.

## Gegenstand

Der Projektleiter hat nach Festlegungen des Auftraggebers im Chat am 22. Oktober 2026 geändert:

- Fachmodell `docs/design/domain/fachmodell.md`: req-fach-055 neu
- Anforderungen Strategiedesigner `docs/design/requirements/anforderungen-strategiedesigner.md`: req-ui-012, req-ui-014, req-ui-017, req-ui-018 (neu), req-ablauf-003

Maßstab ist die Änderung selbst: `git diff 746e6f2d9757b08c67b30ecd8b42aee74572345e <zu prüfender Commit> -- docs/design docs/technical/glossar.md development/strategiedesign/scope.md`. Die Festlegungen des Auftraggebers sind im Abnahmebericht unter „Geänderte Anforderungen“ zusammengefasst.

## Umfang der Prüfung

Prüfe nur:

1. ob die geänderten Stellen Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen oder Umsetzungsdetails enthalten,
2. ob sie den übrigen geltenden Dokumenten laut `scope.md` (auch dem Anforderungsdokument des Gesamtsystems) und dem Glossar `docs/technical/glossar.md` widersprechen, insbesondere den Stellen, auf die sie verweisen (zum Beispiel req-fach-046, req-fach-047, req-fach-049a, req-fach-051, req-ui-006),
3. ob sich beide Testfälle (`str-01`, `str-03`) mit den geänderten Stellen weiterhin vollständig gestalten, speichern und wieder laden lassen.

Ordne jeden Befund nach „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md` zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe. Beachte die Regeln „Keine Einschränkung ohne Erfordernis“ und „Lücken“ im selben Abschnitt.

Nicht Gegenstand:

- alle nicht geänderten Stellen, außer sie widersprechen einer geänderten Stelle (Punkt 2)
- `docs/design/requirements/anforderungen-handelssystem.md` und die Stellen des Fachmodells, die die Ausführung von Strategien betreffen
- die Vorlagen unter `docs/design/planning/`
- Spezifikation, Plan und der Code von `wp02`
- die als offen gekennzeichneten Punkte, auch die neuen in req-fach-055, req-ui-012 und req-ui-018. Ein Befund ist es nur, wenn ein solcher Punkt doch für Gestaltung, Speichern oder Laden eines Testfalls nötig ist.
- die technischen Dokumente unter `docs/technical/` außer dem Glossar
- die Frage, ob die Prüfschleife eine Ebene höher geht. Das entscheidet nicht die QA.

## Prüfgrundlagen

- Briefing QA, Phase 1, in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md`: Die Prüfung ist auf die geänderten Stellen beschränkt. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis, jeden in einer Zeile. Bericht höchstens etwa 60 Zeilen.
- `development/strategiedesign/scope.md`
- `development/strategiedesign/wp02/acceptance/2.md`

Nenne zu jedem Befund Fundstelle (Datei und Kennung), Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-13.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
