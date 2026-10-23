# Prüfauftrag Arbeitspaketplan, Durchlauf 3

- Vorhaben: `backtest`
- Phase: 3 Planung, Prüfung einer Planänderung
- Rolle: QA
- zu prüfender Stand: `main`, der Commit, mit dem dieser Prüfauftrag auf `main` gekommen ist. Nenne ihn vollständig im Bericht.
- Vorheriger Durchlauf: [plan-2.md](plan-2.md), bestanden

## Gegenstand

Der Plan `development/backtest/plan.md` ist geändert: `wp01` beginnt sofort auf dem von der QA geprüften Commit `2cac35b4a45e9d5499c92e3762670faf1021c821` von `strategiedesign/wp02`, übernimmt spätere Änderungen aus dessen Abnahme und wird erst nach `strategiedesign/wp02` in `main` übernommen. Umfang und Abnahmekriterien sollen unverändert sein.

Die geänderten Stellen zeigt `git diff 219da4003214257b229474fbdd955c5d61a194f8 <geprüfter Commit> -- development/backtest/plan.md`. Prüfe nur diese Stellen:

1. ob sie Widersprüche zur Spezifikation, zu den Dokumenten laut `scope.md`, zu `development/strategiedesign/plan.md`, zu nicht geänderten Stellen des Plans oder zu den Regeln für Zweige, Integration und Abnahme in `docs/technical/entwicklungsverfahren.md` enthalten, soweit der Plan nicht ausdrücklich und begründet davon abweicht;
2. ob der beschriebene Ablauf vollständig ist, sodass der Entwicklungsleiter `wp01` ohne Rückfrage beginnen, Änderungen aus `strategiedesign/wp02` übernehmen und `wp01` übernehmen kann;
3. ob Umfang und Abnahmekriterien von `wp01` und die übrigen Pakete unverändert sind.

Nicht Gegenstand: Stellen, die nicht geändert wurden.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`: Prüfe nur die geänderten Stellen. Nur blockierende Befunde verhindern das Bestehen, alles andere führst du als Hinweis in einer Zeile. Testdetails, Formulierungen und vollständige Listen gehören in die Aufträge und sind kein Befund. Der Bericht umfasst höchstens etwa 60 Zeilen.
- `development/backtest/scope.md`, `development/backtest/specification.md`, `development/strategiedesign/plan.md`, Abschnitte „Phasen“, „Phase 4“, „Phase 6“ und „Zweige“ in `docs/technical/entwicklungsverfahren.md`
- Zweig `strategiedesign/wp02` mit Commit `2cac35b4a45e9d5499c92e3762670faf1021c821`

Nenne zu jedem Befund Fundstelle, Sachverhalt und eine konkrete Frage oder einen Kritikpunkt. Lege keine Korrekturlösung fest. Eine Testumgebung brauchst du nicht.

## Ablage

Schreibe den Prüfbericht als Datei `plan-3.md` in das Berichtsverzeichnis `work/backtest/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Der Bericht nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
