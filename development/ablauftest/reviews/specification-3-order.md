# Prüfauftrag Spezifikation, Durchlauf 3

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation
- Rolle: QA
- zu prüfender Stand: `main`, Commit `78318ff4944be82596e77a3a2ce1a8390123f234`

## Gegenstand

Prüfe `development/ablauftest/specification.md` gegen die Anforderungen laut `development/ablauftest/scope.md`:

- req-ui-010 „Angaben zu pipwerk studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/requirements/anforderungen-gesamtsystem.md`, soweit es req-ui-010 berührt

Die Antworten des Auftraggebers stehen in `development/ablauftest/questions/ablauftest-01.md`. Den bisherigen Stand der Oberfläche beschreibt `docs/technical/pipwerk-studio.md`.

Dies ist eine erneute Prüfung. Kontrolliere, ob Befund N1 aus `development/ablauftest/reviews/specification-2.md` behoben oder behandelt ist:

- E9 und Absatz „Grenze im Entwicklungsbetrieb“ in Abschnitt 2, einschließlich nicht committeter Änderungen und des Neustarts des Entwicklungsservers bei Änderung seiner Konfiguration
- Browsertest in Abschnitt 4.2, Anwenderdokumentation in Abschnitt 7
- Vorlage der Grenze beim Auftraggeber zur Bestätigung mit der Spezifikation in Abschnitt 9

Prüfe außerdem, ob die Änderungen neue Probleme verursacht haben.

## Prüfgrundlagen

- Briefing QA, Phase 2 Spezifikation, in `docs/technical/agentenrollen-und-briefings.md`
- Phase 2 in `docs/technical/entwicklungsverfahren.md`

Prüfe, ob die Spezifikation jede Aussage von req-ui-010 vollständig und richtig umsetzt und nichts festlegt, was req-ui-010 widerspricht. Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `specification-3.md` in dein Arbeitsverzeichnis `work/ablauftest/qa/` im Entwicklungsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde.
