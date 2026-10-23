# pipwerk-fetch-mt5

Source of historical market data from MetaTrader 5. A program the user calls on the machine that runs MetaTrader 5: it reads candles, ticks and the details of instruments and writes them as files in the JSON format of the import (`contracts/market-data/v1/`) into a directory. The files are then imported into the data store of pipwerk replay. The program has no server, opens no port and needs no network; pipwerk replay does not start it.

- Technical documentation: [docs/technical/pipwerk-fetch-mt5.md](../../docs/technical/pipwerk-fetch-mt5.md)
- Startup configuration: `pipwerk-fetch-mt5.example.ini` (copy it to `pipwerk-fetch-mt5.ini`, fill in `server_time_zone`, optionally the table of symbols)
- Windows (machine of MetaTrader 5): `scripts\install.cmd` once, then `scripts\fetch.cmd <parameters>`

## Call

```
pipwerk-fetch-mt5 [-c <PATH>] --from <FROM> --to <TO> [-u <UNITS>] [--ticks] [-o <DIRECTORY>] <INSTRUMENT> [<INSTRUMENT> ...]
```

Example: candles H1 and D1 and the ticks of two instruments for January 2026, written to the folder `data`:

```
scripts\fetch.cmd --from 2026-01-01 --to 2026-02-01 -u H1,D1 --ticks -o data EURUSD GBPUSD
```

- One file per instrument and series, named `<INSTRUMENT>_<DATA>_<FROM>_<TO>.json`; `<DATA>` is the time unit (`M1`, `H1`, ...), `TICKS` or `CONTRACT` (the details of the instrument, always written). A file of the same name is replaced.
- `--from` is included, `--to` is excluded. Dates and times are UTC unless a zone is given (`2026-01-05T10:30+02:00`).
- Exit code 0: all files written. 1: at least one part could not be fetched; every such part is named with instrument, kind, period and reason, the other files are written. 2: invalid call or startup configuration.

`pipwerk-fetch-mt5 --help` lists all parameters. `--help` and the technical documentation describe the formats, the configuration and the set-up on the machine of MetaTrader 5.

## Checks (Linux, without the package MetaTrader5)

```
scripts/check [--with-audit]
```

runs `uv sync --frozen`, `pytest`, `ruff check`, `ruff format --check` and `mypy`; with `--with-audit` also `pip-audit` for the locked packages (needs access to the internet). The tests use a replica of the package `MetaTrader5` (`tests/support.py`); a test against a real MetaTrader 5 is part of the acceptance.
