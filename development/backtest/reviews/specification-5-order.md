# Prüfauftrag Spezifikation, Durchlauf 5 (Nachprüfung)

- Vorhaben: `backtest`
- Anlass: Befund B1 aus [specification-4.md](specification-4.md), nicht bestanden
- Rolle: QA
- zu prüfender Stand: `main`, Commit `9b7372325ac2672b02181418de557b9bd45acfa9`
- Vorheriger Durchlauf: [specification-4.md](specification-4.md); Plan in [plan-5.md](plan-5.md) bestanden

## Gegenstand

Nachprüfung. Sichtbar mit `git diff 2c8d6cdab571191cf964c4af436a10687d09d4ce 9b7372325ac2672b02181418de557b9bd45acfa9 -- development/backtest/specification.md development/backtest/plan.md`.

Prüfe nur:

1. Ist B1 behoben? Feiertage zwischen zwei Dateien und am Rand des Testzeitraums nach req-test-003 und M6 (Spezifikation 5.2, 10).
2. Enthalten die dafür und für die Hinweise H1 bis H3 geänderten Stellen neue Fehler (Spezifikation 5.2, 5.5, 10, Änderungsnachweis; Plan `wp02` Kriterien 7 bis 9, Abschnitt „Offen“)? Passt `wp02` Kriterium 9 zur geänderten Spezifikation?

Nicht Gegenstand: alle übrigen Stellen, M4 und die Probeumsetzung `order-04` (vom Auftraggeber zurückgestellt), die Umsetzung auf `backtest/wp02`.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“, „Fragen an den Auftraggeber“ und „Grenze der Durchläufe“ in `docs/technical/entwicklungsverfahren.md`. Eine Nachprüfung nennt nur die noch offenen und die neuen Befunde. Nur blockierende Befunde verhindern das Bestehen, alles andere als Hinweis in einer Zeile. Höchstens etwa 60 Zeilen.
- `development/backtest/scope.md`, Abnahmebericht `development/backtest/wp02/acceptance/2.md`

Befehle, die länger als 10 Minuten laufen können, lässt du im Hintergrund laufen und fragst ihren Stand in kürzeren Abständen ab. Für diese Prüfung ist kein solcher Befehl nötig.

## Ablage

Schreibe den Bericht als `specification-5.md` in das Berichtsverzeichnis `work/backtest/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
