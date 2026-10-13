# Prüfauftrag Spezifikation, Durchlauf 4

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation
- Rolle: QA
- zu prüfender Stand: `main`, Commit `d0b6685321deb36782dd8fddeaf1046bc7296ce5`

## Gegenstand

Prüfe `development/ablauftest/specification.md` gegen die Anforderungen laut `development/ablauftest/scope.md`:

- req-ui-010 „Angaben zu pipwerk studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`, in der Fassung nach der Antwort auf Frage ablauftest-02
- `docs/design/requirements/anforderungen-gesamtsystem.md`, soweit es req-ui-010 berührt

Die Antworten des Auftraggebers stehen in `development/ablauftest/questions/ablauftest-01.md` und `development/ablauftest/questions/ablauftest-02.md`. Den bisherigen Stand der Oberfläche beschreiben `docs/technical/pipwerk-studio.md` und `docs/user/pipwerk-studio.md`.

Die Prüfschleife hatte drei Durchläufe. Der Streitpunkt ging als Frage ablauftest-02 an den Auftraggeber. Seine Antwort ist in req-ui-010 eingetragen. Dies ist die erneute Prüfung danach. Kontrolliere, ob die Befunde aus `development/ablauftest/reviews/specification-3.md` behoben sind:

- D1: E9, Absatz „Grenze im Entwicklungsbetrieb“ in Abschnitt 2, Testumgebungsskript in Abschnitt 6.1, Anwenderdokumentation und technische Dokumentation in Abschnitt 7, Abschnitt 9
- D2: Browsertest in Abschnitt 4.2, neuer Frontend-Test zu `vite.config.ts` in Abschnitt 4.1, Dateien in Abschnitt 3.1
- D3: dritter Punkt der Grenze in Abschnitt 2 und seine Übernahme in die Anwenderdokumentation in Abschnitt 7

Prüfe außerdem, ob die Änderungen neue Probleme verursacht haben. Die Änderungen gegenüber dem in Durchlauf 3 geprüften Commit `78318ff4944be82596e77a3a2ce1a8390123f234` zeigt `git diff 78318ff4944be82596e77a3a2ce1a8390123f234 d0b6685321deb36782dd8fddeaf1046bc7296ce5`.

## Prüfgrundlagen

- Briefing QA, Phase 2 Spezifikation, in `docs/technical/agentenrollen-und-briefings.md`
- Phase 2 in `docs/technical/entwicklungsverfahren.md`

Prüfe, ob die Spezifikation jede Aussage von req-ui-010 vollständig und richtig umsetzt und nichts festlegt, was req-ui-010 widerspricht. Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `specification-4.md` in dein Arbeitsverzeichnis `work/ablauftest/qa/` im Entwicklungsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde.
