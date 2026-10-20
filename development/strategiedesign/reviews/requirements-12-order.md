# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 12 (Nachprüfung zu Beginn von Phase 2)

- Vorhaben: `strategiedesign`, Anlass Abnahme von Arbeitspaket `wp02` (nicht abgenommen)
- Phase: 2 Konzeption, Schritt 1 Nachprüfung
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, mit dem dieser Prüfauftrag auf `main` gebracht wurde (der jüngste Commit, der diese Datei enthält: `git log -1 --format=%H -- development/strategiedesign/reviews/requirements-12-order.md`). Nenne ihn im Bericht vollständig.

## Gegenstand

Durchlauf 10 hat Commit `26ecff465d067320ec279a3e1bb1c12f4b8bc1e5`, Durchlauf 11 Commit `c52c6ba53d46785ea91cc11b89a2bd0a60e78c24` geprüft. Beide sind bestanden und enthielten Hinweise (10: N1 bis N5, 11: N1 bis N6). Danach wurden die Hinweise bearbeitet:

- vom Projektleiter in den Dokumenten des Auftraggebers, siehe `development/strategiedesign/reviews/requirements-11-response.md`,
- vom Softwarearchitekten im Glossar `docs/technical/glossar.md` (10 N2: Eintrag „Eingang“; 11 N5: Einträge „Auslöser“ und „Anwendung einer Strategie“).

Maßstab ist die Änderung selbst: `git diff c52c6ba53d46785ea91cc11b89a2bd0a60e78c24 <zu prüfender Commit> -- docs/design docs/technical/glossar.md development/strategiedesign/scope.md`.

## Umfang der Prüfung

Prüfe nur:

1. ob die in `requirements-11-response.md` und oben genannten Hinweise so bearbeitet sind, wie es dort steht. Hinweise, die dort der Spezifikation zugeordnet sind (10 N4, Teile von 10 N2, 10 N5, 11 N4), sind nicht Gegenstand.
2. ob die geänderten Stellen neue Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen oder Umsetzungsdetails enthalten oder den übrigen geltenden Dokumenten laut `scope.md` und dem Glossar widersprechen,
3. ob sich beide Testfälle (`str-01`, `str-03`) mit den geänderten Stellen weiterhin vollständig gestalten, speichern und wieder laden lassen.

Ordne jeden Befund nach „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md` zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe. Beachte die Regel „Keine Einschränkung ohne Erfordernis“ im selben Abschnitt: Eine Lücke ist kein Anlass für eine Frage, ob eingeschränkt werden soll.

Nicht Gegenstand:

- alle nicht geänderten Stellen, außer sie widersprechen einer geänderten Stelle (Punkt 2)
- `docs/design/requirements/anforderungen-handelssystem.md` und die Stellen des Fachmodells, die die Ausführung von Strategien betreffen
- die Vorlagen unter `docs/design/planning/`
- Spezifikation, Plan und der Code von `wp02`
- die als offen gekennzeichneten Punkte. Ein Befund ist es nur, wenn ein solcher Punkt doch für Gestaltung, Speichern oder Laden eines Testfalls nötig ist.
- die technischen Dokumente unter `docs/technical/` außer dem Glossar
- die Frage, ob die Prüfschleife eine Ebene höher geht. Das entscheidet nicht die QA.

## Prüfgrundlagen

- Briefing QA, Phase 2 Nachprüfung, in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md`: Dies ist eine Nachprüfung. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis.
- `development/strategiedesign/scope.md`
- `development/strategiedesign/reviews/requirements-10.md`, `requirements-11.md`, `requirements-11-response.md`

Nenne zu jedem Befund Fundstelle (Datei und Abschnitt oder Kennung), Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-12.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
