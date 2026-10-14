# Prüfauftrag Spezifikation, Durchlauf 16

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation nach Einwand des Auftraggebers, Nachprüfung
- Rolle: QA
- zu prüfender Stand: `main`, Commit `ad72f879f2caa83a3c6e08c388eeb46baaf55063`

## Gegenstand

Prüfe `development/ablauftest/specification.md` gegen die Anforderungen laut `development/ablauftest/scope.md`:

- req-ui-010 „Angaben zu pipwerk Studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/requirements/anforderungen-gesamtsystem.md`, soweit es req-ui-010 berührt

Anlass: Durchlauf 15 ([specification-15.md](specification-15.md)), der erste nach dem Einwand des Auftraggebers vom 14. Oktober 2026, ist bestanden. Danach hat der Softwarearchitekt den Hinweis V1 aus Durchlauf 15 eingearbeitet. Weil sich die Spezifikation damit nach der Prüfung geändert hat, ist eine Nachprüfung nötig. Durchlauf 16 ist der zweite nach dem Einwand.

## Umfang der Nachprüfung

1. Prüfe, ob der Hinweis V1 aus `development/ablauftest/reviews/specification-15.md` erledigt ist. Eingearbeitet in Abschnitt 4.4, Absatz „Umbruch des Hilfetexts“: argparse bricht mit dem Modul `textwrap` um, an Leerzeichen, nach Bindestrichen und bei zu langen Wörtern auch innerhalb des Worts. Beschreibung und Hilfetexte enthalten den Bezeichner `pipwerk-studio` nicht; der Programmname steht nur in der Zeile `usage:` und vor Fehlermeldungen.
2. Prüfe, ob die geänderten Stellen neue Fehler enthalten. Die Änderungen gegenüber dem in Durchlauf 15 geprüften Stand zeigt `git diff 47b2a764c163121544a56fbf897b81a65584d714 ad72f879f2caa83a3c6e08c388eeb46baaf55063 -- development/ablauftest/specification.md`. Geändert sind die Zeile „prüfung“ im Status und der Absatz „Umbruch des Hilfetexts“ in Abschnitt 4.4.
3. Neue Befunde an unveränderten Stellen meldest du nur, wenn sie einer Anforderung widersprechen oder die Umsetzung verhindern.

Befunde, die nur die Ausgestaltung einzelner Tests betreffen, führst du als Hinweise für die Umsetzung. Sie machen die Prüfung nicht „nicht bestanden“; Entwickler und Tester lösen sie in Phase 4.

## Prüfgrundlagen

- Briefing QA, Phase 2 Spezifikation, in `docs/technical/agentenrollen-und-briefings.md`
- Phase 2 in `docs/technical/entwicklungsverfahren.md`
- Einwand auf Folie 5 in `development/ablauftest/presentations/specification.html`
- Prüfbericht Durchlauf 15 in `development/ablauftest/reviews/specification-15.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `specification-16.md` in dein Arbeitsverzeichnis `work/ablauftest/qa/` im Entwicklungsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle Befunde und getrennt davon die Hinweise für die Umsetzung.
