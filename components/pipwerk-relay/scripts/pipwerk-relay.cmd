@echo off
rem Call of pipwerk-relay (Windows).
rem
rem   pipwerk-relay.cmd [-c <PATH>] run
rem   pipwerk-relay.cmd [-c <PATH>] config load <FILE> | config show
rem   pipwerk-relay.cmd [-c <PATH>] key new <FILE>
rem   pipwerk-relay.cmd [-c <PATH>] queue | migrate
rem
rem Runs the program from the environment that install.cmd has created. All parameters go
rem to the program; "pipwerk-relay.cmd --help" lists them. Without -c the program searches
rem %USERPROFILE%\pipwerk\etc, %APPDATA%\pipwerk and %PROGRAMDATA%\pipwerk for the file
rem pipwerk-relay.ini. The working folder stays the one you call the script from, so relative
rem paths are read from there. The program opens no port.
rem Documentation: docs/technical/pipwerk-relay.md, section "Befehle".
setlocal
set "COMPONENT=%~dp0.."
uv --project "%COMPONENT%" run --frozen --no-dev pipwerk-relay %*
exit /b %ERRORLEVEL%
