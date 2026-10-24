# Prüfauftrag Plan, Durchlauf 4

- Vorhaben: `strategiedesign`, ref `strategiedesign`
- Phase: 3, Anpassung von `wp02` und `wp03` an die Spezifikation in der Fassung vom 2026-10-23 (`plan`)
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, der diesen Prüfauftrag anlegt. Den vollständigen Commit liefert `git log -1 --format=%H -- development/strategiedesign/reviews/plan-4-order.md` auf `origin/main`.
- vorheriger Durchlauf: `development/strategiedesign/reviews/plan-3.md`, bestanden, zur Fassung vom 2026-10-20

## Gegenstand

Die geänderten Stellen von `development/strategiedesign/plan.md`: `git diff c63f37eecbb3bed00c61c3d579f415dcbaf905e4 <zu prüfender Commit> -- development/strategiedesign/plan.md`; die erste Zeile des Änderungsnachweises fasst sie zusammen. Erster Durchlauf für diese Anpassung, beschränkt auf das, was die Spezifikation seit der Fassung vom 2026-10-20 geändert hat (Änderungsnachweis der Spezifikation, Zeilen vom 2026-10-21 bis 2026-10-23; Spezifikation bestanden in `specification-14.md`).

Prüfe:

- ob jeder seit der Fassung vom 2026-10-20 geänderte oder neue Teil der Spezifikation `development/strategiedesign/specification.md` durch ein Arbeitspaket abgedeckt ist und der Plan keinen Teil mehr voraussetzt, der entfallen ist (zum Beispiel `Markttechnik`, „Parameter setzen“, Bereich „Objekte und ihre Werte“, Prototyp als bestätigte Vorlage, Methoden der mitgelieferten Typen);
- ob die geänderten Abnahmekriterien von `wp02` und `wp03` zur Spezifikation passen, der Auftraggeber sie selbst prüfen kann und jedes Paket mit Oberfläche weiter ein Kriterium zur Bedienbarkeit hat (Entwicklungsverfahren, Phase 3);
- ob M1 und M2 aus `development/strategiedesign/wp02/acceptance/2.md` durch `wp02` abgedeckt sind.

Nicht Gegenstand: `wp01`; nicht geänderte Stellen des Plans, außer sie widersprechen der geltenden Spezifikation; Spezifikation selbst; Dokumente des Auftraggebers; Code.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Detailtiefe nach Umfang (Testdetails und Formulierungen gehören in die Aufträge, nicht in den Plan), erster Durchlauf dieser Anpassung vollständig, nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis, je Hinweis eine Zeile. Höchstens etwa 60 Zeilen.
- Phase 3 in `docs/technical/entwicklungsverfahren.md`
- `development/strategiedesign/scope.md` und die dort genannten Dokumente, `development/strategiedesign/specification.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `plan-4.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
