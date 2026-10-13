# Prüfauftrag Spezifikation, Durchlauf 9

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation nach Einwand des Auftraggebers
- Rolle: QA
- zu prüfender Stand: `main`, Commit `064ad6798ce068a5440d6d512a6b3bf10b6f6c41`

## Gegenstand

Prüfe `development/ablauftest/specification.md` gegen die Anforderungen laut `development/ablauftest/scope.md`:

- req-ui-010 „Angaben zu pipwerk Studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/requirements/anforderungen-gesamtsystem.md`, soweit es req-ui-010 berührt

Anlass und Zählung: Der Auftraggeber hat die Spezifikation am 13.10.2026 mit der Änderung des Namens auf „pipwerk Studio“ bestätigt. Dies ist Durchlauf 9, der zweite der Prüfschleife nach diesem Einwand. Durchlauf 8 (`development/ablauftest/reviews/specification-8.md`) war nicht bestanden.

Dies ist eine erneute Prüfung. Kontrolliere, ob der Befund aus `development/ablauftest/reviews/specification-8.md` behoben ist:

- K1: Abschnitt 8, Liste der übrigen Stellen mit der Schreibweise „Pipwerk Studio“

Prüfe außerdem, ob die Änderung neue Probleme verursacht hat. Die Änderungen gegenüber dem in Durchlauf 8 geprüften Commit zeigt `git diff 29f41c7ce0b5764c8aeb027e20ee89024d5f77c9 064ad6798ce068a5440d6d512a6b3bf10b6f6c41 -- development/ablauftest/specification.md`.

## Prüfgrundlagen

- Briefing QA, Phase 2 Spezifikation, in `docs/technical/agentenrollen-und-briefings.md`
- Phase 2 in `docs/technical/entwicklungsverfahren.md`

Prüfe, ob die Spezifikation jede Aussage von req-ui-010 vollständig und richtig umsetzt und nichts festlegt, was req-ui-010 widerspricht. Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `specification-9.md` in dein Arbeitsverzeichnis `work/ablauftest/qa/` im Entwicklungsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde.
