# Prüfauftrag Spezifikation, Durchlauf 2

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation
- Rolle: QA
- zu prüfender Stand: `main`, Commit `345b7b044f43a12aea5ff009aae53e78cf46a8e1`

## Gegenstand

Prüfe `development/ablauftest/specification.md` gegen die Anforderungen laut `development/ablauftest/scope.md`:

- req-ui-010 „Angaben zu pipwerk studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/requirements/anforderungen-gesamtsystem.md`, soweit es req-ui-010 berührt

Die Antworten des Auftraggebers stehen in `development/ablauftest/questions/ablauftest-01.md`. Den bisherigen Stand der Oberfläche beschreibt `docs/technical/pipwerk-studio.md`.

Dies ist eine erneute Prüfung. Kontrolliere, ob die Befunde S1 bis S8 aus `development/ablauftest/reviews/specification-1.md` behoben oder behandelt sind:

- S1: Entscheidung E9 und Absatz „Grenze im Entwicklungsbetrieb“ in Abschnitt 2, Browsertest in Abschnitt 4.2
- S2: Abschnitt 3.2, Test in Abschnitt 4.1
- S3: Abschnitt 3.5
- S4: E5, E7, Abschnitt 3.6
- S5: Abschnitt 7
- S6: Abschnitt 3.1
- S7, S8: als Hinweise für den Auftraggeber in Abschnitt 9, die Spezifikation hängt davon nicht ab

Prüfe außerdem, ob die Änderungen neue Probleme verursacht haben.

## Prüfgrundlagen

- Briefing QA, Phase 2 Spezifikation, in `docs/technical/agentenrollen-und-briefings.md`
- Phase 2 in `docs/technical/entwicklungsverfahren.md`

Prüfe, ob die Spezifikation jede Aussage von req-ui-010 vollständig und richtig umsetzt und nichts festlegt, was req-ui-010 widerspricht. Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `specification-2.md` in dein Arbeitsverzeichnis `work/ablauftest/qa/` im Entwicklungsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde.
