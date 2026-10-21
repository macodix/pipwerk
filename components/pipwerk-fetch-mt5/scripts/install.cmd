@echo off
rem Installation of pipwerk-fetch-mt5 on the machine of MetaTrader 5 (Windows).
rem
rem Installs the runtime dependencies from the lock file uv.lock into an environment of
rem its own below this component (the folder .venv), including the package MetaTrader5.
rem The development tools (pytest, ruff, mypy) are not installed. Nothing is changed in the
rem Python installation of the system.
rem
rem Needs uv (https://docs.astral.sh/uv/) and access to the package index once.
rem Documentation: docs/technical/pipwerk-fetch-mt5.md, section "Einrichtung auf dem Rechner
rem von MetaTrader 5".
setlocal
set "COMPONENT=%~dp0.."
uv --project "%COMPONENT%" sync --frozen --extra mt5 --no-dev
exit /b %ERRORLEVEL%
