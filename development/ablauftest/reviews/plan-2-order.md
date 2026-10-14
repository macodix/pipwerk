# Prüfauftrag Plan, Durchlauf 2

- Vorhaben: `ablauftest`
- Phase: 3 Planung, Prüfung des Arbeitspaketplans, Nachprüfung
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, mit dem dieser Prüfauftrag auf `main` gebracht wurde (`git log -1 --format=%H -- development/ablauftest/reviews/plan-2-order.md` auf `origin/main`). Nenne ihn vollständig im Bericht.

## Gegenstand

Prüfe `development/ablauftest/plan.md` erneut nach dem Briefing QA, Phase 3. Anlass: Durchlauf 1 ([plan-1.md](plan-1.md)) ist nicht bestanden. Der Softwarearchitekt hat die Befunde P1 bis P4 und die Hinweise H1 bis H4 eingearbeitet.

1. Prüfe, ob P1 bis P4 erledigt sind:
   - P1: Verweise aus den bestehenden Erklärungen im Fließtext auf das Glossar sind `wp01` zugeordnet (Dokumentation in `wp01`, Anwenderdokumentation) und im Abnahmekriterium 6 von `wp01` genannt.
   - P2: Name, Aufruf und Parameter des Prüfskripts beschreibt der Tester Funktion in einem neuen Abschnitt „Prüfskript“ in Abschnitt 6 der technischen Dokumentation, in `wp01` (Umfang, Zeile „Prüfskript“, und Dokumentation in `wp01`); Abnahmekriterium 6 von `wp01` nennt beide Skripte.
   - P3: Abnahmekriterium 5 von `wp01` nennt den Aufrufweg am Rechner der Testumgebung; die technische Dokumentation beschreibt im Abschnitt „Start als Testumgebung“ die Adresse der Schnittstellenbeschreibung am Port des Backends und den Aufruf der Kommandozeile.
   - P4: Backend-Dateien stehen mit vollem Pfad; die Pfadregel sagt das.
2. Prüfe, ob die Hinweise H1 bis H4 sachgerecht berücksichtigt sind.
3. Prüfe, ob die Änderungen neue Fehler enthalten. Die Änderungen gegenüber Durchlauf 1 zeigt `git diff bd4638b370effce3c70f14dec343d37c6e25bd19 <geprüfter Commit> -- development/ablauftest/plan.md`.
4. Neue Befunde an unveränderten Stellen meldest du nur, wenn sie einer Anforderung widersprechen, einen Teil der Spezifikation unabgedeckt lassen oder die Umsetzung verhindern.

## Prüfgrundlagen

- Briefing QA, Phase 3 Plan, in `docs/technical/agentenrollen-und-briefings.md`
- Phase 3, Abschnitte „Ablage“ und „Skripte je Komponente“ in `docs/technical/entwicklungsverfahren.md`
- `development/ablauftest/specification.md`
- `development/ablauftest/scope.md` und die dort genannten Anforderungsdokumente
- Prüfbericht Durchlauf 1 in `development/ablauftest/reviews/plan-1.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `plan-2.md` in dein Arbeitsverzeichnis `work/ablauftest/qa/` im Entwicklungsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde.
