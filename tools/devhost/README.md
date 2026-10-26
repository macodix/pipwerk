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

Das Verhalten der Skripte entspricht den bisher installierten Skripten, erweitert um Fortsetzung und Pause (Abschnitte „Fortsetzung nach einem Abbruch“ und „Nutzungsgrenze“) und um die Werte unten als Parameter. `startrole` setzt Fortsetzung und Pause noch nicht um (Auftrag 08).

## Abhängigkeiten

`bash`, `sed`, `grep`, `date` (GNU, `-d`), `flock`, `setsid`, `stat`, `base64`, `jq`, `inotifywait` (Paket `inotify-tools`), `tmux`, `claude`, `gh` (mit Schreibrecht auf das Repository), `/proc/sys/kernel/random/uuid` (Linux) für die Kennung der Sitzungen. Für die Tests: `bats`, `pgrep`, `git`.

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
| `agentrun` | `ABORT_LIMIT` | `3` | unverändert lassen |
| `agentrun` | `RESUME_GRACE` | `60` | unverändert lassen |
| `agentrun` | `PAUSE_INTERVAL` | `900` | unverändert lassen |
| `agentrun` | `LIMIT_TEXT`, `LIMIT_TIME_PATTERN` | Platzhalter | der Suchtext der Nutzungsgrenze, sobald er an einer echten Ausgabe nachgewiesen ist (siehe „Nutzungsgrenze“) |

Ist `GITHUB_REPO` leer, scheitert das Schreiben der Meldung `failed`; `agentrun` protokolliert das und versucht es bei der nächsten Prüfung erneut. Die Werte des Entwicklungsrechners stehen nicht in diesem Verzeichnis.

## Fortsetzung nach einem Abbruch (`agentrun`)

Spezifikation `development/verfahren/specification.md`, Abschnitt 3.2, Punkte 1 bis 4.

- **Kennung.** `agentrun` startet jede Sitzung mit `--session-id <kennung>` (neue UUID) vor dem Startauftrag.
- **Zustandsdatei** `run/<key>.session`, eine Angabe je Zeile: 1 Meldung, 2 `ref`, 3 Beginn der Herzschlagmessung, 4 Rolle, 5 Kennung, 6 Zähler der Abbrüche, 7 Zeitpunkt der letzten Fortsetzung (0: keine). Die Datei gehört zur Meldung und wird mit ihr gelöscht; eine neue Meldung beginnt deshalb bei null.
- **Abbruch** ist: die tmux-Sitzung besteht nicht mehr, ohne dass die Antwortmeldung vorliegt (Art „Absturz“), oder `HEARTBEAT_TIMEOUT` Sekunden ohne Herzschlag ohne Nutzungsgrenze auf dem Bildschirm (Art „Stillstand“). Der erste und zweite Abbruch einer Meldung: `agentrun` beendet die tmux-Sitzung, falls sie noch besteht, erhöht den Zähler und startet im selben Arbeitsverzeichnis mit `--resume <kennung>` und dem Startauftrag „Die Sitzung wurde abgebrochen. Prüfe den Stand deines Arbeitsverzeichnisses und setze die Aufgabe dort fort, wo sie abgebrochen ist.“
- **Neustart.** Lässt sich die Sitzung nicht fortsetzen, startet `agentrun` sie mit dem ursprünglichen Startauftrag und einer neuen Kennung neu; das zählt als derselbe Abbruch. „Nicht fortsetzbar“ heißt: der Start der Fortsetzung schlägt fehl, oder die fortgesetzte Sitzung besteht innerhalb von `RESUME_GRACE` Sekunden nicht mehr. Schlägt auch der Neustart fehl, folgt `failed` (Art „Start fehlgeschlagen“).
- **failed.** Beim `ABORT_LIMIT`-ten (dritten) Abbruch derselben Meldung setzt `agentrun` nicht fort, sondern schreibt `failed` an den Projektleiter. Der Text endet mit „Abbrüche derselben Meldung: <zahl>, Art des letzten Abbruchs: <art>.“
- **Ungültiges `ref`** führt sofort zu `failed`, ohne Start und ohne Fortsetzung.
- **Start schlägt fehl** (tmux startet die erste Sitzung nicht): `failed` sofort, wie bisher; es gibt noch keine Sitzung zum Fortsetzen.

## Nutzungsgrenze (`agentrun`)

Spezifikation Abschnitt 3.3, Punkte 1 bis 3.

1. Fehlt der Herzschlag einer Sitzung `HEARTBEAT_TIMEOUT` Sekunden lang, liest `agentrun` vor der Entscheidung über einen Stillstand den sichtbaren Inhalt der tmux-Sitzung (`tmux capture-pane -p`). Enthält er `LIMIT_TEXT`, gilt die Sitzung als pausiert. Das prüft `agentrun` für alle Sitzungen, bevor es einen Stillstand wertet.
2. Solange irgendeine Sitzung pausiert ist, wertet `agentrun` bei keiner Sitzung fehlenden Herzschlag als Stillstand. Der Vermerk steht in `run/<key>.paused`: Zeile 1 Zeitpunkt der nächsten Prüfung (Sekunden seit 1970), Zeile 2 der in der Meldung genannte Zeitpunkt (kann leer sein). Eine abgestürzte Sitzung ist auch während der Pause ein Abbruch.
3. Steht in der Zeile mit `LIMIT_TEXT` ein Zeitpunkt (Muster `LIMIT_TIME_PATTERN`, lesbar für `date -d`), ist er der nächste Prüfzeitpunkt, sonst gilt jetzt plus `PAUSE_INTERVAL` Sekunden. Zum Prüfzeitpunkt schickt `agentrun` der Sitzung mit `tmux send-keys` den Text „Die Nutzungsgrenze ist aufgehoben. Fahre fort.“ und Enter, entfernt den Vermerk und beginnt die Herzschlagmessung für alle Sitzungen neu (`run/<key>.heartbeat` wird für alle Sitzungen berührt). Ist die Grenze noch nicht aufgehoben, bleibt die Sitzung ohne Herzschlag; nach `HEARTBEAT_TIMEOUT` Sekunden stellt `agentrun` die Pause erneut fest. Die Aufforderung dient damit zugleich als Prüfung.

### Nachweis des Suchtextes (Punkt 5 der Spezifikation): offen

`LIMIT_TEXT` und `LIMIT_TIME_PATTERN` sind **Platzhalter** (`Platzhalter: Nutzungsgrenze erreicht`, ein Zeitpunkt der Form `2099-01-01T00:00:00Z`). Die Ausgabe von Claude Code bei erreichter Nutzungsgrenze ist an keiner echten Ausgabe nachgewiesen; der Wortlaut ist nicht erfunden worden. Mit den Platzhaltern erkennt `agentrun` auf dem Entwicklungsrechner keine echte Pause, sondern wertet den Stillstand wie bisher (Abbruch und Fortsetzung). Der Nachweis braucht den Wortlaut aus einem Protokoll oder einer Probe der echten Sitzung; danach werden `LIMIT_TEXT` und `LIMIT_TIME_PATTERN` in `agentrun` sowie `limit_text` und `limit_text_time` in `tests/scenarios/limit-*.scn` eingetragen.

## Testumgebung

```sh
tools/devhost/tests/testenv create <verzeichnis> [--heartbeat-timeout S] [--interval S] [--pause-interval S] [--resume-grace S] [--claude PROGRAMM] [--tmux PROGRAMM] [--gh PROGRAMM] [--scenario DATEI] [--github-repo NAME]
```

legt unter `<verzeichnis>` die Struktur des Entwicklungsverzeichnisses an: `origin.git` (lokales Repository als `origin`), `repo/` (Klon, Zweig `main`), `run/`, `work/`, `devteam/`, `scripts/` und `fakes/`. Es installiert die Skripte und hängt die Programme ein. `<verzeichnis>/env` setzt `PATH`, `CLAUDE`, `GITHUB_REPO`, `HEARTBEAT_TIMEOUT`, `INTERVAL`, `PAUSE_INTERVAL`, `RESUME_GRACE` und `PIDCHECK_PATH`; wer die Umgebung benutzt, liest es mit `source <verzeichnis>/env`.

Die Quellen enthalten `devteam/bin/functiontest`, `securitytest`, `qa` und `devteam/start.conf` nicht. Die Testumgebung erzeugt dafür **Ersatz-Startskripte** und eine Ersatz-`start.conf` (Modell `sonnet`, Aufruf von `claude` wie in den Erwartungen der Tests) sowie eine leere `settings.json`. Sie dienen nur den Tests von `startrole`; die echten Dateien gehören nicht zu diesem Verzeichnis.

### Ersatzprogramm claude

`tests/fakes/claude` versteht `--session-id`, `--resume`, `--agent` und den Startauftrag. `--settings`, `--plugin-dir` und die übrigen Optionen werden ignoriert, aber aufgezeichnet. Neben dem Programm liegen `claude.log` (letzter Aufruf) und `claude.calls` (Protokoll aller Aufrufe mit `cwd=`, `arg=`, `session-id=`, `resume=`). Das Verhalten steuert eine Szenariendatei (`--scenario`, in der Testumgebung `fakes/claude.scenario`): je Aufruf eine Zeile `call: <aktion> ; <aktion> …`. Aktionen: `reply`, `crash [code]`, `hang`, `limit`, `limit-time <zeit>`, `wait-resume [s]` (wartet auf die Datei `claude.resume`), `sleep <s>`, `exit [code]`. Der Wortlaut der Meldung der Nutzungsgrenze ist ein Platzhalter (`limit_text`, `limit_text_time`), siehe „Nachweis des Suchtextes“. Vorhandene Szenarien: `tests/scenarios/` (`reply`, `crash`, `hang`, `limit-no-time`, `limit-with-time`). Die Tests zu `agentrun` (Auftrag 07) benutzen `limit-no-time` und `limit-with-time` und legen die übrigen Abläufe als Szenario im Test an; die zu `startrole` folgen in Auftrag 08.

### Ersatzprogramm tmux

`tests/fakes/tmux` führt eine Sitzung als Datei `fakes/sessions/<name>`. Ohne Szenario läuft der Befehl nicht; ein Test beendet die Sitzung, indem er die Datei löscht, und stellt den Bildschirm mit `sessions/<name>.screen` ein. Liegt `fakes/claude.scenario`, läuft der Befehl im Hintergrund im Arbeitsverzeichnis der Sitzung, seine Ausgabe ist der Bildschirm (`sessions/<name>.screen`), und die Sitzung endet mit dem Befehl. `capture-pane` gibt den Bildschirm aus, `send-keys` hält den Text in `sessions/<name>.keys` fest und legt `fakes/claude.resume` an (damit setzt `wait-resume` im Szenario fort), `kill-session` beendet den Befehl. Alle Aufrufe stehen in `sessions/.calls`.

## Tests

```sh
tools/devhost/tests/testenv test
```

Jeder Test legt mit `testenv create` eine eigene Testumgebung an. Einzelne Datei: `tools/devhost/tests/testenv test tools/devhost/tests/agentrun.bats`.
