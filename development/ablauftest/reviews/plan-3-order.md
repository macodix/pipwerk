# Prüfauftrag Plan, Durchlauf 3

- Vorhaben: `ablauftest`
- Phase: 3 Planung, Prüfung des Arbeitspaketplans, Nachprüfung
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, mit dem dieser Prüfauftrag auf `main` gebracht wurde (`git log -1 --format=%H -- development/ablauftest/reviews/plan-3-order.md` auf `origin/main`). Nenne ihn vollständig im Bericht.

## Gegenstand

Prüfe `development/ablauftest/plan.md` erneut nach dem Briefing QA, Phase 3. Anlass: Durchlauf 2 ([plan-2.md](plan-2.md)) ist nicht bestanden. Der Softwarearchitekt hat den Befund N1 und die Hinweise H5 bis H7 eingearbeitet. Durchlauf 3 ist der dritte und letzte Durchlauf dieser Prüfschleife.

1. Prüfe, ob N1 erledigt ist: Die Pfadregel (Abschnitt vor `wp01`) verlangt für jede Datei außerhalb von `components/pipwerk-studio/frontend/` den vollen Pfad und nennt die Ausnahmen (`LICENSE` im Wurzelverzeichnis, Einträge in `.gitignore`, Befehle und Optionen). Prüfe jede Pfadangabe im Plan gegen diese Regel und gegen die Dateien im geprüften Commit beziehungsweise die neuen Dateien laut Abschnitt 3.1 der Spezifikation.
2. Prüfe, ob die Hinweise H5 bis H7 sachgerecht berücksichtigt sind:
   - H5: Beschreibung des Prüfskripts in einem neuen Abschnitt 6.4 nach Abschnitt 6.3; die Nummern 6.1 bis 6.3 bleiben.
   - H6: Begründung der Zuordnung an den Tester Funktion und Abgleich des Abschnitts durch die QA in Phase 4 (`wp01`, Umfang, Zeile „Prüfskript“).
   - H7: Hinweis in der technischen Dokumentation, dass `/docs` am Port der Oberfläche nicht die Schnittstellenbeschreibung zeigt; Abnahmekriterium 5 von `wp01` gilt nur am Port des Backends.
3. Prüfe, ob die Änderungen neue Fehler enthalten. Die Änderungen gegenüber Durchlauf 2 zeigt `git diff 32424d3ce5aa0fe141287dfbe92d0c87dc08a3c1 <geprüfter Commit> -- development/ablauftest/plan.md`.
4. Neue Befunde an unveränderten Stellen meldest du nur, wenn sie einer Anforderung widersprechen, einen Teil der Spezifikation unabgedeckt lassen oder die Umsetzung verhindern.

## Prüfgrundlagen

- Briefing QA, Phase 3 Plan, in `docs/technical/agentenrollen-und-briefings.md`
- Phase 3, Abschnitte „Ablage“, „Zweige“ und „Skripte je Komponente“ in `docs/technical/entwicklungsverfahren.md`
- `development/ablauftest/specification.md`
- `development/ablauftest/scope.md` und die dort genannten Anforderungsdokumente
- Prüfberichte `development/ablauftest/reviews/plan-1.md` und `development/ablauftest/reviews/plan-2.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `plan-3.md` in dein Arbeitsverzeichnis `work/ablauftest/qa/` im Entwicklungsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde.
