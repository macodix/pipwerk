# Prüfauftrag Spezifikation, Durchlauf 8

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation nach Einwand des Auftraggebers
- Rolle: QA
- zu prüfender Stand: `main`, Commit `29f41c7ce0b5764c8aeb027e20ee89024d5f77c9`

## Gegenstand

Prüfe `development/ablauftest/specification.md` gegen die Anforderungen laut `development/ablauftest/scope.md`:

- req-ui-010 „Angaben zu pipwerk Studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/requirements/anforderungen-gesamtsystem.md`, soweit es req-ui-010 berührt

Anlass: Der Auftraggeber hat die Spezifikation am 13.10.2026 mit einer Änderung bestätigt. Der Name lautet „pipwerk Studio“ statt „pipwerk studio“. req-ui-010 und `docs/design/projektziel.md` wurden entsprechend angepasst. Der Vermerk steht in `development/ablauftest/presentations/specification.html`.

Zählung: Dies ist Durchlauf 8, der erste einer neuen Prüfschleife nach dem Einwand des Auftraggebers. Durchlauf 7 (`development/ablauftest/reviews/specification-7.md`) war bestanden.

Prüfe, ob die Spezifikation die geänderte Schreibweise überall richtig umsetzt, ob sie an anderer Stelle noch die alte Schreibweise verwendet und ob die Änderung neue Probleme verursacht hat, insbesondere in den Abschnitten 8 und 9. Die Änderungen gegenüber dem in Durchlauf 7 geprüften Stand zeigt `git diff 78b4e755a6f5ca510194a16e9b69e756f1a2b400 29f41c7ce0b5764c8aeb027e20ee89024d5f77c9 -- development/ablauftest/specification.md docs/design development/ablauftest/scope.md`.

## Prüfgrundlagen

- Briefing QA, Phase 2 Spezifikation, in `docs/technical/agentenrollen-und-briefings.md`
- Phase 2 in `docs/technical/entwicklungsverfahren.md`

Prüfe, ob die Spezifikation jede Aussage von req-ui-010 vollständig und richtig umsetzt und nichts festlegt, was req-ui-010 widerspricht. Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `specification-8.md` in dein Arbeitsverzeichnis `work/ablauftest/qa/` im Entwicklungsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde.
