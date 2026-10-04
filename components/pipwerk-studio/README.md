# Pipwerk Studio

Graphical strategy designer of Pipwerk.

The component consists of a Python backend (FastAPI, SQLAlchemy) in `backend/` and a browser user interface (React, TypeScript, Vite, React Flow) in `frontend/`. The current state provides an empty designer canvas, German and English as user interface languages, persistent component-wide language selection and a connection check between user interface and backend.

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

The selected language is stored in the backend database and restored after page reloads and backend restarts. It is not stored in the browser. See the technical documentation for automatic INI search paths and all checks.
