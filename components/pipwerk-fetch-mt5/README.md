# pipwerk-fetch-mt5

Source of historical market data from MetaTrader 5. A small program for the machine that runs MetaTrader 5: it reads candles, ticks and the details of an instrument and delivers them over HTTP, protected by a shared key, as files in the JSON format of the import (`contracts/market-data/v1/`).

- Technical documentation: [docs/technical/pipwerk-fetch-mt5.md](../../docs/technical/pipwerk-fetch-mt5.md)
- Description of the interface: [contracts/api/pipwerk-fetch/v1/](../../contracts/api/pipwerk-fetch/v1/openapi.json), with examples
- Startup configuration: `pipwerk-fetch-mt5.example.ini` (copy it to `pipwerk-fetch-mt5.ini`, fill in `shared_key` and `server_time_zone`)
- Windows (machine of MetaTrader 5): `scripts\install.cmd`, then `scripts\start.cmd [-c <PATH>]`

## Checks (Linux, without the package MetaTrader5)

```
uv sync --frozen
uv run --frozen pytest
uv run --frozen ruff check
uv run --frozen ruff format --check
uv run --frozen mypy
```

## Replica of the source for tests

`pipwerk_fetch_mt5.fake_source` answers like the real program, with fixed deterministic data and no MetaTrader 5. Other components (pipwerk replay) test against it. Add the component as a path dependency (`pipwerk-fetch-mt5 = { path = "../pipwerk-fetch-mt5", editable = true }` in `[tool.uv.sources]`).

In a test, without network and port:

```python
from fastapi.testclient import TestClient
from pipwerk_fetch_mt5.fake_source import FAKE_SHARED_KEY, FakeGateway, create_fake_source_app

gateway = FakeGateway()
app = create_fake_source_app(gateway=gateway)  # key FAKE_SHARED_KEY, server time zone UTC
client = TestClient(
    app, base_url="http://127.0.0.1", headers={"Authorization": f"Bearer {FAKE_SHARED_KEY}"}
)

response = client.post(
    "/api/v1/fetch",
    json={
        "kind": "candles",
        "instrument": "EURUSD",
        "time_unit": "m5",
        "start": "2026-01-05T08:00:00Z",
        "end": "2026-01-05T09:00:00Z",
    },
)
file = response.json()["file"]  # the file the import reads

gateway.fail("EURUSD", "no_data")  # reading EURUSD now answers no_data
gateway.available = False  # everything answers terminal_unavailable
```

As a program on a port, for tests that need a real connection:

```
python -m pipwerk_fetch_mt5.fake_source --port 8766
```

The key is `FAKE_SHARED_KEY` (a test value, no secret) unless `--key` gives another.

What the replica delivers:

- Instruments `EURUSD`, `GBPUSD`, `USDJPY`; any other designation answers `symbol_unknown`.
- Candles of all 21 time units of MetaTrader 5 (`m1` to `mn1`), ticks about every 1.5 seconds with milliseconds, and the details of the instrument. The same request gives the same bytes every time.
- No candle and no tick from Friday 22:00 to Sunday 22:00 (server time); the files carry the trading hours Sunday 22:00 to Friday 22:00 while the time zone of the replica (`time_zone`, default `UTC`) has no summer time.
- Errors on request: `symbol_unknown` (unknown designation), `no_data`, `broker_error` and `terminal_unavailable` (`gateway.fail`, `gateway.available`), `range_too_large` (small `max_rows`), `unauthorized` (wrong key), `invalid_request`, `host_not_allowed`.

More in section 8 of the technical documentation.
