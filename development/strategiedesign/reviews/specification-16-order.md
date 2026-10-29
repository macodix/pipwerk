# Prüfauftrag Spezifikation, Durchlauf 16

- Vorhaben: `strategiedesign`, ref `strategiedesign/wp02`
- Phase: 4, Prüfung des Entwurfs von `wp02` (`development/strategiedesign/wp02/conformance-1.md`). Die Umsetzung weicht an zwei Stellen von der Spezifikation ab, und die Abweichung ist die bessere Lösung; deshalb ist die Spezifikation ergänzt, nicht die Umsetzung (Entwicklungsverfahren, „Prüfung des Entwurfs“).
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, der diesen Prüfauftrag anlegt. Den vollständigen Commit liefert `git log -1 --format=%H -- development/strategiedesign/reviews/specification-16-order.md` auf `origin/main`. Nenne ihn im Bericht vollständig.
- vorheriger Durchlauf: `development/strategiedesign/reviews/specification-15.md`, bestanden

## Gegenstand

Erster Durchlauf für diese Ergänzung, beschränkt auf `git diff 9e9e6ca79582cdb25e0eeff7d6e99be300202e9e <zu prüfender Commit> -- development/strategiedesign/specification.md`. Die oberste Zeile des Änderungsnachweises fasst sie zusammen:

1. E2 nennt zusätzlich Kennungen, erste Verwendung und Verwendbarkeit, Einfügen und Entfernen als Arbeit der Bibliothek. Widerspricht das einer anderen Stelle der Spezifikation (3.3, 3.4, 5)?
2. 4.2 nennt die Endpunkte `/api/v1/keys`, `/api/v1/usage`, `/api/v1/insert` und `/api/v1/removals`. Passt ihr Zweck zu 3.3 und 3.4? Vergleiche mit der technischen Dokumentation `docs/technical/pipwerk-studio.md` Abschnitte 5.2.2 bis 5.2.5 auf dem Zweig `strategiedesign/wp02` und mit `contracts/api/pipwerk-studio/v1/openapi.json` dort.
3. E8 erlaubt, Code des Prototyps zu übernehmen, wenn er E2 erfüllt und wie anderer Code geprüft wird. Widerspricht das der Antwort des Auftraggebers in `development/strategiedesign/questions/strategiedesign-04.md` oder einer anderen Festlegung seiner Dokumente?
4. Die Ergänzung ist als rein technisch vermerkt. Ändert sie eine Anforderung, ein Abnahmekriterium oder den Umfang eines Arbeitspakets (`development/strategiedesign/plan.md`)?

Nicht Gegenstand: die übrigen Stellen der Spezifikation; der Prüfbericht zum Entwurf `wp02/conformance-1.md` selbst; Code; Arbeitspaketplan.

## Prüfgrundlagen

- dein Briefing
- „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ im Entwicklungsverfahren: alle Befunde auf einmal, nur blockierende Befunde verhindern das Bestehen, Hinweise je eine Zeile, höchstens etwa 60 Zeilen.
- `development/strategiedesign/scope.md` und die dort genannten Dokumente

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-16.md` in das Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
