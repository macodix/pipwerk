# Market Data

Data store of historical price data of pipwerk (package `pipwerk_marketdata`): candles, ticks and instrument data in a database, import of JSON and CSV files, completeness check and reading.

Documentation: [docs/technical/pipwerk-marketdata.md](../../docs/technical/pipwerk-marketdata.md)

## Interface

`MarketDataStore(engine)` after `migrate_database(engine)`:

- Import: `import_json` and `import_csv` for one file; `import_files(files, broker=..., timezone=...)` for an import process with any number of files (`ImportFile`: name, content, format, and for CSV instrument and data; for JSON an optional instrument replaces the one of the content, data must equal the content or the file is refused). One broker and one time zone apply to all files, each file is taken over in a transaction of its own, a refused file does not stop the others. The result names per file the rows taken over, the period, the rejected rows with reason, or the reason the file was refused. Limits (`ImportLimits`, all with defaults): size of a file and rows of a file; there is no limit for the number of files or their total size.
- Deleting: `plan_delete_series`, `plan_delete_period`, `plan_delete_contract`, `plan_delete_broker` say what a deletion would remove and change nothing; `delete_series`, `delete_period`, `delete_contract`, `delete_broker` delete in one transaction. A series without a candle or tick left is removed, a broker without data no longer occurs.
- Completeness: no gap inside a covered period; a gap is the time between two covered periods that is not wholly in a time without trade (weekend, outside the trading hours, days without trade given in `CompletenessRules.no_trading_days`).
- Hints for the import dialog, no database needed: `recognize_filename(name)` gives instrument and data a file name contains (patterns `<Instrument>_<Data>_<from>_<to>` and `<Instrument>,<Data>`, for example `EURUSD_H1_202301020000_202312292300.csv`, `EURUSD,H1.csv`, `EURUSD_TICKS_20240101_20240131.json`); `inspect_json(content)` gives broker, instrument and data a JSON file names, without importing it. `<Data>` is a time unit (`M1` to `MN1`), `TICKS` or `CONTRACT`.
- Reading: `read_candles`, `read_ticks`, `instrument_info`, `trading_hours`, `completeness`.
- Data stock: `list_series(broker, instrument, data, offset, limit)` lists the series page by page, filtered by part of broker, instrument and data (case ignored), sorted by broker, instrument and data, with first and last moment and number of gaps; an instrument with instrument data but no series has a row with data `contract`. `series_details(broker, instrument, data)` gives all gaps and the instrument data at that broker. `brokers()` lists the brokers of the data store.
- `overview()` stays until `components/pipwerk-replay` no longer uses it.

Checks (run in this directory with `uv`): `uv run pytest`, `uv run ruff check`, `uv run ruff format --check`, `uv run mypy`.

Prüfskript: `packages/market-data/scripts/check`, Aufruf `check`.
