# Market Data

Data store of historical price data of pipwerk (package `pipwerk_marketdata`): candles, ticks and instrument data in a database, import of JSON and CSV files, completeness check and reading.

Documentation: [docs/technical/pipwerk-marketdata.md](../../docs/technical/pipwerk-marketdata.md)

## Interface

`MarketDataStore(engine)` after `migrate_database(engine)`:

- Import: `import_json` and `import_csv` for one file; `import_files(files, broker=..., timezone=...)` for an import process with any number of files (`ImportFile`: name, content, format, and for CSV instrument and data). One broker and one time zone apply to all files, each file is taken over in a transaction of its own, a refused file does not stop the others. The result names per file the rows taken over, the period, the rejected rows with reason, or the reason the file was refused. Limits (`ImportLimits`, all with defaults): size of a file, rows of a file, `max_files` and `max_batch_bytes` of a process.
- Hints for the import dialog, no database needed: `recognize_filename(name)` gives instrument and data a file name contains (patterns `<Instrument>_<Data>_<from>_<to>` and `<Instrument>,<Data>`, for example `EURUSD_H1_202301020000_202312292300.csv`, `EURUSD,H1.csv`, `EURUSD_TICKS_20240101_20240131.json`); `inspect_json(content)` gives broker, instrument and data a JSON file names, without importing it. `<Data>` is a time unit (`M1` to `MN1`), `TICKS` or `CONTRACT`.
- Reading: `read_candles`, `read_ticks`, `instrument_info`, `trading_hours`, `completeness`.
- Data stock: `list_series(broker, instrument, data, offset, limit)` lists the series page by page, filtered by part of broker, instrument and data (case ignored), sorted by broker, instrument and data, with first and last moment and number of gaps; an instrument with instrument data but no series has a row with data `contract`. `series_details(broker, instrument, data)` gives all gaps and the instrument data at that broker. `brokers()` lists the brokers of the data store.
- `overview()` stays until `components/pipwerk-replay` no longer uses it.

Checks (run in this directory with `uv`): `uv run pytest`, `uv run ruff check`, `uv run ruff format --check`, `uv run mypy`.

Prüfskript: `packages/market-data/scripts/check`, Aufruf `check`.
