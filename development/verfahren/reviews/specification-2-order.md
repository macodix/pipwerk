# Prüfauftrag Spezifikation, Durchlauf 2 (Nachprüfung)

- Vorhaben: `verfahren` (Entwicklungsverfahren verbessern)
- Phase: 2 Konzeption, Prüfung der Spezifikation mit `specify`
- Rolle: QA
- zu prüfender Stand: `main`, Commit `7a2b232bb03dd81e763dcb8ef63a1125af8af3dd`
- vorheriger Prüfbericht: `development/verfahren/reviews/specification-1.md` (geprüfter Commit `4a17211dbb8065ddf6c815f7702dd7b6b0536ecb`)

Dies ist eine Nachprüfung, kein vollständiger Durchlauf.

## Gegenstand

`development/verfahren/specification.md`. Die Änderungen zeigt `git diff 4a17211dbb8065ddf6c815f7702dd7b6b0536ecb 7a2b232bb03dd81e763dcb8ef63a1125af8af3dd -- development/verfahren/specification.md`. Der Änderungsnachweis nennt, wo jeder Befund erledigt ist.

Prüfe nur:

1. Sind B1 bis B4 erledigt?
2. Ist die neue Festlegung „Ablauf dieses Vorhabens“ in `development/verfahren/scope.md` (Commit `229c8ba49cac9f80fad31fc762e2e8e9fd026f57`) richtig übernommen (Abschnitt 10 und die Stellen, die bisher ein umsetzendes Paket oder einen Abnahmebericht nannten)?
3. Enthalten die geänderten Stellen neue Fehler: Widersprüche zu den Festlegungen oder zu unveränderten Stellen der Spezifikation, Mehrdeutigkeiten?

Nicht Gegenstand: unveränderte Stellen, die Festlegungen selbst, die Hinweise H1 bis H9 als solche (prüfe an den dafür geänderten Stellen nur auf neue Fehler).

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- In `docs/technical/entwicklungsverfahren.md` die Regeln „Umfang der Prüfungen“ und „Fragen an den Auftraggeber“. Dies ist eine Nachprüfung: Nenne nur noch offene und neue Befunde. Nur blockierende Befunde verhindern das Bestehen, alles andere als Hinweis, je Hinweis eine Zeile. Der Bericht umfasst höchstens etwa 60 Zeilen.
- `development/verfahren/scope.md`, `development/verfahren/reviews/specification-1.md`, `development/verfahren/questions/verfahren-02.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt, Zuordnung und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-2.md` in das Berichtsverzeichnis `work/verfahren/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, die noch offenen und neuen blockierenden Befunde und getrennt davon die Hinweise.
