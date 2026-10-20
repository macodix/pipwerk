# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 11 (geänderte Stelle req-fach-053)

- Vorhaben: `strategiedesign`, Anlass Abnahme von Arbeitspaket `wp02` (nicht abgenommen)
- Phase: 1 Anforderung, Prüfung einer geänderten Stelle nach Durchlauf 10
- Rolle: QA
- zu prüfender Stand: `main`, Commit `c52c6ba53d46785ea91cc11b89a2bd0a60e78c24`

## Gegenstand

Durchlauf 10 (`development/strategiedesign/reviews/requirements-10.md`) hat Commit `26ecff465d067320ec279a3e1bb1c12f4b8bc1e5` geprüft und ist bestanden. Danach hat der Projektleiter Hinweis H7 aus Durchlauf 9 nach einer Entscheidung des Auftraggebers vom 2026-10-19 bearbeitet: Die Auslöser `Kerzenschluss` und `Tick` haben den Parameter `Instrument`, eine Order kann auf jedem Instrument aufgegeben werden. Die Kennzeichnung als offen ist in req-fach-053 und `scope.md` entfernt.

Maßstab ist die Änderung selbst: `git diff 26ecff465d067320ec279a3e1bb1c12f4b8bc1e5 c52c6ba53d46785ea91cc11b89a2bd0a60e78c24 -- docs development/strategiedesign/scope.md development/strategiedesign/reviews/requirements-9-response.md`, zusammen mit dem letzten Eintrag im Änderungsnachweis von `fachmodell.md`.

## Umfang der Prüfung

Prüfe nur:

1. ob die geänderten Stellen Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen oder Umsetzungsdetails enthalten,
2. ob die geänderten Stellen den übrigen geltenden Dokumenten laut `scope.md` (Abschnitt „Geltende Dokumente“, einschließlich der Testfälle `str-01` und `str-03`) und dem Glossar `docs/technical/glossar.md` widersprechen. Beispiele für zu prüfende Zusammenhänge, ohne Vorgabe eines Ergebnisses: Stellen, die Orders, Positionen oder Auslöser an das Instrument der Anwendung binden (zum Beispiel `wartende Orders` und `offene Positionen` in req-fach-046, Glossar „Auslöser“ und „Anwendung einer Strategie“); die Verweise auf req-fach-028 und req-fach-029,
3. ob sich beide Testfälle mit den geänderten Stellen weiterhin vollständig gestalten, speichern und wieder laden lassen.

Ordne jeden Befund nach „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md` zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe.

Nicht Gegenstand:

- alle anderen Stellen, außer sie widersprechen der geänderten Stelle (Punkt 2)
- die Hinweise N1 bis N5 aus Durchlauf 10
- `docs/design/requirements/anforderungen-handelssystem.md` und die Stellen des Fachmodells, die die Ausführung von Strategien betreffen
- die Vorlagen unter `docs/design/planning/`
- Spezifikation, Plan und der Code von `wp02`
- die in `scope.md` und in den Dokumenten als offen gekennzeichneten Punkte. Ein Befund ist es nur, wenn ein solcher Punkt doch für Gestaltung, Speichern oder Laden eines Testfalls nötig ist.
- die technischen Dokumente unter `docs/technical/` außer dem Glossar
- die Frage, ob die Prüfschleife eine Ebene höher geht. Das entscheidet nicht die QA.

## Prüfgrundlagen

- Briefing QA, Phase 1, in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md`: erster Durchlauf zu dieser Änderung und vollständig für sie, nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis.
- `development/strategiedesign/scope.md`
- `development/strategiedesign/reviews/requirements-9.md` (Hinweis H7), `requirements-9-response.md`, `requirements-10.md`

Nenne zu jedem Befund Fundstelle (Datei und Abschnitt oder Kennung), Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-11.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
