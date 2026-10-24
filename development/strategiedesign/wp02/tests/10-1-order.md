# Prüfauftrag Auftrag 10, Durchlauf 1

- Vorhaben: `strategiedesign`, Arbeitspaket `wp02`, ref `strategiedesign/wp02`
- zu prüfender Commit: `43fa30e5fcc212fc0a56d9fd1f7be7bdcab53a5f` auf Zweig `strategiedesign/wp02-10`, Ausgangscommit `82785e9916de3307b42df20e210a00551e0e027f`
- Auftrag: `strategiedesign/wp02:development/strategiedesign/wp02/orders/10.md`
- Grundlage: `strategiedesign/wp02:development/strategiedesign/specification.md` (Stand 2026-10-23)
- Umfang der Prüfungen: Es gelten die Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`. Nur blockierende Befunde verhindern das Bestehen.

## Tester Funktion

Prüfe jeden Punkt des Umfangs und jedes technische Abnahmekriterium des Auftrags gegen den Commit.

- Lies die Spezifikation an den Stellen, die der Auftrag nennt, und prüfe den Code gegen den Wortlaut.
- Führe in `packages/domain-core` und `components/pipwerk-studio/backend` `uv sync --frozen`, `uv run --frozen pytest`, `uv run --frozen ruff check`, `uv run --frozen ruff format --check` und `uv run --frozen mypy` aus, dazu die Abgleiche der Schemata unter `contracts/strategies/v2/` und der OpenAPI-Beschreibung.
- Prüfe jede Zeile der Befundtabelle in 3.6 mit Gegenprobe, Element der ersten Verwendung und Wege, sichtbare Namen, Namensraum, Namensvorschlag (`/api/v1/insert`), Entfernen (`/api/v1/removals`), `/api/v1/usage`, Umwandlung von 1.0 einschließlich der gesicherten „EMA-Trendfolge“ (`development/strategiedesign/wp02/acceptance/ema-trendfolge-auftraggeber.strategy.json`), die Grenzen nach Abschnitt 8 und `str-01`/`str-03` in 2.0 (null Befunde).
- Prüfe die Dokumentation (Punkt 11) gegen den Code, das Glossar gegen die Spezifikation und `main`, die Beispiele in „Web-API ausprobieren“ und dass keine Pfade, Benutzer- oder Rechnernamen des Entwicklungsrechners enthalten sind. Hinweis H1 aus `tests/09-functiontest-1.md` (Fallfehler in der Erklärung von `ZigZag.wendepunkt_N_endgueltig`) ist Teil des Auftrags.
- Das Prüfskript `components/pipwerk-studio/scripts/check --backend-port <port> --frontend-port <port>` führst du auf freien Ports aus (nicht 5174 und 8001). Die Browsertests laufen für Auftrag 10 nur in Chromium und mit `--max-failures=20`; da `scripts/check` das nicht kennt, führe seine Schritte einzeln aus wie in Durchlauf 1 von Auftrag 09. Die Oberfläche ist nicht angepasst: Scheitern Vitest- oder Playwright-Tests, nenne sie einzeln mit Ursache. Nur Tests, die alte Gruppen, `Manuell`, `Markttechnik`, „Parameter setzen“ oder neue Antwortfelder der bisherigen Oberfläche erwarten, sind kein Befund; sie behebt Auftrag 11. Scheitert ein Test aus anderem Grund, ist das ein Befund.
- Bekannt und kein Befund: `pipwerk-studio-testfaelle.md` und `e2e/testcases.spec.ts` beschreiben noch das alte `str-01` (Oberfläche, Auftrag 11 bis 13).

## Ausführung langer Befehle (verbindlich)

- Das Prüfskript und jeder Befehl, der länger als 5 Minuten dauern kann, laufen im Hintergrund (Bash mit `run_in_background`). Die Ausgabe geht in eine Datei unter `/srv/aixlab/dev/pipwerk/work/strategiedesign/wp02/`.
- Du fragst den Stand mindestens alle 5 Minuten mit einem eigenen kurzen Befehl ab. Ein einzelner Werkzeugaufruf über 15 Minuten erzeugt keinen Herzschlag, und die Sitzung wird beendet.

Ablage: `10-functiontest-1.md` im Berichtsverzeichnis `work/strategiedesign/wp02/reports/` im Entwicklungsverzeichnis
