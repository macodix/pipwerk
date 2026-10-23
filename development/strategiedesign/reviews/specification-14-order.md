# Prüfauftrag Spezifikation, Durchlauf 14

- Vorhaben: `strategiedesign`, ref `strategiedesign`
- Phase: 2, Prüfung der Spezifikation nach den Einwänden aus der Abstimmung `development/strategiedesign/presentations/specification-3.html` (Meldung `revise`)
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, der diesen Prüfauftrag anlegt. Den vollständigen Commit liefert `git log -1 --format=%H -- development/strategiedesign/reviews/specification-14-order.md` auf `origin/main`.
- vorheriger Durchlauf: `development/strategiedesign/reviews/specification-13.md`, bestanden; danach Hinweise eingearbeitet und vorgelegt mit Commit `0b6190b`

## Gegenstand

Erster Durchlauf für diese Fassung, beschränkt auf das, was sich seit Commit `0b6190b` geändert hat:

1. Geänderte Stellen der Spezifikation: `git diff 0b6190b <zu prüfender Commit> -- development/strategiedesign/specification.md`. Die beiden obersten Zeilen des Änderungsnachweises fassen sie zusammen.
2. Prüfe, ob die Spezifikation die seit Commit `0b6190b` geänderten Festlegungen des Auftraggebers vollständig und richtig umsetzt: `git diff 0b6190b <zu prüfender Commit> -- docs/design/domain/fachmodell.md docs/design/requirements/anforderungen-strategiedesigner.md`. Das sind req-fach-055 (mitgelieferte Objekttypen vorerst ohne Methoden, Aktualisieren, Verwendbarkeit einer Instanz nur an Stellen über ihre erste Verwendung, Verwaltung gilt als über ihr „Order aufgeben“ erreicht, Stand dort), req-ui-014 (Bausteine und Verbinden bieten nur verwendbare Instanzen an, Fehler im Ausdruck) und req-ablauf-007 (neue Zeile der Fehler). Grundlage ist der Vermerk der Bestätigung zu den Punkten 23 bis 25 auf der letzten Folie von `specification-3.html`.
3. Prüfe, ob die Spezifikation an einer nicht geänderten Stelle diesen Festlegungen noch widerspricht, insbesondere noch eine Methode der mitgelieferten Typen oder einen Wert vor einer Anzahl Kerzen als Methode voraussetzt.
4. Lassen sich `str-01` und `str-03` mit der Spezifikation weiterhin vollständig abbilden (Abschnitt 6), mit Instanzen des Hauptablaufs in den Verwaltungen mit eigenen Auslösern?

Abschnitt 10 Punkte 21 und 22 bleiben vorläufig bis zur Abnahme; prüfe nur, ob sie so gekennzeichnet sind.

Nicht Gegenstand: Stellen der Spezifikation, die weder geändert sind noch die geänderten Festlegungen berühren; die Dokumente des Auftraggebers selbst (sie sind in `requirements-19.md` und `requirements-20.md` geprüft); Arbeitspaketplan (er wird danach angepasst); Prototyp; Code. Das Glossar nur, soweit es den Begriffen „Methode“, „Namensraum“ und „Aktualisieren“ der Spezifikation widerspricht.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md`: erster Durchlauf dieser Fassung, also alle Befunde auf einmal. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis, je Hinweis eine Zeile. Spezifikation und Plan legen nur Bausteine, Entscheidungen und Abnahmekriterien fest; Testdetails und Formulierungen gehören in die Aufträge. Eine Lücke ist nur mit gutem technischem Grund blockierend. Höchstens etwa 60 Zeilen.
- `development/strategiedesign/scope.md` und die dort genannten Dokumente

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Ordne Befunde zu Dokumenten des Auftraggebers nach „Fragen an den Auftraggeber“ zu. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-14.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
