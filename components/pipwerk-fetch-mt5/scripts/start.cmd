@echo off
rem Start of pipwerk-fetch-mt5 on the machine of MetaTrader 5 (Windows).
rem
rem   start.cmd [-c <PATH>]
rem
rem Starts the program from the environment that install.cmd has created. All parameters go
rem to the program: -c <PATH> names the startup configuration; without it the program
rem searches %USERPROFILE%\pipwerk\etc, %APPDATA%\pipwerk and %PROGRAMDATA%\pipwerk for the
rem file pipwerk-fetch-mt5.ini. The program listens on the address and the port of that file.
rem Press Ctrl+C to stop it.
rem
rem The working folder stays the one you call the script from, so a relative path after -c
rem is read from there. MetaTrader 5 must be running and logged in.
rem Documentation: docs/technical/pipwerk-fetch-mt5.md, section "Einrichtung auf dem Rechner
rem von MetaTrader 5".
setlocal
set "COMPONENT=%~dp0.."
uv --project "%COMPONENT%" run --frozen --extra mt5 --no-dev pipwerk-fetch-mt5 %*
exit /b %ERRORLEVEL%
