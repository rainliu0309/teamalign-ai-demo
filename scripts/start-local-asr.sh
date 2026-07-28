#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
whisper_root="$project_root/.local/whisper.cpp"
server_bin="$whisper_root/build/bin/whisper-server"
model_file="$whisper_root/models/ggml-small-q5_1.bin"

if [[ ! -x "$server_bin" ]]; then
  echo "Local Whisper server is not built. Ask Codex to run the local ASR setup."
  exit 1
fi

if [[ ! -f "$model_file" ]]; then
  echo "Local Whisper model is missing. Ask Codex to run the local ASR setup."
  exit 1
fi

exec "$server_bin" \
  --host 127.0.0.1 \
  --port 8080 \
  --model "$model_file" \
  --convert \
  --language auto \
  --flash-attn
