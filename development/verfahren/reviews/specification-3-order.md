# Prüfauftrag Spezifikation, Durchlauf 3 (Nachprüfung)

- Vorhaben: `verfahren` (Entwicklungsverfahren verbessern)
- Phase: 2 Konzeption, Prüfung der Spezifikation mit `specify`
- Rolle: QA
- zu prüfender Stand: `main`, Commit `bd564cfc4343badf94dbe0fe29ca9306e97f3394`
- vorheriger Prüfbericht: `development/verfahren/reviews/specification-2.md` (geprüfter Commit `7a2b232bb03dd81e763dcb8ef63a1125af8af3dd`)

Dies ist eine Nachprüfung, kein vollständiger Durchlauf. Ab diesem dritten Durchlauf gilt „Grenze der Durchläufe“ in `docs/technical/entwicklungsverfahren.md`: Verbleibende rein technische Befunde entscheidet der Softwarearchitekt selbst. Prüfe nur noch Befunde, die Dokumente des Auftraggebers, bestätigte Festlegungen, Abnahmekriterien oder den Umfang berühren.

## Gegenstand

`development/verfahren/specification.md`. Die Änderungen zeigt `git diff 7a2b232bb03dd81e763dcb8ef63a1125af8af3dd bd564cfc4343badf94dbe0fe29ca9306e97f3394 -- development/verfahren/specification.md`. Der Änderungsnachweis nennt, wo jeder Befund erledigt ist.

Prüfe nur:

1. Sind N1 und N2 erledigt?
2. Enthalten die geänderten Stellen neue Fehler im Sinne des Satzes oben?

Nicht Gegenstand: unveränderte Stellen, die Festlegungen selbst.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- In `docs/technical/entwicklungsverfahren.md` die Regeln „Umfang der Prüfungen“, „Fragen an den Auftraggeber“ und „Grenze der Durchläufe“. Nenne nur noch offene und neue Befunde. Nur blockierende Befunde verhindern das Bestehen, alles andere als Hinweis, je Hinweis eine Zeile. Der Bericht umfasst höchstens etwa 60 Zeilen.
- `development/verfahren/scope.md`, `development/verfahren/reviews/specification-2.md`, `development/verfahren/questions/verfahren-02.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-3.md` in das Berichtsverzeichnis `work/verfahren/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, die noch offenen und neuen blockierenden Befunde und getrennt davon die Hinweise.
