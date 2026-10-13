# Prüfauftrag Spezifikation, Durchlauf 14

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation nach Einwand des Auftraggebers
- Rolle: QA
- zu prüfender Stand: `main`, Commit `1cbe4b884652a11f497d32a434a1a40956d33f84`

## Gegenstand

Prüfe `development/ablauftest/specification.md` gegen die Anforderungen laut `development/ablauftest/scope.md`:

- req-ui-010 „Angaben zu pipwerk Studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/requirements/anforderungen-gesamtsystem.md`, soweit es req-ui-010 berührt

Anlass und Zählung: Durchlauf 13 ([specification-13.md](specification-13.md)) ist nicht bestanden. Der Projektleiter hat mit der Antwort auf Frage `development/ablauftest/questions/ablauftest-07.md` Durchlauf 14 als Nachprüfung freigegeben, nur für R1 und die dafür geänderten Stellen.

## Umfang der Nachprüfung

1. Prüfe, ob der Befund R1 aus `development/ablauftest/reviews/specification-13.md` behoben ist. Eingearbeitet in Abschnitt 4.4:
   - Absatz „Umbruch des Hilfetexts“: Der Parser verwendet `argparse.RawTextHelpFormatter`. Beschreibung und Hilfetexte enthalten ihre Zeilenumbrüche selbst; der Name steht darin nie getrennt. Nur die Einrückung der Hilfetexte der Parameter wählt argparse nach der Breite. Ein Umbruch durch das Terminal bei der Anzeige ist keine Ausgabe von pipwerk Studio.
   - Punkt „Hilfetext der Kommandozeile“: Prüfung bei den Breiten 40, 80 und 200 Zeichen; die Zeilen von Beschreibung und Hilfetexten der Parameter sind bei allen drei Breiten gleich, verglichen ohne führende Leerzeichen.
2. Prüfe, ob die dafür geänderten Stellen neue Fehler enthalten. Die Änderungen gegenüber dem in Durchlauf 13 geprüften Stand zeigt `git diff e1f8a8e605d3ffb8f11f652fc28220dbb0904556 1cbe4b884652a11f497d32a434a1a40956d33f84 -- development/ablauftest/specification.md`. Geändert sind die Zeile „prüfung“ im Status, E1, die Zeile zu `config.py`, `cli.py`, `app.py`, `revision.py` in Abschnitt 3.1, Abschnitt 4.4 (Punkt „Hilfetext der Kommandozeile“ und neuer Absatz „Umbruch des Hilfetexts“), der letzte Punkt in Abschnitt 5 und der letzte Punkt in Abschnitt 8.
3. Neue Befunde an unveränderten Stellen meldest du nur, wenn sie einer Anforderung widersprechen oder die Umsetzung verhindern.

Nach der Antwort auf ablauftest-07 gilt: Befunde, die nur die Ausgestaltung einzelner Tests betreffen, führst du als Hinweise für die Umsetzung. Sie machen die Prüfung nicht „nicht bestanden“; Entwickler und Tester lösen sie in Phase 4.

## Prüfgrundlagen

- Briefing QA, Phase 2 Spezifikation, in `docs/technical/agentenrollen-und-briefings.md`
- Phase 2 in `docs/technical/entwicklungsverfahren.md`
- Antwort des Projektleiters in `development/ablauftest/questions/ablauftest-07.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `specification-14.md` in dein Arbeitsverzeichnis `work/ablauftest/qa/` im Entwicklungsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle Befunde und getrennt davon die Hinweise für die Umsetzung.
