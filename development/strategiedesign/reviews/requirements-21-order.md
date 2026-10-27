# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 21 (geänderte Stellen)

- Vorhaben: `strategiedesign`, Rückweg aus der Abnahme `wp02`, Versuch 3 (`development/strategiedesign/wp02/acceptance/3.md`, Mängel E1, E9, E12)
- Phase: 1 Anforderung, Rückweg mit geänderter Anforderung, Prüfung der geänderten Stellen
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, mit dem dieser Prüfauftrag auf `main` gebracht wurde (der jüngste Commit, der diese Datei enthält: `git log -1 --format=%H -- development/strategiedesign/reviews/requirements-21-order.md`). Nenne ihn im Bericht vollständig.

## Gegenstand

Der Projektleiter hat Entscheidungen des Auftraggebers vom 2026-10-27 eingearbeitet (Commit `1a69f7dcc5f5d5da74912009667a6944069c7598`):

- E1: Der Teil des Ablaufs am Ausgang „gestellt“ heißt „Order- und Positionsverwaltung“, ohne Kurzform „Verwaltung“. Geändert in `docs/design/domain/fachmodell.md` (req-fach-049, req-fach-049a, req-fach-051, req-fach-053, req-fach-055 und weitere Verwendungen), `docs/design/requirements/anforderungen-strategiedesigner.md` (req-fach-015, req-fach-027, req-ui-017, req-ablauf-003) und `docs/technical/glossar.md`.
- E9: req-ui-016, der geführte Aufbau („Assistent“) wird offener Punkt.
- E12: req-ui-015, die Kreuzung ist kein eigener Baustein; sie entsteht aus „vorheriger Wert von“ und Vergleichen. Offen: ob solche Rechnungen als eigene Vorlagen angeboten werden.

Maßstab ist die Änderung selbst: `git diff 9fac24eac80fbb162b7f610330731f31fdee5a04 1a69f7dcc5f5d5da74912009667a6944069c7598 -- docs`, dazu die Entscheidungen in `development/strategiedesign/wp02/acceptance/3.md`, Abschnitte E1, E9 und E12.

## Umfang der Prüfung

Prüfe nur die geänderten Stellen und was ihnen widerspricht:

1. E1: ob der neue Begriff in allen Dokumenten laut `development/strategiedesign/scope.md` und im Glossar vollständig und ohne Kurzform verwendet wird, einschließlich der Testfälle `str-01` und `str-03`. Einträge im Änderungsnachweis, die einen früheren Stand beschreiben, sind kein Befund.
2. E9: ob req-ui-016 den Assistenten als offenen Punkt kennzeichnet und ob andere Stellen der Dokumente laut `scope.md` oder des Glossars den Assistenten noch als festgelegt beschreiben.
3. E12: ob req-ui-015 mit den übrigen Stellen vereinbar ist, die das Kreuzen beschreiben, insbesondere req-fach-014 und req-fach-055 im Fachmodell, das Glossar und die Bedingungen in `str-01` und `str-03`, und ob beide Testfälle sich ohne Baustein „Kreuzung“ nach dem geänderten Wortlaut fehlerfrei gestalten und speichern lassen.
4. ob die geänderten Stellen neue Fehler enthalten: Widersprüche, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen.

Ordne jeden Befund nach „Fragen an den Auftraggeber“ im [Entwicklungsverfahren](https://github.com/macodix/dev-werk/blob/main/de/process/development-process.md#fragen-an-den-auftraggeber) zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe. Beachte die Regeln „Keine Einschränkung ohne Erfordernis“ und „Lücken“ im selben Abschnitt.

Nicht Gegenstand:

- alle nicht geänderten Stellen, außer sie widersprechen den geänderten Stellen oder verwenden den alten Begriff beziehungsweise beschreiben den Assistenten oder die Kreuzung als Baustein
- die Mängel E2 bis E6, E10, E11, E13 des Abnahmeberichts; sie betreffen Spezifikation und Umsetzung
- Spezifikation, Plan, Prototyp und Code von `wp01` und `wp02`
- die als offen gekennzeichneten Punkte inhaltlich
- die technischen Dokumente unter `docs/technical/` außer dem Glossar
- die Frage, ob die Prüfschleife eine Ebene höher geht. Das entscheidet nicht die QA.

## Prüfgrundlagen

- dein Briefing, Phase 1
- „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ im Entwicklungsverfahren: erster Durchlauf zu diesen Stellen vollständig, nur blockierende Befunde verhindern das Bestehen, alles andere als Hinweis in je einer Zeile, Bericht höchstens etwa 60 Zeilen
- `development/strategiedesign/scope.md`
- `development/strategiedesign/wp02/acceptance/3.md`

Nenne zu jedem Befund Fundstelle (Datei und Kennung), Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-21.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, die blockierenden Befunde und getrennt davon die Hinweise.
