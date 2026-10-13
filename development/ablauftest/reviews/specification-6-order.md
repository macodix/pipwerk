# Prüfauftrag Spezifikation, Durchlauf 6

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation
- Rolle: QA
- zu prüfender Stand: `main`, Commit `82b8a9d7c86c5fcd7d77e8b7ff075c28e72c65a7`

## Gegenstand

Prüfe `development/ablauftest/specification.md` gegen die Anforderungen laut `development/ablauftest/scope.md`:

- req-ui-010 „Angaben zu pipwerk studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/requirements/anforderungen-gesamtsystem.md`, soweit es req-ui-010 berührt

Die Antworten des Auftraggebers stehen in `development/ablauftest/questions/ablauftest-01.md` und `development/ablauftest/questions/ablauftest-02.md`. Den bisherigen Stand der Oberfläche beschreiben `docs/technical/pipwerk-studio.md` und `docs/user/pipwerk-studio.md`.

Zählung: Mit der Antwort des Auftraggebers auf Frage ablauftest-02 hat eine neue Prüfschleife begonnen. Durchlauf 4 war ihr erster Durchlauf, Durchlauf 5 ihr zweiter, dies ist ihr dritter.

Dies ist eine erneute Prüfung. Kontrolliere, ob die Befunde aus `development/ablauftest/reviews/specification-5.md` behoben sind:

- G1: E9, Bedingungen für Testumgebung und spätere Installation
- G2: Abschnitt 6.1, Umfang der Prüfung in `testenv start`; Abschnitt 4.3, Nachweis für Änderungen außerhalb der Komponente
- G3: Abschnitt 4.3, Nachbau des Repositorys und Fall ohne Git

Prüfe außerdem, ob die Änderungen neue Probleme verursacht haben. Die Änderungen gegenüber dem in Durchlauf 5 geprüften Commit zeigt `git diff 003c1d4f24c1be23f81c399229385b9f160fb773 82b8a9d7c86c5fcd7d77e8b7ff075c28e72c65a7 -- development/ablauftest/specification.md`.

## Prüfgrundlagen

- Briefing QA, Phase 2 Spezifikation, in `docs/technical/agentenrollen-und-briefings.md`
- Phase 2 in `docs/technical/entwicklungsverfahren.md`

Prüfe, ob die Spezifikation jede Aussage von req-ui-010 vollständig und richtig umsetzt und nichts festlegt, was req-ui-010 widerspricht. Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `specification-6.md` in dein Arbeitsverzeichnis `work/ablauftest/qa/` im Entwicklungsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde.
