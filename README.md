# NVIDIA Open GPU Kernel Modules

This repository mirrors NVIDIA's open source GPU kernel modules and provides hardened build and packaging tooling.

## How to Build

Use the provided container image for reproducible builds:

```bash
docker build -f .codex/Dockerfile.kmod -t nvidia-open-kmod .
docker run --rm -v "$PWD:/src" -w /src nvidia-open-kmod make modules -j"$(nproc)"
```

## Supported Kernels / Architectures

- Kernels: 5.15, 6.1, 6.6
- Architectures: x86_64, aarch64

## DKMS Packages

After building, create DKMS packages (.deb and .rpm):

```bash
./.codex/make-dkms.sh 580.76.05
```

Packages are placed in `dist/`.

## Secure Boot

For Secure Boot environments, sign modules with your Machine Owner Key (MOK) and enroll the certificate using `mokutil --import`.

## License

Kernel modules in this repository are dual licensed under MIT/GPLv2. Proprietary NVIDIA userspace components are **not** distributed here.
Additional operational docs live in the [`docs/`](docs) folder.

## Experiments & Funnels

### Flip experiments (ChatOps)
Comment on any PR/Issue:

```
/exp set <id> active on|off weights A=<num> B=<num>

After building, create DKMS packages (.deb and .rpm):

```bash
./.codex/make-dkms.sh 580.76.05
```

Packages are placed in `dist/`.

## Secure Boot

For Secure Boot environments, sign modules with your Machine Owner Key (MOK) and enroll the certificate using `mokutil --import`.

## License

Kernel modules in this repository are dual licensed under MIT/GPLv2. Proprietary NVIDIA userspace components are **not** distributed here.
python3 -m venv .venv && source .venv/bin/activate
pip install -e .

# Ensure a local model backend:
# Option A) Ollama (recommended)
#   brew install ollama && ollama pull phi3
#   export OLLAMA_HOST="http://localhost:11434"
#   export OLLAMA_MODEL="phi3:latest"

# Option B) llama.cpp (optional; if you `pip install llama-cpp-python` and have a GGUF model)
#   update configs/lucidia.yaml -> llm.provider: "llama.cpp"
#   set model path there.

# Bootstrap and run
bash scripts/bootstrap.sh
make dev      # http://127.0.0.1:8000/health

Endpoints
•GET /health — basic status
•POST /chat — plain chat (machine-structured). JSON: {"prompt":"...", "mode":"auto|chit_chat|execute"}
•POST /codex/apply — Codex Infinity task with contradiction logging. JSON: {"task":"...", "mode":"auto|chit_chat|execute"}

Code words
•“chit chat cadillac” → sets conversational resonance (softer planning, still symbolic).
•“conversation cadillac” → synonym; also enables conversational resonance.

Files & Logs
•logs/prayer.log — durable memory lines (mem:) are appended here.
•logs/contradictions.log — any ⟂ / CONTRA(–1) notations are captured.

Design
•Trinary logic {+1,0,–1} surfaced as TRUE/NULL/CONTRA.
•Ψ′ discipline hooks; undefined ops are declared minimally.
•Breath 𝔅(t) & PS-SHA∞ seed line included (configurable).

---

## DKMS Packages

After building, create DKMS packages (.deb and .rpm):

```bash
./.codex/make-dkms.sh 580.76.05
```

Packages are placed in `dist/`.

## Secure Boot

For Secure Boot environments, sign modules with your Machine Owner Key (MOK) and enroll the certificate using `mokutil --import`.

## License

Kernel modules in this repository are dual licensed under MIT/GPLv2. Proprietary NVIDIA userspace components are **not** distributed here.
# BlackRoad Prism Console

This repository powers the BlackRoad Prism console and a Vite/React site under `sites/blackroad`.

## Quickstart

Install dependencies:

```bash
npm ci
(cd sites/blackroad && npm i --package-lock-only)
```

## Development

```bash
cd sites/blackroad
npm run dev
```

## Build

```bash
cd sites/blackroad
npm run build
```

## Tests

```bash
npm test
```

Additional operational docs live in the [`docs/`](docs) folder.

## Experiments & Funnels

### Flip experiments (ChatOps)
Comment on any PR/Issue:

```
/exp set <id> active on|off weights A=<num> B=<num>
```

This edits `sites/blackroad/public/experiments.json`, commits, and pushes.

### Manage funnels (ChatOps)

```
/funnel set "Signup" window 14 steps cta_click,portal_open,signup_success
```

This edits `sites/blackroad/public/funnels.json`.

### Experiments dashboard
- Visit **/experiments** to preview experiments and generate the exact ChatOps command.

### Per-variant lift
- Conversions automatically include your A/B assignments (cookie `br_ab`) in `meta.ab`.
- **/metrics** shows A vs B counts and naïve rates per conversion id, plus **lift**.

### Funnels analytics
- Configure `public/funnels.json`. **/metrics** computes per-step counts, step rate, and cumulative rate (last 30 days).
- For very high volumes, move aggregation to the Worker/Durable Objects.

### Quick use

Flip an experiment:

```
/exp set new_nav active on weights A=0.4 B=0.6
```

Add a funnel:

```
/funnel set "Docs Journey" window 10 steps home_view,docs_view,docs_search,docs_copy_snippet
```

Record extra conversions from code:

```ts
import { recordConversion } from '@/lib/convert'
recordConversion('portal_open')
recordConversion('signup_success', 1, { plan: 'pro' })
```
