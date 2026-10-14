# Prüfauftrag Plan, Durchlauf 4

- Vorhaben: `ablauftest`
- Phase: 3 Planung, Prüfung des Arbeitspaketplans, Nachprüfung
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, mit dem dieser Prüfauftrag auf `main` gebracht wurde (`git log -1 --format=%H -- development/ablauftest/reviews/plan-4-order.md` auf `origin/main`). Nenne ihn vollständig im Bericht.
- Freigabe: Durchlauf 4 ist nach der Grenze von drei Durchläufen vom Projektleiter freigegeben, siehe Antwort in `development/ablauftest/questions/ablauftest-08.md`.

## Gegenstand

Prüfe `development/ablauftest/plan.md` als Nachprüfung, beschränkt auf den Befund N2, die Hinweise H8 und H9 aus Durchlauf 3 ([plan-3.md](plan-3.md)) und die dafür geänderten Stellen. Andere Stellen prüfst du nicht.

1. N2: Prüfe, ob in `wp01`, Umfang, Zeile „Schreibweise im Backend“, jede Datei des Backends mit vollem Pfad ab dem Wurzelverzeichnis steht und damit der Pfadregel im Abschnitt vor `wp01` entspricht.
2. H8: Prüfe, ob `wp01`, Umfang, Zeile „Prüfskript“, festlegt, dass die Ergänzungen des Entwicklers in Abschnitt 6 von `docs/technical/pipwerk-studio.md` die Nummer 6.4 nicht belegen, und ob die Zeile in sich und mit der Aufzählung zur Dokumentation in `wp01` (Punkt `docs/technical/pipwerk-studio.md`) widerspruchsfrei ist.
3. H9: Prüfe, ob `wp02`, Umfang, Zeile „Gemeinsame Hilfsfunktionen“, `src/RevisionDisplay.tsx` und `src/revisionApi.ts` mit `src/` nennt.
4. Prüfe die geänderten Stellen auf neue Fehler: Statuszeile „prüfung“, die drei genannten Zeilen und den Änderungsnachweis. Die Änderungen gegenüber Durchlauf 3 zeigt `git diff b9c3d77caf608a8ebde2b634f30e9c354cf66189 <geprüfter Commit> -- development/ablauftest/plan.md`.

Nach der Antwort in `ablauftest-08.md` halten Befunde, die nur noch die Schreibweise von Pfaden betreffen, den Plan nicht auf. Führe solche Befunde als Hinweise auf. Sie bestimmen das Ergebnis nicht.

## Prüfgrundlagen

- Briefing QA, Phase 3 Plan, in `docs/technical/agentenrollen-und-briefings.md`
- `development/ablauftest/reviews/plan-3.md`
- `development/ablauftest/questions/ablauftest-08.md` mit Antwort
- `development/ablauftest/specification.md`, Abschnitt 3.1
- `docs/technical/pipwerk-studio.md`, Abschnitt 6, und die versionierten Dateien der Komponente im geprüften Commit

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `plan-4.md` in dein Arbeitsverzeichnis `work/ablauftest/qa/` im Entwicklungsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde.
