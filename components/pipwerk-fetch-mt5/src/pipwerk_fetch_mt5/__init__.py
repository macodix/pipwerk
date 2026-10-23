"""pipwerk-fetch-mt5: historical market data from MetaTrader 5 as files for the import.

A program the user calls on the machine of MetaTrader 5. It reads candles, ticks and the
details of instruments and writes them as files in the JSON format of the import
(``contracts/market-data/v1/``) into a directory. It has no server and opens no port
(specification backtest, section 5.4). Documentation: ``docs/technical/pipwerk-fetch-mt5.md``.
"""

__version__ = "0.1.0.dev0"
