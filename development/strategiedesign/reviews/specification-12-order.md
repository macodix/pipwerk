# Prüfauftrag Spezifikation, Durchlauf 12

- Vorhaben: `strategiedesign`, ref `strategiedesign`
- Phase: 2, Prüfung der Spezifikation vor der Vorlage beim Auftraggeber
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, der diesen Prüfauftrag anlegt. Den vollständigen Commit liefert `git log -1 --format=%H -- development/strategiedesign/reviews/specification-12-order.md` auf `origin/main`.
- vorheriger Durchlauf: `development/strategiedesign/reviews/specification-11.md`, bestanden, geprüft auf Commit `330c774`

## Gegenstand

Erster Durchlauf für diese Fassung, beschränkt auf das, was sich seit Durchlauf 11 geändert hat:

1. Geänderte Stellen der Spezifikation: `git diff 330c774 <zu prüfender Commit> -- development/strategiedesign/specification.md`. Die erste Zeile des Änderungsnachweises fasst sie zusammen; die übrigen Zeilen vom 2026-10-23 nennen frühere Teile derselben Überarbeitung.
2. Prüfe, ob die Spezifikation die seit Commit `330c774` geänderten Festlegungen in den Dokumenten des Auftraggebers vollständig und richtig umsetzt: `git diff 330c774 <zu prüfender Commit> -- docs/design/requirements/anforderungen-strategiedesigner.md docs/design/domain/fachmodell.md docs/design/strategies/str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md`. Dazu gehören req-fach-047 („Parameter setzen“ entfällt), req-fach-053 (`Manuell`), req-fach-054 (`Markttechnik` zurückgestellt, `ZigZag`), req-fach-055, req-ui-012, req-ui-014, req-ui-016, req-ui-017, req-ui-018, req-ablauf-003, req-ablauf-007 und `str-01`.
3. Prüfe, ob die Spezifikation an einer nicht geänderten Stelle diesen Festlegungen noch widerspricht.
4. Prüfe die Antwort in `development/strategiedesign/questions/strategiedesign-04.md`, Abschnitt „Antwort“: Prototyp nur Hilfsmittel, Ort der Fenster vorläufig nach Vorschlag, Lage der Objekte nach req-ui-017. Ist sie richtig umgesetzt (Status, E8, Abschnitte 5 und 10)?
5. Lassen sich `str-01` und `str-03` mit der Spezifikation vollständig abbilden (Abschnitt 6)?

Die Punkte 21 bis 25 in Abschnitt 10 füllen offene Punkte des Auftraggebers vorläufig. Prüfe, ob sie als vorläufig gekennzeichnet sind und keiner Festlegung widersprechen; ob der Auftraggeber sie so will, prüft er selbst in der Abnahme.

Nicht Gegenstand: Stellen der Spezifikation, die weder geändert sind noch die geänderten Festlegungen berühren; die Dokumente des Auftraggebers selbst; Glossar; Arbeitspaketplan (er wird danach neu erstellt); Prototyp; Code.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md`: erster Durchlauf, also alle Befunde auf einmal. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis, je Hinweis eine Zeile. Spezifikation und Plan legen nur Bausteine, Entscheidungen und Abnahmekriterien fest; Testdetails und Formulierungen gehören in die Aufträge. Eine Lücke ist nur mit gutem technischem Grund blockierend. Höchstens etwa 60 Zeilen.
- `development/strategiedesign/scope.md` und die dort genannten Dokumente

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Ordne Befunde zu Dokumenten des Auftraggebers nach „Fragen an den Auftraggeber“ zu. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-12.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
