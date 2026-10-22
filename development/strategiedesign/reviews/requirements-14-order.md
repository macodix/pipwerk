# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 14 (Nachprüfung)

- Vorhaben: `strategiedesign`, Anlass Abnahme von Arbeitspaket `wp02`, Versuch 2 (nicht abgenommen, `development/strategiedesign/wp02/acceptance/2.md`)
- Phase: 1 Anforderung, Rückweg mit geänderten Anforderungen, Nachprüfung
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, mit dem dieser Prüfauftrag auf `main` gebracht wurde (der jüngste Commit, der diese Datei enthält: `git log -1 --format=%H -- development/strategiedesign/reviews/requirements-14-order.md`). Nenne ihn im Bericht vollständig.

## Gegenstand

Durchlauf 13 hat Commit `1c4b7f21cbc4c3157be557ecdabfd95f102050f4` geprüft und war nicht bestanden (B1, B2). Danach wurden bearbeitet:

- B1 und H6 vom Projektleiter in `docs/design/requirements/anforderungen-strategiedesigner.md`, req-ablauf-007,
- B2 vom Softwarearchitekten im Glossar `docs/technical/glossar.md` (Einträge „Namensraum“, „Datenverbindung“, „Ausgang“, „Ergebnis“, „Typbeschreibung“ geändert, „Methode“ und „Aktualisieren“ neu).

Die Bearbeitung beschreibt `development/strategiedesign/reviews/requirements-13-response.md`. Maßstab ist die Änderung selbst: `git diff 1c4b7f21cbc4c3157be557ecdabfd95f102050f4 <zu prüfender Commit> -- docs/design docs/technical/glossar.md development/strategiedesign/scope.md`.

## Umfang der Prüfung

Dies ist eine Nachprüfung. Prüfe nur:

1. ob B1, B2 und H6 aus `requirements-13.md` behoben sind,
2. ob die dafür geänderten Stellen neue Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen oder Umsetzungsdetails enthalten oder den übrigen geltenden Dokumenten laut `scope.md` und dem Glossar widersprechen,
3. ob sich beide Testfälle (`str-01`, `str-03`) mit den geänderten Stellen weiterhin vollständig gestalten, speichern und wieder laden lassen.

Ordne jeden Befund nach „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md` zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe. Beachte die Regeln „Keine Einschränkung ohne Erfordernis“ und „Lücken“ im selben Abschnitt.

Nicht Gegenstand:

- alle nicht geänderten Stellen, außer sie widersprechen einer geänderten Stelle (Punkt 2)
- die übrigen Hinweise aus `requirements-13.md` (H1 bis H5, H7 bis H10); sie sind in `requirements-13-response.md` als offen, Sache der Spezifikation oder Sache des Projektleiters bei Bedarf zugeordnet
- `docs/design/requirements/anforderungen-handelssystem.md` und die Stellen des Fachmodells, die die Ausführung von Strategien betreffen
- die Vorlagen unter `docs/design/planning/`
- Spezifikation, Plan und der Code von `wp02`
- die als offen gekennzeichneten Punkte. Ein Befund ist es nur, wenn ein solcher Punkt doch für Gestaltung, Speichern oder Laden eines Testfalls nötig ist.
- die technischen Dokumente unter `docs/technical/` außer dem Glossar
- die Frage, ob die Prüfschleife eine Ebene höher geht. Das entscheidet nicht die QA.

## Prüfgrundlagen

- Briefing QA, Phase 1, in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md`: Nachprüfung, nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis, jeden in einer Zeile. Eine Nachprüfung nennt nur die noch offenen und die neuen Befunde. Bericht höchstens etwa 60 Zeilen.
- `development/strategiedesign/scope.md`
- `development/strategiedesign/wp02/acceptance/2.md`
- `development/strategiedesign/reviews/requirements-13.md`, `requirements-13-response.md`

Nenne zu jedem Befund Fundstelle (Datei und Kennung), Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-14.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
