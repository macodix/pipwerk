# Prüfauftrag Arbeitspaketplan, Durchlauf 3 (Überarbeitung nach der Abnahme von wp01)

- Vorhaben: `relay`
- Phase: 3 Planung, Überarbeitung zusammen mit der Spezifikation nach einer nicht bestandenen Abnahme
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, der diesen Prüfauftrag enthält (`git log -1 --format=%H -- development/relay/reviews/plan-3-order.md`); nenne ihn im Bericht vollständig
- vorheriger Prüfbericht: `development/relay/reviews/plan-2.md` (bestanden)

## Gegenstand

Nach dem Abnahmebericht `development/relay/wp01/acceptance/1.md` (Mängel M1 bis M7) sind Spezifikation und Plan `development/relay/plan.md` überarbeitet. Der letzte Eintrag im Änderungsnachweis des Plans nennt die Änderungen: `wp01` liefert pipwerk relay allein und wird ohne MetaTrader 5 abgenommen, der Abruf ist in die neuen Pakete `wp06` und `wp07` gewandert. Änderungen sichtbar mit `git diff 5871ed93f1d26e96a50c3d53bfd0da58a8cd395d <geprüfter Commit> -- development/relay/plan.md`.

Prüfe:

1. Ist jeder Teil der überarbeiteten Spezifikation durch ein Arbeitspaket abgedeckt (Abschnitt „Abdeckung der Spezifikation“), und ist jede Anforderung laut `scope.md` weiterhin durch Spezifikation und Pakete abgedeckt?
2. Endet jedes Paket mit einem Ergebnis, das der Auftraggeber selbst prüfen kann, und hat jedes Paket mit Bedienung ein Abnahmekriterium zur Bedienbarkeit ohne Anleitung?
3. Hängt die Abnahme von `wp01` bis `wp05` weder von MetaTrader 5 noch von `pipwerk-fetch-mt5` ab (M6), und decken die Abnahmekriterien von `wp01` die Mängel M1 bis M5 und M7 prüfbar ab?
4. Sind Abhängigkeiten und Reihenfolge widerspruchsfrei, auch der Umgang mit dem bestehenden Arbeitszweig `relay/wp01`?

Nicht Gegenstand: die Spezifikation selbst (eigener Prüfauftrag `specification-6-order.md`), nicht geänderte Stellen, Hinweise aus früheren Durchläufen, der Code auf dem Arbeitszweig.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- In `docs/technical/entwicklungsverfahren.md`: Phase 3 mit dem Absatz zum Inhalt eines Arbeitspakets, „Umfang der Prüfungen“. Nur blockierende Befunde verhindern das Bestehen, alles andere ist ein Hinweis in einer Zeile. Höchstens etwa 60 Zeilen.
- `development/relay/specification.md`, `development/relay/scope.md`, `development/relay/wp01/acceptance/1.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt und einen konkreten Kritikpunkt oder eine Frage. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `plan-3.md` in das Berichtsverzeichnis `work/relay/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
