# BlackRoad Prism Console - AI Coding Agent Guide

## Architecture Overview

BlackRoad Prism Console is a **deterministic, file-backed system** for PLM (Product Lifecycle Management), manufacturing operations, treasury, and enterprise automation. The system uses **bot orchestration** with strict guardrails and performance SLOs.

### Core Stack
- **Backend**: Python CLI (`brc` command) with Typer + file-based storage
- **Frontend**: Next.js/React apps in `/apps/*` and `/sites/*`
- **API**: Express.js server at `srv/blackroad-api/server_full.js` (port 4000)
- **Database**: SQLite + file artifacts in `/artifacts/*`
- **Deployment**: Docker Compose + K8s, with chat-driven pipeline tools

### Key Patterns

**Bot Architecture**: All business logic lives in `/bots/*` extending `BaseBot`. Each bot has strict:
- Mission statement with INPUTS/OUTPUTS/KPIS/GUARDRAILS/HANDOFFS
- Performance SLOs (`orchestrator/slo.py`)
- Red team validation in `orchestrator.py`

**CLI-First Design**: The `brc` command (`cli/console.py`) is the primary interface:
```bash
brc task:create --goal "Build 13-week cash view"
brc task:route --id T0001 --bot "Treasury-BOT"
brc plm:bom:explode --item PROD-100 --rev A --level 3
```

**File-Based Storage**: No external databases - everything persists to `/artifacts/*` as JSON/CSV for deterministic behavior.

## Development Workflows

### Adding New Bots
1. Create `bots/my_bot.py` extending `BaseBot`
2. Include complete docstring with MISSION/INPUTS/OUTPUTS/KPIS/GUARDRAILS/HANDOFFS
3. Register in `bots/__init__.py` auto-discovery
4. Add SLO targets in `orchestrator/slo.py`

### Testing Strategy
- `pytest -q` for unit tests
- `make demo` for full PLM/MFG workflow validation
- Determinism checks: artifacts must hash identically across runs
- Contract validation via JSON schemas in `scripts/validate_contracts.py`

### Chat-Driven Deployment
Use natural language deployment commands:
```bash
python scripts/blackroad_sync.py "Push latest to BlackRoad.io"
bin/blackroad-sync refresh
```

## Project-Specific Conventions

**Naming**: Services use hyphenated names (`blackroad-api`), bots use PascalCase with -BOT suffix (`Treasury-BOT`)

**Port Allocation**:
- 3000: Next.js frontend
- 4000: Express API
- 8000: LLM stub service

**Environment Variables**: All sensitive config via `.env` files, never hardcoded

**Codacy Integration**: After ANY file edit, you MUST run `codacy_cli_analyze` for quality gates

## Key Integration Points

**Task Orchestration**: Tasks flow through `Task` → `Bot` → `BotResponse` with perf tracking and red team validation

**Multi-Language**: Python CLI + Node.js services communicate via file artifacts, not APIs

**Docker/DevContainers**: Use `.devcontainer/devcontainer.json` for consistent dev environments with Node 20, Go 1.22, Terraform

**GitHub Actions**: Extensive automation with ~200 workflows covering security, deployment, ChatOps, and quality gates

## Critical Commands
```bash
# Core development
make setup && make test && make lint
brc bot:list  # See available bots
make demo     # Full system validation

# Deployment
make build && make deploy PR=123
docker compose up --build app

# Quality gates
python scripts/validate_contracts.py
bash scripts/hash_artifacts.sh
```

**Security Note**: This system emphasizes deterministic, offline-first operation with no external API dependencies in core business logic.