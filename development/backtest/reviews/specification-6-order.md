# Prüfauftrag Spezifikation und Plan, Durchlauf 6

- Vorhaben: `backtest`
- Anlass: neue Anforderung req-system-028 mit Ergänzung vom 2026-10-24 (geprüft in [requirements-9.md](requirements-9.md) und [requirements-10.md](requirements-10.md), beide bestanden)
- Rolle: QA
- zu prüfender Stand: `main`, Commit `26df50322617fac7fcfc4b7acca0f039ed4a68b9`
- Vorheriger Durchlauf: [specification-5.md](specification-5.md), bestanden

## Gegenstand

Prüfung beschränkt auf die geänderten Stellen, sichtbar mit `git diff d1ec3cc10f06408e45365bef90f4782695bf4655 26df50322617fac7fcfc4b7acca0f039ed4a68b9 -- development/backtest/specification.md development/backtest/plan.md development/backtest/prototype/order-04.md docs/technical/glossar.md`.

Prüfe:

1. Setzt Spezifikation 5.6 req-system-028 vollständig und widerspruchsfrei um, auch gegen req-system-025 bis req-system-027 und die übrigen Abschnitte (5.3, 5.4, 5.5, 8.3, 10, 11, 12)? Ist die Bewertung des JSON-Formats für Ticks nachvollziehbar (Zählung am Beispiel `contracts/market-data/v1/examples/ticks.json` auf Zweig `backtest/wp02`, kompakt geschrieben)?
2. Deckt der Plan 5.6 ab (`wp02` Umfang, Nicht-Umfang, umgesetzte Teile, Kriterien 11 und 12, Abdeckung, „Offen“)? Kann der Auftraggeber die neuen Kriterien selbst prüfen?
3. Enthält die geänderte Probeumsetzung `prototype/order-04.md` (Stand, Punkte 4a und 6, Abschnitt „Speicherplatz“) Widersprüche zu 5.6 oder zu req-system-028?
4. Passen die Einträge im Glossar zu req-system-028?

Nicht Gegenstand: alle übrigen Stellen, die Messwerte selbst (die Probeumsetzung ist zurückgestellt), die Umsetzung auf `backtest/wp02`.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“, „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“) und „Grenze der Durchläufe“ in `docs/technical/entwicklungsverfahren.md`. Spezifikation und Plan legen nur Bausteine, Entscheidungen und Abnahmekriterien fest; Testdetails und Formulierungen gehören in die Aufträge. Nur blockierende Befunde verhindern das Bestehen, alles andere als Hinweis in einer Zeile. Höchstens etwa 60 Zeilen.
- `docs/design/requirements/anforderungen-gesamtsystem.md`, req-system-025 bis req-system-028
- `development/backtest/scope.md`

Befehle, die länger als 10 Minuten laufen können, lässt du im Hintergrund laufen und fragst ihren Stand in kürzeren Abständen ab. Für diese Prüfung ist kein solcher Befehl nötig.

## Ablage

Schreibe den Bericht als `specification-6.md` in das Berichtsverzeichnis `work/backtest/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
