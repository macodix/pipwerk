# Prüfauftrag Spezifikation, Durchlauf 15

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation nach Einwand des Auftraggebers
- Rolle: QA
- zu prüfender Stand: `main`, Commit `47b2a764c163121544a56fbf897b81a65584d714`

## Gegenstand

Prüfe `development/ablauftest/specification.md` gegen die Anforderungen laut `development/ablauftest/scope.md`:

- req-ui-010 „Angaben zu pipwerk Studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/requirements/anforderungen-gesamtsystem.md`, soweit es req-ui-010 berührt

Anlass: Durchlauf 14 ([specification-14.md](specification-14.md)) ist bestanden. Der Auftraggeber hat am 14. Oktober 2026 einen Einwand erhoben (`development/ablauftest/presentations/specification.html`, Folie 5): keine festen Zeilenumbrüche im Hilfetext der Kommandozeile. Der Hilfetext bricht wie bisher nach der Breite des Terminals um. Der Test fasst die Zeilen vor dem Vergleich zusammen, sodass ein Umbruch zwischen „pipwerk“ und „Studio“ nicht als Fehler zählt. Die übrigen Änderungen hat er nicht beanstandet. Durchlauf 15 ist der erste nach dem Einwand.

## Umfang der Nachprüfung

1. Prüfe, ob der Einwand vollständig und richtig eingearbeitet ist. Eingearbeitet in Abschnitt 4.4:
   - Absatz „Umbruch des Hilfetexts“: `RawTextHelpFormatter` entfällt, der Parser behält den Formatierer von argparse ohne Angabe. Beschreibung und Hilfetexte enthalten keine eigenen Zeilenumbrüche, argparse bricht sie nach der Breite um; ein Umbruch zwischen „pipwerk“ und „Studio“ zählt nicht als Fehler. Im Programmcode steht der Name innerhalb einer Zeile und eines Zeichenkettenliterals.
   - Punkt „Hilfetext der Kommandozeile“: Prüfung bei den Breiten 40, 80 und 200 Zeichen nach Zusammenfassen jeder Folge von Leerzeichen, Tabulatoren und Zeilenumbrüchen zu einem Leerzeichen; farbige Ausgabe im Test abgeschaltet. Der Vergleich der Zeilen bei den drei Breiten entfällt.
2. Prüfe, ob die dafür geänderten Stellen neue Fehler enthalten. Die Änderungen gegenüber dem in Durchlauf 14 geprüften Stand zeigt `git diff 1cbe4b884652a11f497d32a434a1a40956d33f84 47b2a764c163121544a56fbf897b81a65584d714 -- development/ablauftest/specification.md`. Geändert sind die Zeilen „stand“ und „prüfung“ im Status, E1, die Zeile zu `config.py`, `cli.py`, `app.py`, `revision.py` in Abschnitt 3.1, Abschnitt 4.4 (Punkt „Hilfetext der Kommandozeile“ und Absatz „Umbruch des Hilfetexts“), der letzte Punkt in Abschnitt 5 und der letzte Punkt in Abschnitt 8.
3. Prüfe, ob die Hinweise U1 bis U3 aus Durchlauf 14 durch die Änderung gegenstandslos oder gelöst sind, wie der Status der Spezifikation es nennt.
4. Neue Befunde an unveränderten Stellen meldest du nur, wenn sie einer Anforderung widersprechen oder die Umsetzung verhindern.

Befunde, die nur die Ausgestaltung einzelner Tests betreffen, führst du wie in Durchlauf 14 als Hinweise für die Umsetzung. Sie machen die Prüfung nicht „nicht bestanden“; Entwickler und Tester lösen sie in Phase 4.

## Prüfgrundlagen

- Briefing QA, Phase 2 Spezifikation, in `docs/technical/agentenrollen-und-briefings.md`
- Phase 2 in `docs/technical/entwicklungsverfahren.md`
- Einwand auf Folie 5 in `development/ablauftest/presentations/specification.html`
- Prüfbericht Durchlauf 14 in `development/ablauftest/reviews/specification-14.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `specification-15.md` in dein Arbeitsverzeichnis `work/ablauftest/qa/` im Entwicklungsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle Befunde und getrennt davon die Hinweise für die Umsetzung.
