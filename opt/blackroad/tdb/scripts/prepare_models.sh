#!/usr/bin/env bash
set -euo pipefail

MODELS_DIR="${1:-/opt/blackroad/tdb/data/models}"
CACHE_DIR="${2:-/opt/blackroad/tdb/data/cache}"

mkdir -p "$MODELS_DIR" "$CACHE_DIR"
export HF_HOME="$MODELS_DIR"
export TRANSFORMERS_CACHE="$CACHE_DIR"
export HF_HUB_ENABLE_HF_TRANSFER=1

# Pre-fetch gpt2-small weights + tokenizer (no OpenAI API; HuggingFace public model)
python - <<'PY'
from transformers import AutoModelForCausalLM, AutoTokenizer
m = "gpt2"  # gpt2-small
AutoModelForCausalLM.from_pretrained(m, local_files_only=False)
AutoTokenizer.from_pretrained(m, local_files_only=False)
print("Fetched:", m)
PY

echo "Done. You can now set HF_HUB_OFFLINE=1 in .env if you want fully offline."
