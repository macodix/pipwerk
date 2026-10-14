# Prüfauftrag Plan, Durchlauf 1

- Vorhaben: `ablauftest`
- Phase: 3 Planung, Prüfung des Arbeitspaketplans
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, mit dem dieser Prüfauftrag auf `main` gebracht wurde (`git log -1 --format=%H -- development/ablauftest/reviews/plan-1-order.md` auf `origin/main`). Nenne ihn vollständig im Bericht.

## Gegenstand

Prüfe `development/ablauftest/plan.md` nach dem Briefing QA, Phase 3:

1. Ist jede Anforderung laut `development/ablauftest/scope.md` durch die Spezifikation abgedeckt? Maßgeblich ist req-ui-010 „Angaben zu pipwerk Studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md` in der Fassung vom 14. Oktober 2026, einschließlich des neuen Satzes „Ein Zeilenumbruch zwischen „pipwerk“ und „Studio“ ist zulässig.“
2. Ist jeder Teil der Spezifikation `development/ablauftest/specification.md` durch ein Arbeitspaket abgedeckt, ohne Lücke und ohne Doppelung, die zu widersprüchlicher Umsetzung führen kann? Prüfe dazu die Abschnitte „Umfang“ und „Umgesetzte Teile der Spezifikation“ beider Pakete gegen alle Abschnitte der Spezifikation, insbesondere Abschnitt 3.1 Zeile für Zeile und Abschnitt 7.
3. Enthält jedes Paket Ziel, Umfang, Nicht-Umfang, umgesetzte Teile der Spezifikation, Abhängigkeiten und Abnahmekriterien? Endet jedes Paket mit einem Ergebnis, das der Auftraggeber selbst prüfen kann? Sind die Abnahmekriterien prüfbar und decken sie den Umfang ab?
4. Sind die Abhängigkeiten richtig und vollständig? Kann `wp01` ohne `wp02` umgesetzt, bereitgestellt und abgenommen werden?

Die Spezifikation ist vom Auftraggeber bestätigt und nicht Gegenstand dieser Prüfung. Stellst du dabei einen Widerspruch zwischen Spezifikation und req-ui-010 fest, nenne ihn als Befund.

## Prüfgrundlagen

- Briefing QA, Phase 3 Plan, in `docs/technical/agentenrollen-und-briefings.md`
- Phase 3 und Abschnitt „Ablage“ in `docs/technical/entwicklungsverfahren.md`
- `development/ablauftest/specification.md`
- `development/ablauftest/scope.md` und die dort genannten Anforderungsdokumente
- Bestätigung der Spezifikation auf Folie 5 in `development/ablauftest/presentations/specification.html`
- Prüfbericht `development/ablauftest/reviews/specification-16.md` (Hinweise W1 und W2)

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `plan-1.md` in dein Arbeitsverzeichnis `work/ablauftest/qa/` im Entwicklungsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde.
