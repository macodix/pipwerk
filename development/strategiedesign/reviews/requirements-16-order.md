# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 16 (Prüfung der geänderten Stelle)

- Vorhaben: `strategiedesign`, Anlass Festlegung des Auftraggebers vom 2026-10-23 zu req-ui-016 („Assistent“), Einwand zum Prototyp in `development/strategiedesign/questions/strategiedesign-02.md`
- Phase: 1 Anforderung, Rückweg mit geänderter Anforderung, Prüfung beschränkt auf die geänderte Stelle
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, mit dem dieser Prüfauftrag auf `main` gebracht wurde (der jüngste Commit, der diese Datei enthält: `git log -1 --format=%H -- development/strategiedesign/reviews/requirements-16-order.md`). Nenne ihn im Bericht vollständig.

## Gegenstand

Durchlauf 15 hat Commit `b1ebc990333697f2513129e5c4e5ddd64eed3647` geprüft und war bestanden. Danach hat der Projektleiter nach Festlegung des Auftraggebers in `docs/design/requirements/anforderungen-strategiedesigner.md` req-ui-016 geändert: Der geführte Aufbau heißt in der Oberfläche „Assistent“. Dazu gehört die Zeile vom 2026-10-23 im Änderungsnachweis desselben Dokuments.

Maßstab ist die Änderung selbst: `git diff b1ebc990333697f2513129e5c4e5ddd64eed3647 <zu prüfender Commit> -- docs/design docs/technical/glossar.md development/strategiedesign/scope.md`.

## Umfang der Prüfung

Prüfe nur:

1. ob die geänderte Stelle Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen oder Umsetzungsdetails enthält oder den übrigen geltenden Dokumenten laut `scope.md` und dem Glossar widerspricht,
2. ob sich beide Testfälle (`str-01`, `str-03`) mit der geänderten Stelle weiterhin vollständig gestalten, speichern und wieder laden lassen.

Ordne jeden Befund nach „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md` zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe. Beachte die Regeln „Keine Einschränkung ohne Erfordernis“ und „Lücken“ im selben Abschnitt.

Nicht Gegenstand:

- alle nicht geänderten Stellen, außer sie widersprechen der geänderten Stelle (Punkt 1)
- `docs/design/requirements/anforderungen-handelssystem.md`, `docs/design/requirements/anforderungen-strategietester.md` und die Vorlagen unter `docs/design/planning/`
- Spezifikation, Plan, Prototyp und der Code von `wp01` und `wp02`
- die als offen gekennzeichneten Punkte
- die technischen Dokumente unter `docs/technical/` außer dem Glossar
- die Frage, ob die Prüfschleife eine Ebene höher geht. Das entscheidet nicht die QA.

## Prüfgrundlagen

- Briefing QA, Phase 1, in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md`: Prüfung nur der geänderten Stelle, nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis, jeden in einer Zeile. Bericht höchstens etwa 60 Zeilen.
- `development/strategiedesign/scope.md`
- `development/strategiedesign/reviews/requirements-15.md`

Nenne zu jedem Befund Fundstelle (Datei und Kennung), Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-16.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
