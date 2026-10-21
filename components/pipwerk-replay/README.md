# pipwerk replay

Strategy tester of Pipwerk: it runs strategies against historical price data (single-step test and backtest) and keeps the test accounts and the data stock of historical price data.

The component consists of a Python backend (FastAPI, SQLAlchemy, Alembic) in `backend/` and, in a later work package, a browser user interface in `frontend/`. The current state provides the backend with its startup configuration, its own database with versioned schema, the check of the `Host` header, the test accounts (`/api/v1/accounts`, with the default test account) and the setting of the language (`/api/v1/settings`). Data stock, import, acquisition and the test run follow.

Development setup, start, checks and decisions are described in [docs/technical/pipwerk-replay.md](../../docs/technical/pipwerk-replay.md). The web API is described in [contracts/api/pipwerk-replay/v1/openapi.json](../../contracts/api/pipwerk-replay/v1/openapi.json).

## Quick start for development

```sh
cd components/pipwerk-replay/backend
uv sync --frozen
cp pipwerk-replay.example.ini pipwerk-replay.ini
uv run --frozen pipwerk-replay -c pipwerk-replay.ini --host 127.0.0.1 --port 8000
```

The web API is described at `http://127.0.0.1:8000/docs`. pipwerk replay does not start without a valid INI startup configuration that defines the database connection; there is no implicit replacement database.

## Test environment

`scripts/testenv start --frontend-port <port> --backend-port <port>` starts pipwerk replay from exactly one commit of a clean working directory; `scripts/testenv status` reports it and `scripts/testenv stop` ends it. As long as the component has no `frontend/` directory, only the backend is started. See the section "Start als Testumgebung" of the technical documentation.
