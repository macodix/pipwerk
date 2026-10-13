# Prüfauftrag Spezifikation, Durchlauf 12

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation nach Einwand des Auftraggebers
- Rolle: QA
- zu prüfender Stand: `main`, Commit `72e46e94dfde7ab96b26e89d2c8ba7c6d8ea0ecd`

## Gegenstand

Prüfe `development/ablauftest/specification.md` gegen die Anforderungen laut `development/ablauftest/scope.md`:

- req-ui-010 „Angaben zu pipwerk Studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/requirements/anforderungen-gesamtsystem.md`, soweit es req-ui-010 berührt

Anlass und Zählung: Durchlauf 11 ([specification-11.md](specification-11.md)) ist nicht bestanden. Der Projektleiter hat mit der Antwort auf Frage `development/ablauftest/questions/ablauftest-05.md` Durchlauf 12 als Nachprüfung freigegeben.

## Umfang der Nachprüfung

Der Umfang ist durch die Antwort auf ablauftest-05 begrenzt:

1. Prüfe, ob die Befunde aus `development/ablauftest/reviews/specification-11.md` behoben sind:
   - P1: Prüfung der Schnittstellenbeschreibung in Abschnitt 4.4 gegen die Bezeichner nach E10. Eingearbeitet in Abschnitt 4.4: Bedeutung von „richtig geschrieben“ mit der Kurzform „Studio“ als ganzes Wort, geprüfte Felder der Schnittstellenbeschreibung einzeln genannt, die Felder `title` unter `components.schemas` und unter `paths` ausgenommen.
   - P2: Geltungsbereich der Kurzform „Studio“ in E10. Eingearbeitet in E10: Die Kurzform wird in (a), (b) und (c) ersetzt. In (d) wird nur die volle Form angeglichen, die Kurzform darf dort bleiben, auch in Testtexten, Paketbeschreibung, Beispielkonfiguration und Texten von Ausnahmen. Wird ein Text aus (d) angezeigt oder ausgegeben, gilt (a) beziehungsweise (b).
2. Prüfe, ob die dafür geänderten Stellen neue Fehler enthalten. Die Änderungen gegenüber dem in Durchlauf 11 geprüften Stand zeigt `git diff c0836262c021be5d8ccf08072f0bab2b84689272 72e46e94dfde7ab96b26e89d2c8ba7c6d8ea0ecd -- development/ablauftest/specification.md`. Geändert sind nur die Zeile „prüfung“ im Status, E10 und Abschnitt 4.4.
3. Neue Befunde an unveränderten Stellen meldest du nur, wenn sie einer Anforderung widersprechen oder die Umsetzung verhindern.

## Prüfgrundlagen

- Briefing QA, Phase 2 Spezifikation, in `docs/technical/agentenrollen-und-briefings.md`
- Phase 2 in `docs/technical/entwicklungsverfahren.md`
- Antwort des Projektleiters in `development/ablauftest/questions/ablauftest-05.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `specification-12.md` in dein Arbeitsverzeichnis `work/ablauftest/qa/` im Entwicklungsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde.
