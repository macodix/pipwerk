@echo off
rem Call of pipwerk-fetch-mt5 on the machine of MetaTrader 5 (Windows).
rem
rem   fetch.cmd [-c <PATH>] --from <FROM> --to <TO> [-u <UNITS>] [--ticks]
rem             [-o <DIRECTORY>] <INSTRUMENT> [<INSTRUMENT> ...]
rem
rem Runs the program from the environment that install.cmd has created. All parameters go
rem to the program; "fetch.cmd --help" lists them. Without -c the program searches
rem %USERPROFILE%\pipwerk\etc, %APPDATA%\pipwerk and %PROGRAMDATA%\pipwerk for the file
rem pipwerk-fetch-mt5.ini. The files are written to the folder given with -o, without it to
rem the folder you call the script from.
rem
rem The working folder stays the one you call the script from, so relative paths after -c and
rem -o are read from there. MetaTrader 5 must be running and logged in. The program ends after
rem its work and opens no port.
rem Documentation: docs/technical/pipwerk-fetch-mt5.md, section "Einrichtung auf dem Rechner
rem von MetaTrader 5".
setlocal
set "COMPONENT=%~dp0.."
uv --project "%COMPONENT%" run --frozen --extra mt5 --no-dev pipwerk-fetch-mt5 %*
exit /b %ERRORLEVEL%
