# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 22 (Nachprüfung zu Durchlauf 21)

- Vorhaben: `strategiedesign`, Rückweg aus der Abnahme `wp02`, Versuch 3
- Phase: 1 Anforderung, Nachprüfung
- Rolle: QA
- zu prüfender Stand: `main`, Commit `74bb1f5c738fbe1cae1ad0a4beca7019bf6d3a21`. Nenne ihn im Bericht vollständig.

## Gegenstand

Prüfbericht Durchlauf 21: `development/strategiedesign/reviews/requirements-21.md` (nicht bestanden, B1, B2, Hinweise H1 bis H4). Bearbeitung: `development/strategiedesign/reviews/requirements-21-response.md`.

Maßstab ist die Änderung selbst: `git diff 735bd025cc72e355bee7603e3290dd692272cd3b 74bb1f5c738fbe1cae1ad0a4beca7019bf6d3a21 -- docs`, dazu die Entscheidungen in `development/strategiedesign/wp02/acceptance/3.md`, Abschnitte E1 und E9.

## Umfang der Prüfung

Dies ist eine Nachprüfung. Prüfe nur:

1. B1: ob `str-01` und `str-03` den Begriff „Order- und Positionsverwaltung“ ohne Kurzform „Verwaltung“ verwenden.
2. B2: ob der Glossareintrag „Assistent“ als offener Punkt gekennzeichnet ist und nicht mehr Ablauf und Namen als geltend darstellt.
3. H1 und H2: ob die geänderten Sätze in `fachmodell.md` (Abschnitt zur Order), `anforderungen-strategiedesigner.md` (Abschnitt 1) und req-ui-016 richtig sind.
4. ob die dafür geänderten Stellen neue Fehler enthalten: Widersprüche, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen.

Ordne jeden Befund nach „Fragen an den Auftraggeber“ im Entwicklungsverfahren zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe. Beachte die Regeln „Keine Einschränkung ohne Erfordernis“ und „Lücken“ im selben Abschnitt.

Nicht Gegenstand:

- alle Stellen, die der Diff oben nicht ändert
- H3 und H4 (offener Punkt beziehungsweise mit B1 erledigt)
- Spezifikation, Plan, Prototyp und Code
- die Frage, ob die Prüfschleife eine Ebene höher geht

## Prüfgrundlagen

- dein Briefing, Phase 1
- „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ im Entwicklungsverfahren: Nachprüfung, nur blockierende Befunde verhindern das Bestehen, Hinweise je eine Zeile, Bericht höchstens etwa 60 Zeilen
- `development/strategiedesign/scope.md`
- `development/strategiedesign/wp02/acceptance/3.md`
- `development/strategiedesign/reviews/requirements-21.md` und `requirements-21-response.md`

Nenne zu jedem Befund Fundstelle (Datei und Kennung), Sachverhalt, Zuordnung und einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-22.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, die blockierenden Befunde und getrennt davon die Hinweise.
