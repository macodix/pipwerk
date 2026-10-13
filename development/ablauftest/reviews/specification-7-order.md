# Prüfauftrag Spezifikation, Durchlauf 7

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation
- Rolle: QA
- zu prüfender Stand: `main`, Commit `78b4e755a6f5ca510194a16e9b69e756f1a2b400`

## Gegenstand

Prüfe `development/ablauftest/specification.md` gegen die Anforderungen laut `development/ablauftest/scope.md`:

- req-ui-010 „Angaben zu pipwerk studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/requirements/anforderungen-gesamtsystem.md`, soweit es req-ui-010 berührt

Die Antworten des Auftraggebers stehen in `development/ablauftest/questions/ablauftest-01.md` und `development/ablauftest/questions/ablauftest-02.md`. Den bisherigen Stand der Oberfläche beschreiben `docs/technical/pipwerk-studio.md` und `docs/user/pipwerk-studio.md`.

Zählung: Die Prüfschleife, die mit der Antwort auf Frage ablauftest-02 begonnen hat, war nach Durchlauf 6 nicht bestanden. Der Projektleiter hat mit der Antwort auf Frage `development/ablauftest/questions/ablauftest-03.md` diesen weiteren Durchlauf 7 freigegeben. Er dient der Bestätigung der Änderung zu H1.

Dies ist eine erneute Prüfung. Kontrolliere, ob der Befund aus `development/ablauftest/reviews/specification-6.md` behoben ist:

- H1: Abschnitt 4.3, Verhalten des Tests des Testumgebungsskripts, wenn Git installiert ist, der Arbeitsbereich aber kein Git-Arbeitsbereich ist

Prüfe außerdem, ob die Änderung neue Probleme verursacht hat. Die Änderungen gegenüber dem in Durchlauf 6 geprüften Commit zeigt `git diff 82b8a9d7c86c5fcd7d77e8b7ff075c28e72c65a7 78b4e755a6f5ca510194a16e9b69e756f1a2b400 -- development/ablauftest/specification.md`.

## Prüfgrundlagen

- Briefing QA, Phase 2 Spezifikation, in `docs/technical/agentenrollen-und-briefings.md`
- Phase 2 in `docs/technical/entwicklungsverfahren.md`

Prüfe, ob die Spezifikation jede Aussage von req-ui-010 vollständig und richtig umsetzt und nichts festlegt, was req-ui-010 widerspricht. Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `specification-7.md` in dein Arbeitsverzeichnis `work/ablauftest/qa/` im Entwicklungsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde.
