# Prüfauftrag Plan, Durchlauf 5

- Vorhaben: `strategiedesign`, ref `strategiedesign`
- Phase: 3, Anpassung von `wp02` an die Spezifikation in der Fassung vom 2026-10-27 nach der dritten Abnahme (`development/strategiedesign/wp02/acceptance/3.md`)
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, der diesen Prüfauftrag anlegt. Den vollständigen Commit liefert `git log -1 --format=%H -- development/strategiedesign/reviews/plan-5-order.md` auf `origin/main`. Nenne ihn im Bericht vollständig.
- vorheriger Durchlauf: `development/strategiedesign/reviews/plan-4.md`, bestanden, zur Fassung vom 2026-10-23

## Gegenstand

Die geänderten Stellen von `development/strategiedesign/plan.md`: `git diff dd0bf1a70c11b46c3e6aff7ac7ec8775a3935bc6 <zu prüfender Commit> -- development/strategiedesign/plan.md`; die oberste Zeile des Änderungsnachweises fasst sie zusammen. Erster Durchlauf für diese Anpassung, beschränkt auf das, was die Spezifikation seit der Fassung vom 2026-10-23 geändert hat (oberste Zeile des Änderungsnachweises der Spezifikation; ihre Prüfung ist `reviews/specification-15.md`).

Prüfe:

- ob jeder geänderte oder neue Teil der Spezifikation durch `wp02` abgedeckt ist und der Plan keinen Teil mehr voraussetzt, der entfallen ist (Assistent, Baustein „Kreuzung“, Kurzform „Verwaltung“);
- ob die geänderten Abnahmekriterien 1, 2 und 12 von `wp02` zur Spezifikation und zu den Entscheidungen E1, E9 und E12 passen, der Auftraggeber sie selbst prüfen kann und `wp02` weiter ein Kriterium zur Bedienbarkeit hat (Entwicklungsverfahren, Phase 3);
- ob die Mängel E1 bis E6 und E9 bis E13 aus `wp02/acceptance/3.md` durch `wp02` abgedeckt sind.

Nicht Gegenstand: `wp01` und `wp03`; nicht geänderte Stellen des Plans, außer sie widersprechen der geltenden Spezifikation; Spezifikation selbst; Dokumente des Auftraggebers; Code.

## Prüfgrundlagen

- dein Briefing, Phase 3
- „Umfang der Prüfungen“ und Phase 3 im Entwicklungsverfahren: Detailtiefe nach Umfang (Testdetails und Formulierungen gehören in die Aufträge, nicht in den Plan), erster Durchlauf dieser Anpassung vollständig, nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis, je Hinweis eine Zeile. Höchstens etwa 60 Zeilen.
- `development/strategiedesign/scope.md` und die dort genannten Dokumente, `development/strategiedesign/specification.md`, `development/strategiedesign/wp02/acceptance/3.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `plan-5.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
