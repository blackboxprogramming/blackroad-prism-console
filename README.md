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

🪪 License

MIT
