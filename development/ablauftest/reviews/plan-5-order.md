# Prüfauftrag Plan, Durchlauf 5

- Vorhaben: `ablauftest`
- Phase: 3 Planung, Prüfung des Arbeitspaketplans, Nachprüfung nach dem Einwand des Auftraggebers
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, mit dem dieser Prüfauftrag auf `main` gebracht wurde (`git log -1 --format=%H origin/main -- development/ablauftest/reviews/plan-5-order.md`). Nenne ihn vollständig im Bericht.
- Anlass: Einwand des Auftraggebers zum Plan, vermerkt in `development/ablauftest/presentations/plan.html`, Folie 4: ein einziges Arbeitspaket `wp01` mit einer Abnahme. Inhalt und Abnahmekriterien beider bisherigen Pakete werden zusammengeführt; das Testumgebungsskript entsteht im selben Paket. Der Einwand eröffnet eine neue Prüfschleife; dies ist ihr erster Durchlauf.

## Gegenstand

Prüfe `development/ablauftest/plan.md` in der zusammengeführten Fassung. Den Stand vor dem Einwand zeigt `git show 87096ed4f7b30dc56f1719f0e201a4586a736736:development/ablauftest/plan.md`, die Änderungen zeigt `git diff 87096ed4f7b30dc56f1719f0e201a4586a736736 <geprüfter Commit> -- development/ablauftest/plan.md`.

1. Einwand: Prüfe, ob der Plan genau ein Arbeitspaket `wp01` mit einer Abnahme enthält, ob das Testumgebungsskript darin enthalten ist und ob kein Verweis auf ein Paket `wp02` und keine Abhängigkeit zwischen Paketen übrig ist.
2. Vollständigkeit der Zusammenführung: Prüfe, ob jede Zeile des Umfangs, jeder Punkt der Dokumentation, des Nicht-Umfangs und der umgesetzten Teile der Spezifikation und jedes Abnahmekriterium der beiden bisherigen Pakete inhaltlich im neuen `wp01` steht. Die bisherigen Kriterien 6 von `wp01` und 8 von `wp02` zur Dokumentation sind im neuen Kriterium 13 zusammengefasst; prüfe, ob dabei keine Aussage verloren gegangen ist.
3. Abdeckung: Prüfe, ob jede Anforderung durch die Spezifikation und jeder Teil der Spezifikation durch das Paket abgedeckt ist, einschließlich der Tabelle „Abdeckung von req-ui-010“.
4. Bestandteile: Prüfe, ob das Paket Ziel, Umfang, Nicht-Umfang, umgesetzte Teile der Spezifikation, Abhängigkeiten und Abnahmekriterien hat und mit einem Ergebnis endet, das der Auftraggeber selbst prüfen kann.
5. Neue Stellen: Prüfe den Absatz „Reihenfolge innerhalb des Pakets“, die Ergänzungen in der Zeile „Prüfskript“ (Pflege bei weiteren Aufträgen, Ort der Tests des Dialogs in 6.2 und 6.3), die Statuszeile „prüfung“ und den Änderungsnachweis einschließlich der Nachtragung zu Hinweis H10 aus `plan-4.md` auf Widersprüche zur Spezifikation, zum Entwicklungsverfahren und innerhalb des Plans.

Nach der Antwort in `development/ablauftest/questions/ablauftest-08.md` halten Befunde, die nur noch die Schreibweise von Pfaden betreffen, den Plan nicht auf. Führe solche Befunde als Hinweise auf. Sie bestimmen das Ergebnis nicht.

## Prüfgrundlagen

- Briefing QA, Phase 3 Plan, in `docs/technical/agentenrollen-und-briefings.md`
- `docs/technical/entwicklungsverfahren.md`, Abschnitte „Phase 3 – Planung“ und „Phase 4 – Umsetzung eines Arbeitspakets“
- `development/ablauftest/presentations/plan.html`, Folie 4, mit dem Einwand
- `development/ablauftest/scope.md` und die dort genannten Anforderungsdokumente, insbesondere req-ui-010
- `development/ablauftest/specification.md`
- `development/ablauftest/reviews/plan-4.md` und `development/ablauftest/questions/ablauftest-08.md` mit Antwort
- `docs/technical/pipwerk-studio.md` und die versionierten Dateien der Komponente im geprüften Commit

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `plan-5.md` in dein Arbeitsverzeichnis `work/ablauftest/qa/` im Entwicklungsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde.
