# Prüfauftrag Spezifikation und Plan, Durchlauf 8

- Vorhaben: `backtest`
- Anlass: Einwand des Auftraggebers zu Kriterium 13 von `wp02` (Meldung `revise` vom 2026-10-24). Kriterien 11 und 12 sind bestätigt.
- Rolle: QA
- zu prüfender Stand: `main`, Commit `fc89d3c9ae50fb7abe2ef63084c829138780ee37`
- Vorheriger Durchlauf: [specification-7.md](specification-7.md), bestanden

## Einwand des Auftraggebers (wörtlich aus der Meldung)

Import- und Exportverzeichnis gehören in die Einstellungen. Es sind Verzeichnisse auf dem Rechner des Backends, nicht Startverzeichnisse der Dateiauswahl des Browsers. Der Import bietet die Dateien im Importverzeichnis zur Auswahl an und liest sie dort direkt, ohne Hochladen. Das Hochladen von Dateien des Anwenders über den Browser bleibt daneben bestehen (req-system-026). Das Exportverzeichnis ist der voreingestellte Ablageort künftiger Exporte; die Einstellung kommt jetzt, auch wenn es noch keinen Export gibt. Behaltene Dateien (12) gelten nur für hochgeladene Dateien; Dateien aus dem Importverzeichnis werden nie entfernt (req-system-028: Pflege durch den Anwender).

## Gegenstand

Prüfung beschränkt auf die geänderten Stellen, sichtbar mit `git diff 9f46c6c07fde06988b96b4d748f0cc6655cd2fef fc89d3c9ae50fb7abe2ef63084c829138780ee37 -- development/backtest/specification.md development/backtest/plan.md`.

Prüfe:

1. Setzen Spezifikation 5.3, 5.6, 5.7, 7, 8.3, 10, 11 und 12 den Einwand vollständig um, widerspruchsfrei zu req-system-026, req-system-028, req-test-009 und zu den übrigen Stellen von 5.3 und 5.6? Schränkt die Spezifikation etwas ein, was weder der Einwand noch die Anforderungen einschränken, ohne dokumentierte technische Erfordernis?
2. Deckt der Plan die Änderung ab (`wp02` Umfang, Nicht-Umfang, Kriterium 13)? Kann der Auftraggeber Kriterium 13 selbst prüfen? Bleiben die bestätigten Kriterien 11 und 12 unverändert?

Nicht Gegenstand: alle übrigen Stellen, die Umsetzung auf `backtest/wp02`.

## Prüfgrundlagen

- Briefing QA in `docs/technical/agentenrollen-und-briefings.md`
- „Umfang der Prüfungen“, „Fragen an den Auftraggeber“ (einschließlich „Keine Einschränkung ohne Erfordernis“) und „Grenze der Durchläufe“ in `docs/technical/entwicklungsverfahren.md`. Spezifikation und Plan legen nur Bausteine, Entscheidungen und Abnahmekriterien fest; Testdetails und Formulierungen gehören in die Aufträge. Nur blockierende Befunde verhindern das Bestehen, alles andere als Hinweis in einer Zeile. Höchstens etwa 60 Zeilen.
- `docs/design/requirements/anforderungen-strategietester.md` (req-test-009), `docs/design/requirements/anforderungen-gesamtsystem.md` (req-system-026, req-system-028), `docs/technical/pipwerk-studio.md` (Einstellungen, Objektverzeichnis)
- `development/backtest/scope.md`

Befehle, die länger als 10 Minuten laufen können, lässt du im Hintergrund laufen und fragst ihren Stand in kürzeren Abständen ab. Für diese Prüfung ist kein solcher Befehl nötig.

## Ablage

Schreibe den Bericht als `specification-8.md` in das Berichtsverzeichnis `work/backtest/reports/` im Entwicklungsverzeichnis, nicht in dein Arbeitsverzeichnis. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit vollständig, alle blockierenden Befunde und getrennt davon die Hinweise.
