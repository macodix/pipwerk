# Testbericht Funktionstest, Auftrag 02, Durchlauf 2 (Nachprüfung)

- Vorhaben/Arbeitspaket: `backtest` / `wp02`
- Ergebnis: **nicht bestanden** (ein neuer blockierender Befund)
- geprüfter Commit: `3e983095a3c6d6ab70a34d4a7e717f1b82099f45` (Zweig `backtest/wp02-07`), ausgecheckt und mit `git rev-parse HEAD` kontrolliert
- Commit des Prüfskripts: `28b21bbf329aacc204079f55e00f72a50387e4f0` (Zweig `backtest/wp02-functiontest-02`), unverändert; die Datei wurde mit `git checkout 28b21bb -- packages/market-data/scripts/check` in das Arbeitsverzeichnis des geprüften Commits gelegt (der Commit enthält das Skript nicht).

## Prüfskript

- Als Programm über den absoluten Pfad `…/functiontest/packages/market-data/scripts/check` gestartet: **gelang** (Ausführungsbit gesetzt, Exitcode 0).
- Ergebnis: `uv sync --frozen` ok, `pytest` 343 bestanden, `ruff check` ok, `ruff format --check` 29 Dateien formatiert, `mypy` keine Fehler in 28 Dateien. `--with-audit` nicht ausgeführt (nicht verlangt).

## Befund 1 des Vorberichts (volume und spread)

Behoben. `documents.py` Zeilen 102 bis 108: `le=MAX_INTEGER_VALUE` (2 147 483 647) für beide Felder, im Schema (`candles.schema.json`, `maximum`) und in `docs/technical/pipwerk-marketdata.md` (Zeile 94 und 135) genannt. Probe über `MarketDataStore.import_json`: 2147483647 und 0 werden übernommen; 2147483648, 9223372036854775807/-808, 10^400 (als Zahl), -10^400, 1e400, 1e10, 1.0, -1 ergeben je eine abgelehnte Zeile `value_invalid`; 5000 Ziffern ergeben `ImportFileError json_invalid`. Das gilt für `volume` und `spread`.

## Prüfung auf unbehandelte Ausnahmen bei extremen Zahlenwerten im JSON-Import

167 Probeeinträge (Kerzen: open/high/low/close mit 10^400, 1e400, 1e308, 5e-324, 1e-400, 0, -0.0; Ticks: bid/ask mit denselben Werten; Instrument: alle Zahlenfelder und `margin_per_lot` mit 10^400, 1e400, 1e308, 5e-324, 0; `version` 10^400; Zeiten von 0000 bis 9999). Alle Zahlenfelder ergeben eine abgelehnte Zeile oder `ImportFileError document_invalid`/`json_invalid`, oder werden übernommen. Keine unbehandelte Ausnahme bei Zahlenfeldern.

## Befunde

Blockierend:

1. JSON-Import: Eine Kerze oder ein Tick mit Zeit am Ende des Jahres 9999 löst `OverflowError: date value out of range` aus. Das ist weder `ImportFileError` noch `MarketDataStoreError` noch eine abgelehnte Zeile. Fälle: Kerze `"time": "9999-12-31T23:59:59Z"` (Zeiteinheit m1), Kerze `"9999-12-31T23:59:59.999999Z"`, Tick `"9999-12-31T23:59:59.999999Z"`. Ursache (gelesen, nicht im Debugger belegt): `store.py` Zeile 214 `time_unit(parsed.unit).add(last)` und Zeile 215 `last + timedelta(milliseconds=1)` in `_covered` überschreiten das größte darstellbare Datum; das Schema (`TIME_PATTERN`) lässt die Zeit zu, die Zeile wird nicht geprüft. Tick `9999-12-31T23:59:59Z` ohne Bruchteil wird übernommen. Erwartet nach Auftrag 02, Abnahmekriterium 1 und Spezifikation 5.3: jede Fehlerart ergibt abgelehnte Zeilen mit Grund. In Dokument und Tests ist keine Obergrenze für die Zeit genannt. CSV nicht geprüft; `_covered` ist dieselbe Stelle für beide Formate.

Hinweise (nicht blockierend):

2. Hinweise 2 bis 4 des Vorberichts (Dauer 500 000 Zeilen, README ohne Verweis auf das Prüfskript) sind unverändert; `components/pipwerk-replay/` liegt weiter unversioniert im Arbeitsverzeichnis.
3. Mein Probeskript `ft-probe-02.py` liegt unversioniert im Arbeitsverzeichnis (`functiontest/`); ich durfte es in dieser Sitzung nicht löschen (Löschen abgelehnt). Es gehört nicht zum Commit.
