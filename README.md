![Build](https://github.com/blackboxprogramming/blackroad-prism-console/actions/workflows/monorepo-matrix.yml/badge.svg) ![E2E](https://github.com/blackboxprogramming/blackroad-prism-console/actions/workflows/playwright.yml/badge.svg) ![Deploy](https://github.com/blackboxprogramming/blackroad-prism-console/actions/workflows/deploy-blackroad.yml/badge.svg)
# NVIDIA Open GPU Kernel Modules
![Build](https://github.com/blackboxprogramming/blackroad-prism-console/actions/workflows/monorepo-matrix.yml/badge.svg) ![E2E](https://github.com/blackboxprogramming/blackroad-prism-console/actions/workflows/playwright.yml/badge.svg) ![Deploy](https://github.com/blackboxprogramming/blackroad-prism-console/actions/workflows/deploy-blackroad.yml/badge.svg)
# BlackRoad Prism Console

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
# 🧠 Lucidia Cognitive System

[![CI/CD Pipeline](https://github.com/blackroad/lucidia-cognitive-system/workflows/Lucidia%20Cognitive%20System%20CI/CD/badge.svg)](https://github.com/blackroad/lucidia-cognitive-system/actions)
[![codecov](https://codecov.io/gh/blackroad/lucidia-cognitive-system/branch/main/graph/badge.svg)](https://codecov.io/gh/blackroad/lucidia-cognitive-system)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=blackroad_lucidia-cognitive-system&metric=security_rating)](https://sonarcloud.io/dashboard?id=blackroad_lucidia-cognitive-system)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-supported-blue.svg)](https://www.docker.com/)

> Research-grade recursive symbolic AI with contradiction harmonics (FFT stabilization), multi-valued logic, and emergent Strange Loop identities.

> ⚠️ **Badges note:** Codecov/Sonar badges light up after you enable those services and set the correct slugs.

## 🌟 Overview

Lucidia implements recursive symbolic AI via:

- **Multi-valued Logic**: Trinary (qutrit) + 42-state (qudit) logic
- **Contradiction Harmonics**: FFT resonance stabilizes oppositions
- **Strange Loop Identity**: Self-reference stabilized across cycles
- **Six Agents**: Curator, Analyzer, Enhanced Planner, Bridge, Identity Keeper, Explainer
- **Event-driven**: Real-time flows + WebSocket support
- **Production infra**: Docker, Compose v2, NGINX-ready, monitoring hooks

## 🚀 Quick Start

### Prereqs
- Node.js ≥ 18
- Docker + Docker Compose (v2)
- Git

### Local Dev

```bash
git clone https://github.com/blackroad/lucidia-cognitive-system.git
cd lucidia-cognitive-system
cp .env.example .env
npm install || true  # optional if you have dependencies
npm run dev || npm start

Quick Demo

ESM (repo uses "type":"module"):

// Quick Demo (ESM)
import { LucidiaSystem } from './src/comprehensive-lucidia-system.js';

const system = new LucidiaSystem({ monitoring: { enabled: true, interval: 5000 } });
const explanation = await system.processQuestion('What is the nature of consciousness and recursive identity?');
console.log(explanation.summary);

CJS-safe (works regardless of package type):

// Quick Demo (CJS-safe)
(async () => {
  const { LucidiaSystem } = await import('./src/comprehensive-lucidia-system.js');
  const system = new LucidiaSystem({ monitoring: { enabled: true, interval: 5000 } });
  const explanation = await system.processQuestion('What is the nature of consciousness and recursive identity?');
  console.log(explanation.summary);
})();

🏗️ Architecture

graph TB
    Q[Question Input] --> C[Curator Agent]
    C --> A[Analyzer Agent]
    A --> B[Bridge Agent]
    B --> P[Enhanced Planner]
    P --> I[Identity Keeper]
    P --> E[Explainer Agent]
    E --> R[Response Output]
    P -.-> FFT[FFT Harmonics]
    P -.-> ML[42-State Logic]
    P -.-> SL[Strange Loops]

AgentPurposeKey Features
CuratorData ingestion & validationCleanup, metrics, backpressure
AnalyzerContent analysis & enrichmentComplexity assessment, categorization
Enhanced PlannerMulti-valued reasoning42-state logic, contradiction harmonics
BridgeCross-instance sharingSync, conflict resolution
Identity KeeperPersistent identityCoherence tracking, stability metrics
ExplainerHuman-readable outputsContext-aware, confidence indicators

🔍 Health & Readiness
•GET /healthz → {"status":"ok"}
•GET /readyz → Redis/Mongo/Postgres checks

curl -s http://localhost:8000/healthz
curl -s http://localhost:8000/readyz

🧮 Multi-Valued Logic (sketch)
•Qutrits: |−1⟩, |0⟩, |+1⟩ (neg/neutral/pos)
•Qudits (42-level): discrete emotional gradient mapped to planner resonance space
•See docs/logic.md for operator definitions and examples.

📈 Reproducible Benchmarks (Targets until measured)

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

Additional operational docs live in the [`docs/`](docs) folder.
# 🧠 Lucidia Cognitive System

[![CI/CD Pipeline](https://github.com/blackroad/lucidia-cognitive-system/workflows/Lucidia%20Cognitive%20System%20CI/CD/badge.svg)](https://github.com/blackroad/lucidia-cognitive-system/actions)
[![codecov](https://codecov.io/gh/blackroad/lucidia-cognitive-system/branch/main/graph/badge.svg)](https://codecov.io/gh/blackroad/lucidia-cognitive-system)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=blackroad_lucidia-cognitive-system&metric=security_rating)](https://sonarcloud.io/dashboard?id=blackroad_lucidia-cognitive-system)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-supported-blue.svg)](https://www.docker.com/)

> Research-grade recursive symbolic AI with contradiction harmonics (FFT stabilization), multi-valued logic, and emergent Strange Loop identities.

> ⚠️ **Badges note:** Codecov/Sonar badges light up after you enable those services and set the correct slugs.

## 🌟 Overview

Lucidia implements recursive symbolic AI via:

- **Multi-valued Logic**: Trinary (qutrit) + 42-state (qudit) logic
- **Contradiction Harmonics**: FFT resonance stabilizes oppositions
- **Strange Loop Identity**: Self-reference stabilized across cycles
- **Six Agents**: Curator, Analyzer, Enhanced Planner, Bridge, Identity Keeper, Explainer
- **Event-driven**: Real-time flows + WebSocket support
- **Production infra**: Docker, Compose v2, NGINX-ready, monitoring hooks

## 🚀 Quick Start

### Prereqs
- Node.js ≥ 18
- Docker + Docker Compose (v2)
- Git

### Local Dev

```bash
git clone https://github.com/blackroad/lucidia-cognitive-system.git
cd lucidia-cognitive-system
cp .env.example .env
npm install || true  # optional if you have dependencies
npm run dev || npm start
```

Quick Demo

ESM (repo uses "type":"module"):

```javascript
// Quick Demo (ESM)
import { LucidiaSystem } from './src/comprehensive-lucidia-system.js';

const system = new LucidiaSystem({ monitoring: { enabled: true, interval: 5000 } });
const explanation = await system.processQuestion('What is the nature of consciousness and recursive identity?');
console.log(explanation.summary);
```

CJS-safe (works regardless of package type):

```javascript
// Quick Demo (CJS-safe)
(async () => {
  const { LucidiaSystem } = await import('./src/comprehensive-lucidia-system.js');
  const system = new LucidiaSystem({ monitoring: { enabled: true, interval: 5000 } });
  const explanation = await system.processQuestion('What is the nature of consciousness and recursive identity?');
  console.log(explanation.summary);
})();
```

🏗️ Architecture

graph TB
    Q[Question Input] --> C[Curator Agent]
    C --> A[Analyzer Agent]
    A --> B[Bridge Agent]
    B --> P[Enhanced Planner]
    P --> I[Identity Keeper]
    P --> E[Explainer Agent]
    E --> R[Response Output]
    P -.-> FFT[FFT Harmonics]
    P -.-> ML[42-State Logic]
    P -.-> SL[Strange Loops]

| Agent | Purpose | Key Features |
|---|---|---|
| Curator | Data ingestion & validation | Cleanup, metrics, backpressure |
| Analyzer | Content analysis & enrichment | Complexity assessment, categorization |
| Enhanced Planner | Multi-valued reasoning | 42-state logic, contradiction harmonics |
| Bridge | Cross-instance sharing | Sync, conflict resolution |
| Identity Keeper | Persistent identity | Coherence tracking, stability metrics |
| Explainer | Human-readable outputs | Context-aware, confidence indicators |

🔍 Health & Readiness
• GET /healthz → {"status":"ok"}
• GET /readyz → Redis/Mongo/Postgres checks

```bash
curl -s http://localhost:8000/healthz
curl -s http://localhost:8000/readyz
```

🧮 Multi-Valued Logic (sketch)
• Qutrits: |−1⟩, |0⟩, |+1⟩ (neg/neutral/pos)
• Qudits (42-level): discrete emotional gradient mapped to planner resonance space
• See docs/logic.md for operator definitions and examples.

📈 Reproducible Benchmarks (Targets until measured)

Numbers are treated as targets until CI publishes artifacts.

# API running on :8000 (start your app first)

# Reasoning micro-benchmark (writes JSON)
npm run bench:reason

# HTTP throughput (adjust path to your reason endpoint)
npx autocannon -d 30 -c 50 http://localhost:8000/api/v1/reason > ./benchmarks/http.txt

Artifacts:
• ./benchmarks/latest.json – latency/depth/coherence metrics
• ./benchmarks/http.txt – RPS & latency distribution

🛠️ Configuration

Copy and edit:

```bash
cp .env.example .env
```

Key variables:
• PORT=8000
• REDIS_URL, MONGO_URL, POSTGRES_URL
• JWT_SECRET, ENCRYPTION_KEY

🐳 Docker (Compose v2)

```bash
docker compose up -d --build
docker compose up -d --scale lucidia-blackroad=3
docker compose logs -f --tail=100 lucidia-blackroad
```

📂 Project Structure

```
Numbers are treated as targets until CI publishes artifacts.

# API running on :8000 (start your app first)

# Reasoning micro-benchmark (writes JSON)
npm run bench:reason

# HTTP throughput (adjust path to your reason endpoint)
npx autocannon -d 30 -c 50 http://localhost:8000/api/v1/reason > ./benchmarks/http.txt

Artifacts:
•./benchmarks/latest.json – latency/depth/coherence metrics
•./benchmarks/http.txt – RPS & latency distribution

🛠️ Configuration

Copy and edit:

cp .env.example .env

Key variables:
•PORT=8000
•REDIS_URL, MONGO_URL, POSTGRES_URL
•JWT_SECRET, ENCRYPTION_KEY

🐳 Docker (Compose v2)

docker compose up -d --build
docker compose up -d --scale lucidia-blackroad=3
docker compose logs -f --tail=100 lucidia-blackroad

📂 Project Structure

lucidia-cognitive-system/
├── src/                         # Core system (agents, planner, etc.)
├── scripts/
│   ├── healthcheck.js
│   └── benchmarks/
│       └── reasoning.js
├── docs/
│   └── logic.md
├── benchmarks/                  # Generated benchmark outputs
├── Dockerfile
├── docker-compose.yml
└── README.md
```

🪪 License

```ts
import { recordConversion } from '@/lib/convert'
recordConversion('portal_open')
recordConversion('signup_success', 1, { plan: 'pro' })
```
## Bot Commands (ChatOps)
- `/deploy blackroad <channel> [provider]` — deploy canary/beta/prod
- `/rollback blackroad <channel> [steps] [provider]` — revert to earlier build
- `/blog new "Title"` — scaffold blog post PR
- `/promote prod` — open staging→prod PR
- `/toggle <flag> on|off` — set feature flags in `.github/feature-flags.yml`
- `/install all` — run universal installer
- `/fix <freeform prompt>` — dispatch AI Fix with your prompt

## Agents Overview
- **Auto-Heal**: reacts to failing workflows and dispatches **AI Fix**.
- **AI Fix**: runs Codex/LLM prompts, formats, builds, opens PRs.
- **AI Sweeper**: nightly formatter/linter; opens PR if needed.
- **Labeler/Stale/Lock**: repo hygiene.
- **Auto-merge**: merges labeled PRs when checks pass.
- **CodeQL/Snyk/Scorecard**: security analysis.
Kernel modules in this repository are dual licensed under MIT/GPLv2. Proprietary NVIDIA userspace components are **not** distributed here.
## ChatOps — Talk to Agents
- `/ask <question>` — AI answers in-thread (OpenAI or Ollama).
- `/say <message>` — post to the public **Agent Inbox** at `/inbox`.

## Metrics
- CI history regenerated hourly → `/metrics/ci.json`
- Lighthouse scores appended daily and on main pushes → `/metrics/lh.json`
- View charts at **/metrics**.

🪪 License

MIT

## Ops Integrations

- **Slack**: add `SLACK_WEBHOOK_URL` secret → use `/slack message…` on any PR/Issue.
- **PagerDuty**: add `PD_ROUTING_KEY` → run the **PagerDuty Incident (manual)** workflow to trigger.
- **Uptime**: pings every 10m; opens/updates “🚨 Uptime … DOWN” issue on failure.
- **SBOM**: CycloneDX JSON artifact pushes on `main`.
- **Trivy**: scheduled file-system vulnerability scan.
- **Policy-as-code**: OPA checks for risky workflow/infra changes (see `policy/ci.rego`).
- **Devcontainer**: `Open in Dev Container` to get a ready-to-code Node 20 + Python toolchain.
- **Pre-commit**: optional local hooks (`pre-commit install`).
# Blackroad Prism Console

This project currently does not track a package manager lock file. Lock files ensure reproducible installs for everyone working on the project.

## Adding a lock file

1. Run `npm install` once (or `npm install --package-lock-only` if dependencies are already present).
2. Commit the generated `package-lock.json` to git: `git add package-lock.json && git commit -m "chore: add lock file"`.

After the lock file is committed, other contributors can install dependencies with `npm ci` for consistent installs.
