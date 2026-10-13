# Prüfauftrag Spezifikation, Durchlauf 11

- Vorhaben: `ablauftest`
- Phase: 2 Konzeption, Prüfung der Spezifikation nach Einwand des Auftraggebers
- Rolle: QA
- zu prüfender Stand: `main`, Commit `c0836262c021be5d8ccf08072f0bab2b84689272`

## Gegenstand

Prüfe `development/ablauftest/specification.md` gegen die Anforderungen laut `development/ablauftest/scope.md`:

- req-ui-010 „Angaben zu pipwerk Studio“ in `docs/design/requirements/anforderungen-strategiedesigner.md`, in der Fassung mit dem neuen letzten Satz „Überall, wo pipwerk Studio seinen Namen anzeigt oder ausgibt, lautet er „pipwerk Studio“, ebenso in der Dokumentation.“
- `docs/design/requirements/anforderungen-gesamtsystem.md`, soweit es req-ui-010 berührt

Anlass und Zählung: Nach drei nicht bestandenen Durchläufen (8 bis 10) hat der Projektleiter mit der Antwort auf Frage `development/ablauftest/questions/ablauftest-04.md` Durchlauf 11 freigegeben. Zugleich verlangt req-ui-010 jetzt den Namen „pipwerk Studio“ überall. Die Abgrenzung in Abschnitt 8, auf die sich die Befunde K1, L1 und M1 bezogen, und Frage S7 entfallen damit. Die Spezifikation setzt die neue Anforderung mit Entscheidung E10 und den Abschnitten 1, 3.1, 4.1, 4.2, 4.4, 5, 6.2, 7, 8 und 9 um.

Dies ist eine erneute Prüfung. Kontrolliere, ob der Befund aus `development/ablauftest/reviews/specification-10.md` erledigt ist:

- M1: Abschnitt 8 und Schreibweise für neuen Text in der Dokumentation. Prüfe, ob M1 durch die neue Fassung von req-ui-010 und E10 gegenstandslos oder behoben ist.

Prüfe außerdem, ob die Änderung neue Probleme verursacht hat, insbesondere ob E10 und Abschnitt 4.4 den neuen Satz von req-ui-010 vollständig und richtig umsetzen. Die Änderungen gegenüber dem in Durchlauf 10 geprüften Stand zeigt `git diff c8cdc3ee9b02ad7bb998a486eb7a8c1f29151200 c0836262c021be5d8ccf08072f0bab2b84689272 -- development/ablauftest/specification.md`.

## Prüfgrundlagen

- Briefing QA, Phase 2 Spezifikation, in `docs/technical/agentenrollen-und-briefings.md`
- Phase 2 in `docs/technical/entwicklungsverfahren.md`

Prüfe, ob die Spezifikation jede Aussage von req-ui-010 vollständig und richtig umsetzt und nichts festlegt, was req-ui-010 widerspricht. Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht ohne Commit als Datei `specification-11.md` in dein Arbeitsverzeichnis `work/ablauftest/qa/` im Entwicklungsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig und alle Befunde.
