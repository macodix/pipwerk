# Prüfauftrag Spezifikation, Durchlauf 10

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation nach Einwand des Auftraggebers
- Rolle: QA
- zu prüfender Stand: `main`, Commit `c8cdc3ee9b02ad7bb998a486eb7a8c1f29151200`

## Gegenstand

Prüfe `development/ablauftest/specification.md` gegen die Anforderungen laut `development/ablauftest/scope.md`:

- req-ui-010 „Angaben zu pipwerk Studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/requirements/anforderungen-gesamtsystem.md`, soweit es req-ui-010 berührt

Anlass und Zählung: Der Auftraggeber hat die Spezifikation am 13.10.2026 mit der Änderung des Namens auf „pipwerk Studio“ bestätigt. Dies ist Durchlauf 10, der dritte der Prüfschleife nach diesem Einwand. Durchlauf 9 (`development/ablauftest/reviews/specification-9.md`) war nicht bestanden.

Dies ist eine erneute Prüfung. Kontrolliere, ob der Befund aus `development/ablauftest/reviews/specification-9.md` behoben ist:

- L1: Abschnitt 8, übrige Stellen mit der Schreibweise „Pipwerk Studio“ einschließlich der Ausgaben des Backends, und Frage S7 in Abschnitt 9

Prüfe außerdem, ob die Änderung neue Probleme verursacht hat. Die Änderungen gegenüber dem in Durchlauf 9 geprüften Commit zeigt `git diff 064ad6798ce068a5440d6d512a6b3bf10b6f6c41 c8cdc3ee9b02ad7bb998a486eb7a8c1f29151200 -- development/ablauftest/specification.md`.

## Prüfgrundlagen

- Briefing QA, Phase 2 Spezifikation, in `docs/technical/agentenrollen-und-briefings.md`
- Phase 2 in `docs/technical/entwicklungsverfahren.md`

Prüfe, ob die Spezifikation jede Aussage von req-ui-010 vollständig und richtig umsetzt und nichts festlegt, was req-ui-010 widerspricht. Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `specification-10.md` in dein Arbeitsverzeichnis `work/ablauftest/qa/` im Entwicklungsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde.
