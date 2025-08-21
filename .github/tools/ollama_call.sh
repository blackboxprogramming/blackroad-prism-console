#!/usr/bin/env bash
set -euo pipefail

MODEL="${OLLAMA_MODEL:-llama3.1:8b}"
PROMPT="${1:-"Say hello!"}"

call_remote() {
  curl -sS "${OLLAMA_URL%/}/api/generate" \
    -H 'Content-Type: application/json' \
    -d "$(jq -c --arg m "$MODEL" --arg p "$PROMPT" '{model:$m, prompt:$p, stream:false}')" \
  | jq -r '.response // empty'
}

start_local_if_possible() {
  if command -v docker >/dev/null 2>&1; then
    docker rm -f gh-ollama >/dev/null 2>&1 || true
    docker run -d --name gh-ollama -p 11434:11434 ghcr.io/ollama/ollama:latest >/dev/null
    # pull model (best-effort)
    timeout 180 bash -lc 'until curl -fsS http://localhost:11434/api/tags >/dev/null; do sleep 2; done' || true
    curl -sS http://localhost:11434/api/pull -d "{\"name\":\"$MODEL\"}" >/dev/null 2>&1 || true
    export OLLAMA_URL="http://localhost:11434"
    call_remote
  else
    echo "::notice::Docker not available; skipping Ollama." >&2
    exit 0
  fi
}

if [ -n "${OLLAMA_URL:-}" ]; then
  call_remote
else
  start_local_if_possible
fi
