VENV := .venv
PY := $(VENV)/bin/python
PIP := $(VENV)/bin/pip

all: help

help:
@echo "Targets:"
@echo "  make init            # venv + clone human-eval + install"
@echo "  make eval-ollama     # generate + score (Ollama)"
@echo "  make eval-llamacpp   # generate + score (llama.cpp server)"
@echo "  make eval-hf         # generate + score (offline transformers)"
@echo "  make docker-build    # build sandboxed image"
@echo "  make docker-eval     # run eval inside Docker (no network)"

init: $(VENV)/bin/activate third_party/human-eval/.git
$(PIP) install -r requirements.txt
$(PIP) install -e third_party/human-eval

$(VENV)/bin/activate:
python3 -m venv $(VENV)

third_party/human-eval/.git:
mkdir -p third_party
git clone --depth=1 https://github.com/openai/human-eval third_party/human-eval

eval-ollama:
$(PY) run_eval.py --config configs/ollama.yaml
evaluate_functional_correctness outputs/latest.samples.jsonl

eval-llamacpp:
$(PY) run_eval.py --config configs/llamacpp.yaml
evaluate_functional_correctness outputs/latest.samples.jsonl

eval-hf:
$(PY) run_eval.py --config configs/transformers.yaml
evaluate_functional_correctness outputs/latest.samples.jsonl

docker-build:
docker build -t blackroad/humaneval:local .

# run in a strict sandbox: no network, memory + PID caps, read-only FS
docker-eval:
docker run --rm -it \
  --network=none --pids-limit=128 -m 2g --cpus=1.0 \
  --read-only --tmpfs /tmp:rw,noexec,nosuid,size=256m \
  -v $$(pwd):/app -w /app blackroad/humaneval:local

clean:
rm -rf $(VENV) outputs/*.jsonl outputs/*.json outputs/*.txt || true
