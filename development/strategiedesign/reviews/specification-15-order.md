# Prüfauftrag Spezifikation, Durchlauf 15

- Vorhaben: `strategiedesign`, ref `strategiedesign`
- Phase: 2, Spezifikation nach der dritten Abnahme von `wp02` (`development/strategiedesign/wp02/acceptance/3.md`, Mängel E1, E9, E11, E12)
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, der diesen Prüfauftrag anlegt. Den vollständigen Commit liefert `git log -1 --format=%H -- development/strategiedesign/reviews/specification-15-order.md` auf `origin/main`. Nenne ihn im Bericht vollständig.
- vorheriger Durchlauf: `development/strategiedesign/reviews/specification-14.md`, bestanden, zur Fassung vom 2026-10-23

## Gegenstand

Erster Durchlauf für diese Fassung, beschränkt auf das, was sich seit Commit `dd0bf1a70c11b46c3e6aff7ac7ec8775a3935bc6` geändert hat:

1. Geänderte Stellen der Spezifikation: `git diff dd0bf1a70c11b46c3e6aff7ac7ec8775a3935bc6 <zu prüfender Commit> -- development/strategiedesign/specification.md`. Die oberste Zeile des Änderungsnachweises fasst sie zusammen.
2. Prüfe, ob die Spezifikation die Entscheidungen des Auftraggebers vom 2026-10-27 vollständig und richtig umsetzt: `development/strategiedesign/wp02/acceptance/3.md`, Abschnitte E1, E9, E12, und die Änderung seiner Dokumente `git diff 9fac24eac80fbb162b7f610330731f31fdee5a04 74bb1f5c738fbe1cae1ad0a4beca7019bf6d3a21 -- docs`. Das sind: E1 Begriff „Order- und Positionsverwaltung“ ohne Kurzform, Feldnamen des Dokuments unverändert; E9 Assistent entfällt, geführter Aufbau offen (req-ui-016); E12 Kreuzung kein Baustein, gespeicherte Ausdrücke bleiben gültig und erscheinen ausgeschrieben mit „vorheriger Wert von“ (req-ui-015).
3. E11 ist Sache der Spezifikation (Abschnitt 5.4, Abschnitt 10 Punkt 26): Prüfe, ob die Festlegung den Mangel E11 abdeckt und den Anforderungen nicht widerspricht. Punkt 26 ist vorläufig bis zur Abnahme; prüfe, ob er so gekennzeichnet ist.
4. Prüfe, ob die Spezifikation an einer nicht geänderten Stelle diesen Entscheidungen noch widerspricht, insbesondere noch die Kurzform „Verwaltung“, den Assistenten oder einen Baustein „Kreuzung“ voraussetzt. Der Änderungsnachweis beschreibt frühere Stände und ist davon ausgenommen.
5. Lassen sich `str-01` und `str-03` mit der Spezifikation weiterhin vollständig abbilden (Abschnitt 6), die Bedingung zum Kreuzen in `str-03` ohne Baustein „Kreuzung“?

Nicht Gegenstand: Stellen der Spezifikation, die weder geändert sind noch die Entscheidungen berühren; die Mängel E2 bis E6, E10 und E13 (sie folgen aus bestehenden Festlegungen und werden in Phase 4 behoben); die Dokumente des Auftraggebers selbst (geprüft in `requirements-21.md` und `requirements-22.md`); Arbeitspaketplan (eigener Prüfauftrag); Prototyp; Code; die Güte des Entwurfs (Architekturprüfung, `reviews/architecture-1.md`).

## Prüfgrundlagen

- dein Briefing, Phase 2
- „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ im Entwicklungsverfahren: erster Durchlauf dieser Fassung, also alle Befunde auf einmal. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis, je Hinweis eine Zeile. Spezifikation und Plan legen nur Bausteine, Entscheidungen und Abnahmekriterien fest; Testdetails und Formulierungen gehören in die Aufträge. Höchstens etwa 60 Zeilen.
- `development/strategiedesign/scope.md` und die dort genannten Dokumente
- `development/strategiedesign/wp02/acceptance/3.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Ordne Befunde zu Dokumenten des Auftraggebers nach „Fragen an den Auftraggeber“ zu. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-15.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
