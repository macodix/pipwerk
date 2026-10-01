# Pipwerk Studio

Graphical strategy designer of Pipwerk.

The component consists of a Python backend (FastAPI) in `backend/` and a browser user interface (React, TypeScript, Vite, React Flow) in `frontend/`. The current state is the technical skeleton of work package AP1: an empty designer canvas, German and English as user interface languages, a connection check between user interface and backend and the application name and version in the footer.

Development setup, start and checks are described in [docs/technical/pipwerk-studio.md](../../docs/technical/pipwerk-studio.md). Usage is described in [docs/user/pipwerk-studio.md](../../docs/user/pipwerk-studio.md).

## Quick start for development

```sh
cd components/pipwerk-studio/backend
uv sync --frozen
uv run --frozen uvicorn --factory pipwerk_studio.app:create_app --host 127.0.0.1 --port 8000
```

In a second terminal:

```sh
cd components/pipwerk-studio/frontend
npm ci
npm run dev
```

Then open `http://127.0.0.1:5173/` in a browser.
