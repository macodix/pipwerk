# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 10 (Nachprüfung)

- Vorhaben: `strategiedesign`, Anlass Abnahme von Arbeitspaket `wp02` (nicht abgenommen)
- Phase: 1 Anforderung, Nachprüfung der geänderten Stellen nach Durchlauf 9
- Rolle: QA
- zu prüfender Stand: `main`, Commit `26ecff465d067320ec279a3e1bb1c12f4b8bc1e5`

## Gegenstand

Durchlauf 9 (`development/strategiedesign/reviews/requirements-9.md`, geprüfter Commit `69fbbc52d1000277accf1028ce44d3e5e99826b4`) ist nicht bestanden: 5 blockierende Befunde (B1 bis B5) und 10 Hinweise (H1 bis H10). Bearbeitet haben sie:

- der Projektleiter in den Dokumenten des Auftraggebers und in `scope.md`, Übersicht in `development/strategiedesign/reviews/requirements-9-response.md`
- der Softwarearchitekt im Glossar `docs/technical/glossar.md` (B3, B4, H3, H10), Eintrag vom 2026-10-19 im Änderungsnachweis des Glossars

Maßstab sind die Änderungen selbst: `git diff 69fbbc52d1000277accf1028ce44d3e5e99826b4 26ecff465d067320ec279a3e1bb1c12f4b8bc1e5 -- docs development/strategiedesign/scope.md`, zusammen mit den Einträgen zu Durchlauf 9 in den Änderungsnachweisen von `fachmodell.md`, `indikator-markttechnik.md`, `anforderungen-strategiedesigner.md` und `glossar.md`.

## Umfang der Prüfung

Dies ist eine Nachprüfung. Prüfe nur:

1. ob jeder blockierende Befund B1 bis B5 aus Durchlauf 9 erledigt ist,
2. ob die dafür und für die Hinweise geänderten Stellen neue Fehler enthalten: Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen, Umsetzungsdetails,
3. ob die geänderten Stellen den übrigen geltenden Dokumenten laut `scope.md` (Abschnitt „Geltende Dokumente“, einschließlich der Testfälle `str-01` und `str-03`) und dem Glossar widersprechen,
4. ob sich beide Testfälle mit den geänderten Stellen weiterhin vollständig gestalten, speichern und wieder laden lassen, `str-01` und `str-03` auch ohne Formeltext (req-ui-015).

Zu den Hinweisen H1 bis H10 vermerkst du nur, ob die Bearbeitung laut `requirements-9-response.md` vorliegt. Die der Spezifikation zugeordneten Punkte (H2, H5, H6, Kreise über Datenverbindungen aus H4, Namen der ZigZag-Eigenschaften aus H9, Darstellung der Werte in den Bausteinen aus B1, Schreibweise von Namen mit Leerzeichen im Ausdruck aus B2) sind nicht Gegenstand; sie folgen in Phase 2.

Ordne jeden Befund nach „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md` zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe.

Nicht Gegenstand:

- Stellen, die seit Durchlauf 9 nicht geändert wurden, außer sie widersprechen einer geänderten Stelle (Punkt 3)
- `docs/design/requirements/anforderungen-handelssystem.md` und die Stellen des Fachmodells, die die Ausführung von Strategien betreffen
- die Vorlagen unter `docs/design/planning/`
- Spezifikation, Plan und der Code von `wp02`
- die in `scope.md` und in den Dokumenten als offen oder als „Offen für die Spezifikation“ beziehungsweise „Offen für den Prototyp“ gekennzeichneten Punkte. Ein Befund ist es nur, wenn ein solcher Punkt doch für Gestaltung, Speichern oder Laden eines Testfalls nötig ist.
- die technischen Dokumente unter `docs/technical/` außer dem Glossar
- die Frage, ob die Prüfschleife eine Ebene höher geht. Das entscheidet nicht die QA.

## Prüfgrundlagen

- Briefing QA, Phase 1, in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md`: Nachprüfung, nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis.
- `development/strategiedesign/scope.md`
- `development/strategiedesign/reviews/requirements-9.md` und `requirements-9-response.md`

Nenne zu jedem Befund Fundstelle (Datei und Abschnitt oder Kennung), Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-10.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, je Befund aus Durchlauf 9 „erledigt“ oder „nicht erledigt“, alle blockierenden Befunde und getrennt davon die Hinweise.
