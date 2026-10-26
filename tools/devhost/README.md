# tools/devhost

Quellen der Steuerskripte des Entwicklungsablaufs mit Tests und einer Testumgebung. Grundlage ist `docs/technical/entwicklungsverfahren.md`, Abschnitt „Technische Ausführung“.

## Aufteilung

```
tools/devhost/
  scripts/            wird nach <entwicklungsverzeichnis>/scripts/ installiert
    agentrun          überwacht repo/development/messages/, startet und beendet Sitzungen, meldet failed
    heartbeat         Hook von Claude Code (PreToolUse, PostToolUse, PostToolUseFailure)
    pidcheck          Prüfung für Cron: startet agentrun, wenn der Prozess aus run/agentrun.pid nicht läuft
  devteam/lib/
    startrole         wird nach <entwicklungsverzeichnis>/devteam/lib/ installiert; gemeinsamer Teil der Startskripte für Tester und QA
  tests/
    testenv           Hilfsskript: Testumgebung anlegen und alle Tests ausführen
    agentrun.bats     Tests für agentrun, heartbeat, pidcheck und die Startskripte
    fakes/            Ersatzprogramme claude, gh, tmux
    scenarios/        Szenariendateien für das Ersatzprogramm claude
```

Das Verhalten der Skripte entspricht den bisher installierten Skripten. Neu ist nur, dass die Werte unten Parameter sind.

## Abhängigkeiten

`bash`, `sed`, `flock`, `setsid`, `stat`, `base64`, `jq`, `inotifywait` (Paket `inotify-tools`), `tmux`, `claude`, `gh` (mit Schreibrecht auf das Repository). Für die Tests: `bats`, `pgrep`, `git`.

## Installation

Das Entwicklungsverzeichnis ist `<root>`. Die Installation kopiert, mit gesetztem Ausführungsbit:

```sh
cp -p tools/devhost/scripts/agentrun tools/devhost/scripts/heartbeat tools/devhost/scripts/pidcheck <root>/scripts/
cp -p tools/devhost/devteam/lib/startrole <root>/devteam/lib/
```

Die Skripte ermitteln `<root>` aus ihrem Ablageort: `scripts/` liegt direkt, `devteam/lib/` zwei Ebenen unter `<root>`. Es gibt keinen festen Pfad im Skript.

### Werte bei der Installation

Jeder Wert steht am Anfang des Skripts als Parameter. Die Umgebung überschreibt den Standardwert. Die Installation setzt in den installierten Kopien diese Werte, damit der Betrieb ohne Umgebungsvariablen wie bisher läuft:

| Skript | Parameter | Standard im Repository | Bei der Installation setzen |
|---|---|---|---|
| `agentrun` | `GITHUB_REPO` | leer | `<eigentümer>/<name>` des Repositorys für Meldungen `failed` |
| `agentrun` | `CLAUDE` | `claude` | vollständiger Pfad des Programms `claude` |
| `pidcheck` | `PIDCHECK_PATH` | `/usr/local/bin:/usr/bin:/bin` | Suchpfad einschließlich des Verzeichnisses von `claude`; Cron setzt nur `/usr/bin:/bin` |
| `agentrun` | `HEARTBEAT_TIMEOUT` | `900` | unverändert lassen |
| `agentrun` | `INTERVAL` | `30` | unverändert lassen |

Ist `GITHUB_REPO` leer, scheitert das Schreiben der Meldung `failed`; `agentrun` protokolliert das und versucht es bei der nächsten Prüfung erneut. Die Werte des Entwicklungsrechners stehen nicht in diesem Verzeichnis.

## Testumgebung

```sh
tools/devhost/tests/testenv create <verzeichnis> [--heartbeat-timeout S] [--interval S] [--claude PROGRAMM] [--tmux PROGRAMM] [--gh PROGRAMM] [--scenario DATEI] [--github-repo NAME]
```

legt unter `<verzeichnis>` die Struktur des Entwicklungsverzeichnisses an: `origin.git` (lokales Repository als `origin`), `repo/` (Klon, Zweig `main`), `run/`, `work/`, `devteam/`, `scripts/` und `fakes/`. Es installiert die Skripte und hängt die Programme ein. `<verzeichnis>/env` setzt `PATH`, `CLAUDE`, `GITHUB_REPO`, `HEARTBEAT_TIMEOUT`, `INTERVAL` und `PIDCHECK_PATH`; wer die Umgebung benutzt, liest es mit `source <verzeichnis>/env`.

Die Quellen enthalten `devteam/bin/functiontest`, `securitytest`, `qa` und `devteam/start.conf` nicht. Die Testumgebung erzeugt dafür **Ersatz-Startskripte** und eine Ersatz-`start.conf` (Modell `sonnet`, Aufruf von `claude` wie in den Erwartungen der Tests) sowie eine leere `settings.json`. Sie dienen nur den Tests von `startrole`; die echten Dateien gehören nicht zu diesem Verzeichnis.

### Ersatzprogramm claude

`tests/fakes/claude` versteht `--session-id`, `--resume`, `--agent` und den Startauftrag. `--settings`, `--plugin-dir` und die übrigen Optionen werden ignoriert, aber aufgezeichnet. Neben dem Programm liegen `claude.log` (letzter Aufruf) und `claude.calls` (Protokoll aller Aufrufe mit `cwd=`, `arg=`, `session-id=`, `resume=`). Das Verhalten steuert eine Szenariendatei (`--scenario`, in der Testumgebung `fakes/claude.scenario`): je Aufruf eine Zeile `call: <aktion> ; <aktion> …`. Aktionen: `reply`, `crash [code]`, `hang`, `limit`, `limit-time <zeit>`, `wait-resume [s]` (wartet auf die Datei `claude.resume`), `sleep <s>`, `exit [code]`. Der Wortlaut der Meldung der Nutzungsgrenze ist ein Platzhalter (`limit_text`, `limit_text_time`); er wird in Auftrag 07 an einer echten Ausgabe nachgewiesen. Vorhandene Szenarien: `tests/scenarios/` (`reply`, `crash`, `hang`, `limit-no-time`, `limit-with-time`). Die Tests dazu folgen in den Aufträgen 07 und 08.

## Tests

```sh
tools/devhost/tests/testenv test
```

Jeder Test legt mit `testenv create` eine eigene Testumgebung an. Einzelne Datei: `tools/devhost/tests/testenv test tools/devhost/tests/agentrun.bats`.
