# pipwerk replay

Strategy tester of Pipwerk: it runs strategies against historical price data (single-step test and backtest) and keeps the test accounts and the data stock of historical price data.

The component consists of a Python backend (FastAPI, SQLAlchemy, Alembic) in `backend/` and, in a later work package, a browser user interface in `frontend/`. The current state provides the backend with its startup configuration, its own database with versioned schema, the check of the `Host` header, the test accounts (`/api/v1/accounts`, with the default test account), the data stock of historical price data (`/api/v1/market-data/`: overview, import of JSON and CSV files, completeness, acquisition from a source such as `pipwerk-fetch-mt5`) and the internal endpoints for the language, the default source and the revision (`/api/replay/`). The user interface and the test run follow.

Development setup, start, checks and decisions are described in [docs/technical/pipwerk-replay.md](../../docs/technical/pipwerk-replay.md). The web API is described in [contracts/api/pipwerk-replay/v1/openapi.json](../../contracts/api/pipwerk-replay/v1/openapi.json).

## Quick start for development

```sh
cd components/pipwerk-replay/backend
uv sync --frozen
cp pipwerk-replay.example.ini pipwerk-replay.ini
uv run --frozen pipwerk-replay -c pipwerk-replay.ini --host 127.0.0.1 --port 8000
```

The web API is described at `http://127.0.0.1:8000/docs`. pipwerk replay does not start without a valid INI startup configuration that defines the database connection; there is no implicit replacement database.

The data stock lives in the same database unless `[marketdata] url` names another one. To acquire data from a source (`pipwerk-fetch-mt5`), give `fetch_url` and `fetch_key` in `[source]` (see the example file); the key stays in the startup configuration and is never stored or shown. Without them the acquisition answers "no source is set up" and everything else works.

## Test environment

`scripts/testenv start --frontend-port <port> --backend-port <port>` starts pipwerk replay from exactly one commit of a clean working directory; `scripts/testenv status` reports it and `scripts/testenv stop` ends it. As long as the component has no `frontend/` directory, only the backend is started. See the section "Start als Testumgebung" of the technical documentation.
