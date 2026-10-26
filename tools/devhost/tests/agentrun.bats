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
  # ohne Fortsetzungsfrist: ein Abbruch kurz nach einer Fortsetzung gilt als neuer Abbruch (die Tests laufen in Sekunden)
  export RESUME_GRACE=0
}

teardown() {
  if [[ -f "$R/run/agentrun.pid" ]]; then
    kill "$(cat "$R/run/agentrun.pid")" 2>/dev/null
  fi
  # vom Ersatzprogramm von tmux gestartete Prozesse beenden
  local p
  for p in "$FAKES"/sessions/*.pid; do
    [[ -f "$p" ]] && kill -- "-$(cat "$p")" 2>/dev/null
  done
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

# Zeile N der Zustandsdatei einer Sitzung: line KEY N
line() { sed -n "$2p" "$R/run/$1.session"; }
# Sitzung KEY N-mal abbrechen lassen (Sitzungsdatei der Attrappe löschen) und jeweils bewerten
crash() { local _; for _ in $(seq 1 "$2"); do rm "$FAKES/sessions/$1"; ar; done; }
# Anzahl der Aufrufe des Ersatzprogramms claude und Abschnitt des Aufrufs N im Protokoll
claude_calls() { grep -c '^call=' "$FAKES/claude.calls" 2>/dev/null || echo 0; }
claude_call() { sed -n "/^call=$1\$/,/^--\$/p" "$FAKES/claude.calls"; }
# Szenario für das Ersatzprogramm claude einsetzen (damit läuft der Befehl der tmux-Sitzung): scenario DATEI|-
scenario() { if [[ "$1" == - ]]; then cat >"$FAKES/claude.scenario"; else cp "$1" "$FAKES/claude.scenario"; fi; }
# kurz warten, bis das Ersatzprogramm in der Attrappe von tmux gelaufen ist
settle() { sleep 0.5; }
SCN="$BATS_TEST_DIRNAME/scenarios"

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
  # Änderung nach Spezifikation 3.2 Punkt 1: --session-id <kennung> vor dem Startauftrag
  id="$(line probe 5)"
  [[ "$id" =~ ^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$ ]]
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
arg=--session-id
arg=$id
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

@test "Start: drei fehlgeschlagene Starts, Meldung failed mit Grund, Zahl und Art des letzten Abbruchs" {
  # Änderung nach Spezifikation 3.1: ein fehlgeschlagener Start ist ein Abbruch; failed erst nach dem dritten
  touch "$FAKES/tmux.fail"
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar
  [ "$(new_sessions)" -eq 3 ]
  [ "$(failed_files | wc -l)" -eq 1 ]
  grep -q "Die Sitzung ließ sich nicht starten: server exited unexpectedly" "$(failed_files)"
  grep -qF "Abbrüche derselben Meldung: 3, Art des letzten Abbruchs: Start fehlgeschlagen." "$(failed_files)"
  [ ! -f "$R/run/probe.session" ]
  rm "$FAKES/tmux.fail"
  ar
  [ "$(new_sessions)" -eq 3 ]
  [ ! -f "$FAKES/sessions/probe" ]
  [ "$(failed_files | wc -l)" -eq 1 ]
}

@test "Start: ein Start schlägt fehl, der Neustart gelingt, kein failed und derselbe Abbruch" {
  echo 1 >"$FAKES/tmux.fail"
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar
  [ "$(new_sessions)" -eq 2 ]
  [ -f "$FAKES/sessions/probe" ]
  [ -z "$(failed_files)" ]
  [ "$(line probe 6)" -eq 1 ]
  # Startauftrag unverändert, neue Kennung in der Zustandsdatei
  grep -qxF "arg=Bearbeite die Meldung $IN/20261012100000-projectlead-01.md. Entwicklungsverzeichnis: $R." "$FAKES/sessions/probe"
  grep -qx "arg=$(line probe 5)" "$FAKES/sessions/probe"
}

@test "Start: zwei fehlgeschlagene Starts, der dritte gelingt, kein failed" {
  echo 2 >"$FAKES/tmux.fail"
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar
  [ "$(new_sessions)" -eq 3 ]
  [ -f "$FAKES/sessions/probe" ]
  [ -z "$(failed_files)" ]
  [ "$(line probe 6)" -eq 2 ]
}

@test "Start: Abbrüche durch fehlgeschlagene Starts und Abstürze zählen gemeinsam" {
  echo 1 >"$FAKES/tmux.fail"
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar
  [ "$(line probe 6)" -eq 1 ]
  crash probe 1
  [ "$(line probe 6)" -eq 2 ]
  [ -z "$(failed_files)" ]
  crash probe 1
  grep -qF "Abbrüche derselben Meldung: 3, Art des letzten Abbruchs: Absturz." "$(failed_files)"
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
  # Änderung nach Spezifikation 3.2: erst der dritte Abbruch führt zu failed, der Text nennt Zahl und Art
  crash probe 3
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

Die Sitzung besteht nicht mehr, ohne dass eine Antwortmeldung vorliegt. Abbrüche derselben Meldung: 3, Art des letzten Abbruchs: Absturz.
EOF
  grep -qx "branch=main" "$f.meta"
}

# ---------------------------------------------------------------- Entwicklungsleiter

@test "Entwicklungsleiter: Sitzung in work/<ref>/devlead mit Agentendefinition devlead" {
  mkdir -p "$DL"
  message "$DL" 20261021100000-projectlead-01.md projectlead probe/wp01 implement
  ar
  [ -d "$R/work/probe/wp01/devlead" ]
  id="$(line probe-wp01 5)"
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
arg=--session-id
arg=$id
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
  crash probe-wp01 3
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

# Beginn der Herzschlagmessung (Zeile 3 der Sitzungsdatei) weit zurücksetzen: stale KEY
stale() { sed -i "3s/.*/$(( $(date +%s) - 600 ))/" "$R/run/$1.session"; }

@test "Herzschlag: ohne Herzschlag über die Zeitgrenze wird die Sitzung beendet und fortgesetzt, nach dem dritten Mal failed" {
  # Änderung nach Spezifikation 3.2: der erste und zweite Stillstand führen zur Fortsetzung, der dritte zu failed
  set_timeout 60
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar
  stale probe
  touch -d '-2 minutes' "$R/run/probe.heartbeat"
  ar
  grep -q "^kill-session -t =probe" "$FAKES/sessions/.calls"
  [ "$(line probe 6)" -eq 1 ]
  [ -f "$FAKES/sessions/probe" ]
  [ -z "$(failed_files)" ]
  [ ! -e "$R/run/probe.heartbeat" ]
  stale probe; ar
  stale probe; ar
  [ ! -f "$FAKES/sessions/probe" ]
  grep -q "weil 60 Sekunden lang kein Herzschlag kam. Abbrüche derselben Meldung: 3, Art des letzten Abbruchs: Stillstand." "$(failed_files)"
}

@test "Herzschlag: Bildschirminhalt bleibt nach dem Abbruch in run/<key>.screen" {
  set_timeout 60
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar
  stale probe
  ar
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
  [ "$(line probe 6)" -eq 0 ]
  touch -d '-16 minutes' "$R/run/probe.heartbeat"
  ar
  [ "$(line probe 6)" -eq 1 ]
  grep -q "weil 900 Sekunden lang kein Herzschlag kam" "$LOG"
}

# ---------------------------------------------------------------- Fortsetzung (Spezifikation 3.2)
# Mit einem Szenario läuft das Ersatzprogramm claude in der Attrappe von tmux; jede ar-Bewertung
# ist eine Prüfung, settle wartet auf den Ablauf des Ersatzprogramms.

@test "Fortsetzung: Absturz, Fortsetzung mit --resume <kennung> im selben Arbeitsverzeichnis" {
  scenario - <<'EOF'
call: crash 1
call: reply
EOF
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar; settle
  id="$(line probe 5)"
  [ "$(claude_calls)" -eq 1 ]
  claude_call 1 | grep -qx "session-id=$id"
  ar; settle
  [ "$(claude_calls)" -eq 2 ]
  claude_call 2 | grep -qx "resume=$id"
  claude_call 2 | grep -qx "cwd=$R/work/probe/architect"
  claude_call 2 | grep -qxF "arg=Die Sitzung wurde abgebrochen. Prüfe den Stand deines Arbeitsverzeichnisses und setze die Aufgabe dort fort, wo sie abgebrochen ist."
  [ "$(line probe 5)" = "$id" ]
  [ "$(line probe 6)" -eq 1 ]
  [ -z "$(failed_files)" ]
  ar
  [ ! -f "$R/run/probe.session" ]
  [ -z "$(failed_files)" ]
}

@test "Fortsetzung: Stillstand, die Sitzung wird beendet und mit --resume fortgesetzt" {
  scenario - <<'EOF'
call: hang
call: reply
EOF
  set_timeout 60
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar; settle
  id="$(line probe 5)"
  stale probe
  ar; settle
  grep -q "^kill-session -t =probe" "$FAKES/sessions/.calls"
  claude_call 2 | grep -qx "resume=$id"
  [ "$(line probe 6)" -eq 1 ]
  ar
  [ ! -f "$R/run/probe.session" ]
  [ -z "$(failed_files)" ]
}

@test "Fortsetzung: nach dem dritten Abbruch derselben Meldung failed mit Zahl und Art des letzten Abbruchs" {
  scenario - <<'EOF'
call: crash 1
call: crash 1
call: crash 1
call: reply
EOF
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar; settle
  ar; settle
  [ "$(line probe 6)" -eq 1 ]
  ar; settle
  [ "$(line probe 6)" -eq 2 ]
  [ -z "$(failed_files)" ]
  ar
  [ ! -f "$R/run/probe.session" ]
  [ "$(claude_calls)" -eq 3 ]
  [ "$(failed_files | wc -l)" -eq 1 ]
  grep -qF "Abbrüche derselben Meldung: 3, Art des letzten Abbruchs: Absturz." "$(failed_files)"
  grep -qxF -- '- task: `failed`' "$(failed_files)"
  # keine weitere Fortsetzung
  ar; settle
  [ "$(claude_calls)" -eq 3 ]
}

@test "Fortsetzung: der Zähler gehört zur Meldung, eine neue Meldung beginnt bei null" {
  scenario - <<'EOF'
call: crash 1
call: crash 1
call: reply
call: crash 1
call: crash 1
call: reply
EOF
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar; settle; ar; settle; ar; settle
  [ "$(line probe 6)" -eq 2 ]
  ar
  [ ! -f "$R/run/probe.session" ]
  message "$IN" 20261012100100-projectlead-01.md projectlead probe specify
  ar; settle
  [ "$(line probe 6)" -eq 0 ]
  ar; settle; ar; settle
  [ "$(line probe 6)" -eq 2 ]
  ar
  [ ! -f "$R/run/probe.session" ]
  [ "$(claude_calls)" -eq 6 ]
  [ -z "$(failed_files)" ]
}

@test "Fortsetzung: ungültiges ref führt sofort zu failed, ohne Start und ohne Fortsetzung" {
  message "$IN" 20261012100000-projectlead-01.md projectlead "Probe/1" check
  ar
  [ "$(failed_files | wc -l)" -eq 1 ]
  grep -q "kein gültiges Feld ref" "$(failed_files)"
  [ "$(new_sessions)" -eq 0 ]
  [ ! -e "$FAKES/claude.calls" ]
  ls "$R/run" | not grep -q session
}

@test "Fortsetzung: nicht möglich, Neustart mit dem ursprünglichen Startauftrag zählt als derselbe Abbruch" {
  export RESUME_GRACE=60
  scenario - <<'EOF'
call: crash 1
call: crash 1
call: reply
EOF
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar; settle
  id1="$(line probe 5)"
  ar; settle
  claude_call 2 | grep -qx "resume=$id1"
  [ "$(line probe 6)" -eq 1 ]
  # die fortgesetzte Sitzung endet sofort: Fortsetzung nicht möglich
  ar; settle
  id2="$(line probe 5)"
  [ "$id2" != "$id1" ]
  [ "$(claude_calls)" -eq 3 ]
  claude_call 3 | grep -qx "session-id=$id2"
  claude_call 3 | grep -qxF "arg=Bearbeite die Meldung $IN/20261012100000-projectlead-01.md. Entwicklungsverzeichnis: $R."
  not grep -q '^resume=' <(claude_call 3)
  [ "$(line probe 6)" -eq 1 ]
  ar
  [ ! -f "$R/run/probe.session" ]
  [ -z "$(failed_files)" ]
}

@test "Fortsetzung: Neustart, der ebenfalls nicht startet, führt zu failed mit Art Start fehlgeschlagen" {
  scenario - <<'EOF'
call: crash 1
EOF
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar; settle
  touch "$FAKES/tmux.fail"
  ar
  [ ! -f "$R/run/probe.session" ]
  grep -qF "Art des letzten Abbruchs: Start fehlgeschlagen." "$(failed_files)"
}

# ---------------------------------------------------------------- Pause (Spezifikation 3.3)

@test "Pause: Nutzungsgrenze auf dem Bildschirm statt Stillstand, kein Abbruch, Vermerk in run/" {
  scenario "$SCN/limit-no-time.scn"
  set_timeout 60
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar; settle
  grep -qF "Platzhalter: Nutzungsgrenze erreicht" "$FAKES/sessions/probe.screen"
  stale probe
  ar
  [ -f "$FAKES/sessions/probe" ]
  not grep -q '^kill-session' "$FAKES/sessions/.calls"
  [ -z "$(failed_files)" ]
  [ "$(line probe 6)" -eq 0 ]
  [ -f "$R/run/probe.paused" ]
  # ohne genannten Zeitpunkt: nächste Prüfung nach PAUSE_INTERVAL
  [ "$(sed -n 1p "$R/run/probe.paused")" -gt "$(( $(date +%s) + 800 ))" ]
  [ -z "$(sed -n 2p "$R/run/probe.paused")" ]
  ar
  [ ! -e "$FAKES/sessions/probe.keys" ]
}

@test "Pause: solange eine Sitzung pausiert ist, gilt bei keiner Sitzung fehlender Herzschlag als Stillstand" {
  scenario - <<'EOF'
call: limit ; wait-resume 60 ; reply
call: hang
EOF
  set_timeout 60
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  message "$IN" 20261012100100-projectlead-01.md projectlead other check
  ar; settle
  stale probe; stale other
  ar
  [ -f "$R/run/probe.paused" ]
  [ ! -f "$R/run/other.paused" ]
  [ -f "$FAKES/sessions/other" ]
  [ "$(line other 6)" -eq 0 ]
  not grep -q '^kill-session' "$FAKES/sessions/.calls"
  [ -z "$(failed_files)" ]
  # auch bei späteren Prüfungen
  ar
  [ "$(line other 6)" -eq 0 ]
  [ -z "$(failed_files)" ]
}

@test "Pause: ohne die Meldung der Nutzungsgrenze auf dem Bildschirm bleibt fehlender Herzschlag ein Stillstand" {
  scenario - <<'EOF'
call: hang
EOF
  set_timeout 60
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar; settle
  stale probe
  ar
  [ ! -e "$R/run/probe.paused" ]
  [ "$(line probe 6)" -eq 1 ]
}

@test "Pause: Fortsetzung ohne Zeitpunkt nach PAUSE_INTERVAL, danach Herzschlagmessung für alle neu" {
  scenario - <<'EOF'
call: limit ; wait-resume 60 ; reply
call: hang
EOF
  set_timeout 60
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  message "$IN" 20261012100100-projectlead-01.md projectlead other check
  ar; settle
  stale probe; stale other
  ar
  # vor dem Prüfzeitpunkt wird nichts geschickt
  ar
  [ ! -e "$FAKES/sessions/probe.keys" ]
  sed -i "1s/.*/$(( $(date +%s) - 1 ))/" "$R/run/probe.paused"
  ar; settle
  grep -qxF "Die Nutzungsgrenze ist aufgehoben. Fahre fort." "$FAKES/sessions/probe.keys"
  grep -q '^send-keys -t probe Enter' "$FAKES/sessions/.calls"
  [ ! -e "$R/run/probe.paused" ]
  # die Messung beginnt für alle Sitzungen neu: kein Stillstand bei other
  [ "$(( $(date +%s) - $(stat -c %Y "$R/run/other.heartbeat") ))" -lt 30 ]
  [ "$(line other 6)" -eq 0 ]
  ar
  [ "$(line other 6)" -eq 0 ]
  [ -f "$FAKES/sessions/other" ]
  # die Sitzung macht weiter und antwortet
  [ "$(claude_calls)" -eq 2 ]
  ar
  [ ! -f "$R/run/probe.session" ]
  [ -z "$(failed_files)" ]
}

@test "Pause: Meldung mit Zeitpunkt, Prüfung erst ab diesem Zeitpunkt" {
  scenario "$SCN/limit-with-time.scn"
  set_timeout 60
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar; settle
  grep -qF "Zurücksetzung um 2099-01-01T00:00:00Z" "$FAKES/sessions/probe.screen"
  stale probe
  ar
  [ "$(sed -n 1p "$R/run/probe.paused")" -eq "$(date -d 2099-01-01T00:00:00Z +%s)" ]
  [ "$(sed -n 2p "$R/run/probe.paused")" = 2099-01-01T00:00:00Z ]
  ar
  [ ! -e "$FAKES/sessions/probe.keys" ]
  [ -f "$R/run/probe.paused" ]
}

@test "Pause: Zeitpunkt erreicht, die Sitzung wird fortgesetzt" {
  scenario - <<'EOF'
limit_text_time=Platzhalter: Nutzungsgrenze erreicht, Zurücksetzung um {time}
call: limit-time 2020-01-01T00:00:00Z ; wait-resume 60 ; reply
EOF
  set_timeout 60
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar; settle
  stale probe
  ar; settle
  grep -qxF "Die Nutzungsgrenze ist aufgehoben. Fahre fort." "$FAKES/sessions/probe.keys"
  [ ! -e "$R/run/probe.paused" ]
  ar
  [ ! -f "$R/run/probe.session" ]
  [ "$(claude_calls)" -eq 1 ]
  [ -z "$(failed_files)" ]
}

@test "Pause: Suchtext und Zeitmuster sind Parameter" {
  scenario - <<'EOF'
call: hang
EOF
  export LIMIT_TEXT="Grenze X" LIMIT_TIME_PATTERN='bis [0-9]+:[0-9]+'
  set_timeout 60
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar; settle
  echo "Grenze X erreicht, bis 23:59" >"$FAKES/sessions/probe.screen"
  stale probe
  ar
  [ -f "$R/run/probe.paused" ]
  # „bis 23:59“ liest date -d nicht als Zeitpunkt: Prüfung nach PAUSE_INTERVAL
  [ "$(sed -n 1p "$R/run/probe.paused")" -gt "$(( $(date +%s) + 800 ))" ]
}

# ---------------------------------------------------------------- Meldung failed

@test "failed: GitHub nicht erreichbar, Meldung bleibt vorgemerkt und wird später geschrieben" {
  touch "$FAKES/gh.fail"
  message "$IN" 20261012100000-projectlead-01.md projectlead probe check
  ar
  crash probe 3
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
  echo 'call: report' >"$FAKES/claude.scenario"
  run "$R/devteam/bin/functiontest" probe/wp01 "probe/wp01:development/probe/wp01/orders/01.md"
  [ "$status" -eq 0 ]
  # die Kennung der Sitzung (--session-id, Auftrag 08) ist eine UUID und wird durch ID ersetzt
  sed 's/^arg=[0-9a-f]\{8\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{12\}$/arg=ID/' "$FAKES/claude.log" | diff - <(cat <<EOF
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
arg=--session-id
arg=ID
arg=Bearbeite das Übergabedokument probe/wp01:development/probe/wp01/orders/01.md. Bezug: probe/wp01. Entwicklungsverzeichnis: $R. Arbeitsverzeichnis: $R/work/probe/wp01/functiontest.
EOF
)
}

@test "Startskript: Rollen securitytest und qa, Exitcode des Programms" {
  # der erste Aufruf schreibt einen Bericht und endet mit Exitcode 3, der zweite schreibt einen Bericht
  printf 'call: report ; exit 3\ncall: report\n' >"$FAKES/claude.scenario"
  run "$R/devteam/bin/securitytest" probe /abs/doc.md
  [ "$status" -eq 3 ]
  grep -qx "arg=devteam:securitytest" "$FAKES/claude.log"
  grep -qx "cwd=$R/work/probe/securitytest" "$FAKES/claude.log"
  run "$R/devteam/bin/qa" probe /abs/doc.md
  [ "$status" -eq 0 ]
  grep -qx "arg=devteam:qa" "$FAKES/claude.log"
}

@test "Startskript: Programm aus der Konfigurationsdatei" {
  # das Programm schreibt außerdem einen Bericht, sonst setzt startrole es fort (Auftrag 08)
  printf 'START_PROGRAM=(bash -c '"'"'echo "$@"; mkdir -p ../reports; touch ../reports/bericht.md'"'"' _ {agent} {devteam} {model})\n' >"$R/devteam/start.conf"
  run "$R/devteam/bin/qa" probe /abs/doc.md
  [ "$output" = "qa $R/devteam sonnet" ]
}

@test "Startskript: alle drei Rollen starten mit dem Modell Sonnet" {
  local r
  printf 'call: report\ncall: report\ncall: report\n' >"$FAKES/claude.scenario"
  for r in functiontest securitytest qa; do
    rm -f "$FAKES/claude.log"
    run "$R/devteam/bin/$r" probe /abs/doc.md
    [ "$status" -eq 0 ]
    grep -A1 -x "arg=--model" "$FAKES/claude.log" | grep -qx "arg=sonnet"
  done
}

# ---------------------------------------------------------------- startrole: Fortsetzung und Pause (Auftrag 08)

# Aufruf von startrole über das Startskript der QA (ref probe, Rolle qa); Ausgabe und Exitcode in $output und $status
sr() { run "$R/devteam/bin/qa" probe /abs/doc.md; }
# Kennung der Sitzung im Aufruf N des Ersatzprogramms claude: Wert von session-id= beziehungsweise resume=
sid() { claude_call "$1" | sed -n 's/^session-id=//p;s/^resume=//p'; }
# Auftrag (letztes Argument) des Aufrufs N
prompt_of() { claude_call "$1" | grep '^arg=' | tail -n 1 | sed 's/^arg=//'; }
# Ersatz für heartbeat, der die Hook-Daten festhält
hb_stub() {
  printf '#!/usr/bin/env bash\ncat >>"%s/hb.log"\necho >>"%s/hb.log"\n' "$T" "$T" >"$R/scripts/heartbeat"
  chmod +x "$R/scripts/heartbeat"
}
hb_calls() { grep -c '^{' "$T/hb.log" 2>/dev/null || echo 0; }

@test "startrole: Ablauf ohne Abbruch, ein Aufruf mit Kennung, keine Meldung, kein heartbeat" {
  hb_stub
  scenario - <<<"call: report"
  sr
  [ "$status" -eq 0 ]
  [ -z "$output" ]
  [ "$(claude_calls)" -eq 1 ]
  [[ "$(sid 1)" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]]
  claude_call 1 | grep -qx -- "arg=--session-id"
  [ "$(hb_calls)" -eq 0 ]
}

@test "startrole: Absturz, Fortsetzung mit --resume <kennung> im selben Arbeitsverzeichnis" {
  scenario - <<<$'call: crash 1\ncall: report'
  sr
  [ "$status" -eq 0 ]
  [ "$(claude_calls)" -eq 2 ]
  [ -n "$(sid 1)" ]
  [ "$(sid 2)" = "$(sid 1)" ]
  claude_call 1 | grep -qx -- "arg=--session-id"
  claude_call 2 | grep -qx -- "arg=--resume"
  ! claude_call 2 | grep -qx -- "arg=--session-id"
  [ "$(claude_call 1 | grep '^cwd=')" = "cwd=$R/work/probe/qa" ]
  [ "$(claude_call 2 | grep '^cwd=')" = "cwd=$R/work/probe/qa" ]
  [ "$(prompt_of 2)" = "Die Sitzung wurde abgebrochen. Prüfe den Stand deines Arbeitsverzeichnisses und setze die Aufgabe dort fort, wo sie abgebrochen ist." ]
  [[ "$output" == *"Abbruch 1 (Absturz)"* ]]
}

@test "startrole: Ende ohne Bericht und ohne Fehler ist ebenfalls ein Abbruch" {
  scenario - <<<$'call: exit 0\ncall: report'
  sr
  [ "$status" -eq 0 ]
  [ "$(claude_calls)" -eq 2 ]
  [ "$(sid 2)" = "$(sid 1)" ]
  [[ "$output" == *"Abbruch 1 (Ende ohne Bericht)"* ]]
}

@test "startrole: zweimalige Fortsetzung mit derselben Kennung, danach Bericht" {
  scenario - <<<$'call: crash 1\ncall: exit 0\ncall: report'
  sr
  [ "$status" -eq 0 ]
  [ "$(claude_calls)" -eq 3 ]
  [ "$(sid 2)" = "$(sid 1)" ]
  [ "$(sid 3)" = "$(sid 1)" ]
  claude_call 3 | grep -qx -- "arg=--resume"
}

@test "startrole: Exitcode des Programms bleibt, wenn der Bericht vorliegt" {
  scenario - <<<$'call: crash 1\ncall: report ; exit 4'
  sr
  [ "$status" -eq 4 ]
}

@test "startrole: dritter Abbruch endet mit Fehler, Zahl und Art des letzten Abbruchs" {
  scenario - <<<$'call: crash 1\ncall: crash 1\ncall: crash 2'
  sr
  [ "$status" -eq 1 ]
  [ "$(claude_calls)" -eq 3 ]
  [[ "$output" == *"Abbrüche: 3, Art des letzten Abbruchs: Absturz."* ]]
}

@test "startrole: Art des letzten Abbruchs ist die des dritten, Ende ohne Bericht" {
  scenario - <<<$'call: crash 1\ncall: crash 1\ncall: exit 0\ncall: report'
  sr
  [ "$status" -eq 1 ]
  # nach dem dritten Abbruch keine vierte Sitzung
  [ "$(claude_calls)" -eq 3 ]
  [[ "$output" == *"Abbrüche: 3, Art des letzten Abbruchs: Ende ohne Bericht."* ]]
}

@test "startrole: ABORT_LIMIT ist ein Parameter" {
  export ABORT_LIMIT=2
  scenario - <<<$'call: crash 1\ncall: crash 1\ncall: report'
  sr
  [ "$status" -eq 1 ]
  [ "$(claude_calls)" -eq 2 ]
  [[ "$output" == *"Abbrüche: 2, Art des letzten Abbruchs: Absturz."* ]]
}

@test "startrole: ein Bericht aus einem früheren Durchlauf zählt nicht" {
  mkdir -p "$R/work/probe/reports"
  echo alt >"$R/work/probe/reports/alt.md"
  touch -d '1 hour ago' "$R/work/probe/reports/alt.md"
  scenario - <<<$'call: exit 0\ncall: report'
  sr
  [ "$status" -eq 0 ]
  [ "$(claude_calls)" -eq 2 ]
}

@test "startrole: Pause ohne Zeitpunkt, Wartezeit PAUSE_INTERVAL, heartbeat mit dem Arbeitsverzeichnis, dann --resume" {
  export PAUSE_INTERVAL=3 PAUSE_HEARTBEAT_INTERVAL=1
  hb_stub
  scenario - <<<$'call: limit\ncall: report'
  SECONDS=0
  sr
  [ "$status" -eq 0 ]
  [ "$SECONDS" -ge 3 ]
  [ "$(claude_calls)" -eq 2 ]
  [ "$(hb_calls)" -ge 3 ]
  # jeder Aufruf von heartbeat trägt das Arbeitsverzeichnis der Rolle
  [ "$(grep -c "\"cwd\":\"$R/work/probe/qa\"" "$T/hb.log")" -eq "$(hb_calls)" ]
  [ "$(sid 2)" = "$(sid 1)" ]
  claude_call 2 | grep -qx -- "arg=--resume"
  [ "$(prompt_of 2)" = "Die Nutzungsgrenze ist aufgehoben. Fahre fort." ]
}

@test "startrole: während der Pause hält der echte heartbeat die Herzschlagdatei der Meldung frisch" {
  export PAUSE_INTERVAL=2 PAUSE_HEARTBEAT_INTERVAL=1
  scenario - <<<$'call: limit\ncall: report'
  sr
  [ "$status" -eq 0 ]
  [ -f "$R/run/probe.heartbeat" ]
}

@test "startrole: die Pause zählt nicht als Abbruch, danach bleiben zwei Fortsetzungen" {
  export PAUSE_INTERVAL=1 PAUSE_HEARTBEAT_INTERVAL=1
  scenario - <<<$'call: limit\ncall: crash 1\ncall: crash 1\ncall: report'
  sr
  [ "$status" -eq 0 ]
  [ "$(claude_calls)" -eq 4 ]
}

@test "startrole: mehrere Pausen nacheinander" {
  export PAUSE_INTERVAL=1 PAUSE_HEARTBEAT_INTERVAL=1
  scenario - <<<$'call: limit\ncall: limit\ncall: limit\ncall: report'
  sr
  [ "$status" -eq 0 ]
  [ "$(claude_calls)" -eq 4 ]
}

@test "startrole: Meldung mit Zeitpunkt, gewartet wird bis zu diesem Zeitpunkt statt PAUSE_INTERVAL" {
  export PAUSE_INTERVAL=100 PAUSE_HEARTBEAT_INTERVAL=1
  hb_stub
  scenario - <<<$'call: limit-time '"$(date -u -d '+3 seconds' +%Y-%m-%dT%H:%M:%SZ)"$'\ncall: report'
  SECONDS=0
  sr
  [ "$status" -eq 0 ]
  [ "$SECONDS" -ge 2 ]
  [ "$SECONDS" -lt 20 ]
  [ "$(hb_calls)" -ge 2 ]
  [ "$(claude_calls)" -eq 2 ]
  claude_call 2 | grep -qx -- "arg=--resume"
}

@test "startrole: genannter Zeitpunkt liegt in der Vergangenheit, keine Wartezeit" {
  export PAUSE_INTERVAL=100 PAUSE_HEARTBEAT_INTERVAL=1
  scenario - <<<$'call: limit-time 2000-01-01T00:00:00Z\ncall: report'
  SECONDS=0
  sr
  [ "$status" -eq 0 ]
  [ "$SECONDS" -lt 10 ]
  [ "$(claude_calls)" -eq 2 ]
}

@test "startrole: Zeitpunkt, den date nicht lesen kann, gilt als nicht genannt" {
  export PAUSE_INTERVAL=2 PAUSE_HEARTBEAT_INTERVAL=1 LIMIT_TIME_PATTERN='um [A-Za-z]+'
  scenario - <<<$'call: limit-time Mittag\ncall: report'
  SECONDS=0
  sr
  [ "$status" -eq 0 ]
  [ "$SECONDS" -ge 2 ]
  [ "$(claude_calls)" -eq 2 ]
}

@test "startrole: Suchtext ist ein Parameter, ohne Treffer ist es ein Abbruch" {
  export PAUSE_INTERVAL=1 PAUSE_HEARTBEAT_INTERVAL=1 LIMIT_TEXT='anderer Wortlaut'
  scenario - <<<$'call: limit\ncall: report'
  sr
  [ "$status" -eq 0 ]
  [[ "$output" == *"Abbruch 1 (Ende ohne Bericht)"* ]]
  [[ "$output" != *"Pause wegen der Nutzungsgrenze"* ]]
}

@test "startrole: Ablauf mit Bericht gibt die Ausgabe des Programms unverändert weiter und ruft kein heartbeat auf" {
  hb_stub
  printf 'START_PROGRAM=(bash -c '"'"'echo Ausgabe; mkdir -p ../reports; touch ../reports/bericht.md; exit 5'"'"')\n' >"$R/devteam/start.conf"
  sr
  [ "$status" -eq 5 ]
  [ "$output" = "Ausgabe" ]
  [ "$(hb_calls)" -eq 0 ]
}
