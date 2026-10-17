# pipwerk Studio

Graphical strategy designer of Pipwerk.

The component consists of a Python backend (FastAPI, SQLAlchemy) in `backend/` and a browser user interface (React, TypeScript, Vite, React Flow) in `frontend/`. The current state provides the strategy designer (menu, element library, canvas, property view: create, design, check, save, open, close and delete strategies), German and English as user interface languages, persistent component-wide language selection and object directory in the settings, and a connection check between user interface and backend. The footer shows the revision (commit) pipwerk Studio runs from; the dialog "About pipwerk Studio", opened from the header, shows name, the full revision with date, the license text and the address of the repository.

Development setup, start and checks are described in [docs/technical/pipwerk-studio.md](../../docs/technical/pipwerk-studio.md). Usage is described in [docs/user/pipwerk-studio.md](../../docs/user/pipwerk-studio.md).

## Quick start for development

```sh
cd components/pipwerk-studio/backend
uv sync --frozen
cp pipwerk-studio.example.ini pipwerk-studio.ini
uv run --frozen pipwerk-studio -c pipwerk-studio.ini --host 127.0.0.1 --port 8000
```

In a second terminal:

```sh
cd components/pipwerk-studio/frontend
npm ci
npm run dev
```

Then open `http://127.0.0.1:5173/` in a browser.

## Test environment

`scripts/testenv start --frontend-port <port> --backend-port <port>` builds and starts pipwerk Studio from exactly one commit of a clean working directory; `scripts/testenv status` reports it and `scripts/testenv stop` ends it. See the section "Start als Testumgebung" of the technical documentation.

The selected language is stored in the backend database and restored after page reloads and backend restarts. It is not stored in the browser. pipwerk Studio does not start without a valid INI startup configuration that defines the database connection; there is no implicit replacement database. See the technical documentation for automatic INI search paths and all checks.
