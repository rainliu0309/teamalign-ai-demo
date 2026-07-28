#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

"$project_root/scripts/start-local-asr.sh" &
asr_pid=$!

cleanup() {
  kill "$asr_pid" 2>/dev/null || true
}

trap cleanup EXIT INT TERM
cd "$project_root"
npm run dev
