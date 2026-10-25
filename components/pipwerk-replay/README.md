# pipwerk replay

Strategy tester of Pipwerk: it runs strategies against historical price data (single-step test and backtest) and keeps the test accounts and the data stock of historical price data.

The component consists of a Python backend (FastAPI, SQLAlchemy, Alembic) in `backend/` and a browser user interface (React, TypeScript, Vite) in `frontend/`.

The current state provides:

- the backend with its startup configuration, its own database with versioned schema, the check of the `Host` header, the test accounts (`/api/v1/accounts`, with the default test account), the data stock of historical price data (`/api/v1/market-data/`: the list of series filtered and page by page, the details of a series with its gaps and the instrument data, the brokers, the import of any number of JSON and CSV files in one import process, one request per file, with a preview of what a file says about itself, deleting series, periods, instrument data and all data of a broker after a preview and a confirmation, the completeness of the data a test run needs; weekends and days without trade are no gaps) and the internal endpoints for the language, the broker for test runs and the revision (`/api/replay/`). pipwerk replay acquires no data: price data come into the data stock only through the import (for example files written by `pipwerk-fetch-mt5` on the computer of MetaTrader 5);
- the user interface with the header, the footer and the three views "Datenbestand" (data stock), "Testkonten" (test accounts) and "Einstellungen" (settings: keep imported files, storage, import and export directory), in German and English. The view "Datenbestand" has a bar with the button "Datei importieren …" (a dialog that imports any number of JSON and CSV files in one process, uploaded or chosen in the import directory, with the box "Dateien behalten") and the choice of the broker for test runs, and below it a compact table of the series with a filter, pages and the details of a row (all gaps and the contract data). It uses the web API of the backend as described above and acquires nothing.

The test run (single-step test and backtest) and the saved backtests follow in later work packages.

Development setup, start, checks and decisions are described in [docs/technical/pipwerk-replay.md](../../docs/technical/pipwerk-replay.md). How to use pipwerk replay (German) is described in [docs/user/pipwerk-replay.md](../../docs/user/pipwerk-replay.md). The web API is described in [contracts/api/pipwerk-replay/v1/openapi.json](../../contracts/api/pipwerk-replay/v1/openapi.json).

## Quick start for development

Backend, in one terminal:

```sh
cd components/pipwerk-replay/backend
uv sync --frozen
cp pipwerk-replay.example.ini pipwerk-replay.ini
uv run --frozen pipwerk-replay -c pipwerk-replay.ini --host 127.0.0.1 --port 8000
```

User interface, in another terminal (needs Node.js 24 or newer):

```sh
cd components/pipwerk-replay/frontend
npm ci
npm run dev
```

The development server of Vite passes the requests under `/api` to the backend (`PIPWERK_REPLAY_BACKEND_URL`, default `http://127.0.0.1:8000`). The web API is described at `http://127.0.0.1:8000/docs`. pipwerk replay does not start without a valid INI startup configuration that defines the database connection; there is no implicit replacement database.

The data stock lives in the same database unless `[marketdata] url` names another one. An import has no limit for the number or the total size of its files; the limits per file (size and number of rows), the days without trade and the time after which an import process ends by itself are entries of `[marketdata]` with defaults (see the example file). A startup configuration that still has the former section for a source is not wrong: the backend ignores it, like any entry it does not know.

The settings for files (keep imported files, storage directory, import directory, export directory) are stored in the database, not in the startup configuration; without a stored value the default of the operating system applies (see `docs/technical/pipwerk-replay.md`, section 2.7a). The import can read files directly from the import directory; it never changes them. A kept file never replaces an existing file: if the name is taken, it gets a number before the extension (`EURUSD_M1 (2).csv`), and the answer names it (`kept_as`). Storage and import directory may be the same or lie inside each other.

## Checks

```sh
cd components/pipwerk-replay/backend
uv run --frozen pytest
uv run --frozen ruff check
uv run --frozen ruff format --check
uv run --frozen mypy

cd ../frontend
npm run typecheck     # tsc --noEmit, strict
npm test              # Vitest with Testing Library
npm run build         # type check and build into dist/
npm run e2e           # Playwright against the built interface and a real backend
```

The first four commands check the backend. The browser tests start their own backend and the built interface on two ports; the interface passes `/api` on to the backend, as it does in operation. Ports and the directory of the database are parameters (`PIPWERK_REPLAY_E2E_FRONTEND_PORT`, `PIPWERK_REPLAY_E2E_BACKEND_PORT`, `PIPWERK_REPLAY_E2E_DATA_DIR`); a port that is not given is a free port. Chromium runs all tests; Firefox and WebKit run the start of the built interface (`npx playwright install chromium firefox webkit`).

## Test environment

```sh
scripts/testenv start --frontend-port <port> --backend-port <port> [--host <address>]
scripts/testenv status
scripts/testenv stop
```

`scripts/testenv start` builds and starts the backend and the user interface from exactly one commit of a clean working directory with an empty data stock; `status` reports both; `stop` ends them and removes `.testenv/`. Any other parameter is refused. See the section "Start als Testumgebung" of the technical documentation.
