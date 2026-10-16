# Prüfauftrag Spezifikation, Durchlauf 1

- Vorhaben: `strategiedesign`
- Phase: 2 Konzeption, Prüfung der Spezifikation
- Rolle: QA
- zu prüfender Stand: `main`, Commit `f48d259fa257f5c1fb83f172f0e1cef44134319a`

## Gegenstand

`development/strategiedesign/specification.md`.

Prüfe, ob die Spezifikation die Anforderungen der Dokumente laut `development/strategiedesign/scope.md`, Abschnitt „Geltende Dokumente“, vollständig und richtig umsetzt:

- `docs/design/requirements/anforderungen-gesamtsystem.md`
- `docs/design/requirements/anforderungen-strategiedesigner.md`
- `docs/design/domain/fachmodell.md`
- `docs/design/domain/indikator-markttechnik.md`
- Testfälle `str-01` und `str-03` unter `docs/design/strategies/`

## Umfang der Prüfung

1. Jede Anforderung, die das Vorhaben betrifft (Gestalten, Prüfen, Speichern, Öffnen, Löschen von Strategien und Vorlagen, Einstellungen, Oberfläche, Web-API, Speicherung, Dokumentation), ist durch die Spezifikation abgedeckt und richtig umgesetzt.
2. Die Spezifikation widerspricht keiner Anforderung und keiner Festlegung des Fachmodells, und sie trifft keine Entscheidung, die dem Auftraggeber zusteht, ohne sie in Abschnitt 10 zur Bestätigung zu nennen.
3. Beide Testfälle lassen sich mit den spezifizierten Element- und Objekttypen, Ausdrücken und Arbeitsabläufen vollständig gestalten, speichern und wieder laden, und die Konsistenzprüfung meldet für sie keinen Fehler (Abschnitt 6).
4. Die Regelvorlage „Risiko je Trade“ (Abschnitt 3.5) erfüllt req-core-002 für alle dort genannten Fälle. Der Auftraggeber hat die Abbildung im Ausdruck der Spezifikation zugewiesen (`reviews/requirements-6-response.md`). Berücksichtige die Hinweise H23 und H24 aus `reviews/requirements-7.md`.

Nicht Gegenstand: die Ausführung von Strategien, die in `scope.md` und in den Dokumenten als offen gekennzeichneten Punkte, die Vorlagen unter `docs/design/planning/` außer als Hintergrund.

## Prüfgrundlagen

- Briefing QA, Phase 2 Spezifikation, in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Dies ist der erste Durchlauf, melde alle Befunde auf einmal. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis. Spezifikationen legen nur Bausteine, Entscheidungen und Abnahmekriterien fest, so knapp, wie der Umfang es erlaubt; Testdetails, Formulierungen, Schreibweisen und vollständige Listen von Kennungen gehören in die Aufträge und sind kein Befund.
- `docs/technical/pipwerk-studio.md`, `docs/technical/development-test-security-rules.md`, `docs/technical/glossar.md`

Nenne zu jedem Befund Fundstelle (Abschnitt der Spezifikation und Anforderung), Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `specification-1.md` in das Berichtsverzeichnis `work/strategiedesign/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, die blockierenden Befunde und getrennt davon die Hinweise.
