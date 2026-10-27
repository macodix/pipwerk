# Prüfauftrag Spezifikation und Plan, Durchlauf 7

- Vorhaben: `backtest`
- Anlass: neue Anforderung req-test-009 Einstellungsbereich vom 2026-10-24 (geprüft in [requirements-11.md](requirements-11.md), bestanden)
- Rolle: QA
- zu prüfender Stand: `main`, Commit `1aa59510bea6935cb18caeda971b2742f0537b90`
- Vorheriger Durchlauf: [specification-6.md](specification-6.md), bestanden

## Gegenstand

Prüfung beschränkt auf die geänderten Stellen, sichtbar mit `git diff 26df50322617fac7fcfc4b7acca0f039ed4a68b9 1aa59510bea6935cb18caeda971b2742f0537b90 -- development/backtest/specification.md development/backtest/plan.md`. Darin sind auch die eingearbeiteten Hinweise H1 und H4 aus `specification-6.md`; prüfe sie nur auf neue Fehler.

Prüfe:

1. Setzt Spezifikation 5.7 req-test-009 um, ohne den offenen Punkt 2 (Aufbau und Gestaltung) vorwegzunehmen, und widerspruchsfrei zu req-system-016, req-system-028, 5.6, 8.3, 10, 11 und 12? Ist der Verzicht auf Import- und Exportverzeichnis nach „Keine Einschränkung ohne Erfordernis“ ausreichend begründet?
2. Deckt der Plan 5.7 ab (`wp02` Umfang, umgesetzte Teile, Kriterien 12 und 13, Abdeckung)? Kann der Auftraggeber die Kriterien selbst prüfen?

Nicht Gegenstand: alle übrigen Stellen, die Umsetzung auf `backtest/wp02`.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“, „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“) und „Grenze der Durchläufe“ in `docs/technical/entwicklungsverfahren.md`. Spezifikation und Plan legen nur Bausteine, Entscheidungen und Abnahmekriterien fest; Testdetails und Formulierungen gehören in die Aufträge. Nur blockierende Befunde verhindern das Bestehen, alles andere als Hinweis in einer Zeile. Höchstens etwa 60 Zeilen.
- `docs/design/requirements/anforderungen-strategietester.md` (req-test-009), `docs/design/requirements/anforderungen-gesamtsystem.md` (req-system-016, req-system-028), `docs/technical/pipwerk-studio.md` (Einstellungen, Objektverzeichnis)
- `development/backtest/scope.md`

Befehle, die länger als 10 Minuten laufen können, lässt du im Hintergrund laufen und fragst ihren Stand in kürzeren Abständen ab. Für diese Prüfung ist kein solcher Befehl nötig.

## Ablage

Schreibe den Bericht als `specification-7.md` in das Berichtsverzeichnis `work/backtest/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
