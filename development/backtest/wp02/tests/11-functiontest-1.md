# Testbericht Funktionstest, Auftrag 11, Durchlauf 1

- Ergebnis: **bestanden**
- Geprüfter Commit: `e46b90b00c28c1996500a6a7394cc00a31541100` (Zweig `backtest/wp02-11`), ausgecheckt und kontrolliert.
- Commit des Prüfskripts: `e46b90b00c28c1996500a6a7394cc00a31541100` (`packages/market-data/scripts/check` unverändert, keine Änderung nötig, kein Zweig `backtest/wp02-functiontest-11` angelegt).

## Durchgeführt

- `packages/market-data/scripts/check --with-audit`: Exitcode 0 (`uv sync --frozen`, pytest, `ruff check`, `ruff format --check`, mypy, pip-audit ohne bekannte Schwachstellen).
- Code gelesen: `store.py` (`import_files`, `_parse_file`, `list_series`, `series_details`, `brokers`), `filehints.py`, `limits.py`, `parsed.py`, `records.py`.
- Eigene Probeläufe gegen eine frische SQLite-Datenbank (Wegwerfskript, nicht im Repository): 25 Dateinamen, Vorgang mit acht Dateien (gültig, doppelt, ohne Instrument, Instrument `../x`, leer, `{}`, CSV mit `contract`, Balken-CSV als `ticks`), alle vier Grenzen, leerer Vorgang, falsche Zeitzone, Broker mit Leerzeichen, Filter und Seiten, `inspect_json` mit Fehlerfällen.
- Dokumentation gegen Code verglichen: `docs/technical/pipwerk-marketdata.md` (Abschnitte 5.3, 5.4, 8, 13), `packages/market-data/README.md`, `contracts/market-data/README.md`.

## Ergebnis je Gegenstand

- Import mehrerer Dateien: erfüllt. Je Datei eigene Transaktion, abgelehnte Datei hindert die übrigen nicht, Broker des Vorgangs ersetzt den der JSON-Datei, Instrument bei JSON überschreibbar, abweichende Daten bei JSON lehnen die Datei ab (`series_invalid`), Ergebnis je Datei mit Zeitraum und abgelehnten Zeilen.
- Begrenzungen: erfüllt. `max_files` und `max_batch_bytes` ergeben `ImportBatchError` vor dem Lesen, `max_bytes` und `max_rows` lehnen die einzelne Datei ab, `ImportLimits` prüft positive Werte, Vorgaben dokumentiert.
- Erkennung aus Dateinamen: erfüllt. Beide Muster, alle Zeiteinheiten, `TICKS`, Pfadteile werden abgeschnitten, Nichterkennung bei `EURUSD.csv`, `EURUSD_H1_x_y.csv`, `..csv`; der Name wird nie als Pfad verwendet. `inspect_json` liefert Kopffelder und Fehlercodes, auch bei ungültigem JSON, NaN, falschem Typ.
- Reihenliste: erfüllt. Teilzeichenfolge ohne Groß-/Kleinschreibung, Gesamtzahl, Seiten, feste Sortierung, Zeile „Kontraktdaten“ (`contract`) nur ohne Reihe, `gap_count` zählt auch Teile zwischen getrennt abgedeckten Zeiträumen, Wildcards (`%`, `_`) werden wörtlich gesucht.
- Einzelheiten und Brokerliste: erfüllt (Lücken mit Grund, Kontraktdaten oder `None`).
- `overview()` bleibt, in der Dokumentation (Abschnitt 8, 13) begründet: wie vom Entwicklungsleiter entschieden.
- Schema (Umfang 7): unverändert, Begründung in `contracts/market-data/README.md`.
- Tests: `test_import_files.py` (22), `test_filehints.py` (11), `test_series_list.py` (21) decken die Punkte des Auftrags ab; laufen ohne Netz.
- Programmierregeln: ruff und mypy ohne Meldung; keine Pfade des Entwicklungsrechners in Code und Dokumentation gefunden.

## Befunde

Blockierende Befunde: keine.

Hinweise (verhindern das Bestehen nicht):

1. `packages/market-data/src/pipwerk_marketdata/store.py`, `series_details`: Die Beschreibung sagt „`None`, wenn die Liste keine solche Zeile hat“, bei unbekannter Daten-Kennung (`xx`, leer) oder Großschreibung (`H1`) wirft die Methode aber `ValueError("unknown time unit")`. Probe: `series_details("B1","EURUSD","H1")`.
2. `ImportFile.data` ist streng kleingeschrieben (`H1` ergibt „The time unit is not known.“); die Erkennung aus dem Dateinamen liefert Kleinschreibung, daher kein Fehler im Ablauf. Die Meldung nennt die erwartete Schreibweise nicht.
3. Im Arbeitsverzeichnis `functiontest` liegt die ungetrackte Datei `probe_ft11.py` (mein Wegwerfskript); das Löschen wurde in der Sitzung verweigert. Sie ist nicht im Repository und nicht Teil des Commits.
