#!/usr/bin/env bash
# FILE: /opt/lucidia/bin/setup_llms_from_scratch.sh
# Purpose: Integrate rasbt/LLMs-from-scratch into Lucidia with a clean venv, Makefile helpers, and quick sanity checks.

set -euo pipefail

# --- config
BASE="/opt/lucidia/ext/LLMs-from-scratch"
VENV="/opt/lucidia/venvs/llms-scratch"
BIN="/opt/lucidia/bin"
REPO="https://github.com/rasbt/LLMs-from-scratch.git"
JUPYTER_PORT="${JUPYTER_PORT:-8890}"

SUDO="" ; if [ "$(id -u)" -ne 0 ]; then SUDO="sudo"; fi

# --- dirs
$SUDO mkdir -p "$(dirname "$BASE")" "$(dirname "$VENV")" "$BIN"

# --- system deps (Debian/Ubuntu)
if command -v apt-get >/dev/null 2>&1; then
  $SUDO apt-get update -y
  $SUDO apt-get install -y python3-venv python3-dev git build-essential
fi

# --- clone or update repo
if [ -d "$BASE/.git" ]; then
  git -C "$BASE" fetch --all --tags --prune || true
  # Prefer default branch (main/master) without guessing
  git -C "$BASE" reset --hard HEAD
  git -C "$BASE" pull --ff-only || true
else
  git clone --depth 1 "$REPO" "$BASE"
fi

# --- venv
if [ ! -d "$VENV" ]; then
  python3 -m venv "$VENV"
fi
# shellcheck disable=SC1091
source "$VENV/bin/activate"
pip install --upgrade pip wheel setuptools

# --- PyTorch (GPU if available, else CPU)
if command -v nvidia-smi >/dev/null 2>&1; then
  pip install --extra-index-url https://download.pytorch.org/whl/cu121 torch torchvision torchaudio
else
  pip install --index-url https://download.pytorch.org/whl/cpu torch torchvision torchaudio
fi

# --- repo requirements (best-effort, notebooks often self-contained)
if [ -f "$BASE/requirements.txt" ]; then
  pip install -r "$BASE/requirements.txt" || true
fi

# --- common tools
pip install jupyterlab papermill ipykernel datasets tokenizers sentencepiece accelerate

python -m ipykernel install --user --name llms-scratch --display-name "LLMs Scratch"

# --- tools: notebook locator
mkdir -p "$BASE/tools"
cat > "$BASE/tools/search_notebooks.py" <<'PY'
# FILE: /opt/lucidia/ext/LLMs-from-scratch/tools/search_notebooks.py
import sys, pathlib
root = pathlib.Path(__file__).resolve().parents[1]
terms = [t.lower() for t in sys.argv[1:]]
nbs = sorted(root.glob("**/*.ipynb"))
def ok(p):
    s = str(p).lower()
    return all(t in s for t in terms)
for p in nbs:
    if not terms or ok(p):
        print(p.relative_to(root))
PY

# --- Makefile with helpful targets
cat > "$BASE/Makefile" <<MAKE
# FILE: /opt/lucidia/ext/LLMs-from-scratch/Makefile

VENVDIR ?= $VENV
VENVBIN := \$(VENVDIR)/bin
PY := \$(VENVBIN)/python
PIP := \$(VENVBIN)/pip

.PHONY: setup update list lab nb pretrain-demo eval-ollama

setup:
	@echo "[setup] venv: \$(VENVDIR)"
	@test -d \$(VENVDIR) || python3 -m venv \$(VENVDIR)
	@\$(PIP) install --upgrade pip wheel setuptools
	@\$(PIP) install jupyterlab papermill ipykernel datasets tokenizers sentencepiece accelerate
	@\$(PY) -m ipykernel install --user --name llms-scratch --display-name "LLMs Scratch"

update:
	@git -C . fetch --all --tags --prune
	@git -C . pull --ff-only || true

list:
	@echo "== Matching notebooks ==" 
	@KEYWORDS="\$(KEYWORDS)"; \
	if [ -z "$$KEYWORDS" ]; then \
	  \$(PY) tools/search_notebooks.py; \
	else \
	  \$(PY) tools/search_notebooks.py $$KEYWORDS; \
	fi

lab:
	@echo "Launching Jupyter Lab on 127.0.0.1:$JUPYTER_PORT (Ctrl-C to stop)"
	@cd . && \$(VENVBIN)/jupyter lab --ip=127.0.0.1 --port=$JUPYTER_PORT --no-browser

# Execute the first notebook matching KEYWORDS non-interactively
# Usage: make nb KEYWORDS="ch05 gpt"
nb:
	@[ -n "\$(KEYWORDS)" ] || (echo "Usage: make nb KEYWORDS=\"ch05 gpt\"" && exit 1)
	@NB=$$\(\$(PY) tools/search_notebooks.py \$(KEYWORDS) | head -n1\); \
	if [ -z "$$NB" ]; then echo "No notebook found"; exit 1; fi; \
	echo "Executing $$NB with papermill..."; \
	mkdir -p runs; \
	\$(VENVBIN)/papermill "$$NB" "runs/$$(basename $$NB .ipynb)-run.ipynb"

# Tiny demo to verify Torch + training loop (HF-based; quick sanity check)
pretrain-demo:
	@echo "[demo] quick-check: tiny causal LM fine-tune"
	@\$(PY) - <<'PY'
# FILE: DEMO (sanity check) — runs fast on CPU/GPU
import torch
from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForCausalLM, Trainer, TrainingArguments, DataCollatorForLanguageModeling
tok = AutoTokenizer.from_pretrained("gpt2"); tok.pad_token = tok.eos_token
ds = load_dataset("wikitext","wikitext-2-raw-v1", split="train[:1%]").shuffle(seed=0)
ds = ds.map(lambda b: tok(b["text"], truncation=True, max_length=128), batched=True, remove_columns=["text"])
model = AutoModelForCausalLM.from_pretrained("gpt2")
args = TrainingArguments(output_dir="runs/demo", per_device_train_batch_size=2, num_train_epochs=1, max_steps=20, logging_steps=5, fp16=torch.cuda.is_available(), report_to="none")
trainer = Trainer(model=model, args=args, train_dataset=ds, data_collator=DataCollatorForLanguageModeling(tok, mlm=False))
trainer.train(); print("Demo complete.")
PY

# Optional: smoke-test Ollama if present (e.g., llama3.1)
eval-ollama:
	@command -v ollama >/dev/null 2>&1 || { echo "ollama not found — skipping"; exit 0; }
	@\$(PY) - <<'PY'
import subprocess, sys
model = sys.argv[1] if len(sys.argv)>1 else "llama3.1"
prompt = "Say hello from the LLMs-from-scratch integration."
out = subprocess.check_output(["ollama","run",model], input=prompt.encode())
print(out.decode()[:400])
PY
MAKE

# --- one-liner env helper
cat > "$BIN/llms-scratch-env.sh" <<'BASH'
# FILE: /opt/lucidia/bin/llms-scratch-env.sh
# Usage: source /opt/lucidia/bin/llms-scratch-env.sh
VENV="/opt/lucidia/venvs/llms-scratch"
REPO="/opt/lucidia/ext/LLMs-from-scratch"
if [ -d "$VENV" ]; then
  . "$VENV/bin/activate"
  cd "$REPO"
  echo "[env] Activated venv and cd into $REPO"
else
  echo "Venv not found: $VENV"
fi
BASH
chmod +x "$BIN/llms-scratch-env.sh"

echo
echo "✅ LLMs-from-scratch integrated."
echo "Next steps:"
echo "1) source $BIN/llms-scratch-env.sh"
echo "2) make -C $BASE list                          # list notebooks (or: make list KEYWORDS=\"ch05 gpt\")"
echo "3) make -C $BASE lab                           # Jupyter on 127.0.0.1:$JUPYTER_PORT (use SSH tunnel)"
echo "4) make -C $BASE nb KEYWORDS=\"ch05 gpt\"       # execute first matching notebook non-interactively"
echo "5) make -C $BASE pretrain-demo                 # quick sanity check training loop"
echo "6) make -C $BASE eval-ollama                   # optional, if 'ollama' is installed"
