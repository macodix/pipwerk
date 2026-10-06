#!/bin/sh
# Starts an isolated Pipwerk Studio backend for the Playwright end-to-end
# tests. The backend is started with the documented `-c <PATH>` startup
# configuration parameter (req-system-017, req-system-018) pointing at a
# freshly generated, test-only SQLite database. No additional,
# undocumented environment-variable based configuration source is
# introduced for the backend's storage. The bind port is passed through
# explicitly as a script argument, not as a new configuration channel.
set -eu

PORT="$1"
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
CONFIG_PATH="$(node "$SCRIPT_DIR/write-backend-config.mjs" "$PORT")"

exec uv run --frozen --project "$SCRIPT_DIR/../../backend" \
  pipwerk-studio -c "$CONFIG_PATH" --host 127.0.0.1 --port "$PORT"
