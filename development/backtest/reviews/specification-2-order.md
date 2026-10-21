# Prüfauftrag Spezifikation, Durchlauf 2

- Vorhaben: `backtest`
- Phase: 2 Konzeption, Nachprüfung der Spezifikation
- Rolle: QA
- zu prüfender Stand: `main`, Commit `34a51ccadb0456ffc691982b134e6a1f7fa55077`
- Vorheriger Durchlauf: [specification-1.md](specification-1.md), geprüft auf Commit `67c0339d26f4137e8f540b7cf41111dd8fb8e33c`, nicht bestanden, B1 bis B4

## Gegenstand

Dies ist eine Nachprüfung von `development/backtest/specification.md`. Prüfe nur:

1. ob die blockierenden Befunde B1 bis B4 aus `specification-1.md` erledigt sind;
2. ob die seit Durchlauf 1 geänderten Stellen neue Fehler enthalten: Widersprüche zu den Dokumenten des Auftraggebers laut `scope.md`, zu `development/backtest/questions/backtest-01.md` oder zu nicht geänderten Stellen der Spezifikation, und Einschränkungen ohne Begründung.

Die geänderten Stellen zeigt `git diff 67c0339d26f4137e8f540b7cf41111dd8fb8e33c 34a51ccadb0456ffc691982b134e6a1f7fa55077 -- development/backtest/specification.md`. Der Änderungsnachweis nennt zu jeder Stelle den Befund oder Hinweis.

Nicht Gegenstand: Stellen, die seit Durchlauf 1 nicht geändert wurden; die Hinweise aus `specification-1.md` als solche (melde nur neue Fehler an den dafür geänderten Stellen); die Dokumente des Auftraggebers selbst.

## Prüfgrundlagen

- Briefing QA, Phase 2 Spezifikation, in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Dies ist eine Nachprüfung, nenne nur noch offene und neue Befunde. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis in einer Zeile. Testdetails, Formulierungen, Schreibweisen von Pfaden und vollständige Listen von Kennungen gehören in die Aufträge und sind kein Befund. Der Bericht umfasst höchstens etwa 60 Zeilen.
- „Fragen an den Auftraggeber“ in `docs/technical/entwicklungsverfahren.md`, einschließlich „Keine Einschränkung ohne Erfordernis“
- `development/backtest/scope.md` mit den dort genannten Dokumenten

Nenne zu jedem Befund Fundstelle, Sachverhalt, Zuordnung nach „Fragen an den Auftraggeber“ und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest.

## Ablage

Schreibe den Prüfbericht als Datei `specification-2.md` in das Berichtsverzeichnis `work/backtest/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, zu B1 bis B4 „erledigt“ oder „offen“, alle neuen blockierenden Befunde und getrennt davon die Hinweise.
