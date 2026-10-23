# Prüfauftrag Arbeitspaketplan, Durchlauf 2

- Vorhaben: `backtest`
- Phase: 3 Planung, Nachprüfung des Plans
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, mit dem dieser Prüfauftrag auf `main` gekommen ist. Nenne ihn vollständig im Bericht.
- Vorheriger Durchlauf: [plan-1.md](plan-1.md), geprüft auf Commit `8ce9905563f12a73e99af623f77a07ccae5ace4d`, nicht bestanden, B1

## Gegenstand

Dies ist eine Nachprüfung von `development/backtest/plan.md`. Prüfe nur:

1. ob der blockierende Befund B1 aus `plan-1.md` erledigt ist;
2. ob die seit Durchlauf 1 geänderten Stellen neue Fehler enthalten: Widersprüche zur Spezifikation, zu den Dokumenten laut `scope.md`, zu `development/strategiedesign/plan.md` oder zu nicht geänderten Stellen des Plans.

Die geänderten Stellen zeigt `git diff 8ce9905563f12a73e99af623f77a07ccae5ace4d <geprüfter Commit> -- development/backtest/plan.md`. Der Änderungsnachweis nennt zu jeder Stelle den Befund oder Hinweis.

Nicht Gegenstand: Stellen, die seit Durchlauf 1 nicht geändert wurden; die Hinweise aus `plan-1.md` als solche, auch die verworfenen (melde nur neue Fehler an den dafür geänderten Stellen).

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Dies ist eine Nachprüfung, nenne nur noch offene und neue Befunde. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis in einer Zeile. Testdetails, Formulierungen und vollständige Listen gehören in die Aufträge und sind kein Befund. Der Bericht umfasst höchstens etwa 60 Zeilen.
- `development/backtest/scope.md`, `development/backtest/specification.md`, `development/strategiedesign/plan.md`

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest. Eine Testumgebung brauchst du nicht.

## Ablage

Schreibe den Prüfbericht als Datei `plan-2.md` in das Berichtsverzeichnis `work/backtest/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, zu B1 „erledigt“ oder „offen“, alle neuen blockierenden Befunde und getrennt davon die Hinweise.
