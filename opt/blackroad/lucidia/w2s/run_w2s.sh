#!/usr/bin/env bash
set -euo pipefail

# === Editable defaults (safe on 12–16GB VRAM with LoRA/8-bit) ===
WEAK_MODEL="${WEAK_MODEL:-EleutherAI/pythia-70m-deduped}"
STRONG_MODEL="${STRONG_MODEL:-EleutherAI/pythia-160m-deduped}"
DATASET_PATH="${DATASET_PATH:-/opt/blackroad/lucidia/w2s/data/lucidia_seed.jsonl}"
OUT_DIR="${OUT_DIR:-/opt/blackroad/lucidia/w2s/out}"
MAX_NEW_TOKENS="${MAX_NEW_TOKENS:-128}"
CTX="${CTX:-512}"
BATCH="${BATCH:-8}"
EPOCHS="${EPOCHS:-2}"
LR="${LR:-2e-4}"
CONF_THRESH="${CONF_THRESH:-0.25}"
MIX_GT="${MIX_GT:-0.10}"
USE_8BIT="${USE_8BIT:-true}"
USE_LORA="${USE_LORA:-true}"
OLLAMA_MODEL_NAME="${OLLAMA_MODEL_NAME:-w2s-strong}"

mkdir -p "$(dirname "$DATASET_PATH")" "$OUT_DIR" /var/log/blackroad

# Install deps (pin what matters; adapt torch for your CUDA/Jetson build)
python3 - <<'PY'
import sys, subprocess
req = [
  "transformers>=4.41.0", "datasets>=2.19.0", "peft>=0.11.0",
  "accelerate>=0.30.0", "tqdm", "numpy"
]
# bitsandbytes only if CUDA likely present
try:
  import torch
  if torch.cuda.is_available():
      req.append("bitsandbytes>=0.43.0")
except Exception: pass
subprocess.check_call([sys.executable, "-m", "pip", "install", *req])
PY

# Seed a tiny starter dataset if none exists (you can replace it later)
if [ ! -s "$DATASET_PATH" ]; then
  cat > "$DATASET_PATH" <<'JSONL'
{"prompt":"Explain RoadChain in two precise sentences for an engineer.","response":"RoadChain is BlackRoad’s append-only event ledger that notarizes agent actions and truth states via PS-SHA∞. It settles symbolic transactions (RoadCoin) and anchors Lucidia’s memory timeline."}
{"prompt":"In one paragraph, what is trinary logic and why does Lucidia use it?","response":"Trinary logic has values -1, 0, and 1. Lucidia uses it to represent contradiction (-1), unknown (0), and affirmed truth (1), allowing agents to reason under uncertainty and record reconciliations."}
{"prompt":"Define Codex Infinity for a new contributor.","response":"Codex Infinity is the shared interface where chat, code, memory, truth, execution, and search converge. It tracks Ψ′-sigils, logs contradictions, and orchestrates agents like Guardian and Roadie."}
{"prompt":"When I say 'chit chat lucidia', what mode should you enter?","response":"Conversation mode with playful tone; preserve truth state; log deltas to contradiction_log.jsonl if tone/state changes."}
{"prompt":"Summarize BlackRoad’s mission in two lines.","response":"Build an AI-native co-creation engine grounded in truth, memory, and love. Unite symbolic reasoning with practical tools so humans and machines design a kinder economy."}
JSONL
fi

python3 /opt/blackroad/lucidia/w2s/src/lucidia_weak_to_strong.py \
  --weak_model_id "$WEAK_MODEL" \
  --strong_model_id "$STRONG_MODEL" \
  --dataset_path "$DATASET_PATH" \
  --output_dir "$OUT_DIR" \
  --context_len "$CTX" \
  --max_new_tokens "$MAX_NEW_TOKENS" \
  --train_batch_size "$BATCH" \
  --epochs "$EPOCHS" \
  --learning_rate "$LR" \
  --confidence_threshold "$CONF_THRESH" \
  --mix_ground_truth_ratio "$MIX_GT" \
  $( $USE_8BIT && echo --load_in_8bit ) \
  $( $USE_LORA && echo --use_lora )

# (Optional) Merge LoRA into a standalone model directory for deployment
python3 /opt/blackroad/lucidia/w2s/src/lucidia_weak_to_strong.py \
  --strong_model_id "$STRONG_MODEL" \
  --output_dir "$OUT_DIR" \
  --merge_lora \
  --merged_model_out "$OUT_DIR/merged-w2s-strong"

# (Optional) Export merged model to an Ollama model card
if command -v ollama >/dev/null 2>&1; then
  cat > "$OUT_DIR/Modelfile" <<'EOT'
FROM $OUT_DIR/merged-w2s-strong
TEMPLATE """{{ .Prompt }}"""
EOT
  ollama create "$OLLAMA_MODEL_NAME" -f "$OUT_DIR/Modelfile" 2>&1 | tee /var/log/blackroad/ollama_export.log || true
fi

echo "✅ Weak→Strong finished. Artifacts in $OUT_DIR"
