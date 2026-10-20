# Prüfauftrag Plan, Durchlauf 3

- Vorhaben: `strategiedesign`, ref `strategiedesign`
- Phase: 3, Neufassung von `wp02` und `wp03` (`plan`)
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, der diesen Prüfauftrag anlegt. Den vollständigen Commit liefert `git log -1 --format=%H -- development/strategiedesign/reviews/plan-3-order.md` auf `origin/main`.
- vorheriger Durchlauf: `development/strategiedesign/reviews/plan-2.md`, bestanden, zur Fassung vom 2026-10-16

## Gegenstand

`development/strategiedesign/plan.md`: Status, Übersicht, `wp02`, `wp03`, Tabelle der Abdeckung und Änderungsnachweis (erste Zeile). `wp02` und `wp03` sind nach der Neufassung der Spezifikation neu gefasst; für sie ist dies ein erster Durchlauf. `wp01` ist abgenommen und übernommen (`done`) und nicht Gegenstand.

Prüfe nach dem Briefing QA für Phase 3, ob jede Anforderung der geltenden Dokumente laut `development/strategiedesign/scope.md` durch die Spezifikation und jeder Teil der Spezifikation `development/strategiedesign/specification.md` durch ein Arbeitspaket abgedeckt ist. Prüfe außerdem:

- ob jedes Paket mit einem Ergebnis endet, das der Auftraggeber selbst prüfen kann;
- ob jedes Paket mit Oberfläche ein Abnahmekriterium zur Bedienbarkeit hat (Entwicklungsverfahren, Phase 3);
- ob die Mängel M1 bis M17 aus `development/strategiedesign/wp02/acceptance/1.md` durch den Umfang von `wp02` abgedeckt sind;
- ob die Stellen des Plans, die Hinweis T2-H6 aus `development/strategiedesign/reviews/specification-9.md` nennt, zur Spezifikation passen.

Nicht Gegenstand: `wp01`, Spezifikation selbst (bestanden in `specification-10.md`), Code.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Detailtiefe nach Umfang (Testdetails und Formulierungen gehören in die Aufträge, nicht in den Plan), erster Durchlauf vollständig, nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis.
- Phase 3 in `docs/technical/entwicklungsverfahren.md`
- `development/strategiedesign/scope.md` und die dort genannten Dokumente, `development/strategiedesign/specification.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `plan-3.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
