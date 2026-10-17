# Prüfauftrag QA, Ergänzung der Spezifikation in Phase 4, Durchlauf 4

- Vorhaben: `strategiedesign`, ref `strategiedesign/wp02`
- Phase: 4 Umsetzung, Lücke der Spezifikation (Entwicklungsverfahren, Abschnitt „Meldungen“, vorletzter Absatz)
- Rolle: QA
- zu prüfender Stand: der Commit auf `main`, der diesen Prüfauftrag enthält. Prüfe genau den Stand, den `git log -1 -- development/strategiedesign/reviews/specification-4-order.md` auf `origin/main` nennt, und nenne ihn vollständig im Bericht.
- Gegenstand: `development/strategiedesign/specification.md`, Abschnitt 3.1 (neue Zeilen der Tabelle der Typbeschreibung und der Absatz darunter) und die Zeile „ergänzung in Phase 4“ im Status; `development/strategiedesign/plan.md`, Paket `wp02` (Umfang, Nicht-Umfang, umgesetzte Teile), Tabelle der Abdeckung, Status und Änderungsnachweis.

## Anlass

Bei der Umsetzung von `wp02` fehlen der Oberfläche Angaben der Typbeschreibung, die sie nach E2 nicht aus eigener Typkenntnis nehmen darf: an welchem Ausgang die Verwaltung hängt (Abnahmekriterium 4 von `wp02`: Verwaltung als Rahmen am Ausgang `gestellt`), über welches Objekt der Anwendung Ausdrücke die Strategieparameter ansprechen (Abnahmekriterium 6, Vorschläge der Ausdruckseingabe), mit welchem Auslöser eine neue Strategie beginnt (Abnahmekriterium 2) und welche Elemente einen Namen tragen. Nachweis: Testbericht `strategiedesign/wp02:development/strategiedesign/wp02/tests/01-functiontest-1.md`, Hinweis H1, und `docs/technical/pipwerk-studio.md` Abschnitt 2.3 „Ableitungen aus den Typbeschreibungen“ auf dem Zweig `strategiedesign/wp02-01`.

## Umfang der Prüfung

Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Geprüft werden nur die geänderten Stellen und ihr Verhältnis zur übrigen Spezifikation, zum Plan und zu den Dokumenten laut `development/strategiedesign/scope.md`. Nur blockierende Befunde verhindern das Bestehen, alles andere steht als Hinweis im Bericht.

1. Setzen die ergänzten Felder die Anforderungen richtig um und widersprechen sie keiner Anforderung, keinem Fachmodell, keiner bestätigten Festlegung der Spezifikation (insbesondere E2, 3.2, 3.3, 3.4, 5.2, 5.3)?
2. Ist jeder ergänzte Teil der Spezifikation durch das Paket `wp02` abgedeckt, und sind Umfang, Nicht-Umfang und Abdeckung des Plans in sich und mit `wp01` und `wp03` widerspruchsfrei?
3. Bleiben Abnahmekriterien von `wp02` unverändert prüfbar?

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- `development/strategiedesign/specification.md`, `development/strategiedesign/plan.md`, `development/strategiedesign/scope.md` und die dort genannten Dokumente des Auftraggebers
- Prüfberichte `development/strategiedesign/reviews/specification-3.md` und `plan-2.md`

Nenne zu jedem Befund Fundstelle und Sachverhalt mit konkreter Frage oder konkretem Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/reports/specification-4.md`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, die Befunde und getrennt davon die Hinweise.
