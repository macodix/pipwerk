# pipwerk replay

Strategy tester of Pipwerk: it runs strategies against historical price data (single-step test and backtest) and keeps the test accounts and the data stock of historical price data.

The component consists of a Python backend (FastAPI, SQLAlchemy, Alembic) in `backend/` and a browser user interface (React, TypeScript, Vite) in `frontend/`.

The current state provides:

- the backend with its startup configuration, its own database with versioned schema, the check of the `Host` header, the test accounts (`/api/v1/accounts`, with the default test account), the data stock of historical price data (`/api/v1/market-data/`: overview, import of JSON and CSV files, completeness, acquisition from a source such as `pipwerk-fetch-mt5`) and the internal endpoints for the language, the default source and the revision (`/api/replay/`);
- the user interface with the header, the footer and the two views "Datenbestand" (data stock: overview with periods and gaps, instrument details, default source, import of a file, acquisition by hand) and "Testkonten" (test accounts), in German and English, connected to that web API.

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

The data stock lives in the same database unless `[marketdata] url` names another one. To acquire data from a source (`pipwerk-fetch-mt5`), give `fetch_url` and `fetch_key` in `[source]` (see the example file); the key stays in the startup configuration and is never stored or shown. Without them the acquisition answers "no source is set up" and everything else works.

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

The browser tests start their own backend, a replica of the source and the built interface. Ports and the directory of the databases are parameters (`PIPWERK_REPLAY_E2E_FRONTEND_PORT`, `PIPWERK_REPLAY_E2E_BACKEND_PORT`, `PIPWERK_REPLAY_E2E_SOURCE_PORT`, `PIPWERK_REPLAY_E2E_DATA_DIR`); a port that is not given is a free port. Chromium runs all tests; Firefox and WebKit run the start of the built interface (`npx playwright install chromium firefox webkit`).

## Test environment

```sh
scripts/testenv start --frontend-port <port> --backend-port <port> [--host <address>] [--source-url <address> --source-key-file <file>]
scripts/testenv status
scripts/testenv stop
```

`scripts/testenv start` builds and starts the backend and the user interface from exactly one commit of a clean working directory; `status` reports both and the source; `stop` ends them and removes `.testenv/`. A source is set up with `--source-url` (its address) and `--source-key-file` (a file whose first line is the shared key); the key is never a parameter, is read and written with built-in commands of the shell only, and reaches nothing but the startup configuration under `.testenv/`, which only the user can read. See the section "Start als Testumgebung" of the technical documentation.
