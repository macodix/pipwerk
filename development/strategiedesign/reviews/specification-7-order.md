# Prüfauftrag Spezifikation, Durchlauf 7

- Vorhaben: `strategiedesign`, ref `strategiedesign`
- Phase: 2, Spezifikation nach der Abnahme von `wp02` und dem bestätigten Prototyp
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, der diesen Prüfauftrag anlegt. Den vollständigen Commit liefert `git log -1 --format=%H -- development/strategiedesign/reviews/specification-7-order.md` auf `origin/main`.
- vorheriger Durchlauf: `development/strategiedesign/reviews/specification-6.md`, bestanden, Hinweise N1 bis N5

## Gegenstand

`development/strategiedesign/specification.md` in der überarbeiteten Fassung vom 2026-10-19 (Änderungsnachweis, erste Zeile). Die Überarbeitung arbeitet die neuen und geänderten Anforderungen nach der Abnahme von `wp02` und den Prototyp der Oberfläche ein. Weil sie die Spezifikation in weiten Teilen ändert, ist dies der erste Durchlauf einer neuen Prüfschleife: Prüfe vollständig und melde alle Befunde auf einmal.

Prüfe, ob die Spezifikation die Anforderungen vollständig und richtig umsetzt, insbesondere:

- die neuen und geänderten Anforderungen: req-system-024 (`anforderungen-gesamtsystem.md`); req-fach-014, req-fach-015, req-fach-036, req-fach-046, req-fach-053, req-fach-054 (`fachmodell.md`) und `indikator-markttechnik.md`; req-ui-014 bis req-ui-017, req-ablauf-002, req-ablauf-003, req-ablauf-007 (`anforderungen-strategiedesigner.md`)
- die Mängel M1 bis M17 aus `development/strategiedesign/wp02/acceptance/1.md`, soweit sie die Spezifikation betreffen
- die Übereinstimmung von Abschnitt 5 mit dem bestätigten Prototyp. Der Auftraggeber hat ihn als Grundlage bestätigt; fünf Lösungen gelten vorläufig bis zu seinem Test (Antwort in `development/strategiedesign/questions/strategiedesign-01.md`, Spezifikation Abschnitt 10 Punkte 9 bis 13)
- dass die Testfälle `str-01` und `str-03` und die gesicherte Strategie des Auftraggebers mit der Spezifikation abbildbar bleiben
- die Erledigung der Hinweise N2 bis N5 aus `specification-6.md` (laut Änderungsnachweis in 3.6 und Abschnitt 10). N1 liegt beim Projektleiter.

Nicht Gegenstand: die Dokumente des Auftraggebers selbst (in Phase 1 geprüft, `requirements-12.md`), das Glossar, der Arbeitspaketplan (er wird nach der Abstimmung der Spezifikation neu erstellt), Code.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md`: Spezifikation legt nur Bausteine, Entscheidungen und Abnahmegrundlagen fest, so knapp wie der Umfang erlaubt; Formulierungen, Testdetails und Schreibweisen gehören in die Aufträge. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis. Ordne jeden Befund, der Dokumente des Auftraggebers berührt, einer der Gruppen zu.
- `development/strategiedesign/scope.md` und die dort genannten Dokumente
- `development/strategiedesign/wp02/acceptance/1.md` und `development/strategiedesign/wp02/acceptance/ema-trendfolge-auftraggeber.strategy.json`
- Prototyp: `development/strategiedesign/prototype/order-01.md`, `development/strategiedesign/prototype/pipwerk-studio-prototyp.html` (im Browser zu öffnen, ohne Server), Beschreibung `strategiedesign/proto-studio:components/pipwerk-studio/prototype/README.md`
- `development/strategiedesign/questions/strategiedesign-01.md` mit Antwort
- `development/strategiedesign/reviews/specification-6.md`
- technische Dokumentation des bestehenden Stands: `docs/technical/pipwerk-domain.md`, `docs/technical/pipwerk-studio.md`, `docs/technical/development-test-security-rules.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-7.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
