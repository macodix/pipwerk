#!/bin/sh
# Startet oder startet neu: die Sitzung der Auftragsverwaltung in tmux.
# Beschreibung: docs/technical/entwicklungsverfahren.md, Abschnitt "Auftragsverwaltung".
set -eu

: "${PIPWERK_DEV_ROOT:?PIPWERK_DEV_ROOT ist nicht gesetzt}"
test -d "$PIPWERK_DEV_ROOT/repo/.git" || { echo "Referenz-Repository fehlt: $PIPWERK_DEV_ROOT/repo" >&2; exit 1; }

SESSION=order-management
DEV="$PIPWERK_DEV_ROOT/scripts/pipwerk-dev"
WORKDIR="$PIPWERK_DEV_ROOT/work/$SESSION/coordinate"

if tmux has-session -t "$SESSION" 2>/dev/null; then
    tmux kill-session -t "$SESSION"
fi

# remove lehnt ab, solange in der Arbeitskopie noch ein Claude-Code-Prozess
# läuft; deshalb bis zu 60 Sekunden lang erneut versuchen.
if [ -d "$PIPWERK_DEV_ROOT/work/$SESSION" ]; then
    tries=0
    until "$DEV" remove --order "$SESSION"; do
        tries=$((tries + 1))
        if [ "$tries" -ge 12 ]; then
            echo "Arbeitskopie der Auftragsverwaltung ließ sich nicht abbauen" >&2
            exit 1
        fi
        sleep 5
    done
fi

BASE=$(git -C "$PIPWERK_DEV_ROOT/repo" rev-parse origin/main)
"$DEV" prepare --order "$SESSION" coordinate --base "$BASE"

tmux new-session -d -s "$SESSION" -c "$WORKDIR" \
    -e "PIPWERK_DEV_ROOT=$PIPWERK_DEV_ROOT" \
    'claude --agent order-management'

tmux has-session -t "$SESSION"
echo "Auftragsverwaltung gestartet auf Commit $BASE"
