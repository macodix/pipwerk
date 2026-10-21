# Market Data Contracts

Versioned JSON file formats for historical price data: the files the import of the data store reads and the files a source of price data (for example `pipwerk-fetch-mt5`) delivers.

- `v1/candles.schema.json`: a series of candles of one broker, one instrument and one time unit (opening moments in UTC, bid prices, optional volume and spread in points).
- `v1/ticks.schema.json`: a series of ticks of one broker and one instrument (moments in UTC with milliseconds, bid and ask).
- `v1/instrument.schema.json`: the data of one instrument at one broker with the moment it was obtained.
- `v1/examples/`: one valid example file per schema. A test checks every example against its schema and against the import.

A file holds exactly one series, or the data of exactly one instrument. The field `kind` (`candles`, `ticks`, `instrument`) says which. All moments are UTC and written like `2024-01-02T10:15:00Z`. Additional fields are refused. The optional `period` states the period the source covers, even where it delivers no candle or tick; the optional `trading_hours` list the weekly trading sessions in UTC and replace the trading hours stored for the series.

The schemas are generated from the models of the library and are not edited by hand: `pipwerk-marketdata-schemas contracts/market-data/v1` writes them, `--check` compares them (a test does the same). Everything else (limits of the import, what is rejected and why, CSV files of MetaTrader 5, time zones, completeness) is described in [docs/technical/pipwerk-marketdata.md](../../docs/technical/pipwerk-marketdata.md).
