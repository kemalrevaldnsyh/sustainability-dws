#!/usr/bin/env bash
# Jalankan Vite dev server. Jika folder .tools/ berisi Node portabel, dipakai otomatis.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
TOOL_BIN="$(ls -d "$ROOT"/.tools/node-*-darwin-*/bin 2>/dev/null | head -1 || true)"
if [[ -n "$TOOL_BIN" && -x "$TOOL_BIN/node" ]]; then
  export PATH="$TOOL_BIN:$PATH"
fi
if [[ -x "$ROOT/node_modules/.bin/vite" ]]; then
  exec "$ROOT/node_modules/.bin/vite"
fi
exec npm run dev
