# BlackRoad + Lucidia Diffusion (Local)

## 0) Install guided-diffusion locally (no cloud)

```bash
cd /opt/blackroad/ai
git clone https://github.com/openai/guided-diffusion
cd guided-diffusion
python3 -m venv .venv && source .venv/bin/activate
pip install --upgrade pip
pip install -e .
```

1. Install this service

```bash
cd /opt/blackroad/ai/diffusion
pip install -r requirements.txt
```

2. Models

Place checkpoints in /opt/blackroad/ai/diffusion/models/ and update config.yaml if names differ. Use your own trained weights or community mirrors.

Examples
•diffusion_256: 256x256_diffusion.pt
•classifier_256: 256x256_classifier.pt

3. Run service

```bash
python blackroad_diffusion_service.py
# or with systemd
sudo ln -s /opt/blackroad/ai/diffusion/systemd/blackroad-diffusion.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now blackroad-diffusion
curl http://127.0.0.1:8009/health
```

4. Try CLI (“chit chat”)

```bash
python diffusion_cli.py
> gen class=207 n=4 size=256 scale=1.2
```

5. Via Lucidia agent (Python)

```python
from lucidia_diffusion_agent import generate
out = generate(207, n=8, image_size=256, classifier_scale=1.0)
print(out["run_dir"])
```

Notes
•100% local. No API calls. Works on CPU (slow) or CUDA.
•For free-text class names, download imagenet_class_index.json (from torchvision) to the path in config.yaml.
•To train your own models, use the repo’s training scripts and point MODEL_DIR to your weights.

---

## Codex Infinity Control Prompt (drop-in)

Paste this as a new **Codex task profile**. It teaches Codex how to command the diffusion agent without any external APIs.

```yaml
<!-- FILE: /opt/blackroad/ai/diffusion/codex_prompt.yaml -->
role: "BlackRoad Diffusion Orchestrator"
goals:
  - Generate images locally using guided-diffusion weights with optional classifier guidance.
  - Never call external APIs. All actions are local.
  - Log every run (inputs, outputs) to maintain reproducible states for RoadChain anchors.
capabilities:
  - call: HTTP POST http://127.0.0.1:8009/sample
    body_schema:
      image_size: int        # e.g., 256
      num_samples: int       # how many to make this run
      batch_size: int        # ≤ num_samples
      seed: int|null
      timestep_respacing: str  # e.g., "250" or "" for full steps
      class_id: int|null       # required if classifier is provided
      classifier_scale: float  # e.g., 1.0..3.0
      diffusion_path: str|null
      classifier_path: str|null
default_plan:
  - ensure /health returns ok
  - for natural-language requests: resolve class_id (use local label map via lucidia_diffusion_agent or require explicit class_id)
  - choose seed for determinism unless user demands full stochasticity
  - call /sample with requested params
  - return {run_dir, files, meta} and a compact summary (no thumbnails unless asked)
guardrails:
  - if class_id cannot be resolved locally, ask the user for an integer class_id or a known label present in the local map.
  - never attempt to reach the internet for labels or weights.
  - reject prompts requesting disallowed content per BlackRoad policy.
examples:
  - user: "Make 12 golden retriever samples at 256 with a bit more guidance."
    plan:
      - resolve class="golden retriever" -> class_id via local map
      - POST /sample { num_samples: 12, batch_size: 4, image_size: 256, classifier_scale: 1.3, timestep_respacing: "250", class_id: <resolved> }
      - return run_dir
  - user: "Use custom weights diffusion_x.pt and classifier_x.pt for 64x64, 100 images."
    plan:
      - POST /sample { num_samples: 100, batch_size: 20, image_size: 64, diffusion_path: "diffusion_x.pt", classifier_path: "classifier_x.pt", class_id: <id>, timestep_respacing: "250" }
```

How to make this “machine-native” inside Lucidia
•Agent call: other agents call lucidia_diffusion_agent.generate(…) with either class_id or a text label resolved locally.
•Determinism: pin seed for reproducibility and RoadChain anchoring (hash the meta.json).
•No fallback: if label mapping fails, the agent errors (no internet search), asking Codex/user for a numeric class id — clean and explicit.
•Chit-chat: the diffusion_cli.py is a tiny REPL that ops or Codex can drive; it mirrors the same parameters so humans and agents speak the same minimal dialect.

If you want, I can also drop in a training runner and a checkpoint lister next.

_Last updated on 2025-09-11_
