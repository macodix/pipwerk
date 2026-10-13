# Prüfauftrag Spezifikation, Durchlauf 13

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation nach Einwand des Auftraggebers
- Rolle: QA
- zu prüfender Stand: `main`, Commit `e1f8a8e605d3ffb8f11f652fc28220dbb0904556`

## Gegenstand

Prüfe `development/ablauftest/specification.md` gegen die Anforderungen laut `development/ablauftest/scope.md`:

- req-ui-010 „Angaben zu pipwerk Studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/requirements/anforderungen-gesamtsystem.md`, soweit es req-ui-010 berührt

Anlass und Zählung: Durchlauf 12 ([specification-12.md](specification-12.md)) ist nicht bestanden. Der Projektleiter hat mit der Antwort auf Frage `development/ablauftest/questions/ablauftest-06.md` Durchlauf 13 als Nachprüfung im Umfang wie Durchlauf 12 freigegeben.

## Umfang der Nachprüfung

Der Umfang ist durch die Antwort auf ablauftest-06 begrenzt: nur Q1 und die dafür geänderten Stellen.

1. Prüfe, ob der Befund Q1 aus `development/ablauftest/reviews/specification-12.md` behoben ist. Eingearbeitet in Abschnitt 4.4:
   - Bedeutung von „richtig geschrieben“: Jede Zeichenfolge `pipwerk[ -]studio` lautet genau „pipwerk Studio“ oder genau den Bezeichner `pipwerk-studio` in Kleinbuchstaben, wie bei der Suche im Repository.
   - Geprüft wird jeweils der Text, so wie pipwerk Studio ihn ausgibt, einschließlich des Programmnamens `pipwerk-studio`, den die Kommandozeile Hilfetext und Fehlermeldungen voranstellt. Die Fehlermeldung beim Start wird als vollständige Ausgabe auf der Fehlerausgabe geprüft.
2. Prüfe, ob die dafür geänderten Stellen neue Fehler enthalten. Die Änderungen gegenüber dem in Durchlauf 12 geprüften Stand zeigt `git diff 72e46e94dfde7ab96b26e89d2c8ba7c6d8ea0ecd e1f8a8e605d3ffb8f11f652fc28220dbb0904556 -- development/ablauftest/specification.md`. Geändert sind nur die Zeile „prüfung“ im Status und Abschnitt 4.4 (einleitender Absatz und erster Punkt der Liste).
3. Neue Befunde an unveränderten Stellen meldest du nur, wenn sie einer Anforderung widersprechen oder die Umsetzung verhindern.

## Prüfgrundlagen

- Briefing QA, Phase 2 Spezifikation, in `docs/technical/agentenrollen-und-briefings.md`
- Phase 2 in `docs/technical/entwicklungsverfahren.md`
- Antwort des Projektleiters in `development/ablauftest/questions/ablauftest-06.md`: Der Programmname `pipwerk-studio` bleibt als technischer Name unverändert.

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `specification-13.md` in dein Arbeitsverzeichnis `work/ablauftest/qa/` im Entwicklungsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde.
