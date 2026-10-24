# Prüfauftrag Auftrag 09, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `3d11dceed8749506e89ca2858cbcfba9e1001a6b` auf Zweig `strategiedesign/wp02-09`, Ausgangscommit `3ad644362b35d5b9c22033452f6740ae9ec79571`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/09.md`
- Grundlage: `strategiedesign/wp02:development/strategiedesign/specification.md` (Stand 2026-10-23)
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Nur blockierende Befunde verhindern das Bestehen.

## Tester Funktion

Prüfe jeden Punkt des Umfangs und jedes technische Abnahmekriterium des Auftrags gegen den Commit.

- Lies die Spezifikation an den Stellen, die der Auftrag nennt, und prüfe den Code gegen den Wortlaut.
- Führe in `packages/domain-core` und `components/pipwerk-studio/backend` `uv sync --frozen`, `uv run --frozen pytest`, `uv run --frozen ruff check`, `uv run --frozen ruff format --check` und `uv run --frozen mypy` aus, dazu die Abgleiche der Schemata unter `contracts/strategies/v2/` und der OpenAPI-Beschreibung.
- Prüfe `GET /api/v1/element-types` gegen Kriterium 3 (Gruppen, `methods`, `can_refresh`, `Manuell`, kein `Markttechnik`, kein „Parameter setzen“, keine Kennung in Programmierschreibweise in Namen, Beschriftungen und Erklärungen).
- Prüfe, dass `contracts/strategies/v1/` unverändert ist und dass `trigger.manual_start` als `trigger.manual` gelesen wird.
- Prüfe die Dokumentation (Punkt 8) gegen den Code, das Glossar gegen `617867c:docs/technical/glossar.md` und `main`, und dass keine Pfade, Benutzer- oder Rechnernamen des Entwicklungsrechners enthalten sind.
- Das Prüfskript `components/pipwerk-studio/scripts/check` führst du auf freien Ports aus (nicht 5174 und 8001). Die Browsertests laufen für Auftrag 09 nur in Chromium und mit `--max-failures=20`; die drei Browser prüft der Auftrag, der die Oberfläche anpasst. Die Oberfläche ist in diesem Auftrag nicht angepasst: Scheitern Vitest- oder Playwright-Tests, nenne sie einzeln und gib bei jedem die Ursache an. Nur Tests, die die alten Gruppen, `Manuell`, `Markttechnik`, „Parameter setzen“ oder neue Antwortfelder der bisherigen Oberfläche erwarten, sind kein Befund; sie behebt Auftrag 11. Scheitert ein Test aus einem anderen Grund, ist das ein Befund.
- Bekannt und kein Befund: `str-01` verwendet noch `Markttechnik` und wird in Auftrag 10 neu erzeugt; `pipwerk-studio-testfaelle.md` nennt noch `Markttechnik`.

## Ausführung langer Befehle (verbindlich)

- Das Prüfskript und jeder Befehl, der länger als 5 Minuten dauern kann, laufen im Hintergrund (Bash mit `run_in_background`). Die Ausgabe geht in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`.
- Du fragst den Stand mindestens alle 5 Minuten mit einem eigenen kurzen Befehl ab, zum Beispiel das Ende der Ausgabedatei lesen. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet.

Ablage: `09-functiontest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
