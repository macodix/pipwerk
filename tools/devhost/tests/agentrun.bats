#!/usr/bin/env bats
# Tests für agentrun, heartbeat, pidcheck und die Startskripte in devteam/bin
# ohne echtes GitHub, tmux und Claude Code. Jeder Test legt mit testenv create eine
# vollständige Testumgebung (Entwicklungsverzeichnis) in einem eigenen Verzeichnis an;
# die Skripte ermitteln ihr Entwicklungsverzeichnis aus ihrem Ablageort.

setup() {
  T="$BATS_TEST_TMPDIR"
  R="$T/root"
  IN="$R/repo/development/messages/architect"
  DL="$R/repo/development/messages/devlead"       # legt erst der jeweilige Test an, wie Git ohne Meldung darin
  OUT="$R/repo/development/messages/projectlead"
  FAKES="$R/fakes"
  LOG="$T/agentrun.log"
  "$BATS_TEST_DIRNAME/testenv" create "$R"
  # setzt PATH mit den Ersatzprogrammen sowie CLAUDE, GITHUB_REPO, HEARTBEAT_TIMEOUT, INTERVAL, PIDCHECK_PATH
  source "$R/env"
}

teardown() {
  if [[ -f "$R/run/agentrun.pid" ]]; then
    kill "$(cat "$R/run/agentrun.pid")" 2>/dev/null
  fi
  true
}

# Meldung schreiben: message VERZEICHNIS DATEI FROM REF TASK
message() {
  printf '# Meldung\n\n- from: `%s`\n- ref: `%s`\n- task: `%s`\n- document: `development/%s/scope.md`\n\nText.\n' \
    "$3" "$4" "$5" "$4" >"$1/$2"
}

# agentrun starten, die erste Bewertung abwarten (inotifywait läuft) und beenden
ar() {
  local pid
  "$R/scripts/agentrun" 2>>"$LOG" &
  pid=$!
  for _ in $(seq 1 100); do
    if pgrep -P "$pid" -x inotifywait >/dev/null; then break; fi
    sleep 0.05
  done
  kill "$pid"
  wait "$pid"
}

set_timeout() { export HEARTBEAT_TIMEOUT="$1"; }
not() { ! "$@"; }
new_sessions() { grep -c '^new-session' "$FAKES/sessions/.calls" 2>/dev/null || echo 0; }
failed_files() { find "$FAKES/github" -name '*-agentrun-*.md' 2>/dev/null | sort; }

# ---------------------------------------------------------------- Sperre

@test "agentrun: zweite Instanz endet sofort" {
  exec 8>"$R/run/agentrun.lock"
  flock -n 8
  run "$R/scripts/agentrun"
  [ "$status" -eq 0 ]
  [[ "$output" == *"agentrun läuft bereits"* ]]
  [ "$(new_sessions)" -eq 0 ]
}

# ---------------------------------------------------------------- Start

@test "Start: Sitzung in work/<ref>/architect mit Startbefehl und Startauftrag" {
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar
  [ -d "$R/work/probe/architect" ]
  diff - "$FAKES/sessions/probe" <<EOF
cwd=$R/work/probe/architect
arg=$FAKES/claude
arg=--setting-sources
arg=project
arg=--permission-mode
arg=dontAsk
arg=--plugin-dir
arg=$R/devteam
arg=--settings
arg=$R/devteam/settings.json
arg=--agent
arg=devteam:software-architect
arg=Bearbeite die Meldung $IN/20261012100000-projectlead-01.md. Entwicklungsverzeichnis: $R.
EOF
  grep -qx 20261012100000-projectlead-01.md "$R/run/agentrun.started"
  [ -f "$R/run/probe.session" ]
  # tmux erbt die Sperre von agentrun nicht
  [ ! -e "$FAKES/sessions/.fds" ]
}

@test "Start: Arbeitspaket, Sitzungsname mit Bindestrich, Verzeichnis work/<vorhaben>/<arbeitspaket>/architect" {
  message "$IN" 20261012100000-projectlead-01.md projectlead probe/wp01 implement
  ar
  grep -qx "cwd=$R/work/probe/wp01/architect" "$FAKES/sessions/probe-wp01"
}

@test "Start: jede Meldung genau einmal, auch nach dem Ende der Sitzung" {
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar; ar
  [ "$(new_sessions)" -eq 1 ]
  message "$OUT" 20261012100500-architect-01.md architect probe review
  ar
  [ ! -f "$FAKES/sessions/probe" ]
  ar
  [ "$(new_sessions)" -eq 1 ]
}

@test "Start: höchstens eine Sitzung je ref, die zweite Meldung startet nach dem Ende der ersten" {
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  message "$IN" 20261012100100-projectlead-01.md projectlead probe specify
  ar
  [ "$(new_sessions)" -eq 1 ]
  grep -q "20261012100000-projectlead-01.md" "$FAKES/sessions/probe"
  rm "$IN/20261012100000-projectlead-01.md"
  message "$OUT" 20261012100500-architect-01.md architect probe review
  ar
  [ "$(new_sessions)" -eq 2 ]
  grep -q "20261012100100-projectlead-01.md" "$FAKES/sessions/probe"
}

@test "Start: verschiedene ref laufen nebeneinander" {
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  message "$IN" 20261012100100-projectlead-01.md projectlead other check
  ar
  [ -f "$FAKES/sessions/probe" ]
  [ -f "$FAKES/sessions/other" ]
}

@test "Start: ungültiges ref startet nichts und meldet failed" {
  message "$IN" 20261012100000-projectlead-01.md projectlead "Probe/1" check
  ar
  [ "$(new_sessions)" -eq 0 ]
  [ "$(failed_files | wc -l)" -eq 1 ]
  grep -q "kein gültiges Feld ref" "$(failed_files)"
}

@test "Start: tmux schlägt fehl, Meldung failed mit dem Grund" {
  touch "$FAKES/tmux.fail"
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar
  grep -q "Die Sitzung ließ sich nicht starten: server exited unexpectedly" "$(failed_files)"
  [ ! -f "$R/run/probe.session" ]
  rm "$FAKES/tmux.fail"
  ar
  [ "$(new_sessions)" -eq 1 ]
  [ ! -f "$FAKES/sessions/probe" ]
}

@test "Start: andere Dateien im Meldungsverzeichnis zählen nicht" {
  touch "$IN/.gitkeep" "$IN/notiz.txt"
  ar
  [ "$(new_sessions)" -eq 0 ]
}

# ---------------------------------------------------------------- Ende

@test "Ende: Antwortmeldung des Softwarearchitekten mit demselben ref beendet die Sitzung" {
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar
  message "$OUT" 20261012100500-architect-01.md architect probe question
  ar
  [ ! -f "$FAKES/sessions/probe" ]
  [ ! -f "$R/run/probe.session" ]
  [ -z "$(failed_files)" ]
}

@test "Ende: leere Verzeichnisse unter work/ werden entfernt, nicht leere bleiben" {
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  message "$IN" 20261012100100-projectlead-01.md projectlead other/wp01 implement
  ar
  touch "$R/work/other/wp01/architect/datei"
  # der Softwarearchitekt hat sein Verzeichnis schon selbst entfernt
  rmdir "$R/work/probe/architect"
  message "$OUT" 20261012100500-architect-01.md architect probe question
  message "$OUT" 20261012100600-architect-01.md architect other/wp01 acceptance
  ar
  [ ! -e "$R/work/probe" ]
  [ -f "$R/work/other/wp01/architect/datei" ]
  [ -d "$R/work" ]
}

@test "Ende: leeres Arbeitspaketverzeichnis wird bis work/<vorhaben> entfernt" {
  message "$IN" 20261012100000-projectlead-01.md projectlead probe/wp01 implement
  ar
  message "$OUT" 20261012100500-architect-01.md architect probe/wp01 acceptance
  ar
  [ ! -e "$R/work/probe" ]
  [ -d "$R/work" ]
}

@test "Ende: Meldungen vor dem Start, mit anderem ref oder anderem Absender zählen nicht" {
  message "$OUT" 20261012090000-architect-01.md architect probe review
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar
  message "$OUT" 20261012100500-architect-01.md architect other review
  message "$OUT" 20261012100600-agentrun-01.md agentrun probe failed
  ar
  [ -f "$FAKES/sessions/probe" ]
}

@test "Ende: Sitzung besteht nicht mehr ohne Antwort, Meldung failed über die GitHub-API auf main" {
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar
  rm "$FAKES/sessions/probe"
  ar
  [ ! -f "$R/run/probe.session" ]
  f="$(failed_files)"
  [ "$(wc -l <<<"$f")" -eq 1 ]
  [[ "$f" == "$FAKES/github/testowner/testrepo/development/messages/projectlead/"* ]]
  [[ "$(basename "$f")" =~ ^[0-9]{14}-agentrun-01\.md$ ]]
  diff - "$f" <<'EOF'
# Meldung

- from: `agentrun`
- ref: `probe`
- task: `failed`
- document: `development/messages/architect/20261012100000-projectlead-01.md`

Die Sitzung besteht nicht mehr, ohne dass eine Antwortmeldung vorliegt.
EOF
  grep -qx "branch=main" "$f.meta"
}

# ---------------------------------------------------------------- Entwicklungsleiter

@test "Entwicklungsleiter: Sitzung in work/<ref>/devlead mit Agentendefinition devlead" {
  mkdir -p "$DL"
  message "$DL" 20261021100000-projectlead-01.md projectlead probe/wp01 implement
  ar
  [ -d "$R/work/probe/wp01/devlead" ]
  diff - "$FAKES/sessions/probe-wp01" <<EOF
cwd=$R/work/probe/wp01/devlead
arg=$FAKES/claude
arg=--setting-sources
arg=project
arg=--permission-mode
arg=dontAsk
arg=--plugin-dir
arg=$R/devteam
arg=--settings
arg=$R/devteam/settings.json
arg=--agent
arg=devteam:devlead
arg=Bearbeite die Meldung $DL/20261021100000-projectlead-01.md. Entwicklungsverzeichnis: $R.
EOF
  grep -qx 20261021100000-projectlead-01.md "$R/run/agentrun.started"
  [ "$(sed -n 4p "$R/run/probe-wp01.session")" = devlead ]
}

@test "Entwicklungsleiter: fehlendes Verzeichnis devlead/ stört nicht" {
  message "$IN" 20261021100000-projectlead-01.md projectlead probe check
  ar
  [ -f "$FAKES/sessions/probe" ]
  not grep -q "inotifywait fehlgeschlagen" "$LOG"
}

@test "Entwicklungsleiter: eine Sitzung je ref über beide Rollen, die zweite startet nach dem Ende der ersten" {
  mkdir -p "$DL"
  message "$IN" 20261021100000-projectlead-01.md projectlead probe/wp01 check
  message "$DL" 20261021100100-projectlead-02.md projectlead probe/wp01 implement
  ar
  [ "$(new_sessions)" -eq 1 ]
  grep -qx "cwd=$R/work/probe/wp01/architect" "$FAKES/sessions/probe-wp01"
  rm "$IN/20261021100000-projectlead-01.md"
  message "$OUT" 20261021100500-architect-01.md architect probe/wp01 review
  ar
  [ "$(new_sessions)" -eq 2 ]
  grep -qx "cwd=$R/work/probe/wp01/devlead" "$FAKES/sessions/probe-wp01"
}

@test "Entwicklungsleiter: Antwort an den Projektleiter beendet die Sitzung, die des Softwarearchitekten nicht" {
  mkdir -p "$DL"
  message "$DL" 20261021100000-projectlead-01.md projectlead probe/wp01 implement
  ar
  message "$OUT" 20261021100500-architect-01.md architect probe/wp01 review
  ar
  [ -f "$FAKES/sessions/probe-wp01" ]
  message "$OUT" 20261021100600-devlead-01.md devlead probe/wp01 acceptance
  ar
  [ ! -f "$FAKES/sessions/probe-wp01" ]
  [ ! -e "$R/work/probe" ]
  [ -z "$(failed_files)" ]
}

@test "Entwicklungsleiter: amend im Verzeichnis architect/ beendet seine Sitzung" {
  mkdir -p "$DL"
  message "$DL" 20261021100000-projectlead-01.md projectlead probe/wp01 implement
  ar
  # eine Meldung an sich selbst zählt nicht
  message "$DL" 20261021100500-devlead-01.md devlead probe/wp01 implement
  ar
  [ -f "$FAKES/sessions/probe-wp01" ]
  message "$IN" 20261021100600-devlead-01.md devlead probe/wp01 amend
  ar
  # die Meldung amend startet danach den Softwarearchitekten für dasselbe ref
  grep -q "^kill-session -t =probe-wp01" "$FAKES/sessions/.calls"
  grep -qx "cwd=$R/work/probe/wp01/architect" "$FAKES/sessions/probe-wp01"
  [ "$(new_sessions)" -eq 2 ]
  [ -z "$(failed_files)" ]
}

@test "Softwarearchitekt: amended im Verzeichnis devlead/ beendet seine Sitzung" {
  message "$IN" 20261021100000-devlead-01.md devlead probe/wp01 amend
  ar
  mkdir -p "$DL"
  message "$DL" 20261021100500-architect-01.md architect probe/wp01 amended
  ar
  # die Meldung amended startet danach den Entwicklungsleiter für dasselbe ref
  grep -q "^kill-session -t =probe-wp01" "$FAKES/sessions/.calls"
  grep -qx "cwd=$R/work/probe/wp01/devlead" "$FAKES/sessions/probe-wp01"
  [ "$(new_sessions)" -eq 2 ]
  [ -z "$(failed_files)" ]
}

@test "Entwicklungsleiter: Meldung failed nennt die Meldung in devlead/" {
  mkdir -p "$DL"
  message "$DL" 20261021100000-projectlead-01.md projectlead probe/wp01 implement
  ar
  rm "$FAKES/sessions/probe-wp01"
  ar
  grep -qxF -- '- document: `development/messages/devlead/20261021100000-projectlead-01.md`' "$(failed_files)"
}

@test "Entwicklungsleiter: neu angelegtes Verzeichnis devlead/ startet die Sitzung ohne Wartezeit" {
  "$R/scripts/agentrun" 2>>"$LOG" &
  for _ in $(seq 1 50); do [ -f "$R/run/agentrun.pid" ] && break; sleep 0.1; done
  sleep 0.5
  mkdir "$DL"
  sleep 0.2
  message "$DL" 20261021100000-projectlead-01.md projectlead probe/wp01 implement
  for _ in $(seq 1 50); do [ -f "$FAKES/sessions/probe-wp01" ] && break; sleep 0.1; done
  [ -f "$FAKES/sessions/probe-wp01" ]
  kill "$(cat "$R/run/agentrun.pid")"
  for _ in $(seq 1 50); do [ -f "$R/run/agentrun.pid" ] || break; sleep 0.1; done
}

# ---------------------------------------------------------------- Herzschlag

@test "Herzschlag: ohne Herzschlag über die Zeitgrenze wird die Sitzung beendet" {
  set_timeout 60
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar
  sed -i "3s/.*/$(( $(date +%s) - 600 ))/" "$R/run/probe.session"
  touch -d '-2 minutes' "$R/run/probe.heartbeat"
  ar
  [ ! -f "$FAKES/sessions/probe" ]
  grep -q "weil 60 Sekunden lang kein Herzschlag kam" "$(failed_files)"
  [ ! -e "$R/run/probe.heartbeat" ]
}

@test "Herzschlag: Bildschirminhalt bleibt nach dem Abbruch in run/<key>.screen" {
  set_timeout 60
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar
  sed -i "3s/.*/$(( $(date +%s) - 600 ))/" "$R/run/probe.session"
  ar
  [ ! -f "$FAKES/sessions/probe" ]
  [ -f "$R/run/probe.screen" ]
}

@test "Herzschlag: frischer Herzschlag oder später Start halten die Sitzung" {
  set_timeout 60
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar
  ar
  [ -f "$FAKES/sessions/probe" ]
  sed -i "3s/.*/$(( $(date +%s) - 600 ))/" "$R/run/probe.session"
  touch -d '-30 seconds' "$R/run/probe.heartbeat"
  ar
  [ -f "$FAKES/sessions/probe" ]
  [ -z "$(failed_files)" ]
}

@test "Herzschlag: Grenze 900 Sekunden" {
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar
  sed -i "3s/.*/$(( $(date +%s) - 3600 ))/" "$R/run/probe.session"
  touch -d '-14 minutes' "$R/run/probe.heartbeat"
  ar
  [ -f "$FAKES/sessions/probe" ]
  touch -d '-16 minutes' "$R/run/probe.heartbeat"
  ar
  grep -q "weil 900 Sekunden lang" "$(failed_files)"
}

# ---------------------------------------------------------------- Meldung failed

@test "failed: GitHub nicht erreichbar, Meldung bleibt vorgemerkt und wird später geschrieben" {
  touch "$FAKES/gh.fail"
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar
  rm "$FAKES/sessions/probe"
  ar
  [ -f "$R/run/20261012100000-projectlead-01.md.failed" ]
  grep -q "Meldung failed ließ sich nicht schreiben" "$LOG"
  rm "$FAKES/gh.fail"
  ar
  [ ! -f "$R/run/20261012100000-projectlead-01.md.failed" ]
  [ "$(failed_files | wc -l)" -eq 1 ]
}

# ---------------------------------------------------------------- Laufzeit

@test "Laufzeit: inotifywait-Schleife startet bei neuer Meldung ohne Wartezeit" {
  "$R/scripts/agentrun" 2>>"$LOG" &
  for _ in $(seq 1 50); do [ -f "$R/run/agentrun.pid" ] && break; sleep 0.1; done
  sleep 0.5
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  for _ in $(seq 1 50); do [ -f "$FAKES/sessions/probe" ] && break; sleep 0.1; done
  [ -f "$FAKES/sessions/probe" ]
  kill "$(cat "$R/run/agentrun.pid")"
  for _ in $(seq 1 50); do [ -f "$R/run/agentrun.pid" ] || break; sleep 0.1; done
  [ ! -f "$R/run/agentrun.pid" ]
}

# ---------------------------------------------------------------- heartbeat

hb() { run "$R/scripts/heartbeat" <<<"{\"cwd\":\"$1\"}"; }

@test "heartbeat: legt die Herzschlagdatei auch bei leerer Umgebung an" {
  run env -i "$R/scripts/heartbeat" <<<"{\"cwd\":\"$R/work/probe/architect\"}"
  [ "$status" -eq 0 ]; [ -z "$output" ]
  [ -f "$R/run/probe.heartbeat" ]
}

@test "heartbeat: Rollenverzeichnisse von Vorhaben und Arbeitspaket" {
  hb "$R/work/probe/architect"
  [ "$status" -eq 0 ]; [ -z "$output" ]
  [ -f "$R/run/probe.heartbeat" ]
  hb "$R/work/probe/wp01/backend2"
  [ -f "$R/run/probe-wp01.heartbeat" ]
  rm "$R/run/probe-wp01.heartbeat"
  hb "$R/work/probe/wp01/functiontest/src/sub"
  [ -f "$R/run/probe-wp01.heartbeat" ]
}

@test "heartbeat: alle Rollennamen" {
  local r
  for r in architect architectmain devlead devleadmain backend frontend functiontest securitytest qa; do
    rm -f "$R/run/probe-wp02.heartbeat"
    hb "$R/work/probe/wp02/$r"
    [ -f "$R/run/probe-wp02.heartbeat" ]
  done
}

@test "heartbeat: außerhalb von work/ oder ohne Rolle tut nichts" {
  hb "$R/repo"
  hb "$R/work/probe"
  hb "$R/work/probe/wp01"
  hb "$R/work/probe/other"
  hb "/tmp/work/probe/architect"
  [ -z "$(ls "$R/run")" ]
}

@test "heartbeat: ungültige Daten, keine Ausgabe, Exitcode 0" {
  run "$R/scripts/heartbeat" <<<"kein json"
  [ "$status" -eq 0 ]; [ -z "$output" ]
  [ -z "$(ls "$R/run")" ]
}

# ---------------------------------------------------------------- pidcheck

@test "pidcheck: startet agentrun, wenn kein Prozess läuft, und nie eine zweite Instanz" {
  run "$R/scripts/pidcheck" agentrun
  [ "$status" -eq 0 ]
  for _ in $(seq 1 50); do [ -f "$R/run/agentrun.pid" ] && break; sleep 0.1; done
  local p; p="$(cat "$R/run/agentrun.pid")"
  kill -0 "$p"
  [ "$(readlink "/proc/$p/cwd")" = "$R" ]
  run "$R/scripts/pidcheck" agentrun
  sleep 0.5
  [ "$(cat "$R/run/agentrun.pid")" = "$p" ]
  [ "$(grep -c 'agentrun gestartet, PID' "$R/run/agentrun.log")" -eq 1 ]
}

@test "pidcheck: veraltete PID-Datei führt zum Neustart" {
  echo 999999 >"$R/run/agentrun.pid"
  run "$R/scripts/pidcheck" agentrun
  for _ in $(seq 1 50); do [ "$(cat "$R/run/agentrun.pid")" != 999999 ] && break; sleep 0.1; done
  [ "$(cat "$R/run/agentrun.pid")" != 999999 ]
}

# ---------------------------------------------------------------- Startskripte in devteam/bin

@test "Startskript: legt work/<ref>/<rolle> an und startet das Programm aus start.conf darin" {
  run "$R/devteam/bin/functiontest" probe/wp01 "probe/wp01:development/probe/wp01/orders/01.md"
  [ "$status" -eq 0 ]
  diff - "$FAKES/claude.log" <<EOF
cwd=$R/work/probe/wp01/functiontest
arg=--setting-sources
arg=project
arg=--permission-mode
arg=dontAsk
arg=--plugin-dir
arg=$R/devteam
arg=--settings
arg=$R/devteam/settings.json
arg=--agent
arg=devteam:functiontest
arg=--model
arg=sonnet
arg=-p
arg=Bearbeite das Übergabedokument probe/wp01:development/probe/wp01/orders/01.md. Bezug: probe/wp01. Entwicklungsverzeichnis: $R. Arbeitsverzeichnis: $R/work/probe/wp01/functiontest.
EOF
}

@test "Startskript: Rollen securitytest und qa, Exitcode des Programms" {
  echo 3 >"$FAKES/claude.exit"
  run "$R/devteam/bin/securitytest" probe /abs/doc.md
  [ "$status" -eq 3 ]
  grep -qx "arg=devteam:securitytest" "$FAKES/claude.log"
  grep -qx "cwd=$R/work/probe/securitytest" "$FAKES/claude.log"
  rm "$FAKES/claude.exit"
  run "$R/devteam/bin/qa" probe /abs/doc.md
  [ "$status" -eq 0 ]
  grep -qx "arg=devteam:qa" "$FAKES/claude.log"
}

@test "Startskript: Programm aus der Konfigurationsdatei" {
  printf 'START_PROGRAM=(echo {agent} {devteam} {model})\n' >"$R/devteam/start.conf"
  run "$R/devteam/bin/qa" probe /abs/doc.md
  [ "$output" = "qa $R/devteam sonnet" ]
}

@test "Startskript: alle drei Rollen starten mit dem Modell Sonnet" {
  local r
  for r in functiontest securitytest qa; do
    rm -f "$FAKES/claude.log"
    run "$R/devteam/bin/$r" probe /abs/doc.md
    [ "$status" -eq 0 ]
    grep -A1 -x "arg=--model" "$FAKES/claude.log" | grep -qx "arg=sonnet"
  done
}
