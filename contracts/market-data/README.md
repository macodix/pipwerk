# Market Data Contracts

Versioned JSON file formats for historical price data: the files the import of the data store reads and the files a source of price data (for example `pipwerk-fetch-mt5`) delivers.

- `v1/candles.schema.json`: a series of candles of one broker, one instrument and one time unit (opening moments in UTC, bid prices, optional volume and spread in points, each 0 to 2147483647).
- `v1/ticks.schema.json`: a series of ticks of one broker and one instrument (moments in UTC with milliseconds, bid and ask).
- `v1/instrument.schema.json`: the data of one instrument at one broker with the moment it was obtained.
- `v1/examples/`: one valid example file per schema. A test checks every example against its schema and against the import.

A file holds exactly one series, or the data of exactly one instrument. The field `kind` (`candles`, `ticks`, `instrument`) says which. All moments are UTC and written like `2024-01-02T10:15:00Z`. The import accepts moments from 1970-01-01T00:00:00Z up to before 2100-01-01T00:00:00Z only; a candle or tick outside is a rejected row (`time_out_of_range`). Additional fields are refused. The optional `period` states the period the source covers, even where it delivers no candle or tick; the optional `trading_hours` list the weekly trading sessions in UTC and replace the trading hours stored for the series.

The field `broker` is required in every file. For files of a source such as `pipwerk-fetch-mt5` it is the name of the trading server of MetaTrader 5 (1 to 128 characters, spaces inside allowed). When several files are imported in one process, the broker given for the process replaces the broker named in a JSON file; the schema is unchanged by that. The names of the files are not part of the format; the import dialog reads `<Instrument>_<Data>_<from>_<to>.json` only as a hint (see the technical documentation, section 5.3).

The schemas are generated from the models of the library and are not edited by hand: `pipwerk-marketdata-schemas contracts/market-data/v1` writes them, `--check` compares them (a test does the same). Everything else (limits of the import, what is rejected and why, CSV files of MetaTrader 5, time zones, completeness) is described in [docs/technical/pipwerk-marketdata.md](../../docs/technical/pipwerk-marketdata.md).
