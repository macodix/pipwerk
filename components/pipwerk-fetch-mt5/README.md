# pipwerk-fetch-mt5

Source of historical market data from MetaTrader 5. A program the user calls on the machine that runs MetaTrader 5: it reads candles, ticks and the details of instruments and writes them as files in the JSON format of the import (`contracts/market-data/v1/`) into a directory. The files are then imported into the data store of pipwerk replay. The call on the command line has no server, opens no port and needs no network; pipwerk replay does not start it.

With pipwerk relay the program has two more commands: `serve` runs on the machine of MetaTrader 5 and answers requests that come through the relay of that machine; `request` runs on any machine, sends a request and writes the files that come back (see "Through pipwerk relay" below). They use the library `packages/relay-core`; the call on the command line does not load it.

- Technical documentation: [docs/technical/pipwerk-fetch-mt5.md](../../docs/technical/pipwerk-fetch-mt5.md)
- User documentation: [docs/user/pipwerk-replay.md](../../docs/user/pipwerk-replay.md) (the call on the command line), [docs/user/pipwerk-relay.md](../../docs/user/pipwerk-relay.md) ("Abruf mit serve und request")
- Startup configuration: `pipwerk-fetch-mt5.example.ini` (copy it to `pipwerk-fetch-mt5.ini`, fill in `server_time_zone`, optionally the table of symbols; the section `[relay]` for `serve` and `request`)
- Windows (machine of MetaTrader 5): `scripts\install.cmd` once, then `scripts\fetch.cmd <parameters>`. Copy `packages\relay-core` along with `components\pipwerk-fetch-mt5`, under the same parent folder as in the repository.

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

An instrument that is called `serve` or `request` is named after an option (`--from … --to … serve`), not as the first argument.

## Through pipwerk relay

```
pipwerk-fetch-mt5 serve [-c <PATH>]

pipwerk-fetch-mt5 request [-c <PATH>] --address <ADDRESS> --broker <BROKER> [--instrument <DESIGNATION>]
                          --from <FROM> --to <TO> [-u <UNITS>] [--ticks] [-o <DIRECTORY>] [--wait <MINUTES>] <SYMBOL>
```

- Both read the sections `[relay]` and `[relay.way]` of the startup configuration: the own address, the key of the connection with the relay, the database of the connection and the own settings of the transmission way (`target.<entry>` where the relay reads what the component sends, `inbox.<entry>` where it puts what is meant for the component). `serve` also needs `server_time_zone`; `request` does not.
- `serve` answers a request (`fetch.request`) with one message per file (`fetch.file`, the file is its attachment) and at the end one `fetch.result` that names the files and every part that could not be fetched with its reason. A request for another broker (`broker_mismatch`) or an invalid request (`request_invalid`) gets a `fetch.result` only. Requests are answered one after the other.
- `request` writes every file into the directory (one line per file), prints the result and ends with the exit codes of the call on the command line: 0 all files written; 1 a part could not be fetched, or the request could not be delivered (`relay.undeliverable`, with the reason), or no result came within the wait time (default 30 minutes); 2 invalid call or startup configuration. It needs neither MetaTrader 5 nor the package `MetaTrader5` and runs on Windows and Linux.
- After a hard stop during a delivery nothing is missing; `request` writes a file once.
- The kinds of messages and their schemas: [contracts/messages/README.md](../../contracts/messages/README.md).

`pipwerk-fetch-mt5 --help` lists all parameters. `--help` and the technical documentation describe the formats, the configuration and the set-up on the machine of MetaTrader 5.

## Checks (Linux, without the package MetaTrader5)

```
scripts/check [--with-audit]
```

runs `uv sync --frozen`, `pytest`, `ruff check`, `ruff format --check` and `mypy`; with `--with-audit` also `pip-audit` for the locked packages (needs access to the internet). The tests use a replica of the package `MetaTrader5` (`tests/support.py`); a test against a real MetaTrader 5 is part of the acceptance.
