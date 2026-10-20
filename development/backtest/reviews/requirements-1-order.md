# Prüfauftrag Dokumente des Auftraggebers, Durchlauf 1

- Vorhaben: `backtest`
- Phase: 1 Anforderung, Prüfung der Dokumente des Auftraggebers vor der Präsentation
- Rolle: QA
- zu prüfender Stand: `main`, Commit `b2179b9206ff20401271a50bcc115979588ad5dc`

## Gegenstand

Prüfe jedes Dokument laut `development/backtest/scope.md`, Abschnitt „Geltende Dokumente“:

Anforderungsdokumente:

- `docs/design/requirements/anforderungen-gesamtsystem.md`
- `docs/design/requirements/anforderungen-strategietester-backtester.md`, einschließlich seiner Widerspruchsfreiheit zum Anforderungsdokument des Gesamtsystems

Fachmodell und Strategiebeschreibungen des Auftraggebers, ebenfalls auf Widersprüche, Lücken und mehrdeutige Begriffe sowie auf Widerspruchsfreiheit untereinander und zu den Anforderungsdokumenten:

- `docs/design/domain/fachmodell.md`, insbesondere die Ausführung von Strategien, Orders, Positionen und Regeln
- `docs/design/domain/indikator-markttechnik.md`
- `docs/design/strategies/str-01-fachlich-scalping-punkt-2-ausbruch-einfach.md` (Testfall `str-01`)
- `docs/design/strategies/str-03-fachlich-ema-trendfolge.md` (Testfall `str-03`)

Nachweis des Vorhabens ist laut `scope.md`: Jeder der beiden Testfälle lässt sich im Strategietester schrittweise prüfen und im Backtester über den vorbelegten Testzeitraum testen, ohne die Strategie dafür zu bearbeiten. Prüfe deshalb auch, ob sich jeder Testfall mit den beschriebenen Objekten und Arbeitsabläufen vollständig abbilden lässt, und nenne jede Stelle eines Testfalls, bei der das nicht gelingt.

Suche Widersprüche, Lücken, mehrdeutige Begriffe, nicht gekennzeichnete offene Fragen und Umsetzungsdetails. Prüfe außerdem das Glossar `docs/technical/glossar.md` auf Widersprüche zu den geprüften Dokumenten.

Nicht Gegenstand:

- die in `scope.md` nur zum Vergleich genannten Dokumente `anforderungen-strategiedesigner.md` und `anforderungen-handelssystem.md`, außer sie widersprechen einem geprüften Dokument
- die Vorlagen unter `docs/design/planning/`; sie sind keine Festlegung
- die technischen Dokumente unter `docs/technical/` außer dem Glossar
- Spezifikation, Plan und Code des Vorhabens `strategiedesign`
- die in `scope.md` unter „Offene Punkte des Auftraggebers“ genannten und in den Dokumenten als offen gekennzeichneten Punkte. Sie werden nicht erneut als Befund gemeldet. Ein Befund ist es nur, wenn ein solcher Punkt doch für das Prüfen oder Testen eines Testfalls nötig ist oder in den Dokumenten nicht als offen gekennzeichnet ist.

## Prüfgrundlagen

- Briefing QA, Phase 1, in `docs/technical/agentenrollen-und-briefings.md`
- Phase 1, „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“ und „Lücken“) in `docs/technical/entwicklungsverfahren.md`. Dies ist der erste Durchlauf: Melde alle Befunde auf einmal. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis. Eine Lücke ist nur blockierend, wenn ohne sie Betrieb, Umsetzung oder Sicherheit der Software beeinträchtigt sind.
- `development/backtest/scope.md`

Ordne jeden Befund nach „Fragen an den Auftraggeber“ zu: folgt aus einer Festlegung (mit Angabe der Festlegung), Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers. Fragen stellst du nur in der letzten Gruppe.

Nenne zu jedem Befund Fundstelle (Datei und Abschnitt oder Kennung), Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest und triff keine Entscheidung über Inhalte des Auftraggebers.

## Ablage

Schreibe den Prüfbericht als Datei `requirements-1.md` in das Berichtsverzeichnis `work/backtest/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
