#!/usr/bin/env bash
# After a deploy: if the API's Scope database is missing or differs from the committed one
# (build id or latest recording), upload recordings/scope/scope.sqlite to the volume. The
# committed file is the source of truth: it holds the dataset and every recorded model call.
set -euo pipefail

APP="${FLY_APP:-highnet-safe-llm-tools}"
SRC="${1:-recordings/scope/scope.sqlite}"
health="$(curl -fsS --retry 6 --retry-delay 5 --retry-all-errors "https://$APP.fly.dev/api/health")"
echo "Health: $health"

local_state="$(python3 - "$SRC" <<'PY'
import sqlite3, sys
conn = sqlite3.connect(f"file:{sys.argv[1]}?mode=ro", uri=True)
build = conn.execute("SELECT value FROM meta WHERE key = 'build_id'").fetchone()[0]
recorded = conn.execute("SELECT max(recorded_at) FROM calls").fetchone()[0]
print(f"{build} {recorded}")
PY
)"
live_state="$(jq -r '"\(.scope) \(.scope_recorded_at)"' <<<"$health")"
if [ "$local_state" = "$live_state" ]; then
  echo "Scope database $local_state is already live; nothing to do."
  exit 0
fi
echo "Live: $live_state; committed: $local_state. Uploading."
scripts/upload-corpus.sh "$SRC" scope.sqlite
