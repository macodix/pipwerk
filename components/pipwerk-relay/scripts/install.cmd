@echo off
rem Installation of pipwerk-relay (Windows).
rem
rem Installs the runtime dependencies from the lock file uv.lock into an environment of
rem its own below this component (the folder .venv), together with the library
rem packages\relay-core. The development tools (pytest, ruff, mypy) are not installed.
rem Nothing is changed in the Python installation of the system.
rem
rem Needs uv (https://docs.astral.sh/uv/) and access to the package index once.
rem Documentation: docs/technical/pipwerk-relay.md, section "Einrichtung des Relays".
setlocal
set "COMPONENT=%~dp0.."
uv --project "%COMPONENT%" sync --frozen --no-dev
exit /b %ERRORLEVEL%
