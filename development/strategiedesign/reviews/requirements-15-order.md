# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 15 (Prüfung der geänderten Stellen)

- Vorhaben: `strategiedesign`, Anlass Festlegungen des Auftraggebers vom 2026-10-23 zu den Hinweisen N1 und N3 aus Durchlauf 14
- Phase: 1 Anforderung, Rückweg mit geänderten Anforderungen, Prüfung beschränkt auf die geänderten Stellen
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, mit dem dieser Prüfauftrag auf `main` gebracht wurde (der jüngste Commit, der diese Datei enthält: `git log -1 --format=%H -- development/strategiedesign/reviews/requirements-15-order.md`). Nenne ihn im Bericht vollständig.

## Gegenstand

Durchlauf 14 hat Commit `075389a525e5b5e8a2f45e8f83dfae25e6150899` geprüft und war bestanden, mit den Hinweisen N1 bis N3. Danach wurden geändert:

- vom Projektleiter nach Festlegung des Auftraggebers: `docs/design/requirements/anforderungen-strategiedesigner.md` req-ui-014 (N1: Verwendung nur im Ausdruck gilt als Verbindung nach req-ablauf-003) und req-ablauf-003 (N3: Namensvorschlag für Instanzen in einer eingefügten Vorlage); `docs/design/domain/fachmodell.md` req-fach-055 (N3: gemeinsamer Namensraum umfasst Regeln, Regelwerke und enthaltene Instanzen),
- vom Softwarearchitekten als Folge dieser Festlegung: Glossar `docs/technical/glossar.md`, Eintrag „Namensraum“ (kein Verdecken eines Namens der Strategie durch einen inneren Namen).

N2 bleibt Sache der Spezifikation und ist nicht Gegenstand. Maßstab ist die Änderung selbst: `git diff 075389a525e5b5e8a2f45e8f83dfae25e6150899 <zu prüfender Commit> -- docs/design docs/technical/glossar.md development/strategiedesign/scope.md`.

## Umfang der Prüfung

Prüfe nur:

1. ob N1 und N3 aus `requirements-14.md` durch die Änderungen erledigt sind,
2. ob die geänderten Stellen Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen oder Umsetzungsdetails enthalten oder den übrigen geltenden Dokumenten laut `scope.md` und dem Glossar widersprechen,
3. ob sich beide Testfälle (`str-01`, `str-03`) mit den geänderten Stellen weiterhin vollständig gestalten, speichern und wieder laden lassen.

Ordne jeden Befund nach „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md` zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe. Beachte die Regeln „Keine Einschränkung ohne Erfordernis“ und „Lücken“ im selben Abschnitt.

Nicht Gegenstand:

- alle nicht geänderten Stellen, außer sie widersprechen einer geänderten Stelle (Punkt 2)
- N2 aus `requirements-14.md`
- `docs/design/requirements/anforderungen-handelssystem.md` und die Stellen des Fachmodells, die die Ausführung von Strategien betreffen
- die Vorlagen unter `docs/design/planning/`
- Spezifikation, Plan, Prototyp und der Code von `wp01` und `wp02`
- die als offen gekennzeichneten Punkte. Ein Befund ist es nur, wenn ein solcher Punkt doch für Gestaltung, Speichern oder Laden eines Testfalls nötig ist.
- die technischen Dokumente unter `docs/technical/` außer dem Glossar
- die Frage, ob die Prüfschleife eine Ebene höher geht. Das entscheidet nicht die QA.

## Prüfgrundlagen

- Briefing QA, Phase 1, in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md`: Prüfung nur der geänderten Stellen, nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis, jeden in einer Zeile. Bericht höchstens etwa 60 Zeilen.
- `development/strategiedesign/scope.md`
- `development/strategiedesign/reviews/requirements-14.md`

Nenne zu jedem Befund Fundstelle (Datei und Kennung), Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-15.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
