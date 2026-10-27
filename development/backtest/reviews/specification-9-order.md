# Prüfauftrag Spezifikation und Plan, Durchlauf 9

- Vorhaben: `backtest`, Arbeitspaket `wp02`, ref `backtest/wp02`
- Anlass: Lücke [wp02/amend-01.md](../wp02/amend-01.md) des Entwicklungsleiters nach der Antwort des Projektleiters vom 2026-10-25 in [Frage wp02-01](../questions/wp02-01.md), Punkt 2
- Rolle: QA
- zu prüfender Stand: `main`, Commit `2f1f95d0681e843a8629f87199f4dc6a88038390`
- Vorheriger Durchlauf: [specification-8.md](specification-8.md), bestanden

## Entscheidung des Projektleiters (wörtlich aus der Frage)

Keine Einschränkung der Verzeichniswahl. Ablage- und Importverzeichnis dürfen gleich sein oder ineinander liegen. Eine vorhandene Datei wird beim Behalten nie ersetzt; bei gleichem Namen erhält die behaltene Datei einen eindeutigen Namen. Das gilt für jede vorhandene Datei im Ablageverzeichnis, nicht nur für Dateien aus dem Importverzeichnis.

## Gegenstand

Prüfung beschränkt auf die geänderten Stellen, sichtbar mit `git diff 69b324edb7ff607d4798399771bf30eaf6105be3 2f1f95d0681e843a8629f87199f4dc6a88038390 -- development/backtest/specification.md development/backtest/plan.md`.

Prüfe:

1. Setzen Spezifikation 5.3, 5.6, 5.7, 10, 11 und 12 die Entscheidung vollständig um, widerspruchsfrei zu req-system-026, req-system-028, req-test-009 und zu den übrigen Stellen von 5.3, 5.6 und 5.7? Bleibt eine Aussage zurück, nach der eine behaltene Datei eine vorhandene ersetzt oder die Verzeichniswahl eingeschränkt wird? Schränkt die Spezifikation etwas ein, was weder die Entscheidung noch die Anforderungen einschränken, ohne dokumentierte technische Erfordernis?
2. Ist die Ergänzung rein technisch nach „Meldungen“ in `docs/technical/entwicklungsverfahren.md` (keine Änderung von Anforderung, Fachmodell, Strategiebeschreibung, bestätigter Festlegung der Spezifikation, Abnahmekriterium oder Umfang eines Arbeitspakets)? Bleiben die Kriterien 12 und 13 von `wp02` mit der Ergänzung richtig, sodass der Plan ohne Änderung bleiben kann?

Nicht Gegenstand: alle übrigen Stellen, die Umsetzung auf `backtest/wp02`.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“, „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“) und „Grenze der Durchläufe“ in `docs/technical/entwicklungsverfahren.md`. Spezifikation und Plan legen nur Bausteine, Entscheidungen und Abnahmekriterien fest; Testdetails und Formulierungen gehören in die Aufträge. Nur blockierende Befunde verhindern das Bestehen, alles andere als Hinweis in einer Zeile. Höchstens etwa 60 Zeilen.
- `docs/design/requirements/anforderungen-strategietester.md` (req-test-009), `docs/design/requirements/anforderungen-gesamtsystem.md` (req-system-026, req-system-028)
- `development/backtest/scope.md`, `development/backtest/questions/wp02-01.md`, `development/backtest/wp02/amend-01.md`

Befehle, die länger als 10 Minuten laufen können, lässt du im Hintergrund laufen und fragst ihren Stand in kürzeren Abständen ab. Für diese Prüfung ist kein solcher Befehl nötig.

## Ablage

Schreibe den Bericht als `specification-9.md` in das Berichtsverzeichnis `work/backtest/wp02/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
