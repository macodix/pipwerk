# Testbericht Funktionstest, Auftrag 02, Durchlauf 3 (Nachprüfung)

- Vorhaben/Arbeitspaket: `backtest` / `wp02`
- Ergebnis: **bestanden** (keine offenen und keine neuen blockierenden Befunde)
- geprüfter Commit: `de74b5f6bb9b7706a352ca612c8f19e96a7c0ad7` (Zweig `backtest/wp02-08`), ausgecheckt und mit `git rev-parse HEAD` kontrolliert
- Commit des Prüfskripts: `28b21bbf329aacc204079f55e00f72a50387e4f0` (Zweig `backtest/wp02-functiontest-02`), unverändert; `packages/market-data/scripts/check` liegt unversioniert im Arbeitsverzeichnis und ist byte-gleich zu diesem Commit (kontrolliert mit `git show … | diff`).

## Prüfskript

Als Programm über den absoluten Pfad gestartet, Exitcode 0: `uv sync --frozen` ok, `pytest` 430 bestanden (vorher 343; neu `test_time_limits.py`), `ruff check` ok, `ruff format --check` 30 Dateien formatiert, `mypy` keine Fehler in 29 Dateien.

## Befund 1 des Vorberichts (Zeit am Ende des darstellbaren Bereichs)

Behoben. Das Probeskript `ft-probe-04.py` (3571 Ausgabezeilen, 2809 Fälle ohne Ausnahme, 164 erwartete Ablehnungen) ergab **keine unbehandelte Ausnahme** (`OverflowError` und andere). Geprüft:

- JSON, Kerzen in allen 21 Zeiteinheiten und Ticks, je Zeit 0001-01-01, 1969-12-31T23:59:59(.999999), 1970-01-01T00:00:00(.000001), 2099-12-31T23:59:59(.999999), 2100-01-01T00:00:00(.000001), 9999-12-31T23:59:59.999999: 1970 bis vor 2100 wird übernommen, alles andere ist eine abgelehnte Zeile `time_out_of_range`; gemischte Dateien behalten die gültigen Zeilen.
- Zeitraum (`period`): bis genau 2100-01-01 übernommen, eine Mikrosekunde darüber, vor 1970, Beginn 2100 und Jahr 9999 ergeben `period_invalid`; `acquired_at` außerhalb ergibt `document_invalid`.
- CSV, 11 Zeitzonen (unter anderem Kiritimati +14, Etc/GMT+12, Pago_Pago, Lord_Howe, Chatham, Kolkata, New_York, Berlin, Moskau, Teheran) mit Ortszeiten von Jahr 1 bis 9999, Kerzen (m1, d1, w1, mn1) und Ticks: Grenze gilt nach der Umrechnung nach UTC (zum Beispiel Berlin 1970-01-01 00:00 abgelehnt, New York 2099-12-31 23:59:59 abgelehnt, Kiritimati 2100-01-01 10:00 übernommen). Dateien mit gemischten Zeilen behalten die gültigen. Datumsformen `2100-01-01`, `10000.01.01`, `0000.01.01`, `1970.1.1` ergeben abgelehnte Zeile.
- Lesen (`read_candles`, `read_ticks`, `instrument_info`, `after`, `as_of`) mit `datetime.min/max` in UTC und in Zeitzonen (+14, −14, ±23:59, New York, Kiritimati), jede Paarung: keine Ausnahme außer der Pflichtprüfung Ende nach Beginn; Treffer richtig (2 Zeilen von 1970 bis 2100).
- `completeness` (Kerzen und Ticks) und `overview` nach Importen am Rand: Ergebnisse stimmig; Zeitraum außerhalb 1970 bis 2100 ergibt `ValueError`, wie in `pipwerk-marketdata.md` Abschnitt 4.4 dokumentiert und getestet (`test_time_limits.py`), kein Befund.
- Dokumentation (`pipwerk-marketdata.md`, Schemas, `contracts/market-data/README.md`, Docstrings in `limits.py`) stimmt mit dem Verhalten überein; `test_documentation.py` und `test_contract.py` bestehen.

## Befunde

Blockierend: keine.

Hinweise (nicht blockierend):

1. Hinweise 2 bis 4 des Vorberichts 2 sind unverändert: Dauer bei 500 000 Zeilen, README ohne Verweis auf das Prüfskript; `components/pipwerk-replay/` und `components/pipwerk-fetch-mt5/` liegen unversioniert im Arbeitsverzeichnis, ebenso meine Probeskripte `ft-probe-02.py`, `-03.py`, `-04.py` (nicht im Commit; Ausgabe `work/backtest/wp02/ft-probe-04.out`).
