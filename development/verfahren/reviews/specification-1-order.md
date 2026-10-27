# Prüfauftrag Spezifikation, Durchlauf 1

- Vorhaben: `verfahren` (Entwicklungsverfahren verbessern)
- Phase: 2 Konzeption, Prüfung der Spezifikation mit `specify`
- Rolle: QA
- zu prüfender Stand: `main`, Commit `4a17211dbb8065ddf6c815f7702dd7b6b0536ecb`

Dies ist der erste Durchlauf. Melde alle Befunde auf einmal.

## Gegenstand

`development/verfahren/specification.md`, vollständig.

Prüfe gegen die Dokumente des Auftraggebers:

1. Setzt die Spezifikation jede der Festlegungen 1 bis 7 in `development/verfahren/scope.md` um, ohne sie zu ändern oder einzuschränken?
2. Gibt Abschnitt 7.4 Aufbau und Bedienung des bestätigten Oberflächenentwurfs wieder (`development/verfahren/questions/verfahren-02.md`, Frage 1 mit den fünf bestätigten Punkten und der Antwort; Entwurf `development/verfahren/prototype/uebersicht-prototyp.html`)?
3. Trägt Abschnitt 4.1 den Befund zur verspäteten Wiedervorlage im Abschnitt „Stand“ von `scope.md`?
4. Sind die Antworten aus `development/verfahren/questions/verfahren-01.md` (Fragen 2 und 3) richtig eingearbeitet?
5. Ist die Spezifikation in sich widerspruchsfrei und so eindeutig, dass sich daraus Arbeitspakete mit prüfbaren Abnahmekriterien bilden lassen?

Nicht Gegenstand:

- die Festlegungen selbst; sie sind geprüft (`reviews/requirements-2.md`, bestanden)
- der offene Punkt „Präsentationen und Ablauf der Abnahme“ in `scope.md`
- Formulierungen, Testdetails und Schreibweisen, die in Aufträge gehören

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- In `docs/technical/entwicklungsverfahren.md` die Regeln „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“ und „Lücken“). Nur blockierende Befunde verhindern das Bestehen, alles andere als Hinweis, je Hinweis eine Zeile. Der Bericht umfasst höchstens etwa 60 Zeilen.
- `development/verfahren/scope.md`, `development/verfahren/questions/verfahren-01.md`, `development/verfahren/questions/verfahren-02.md`, `development/verfahren/prototype/uebersicht-prototyp.html`
- `docs/design/requirements/anforderungen-gesamtsystem.md`, req-system-024

Nenne zu jedem Befund Fundstelle, Sachverhalt, Zuordnung (folgt aus einer Festlegung, Sache der Spezifikation, offener Punkt oder Entscheidung des Auftraggebers) und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-1.md` in das Berichtsverzeichnis `work/verfahren/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, die blockierenden Befunde und getrennt davon die Hinweise.
