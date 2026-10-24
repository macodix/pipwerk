# Prüfauftrag Funktionstest, Auftrag 16, Durchlauf 1

- Vorhaben: `backtest`
- Arbeitspaket: `wp02`
- Rolle: Tester Funktion
- zu prüfender Commit: `4a30a147130032f3c2c02b18fa63d64a4bf20154` (Zweig `backtest/wp02-16`)
- Auftrag: `development/backtest/wp02/orders/16.md` auf dem Zweig `backtest/wp02`

## Gegenstand

Prüfe den Commit gegen Auftrag 16 und Spezifikation (E5, 5.4, 12 Punkt „Nach M2“): Vollständigkeit und Richtigkeit von `docs/technical/pipwerk-fetch-mt5.md` zu dem, was auf dem Rechner von MetaTrader 5 installiert wird und läuft (`uv`, Python mit Version, jedes Paket mit Version und Zweck nach `uv.lock`, Ablageorte, Zwischenspeicher, Zeitpunkt und Dauer, Netzzugriffe, Entfernen). Jede Angabe muss sich aus `uv.lock`, `pyproject.toml`, Skripten oder Quelltext belegen lassen; gleiche die Paketliste und Versionen mit `uv.lock` ab. Der Commit legt außerdem `requires-python` auf `>=3.14,<3.15` fest (Entscheidung des Entwicklungsleiters, kein Befund, sofern `uv.lock` konsistent ist). Führe das Prüfskript `components/pipwerk-fetch-mt5/scripts/check` aus.

Beachte die Regeln „Umfang der Prüfungen“ (erster Durchlauf vollständig, nur blockierende Befunde verhindern das Bestehen, Bericht höchstens etwa 60 Zeilen).

## Prüfgrundlagen

- `development/backtest/wp02/orders/16.md`
- `development/backtest/specification.md`, `development/backtest/plan.md`
- `components/pipwerk-fetch-mt5/` (`pyproject.toml`, `uv.lock`, `scripts/`)
- `docs/technical/development-test-security-rules.md`
- Briefing Tester Funktion in `docs/technical/agentenrollen-und-briefings.md`
- Regeln „Umfang der Prüfungen“ in `docs/technical/entwicklungsverfahren.md`

## Ablage

Schreibe den Testbericht ohne Commit als Datei `16-functiontest-1.md` in das Berichtsverzeichnis `/srv/aixlab/dev/pipwerk/work/backtest/wp02/reports/`. Er nennt „bestanden“ oder „nicht bestanden“, den geprüften Commit und den Commit des Prüfskripts vollständig und alle Befunde mit Fundstelle.
