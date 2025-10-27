# Distributed Agent Sync Architecture

This document outlines how to keep every BlackRoad device—Raspberry Pi, laptop, or phone—in continuous alignment with the canonical `blackroad-prism-console` repository while giving each local agent enough autonomy to make decisions.

## Overview

1. **Source of truth**: `blackroad-prism-console` on GitHub remains the authoritative codebase.
2. **Device mirrors**: every device maintains a live clone of the repo.
3. **Coordinated agents**: local agents know when to pull, when to commit, and how to report status to the fleet.

## Continuous Sync Plumbing

There are three progressively sophisticated sync strategies. They can be mixed and matched by device class.

### Option A — Timed `git pull`

- Install a cron job or systemd timer that runs `git pull` on a fixed cadence (e.g. every 5 minutes).
- Configure device-specific author names/email (e.g. `Lucidia-Pi5`, `Athena-Laptop`) so commits from each node are clearly labeled.
- Combine with guarded `git push` hooks so accidental upstream pushes are reviewed.

### Option B — Event-driven Updates

- Register a GitHub webhook (or use the GitHub CLI) that fires on `push` or `workflow_run` events.
- A lightweight listener on each device receives the event and immediately runs `git fetch --prune` followed by `git pull --ff-only`.
- Useful for higher-trust devices that are online most of the time.

### Option C — GitOps Agents

- Install a GitOps watcher such as **Flux** or a trimmed-down **ArgoCD** profile.
- The agent keeps the working tree reconciled with the repo. Divergence triggers an automatic rollback.
- Ideal for mission-critical kiosks or wall displays that must self-heal without human intervention.

## Agent Autonomy Layer

Each device runs a local "BlackRoad Agent" process with a small identity payload, enabling orchestration logic.

### Identity Files

Create `agent.json` beside the repo on every device:

```json
{
  "id": "lucidia-pi5",
  "role": "display_node",
  "last_sync": "2025-10-27T09:42Z",
  "permissions": ["pull", "commit", "analyze"]
}
```

- The `role` key groups devices by duties (e.g. `display_node`, `ingest`, `ops-console`).
- `permissions` signal the orchestrator about what commands it can delegate.

### Registry & Heartbeats

- Every agent POSTs its identity to a central registry (GitHub issue, SQLite DB, or a simple API hosted by `Prism Orchestrator`).
- Agents include health metadata (current commit hash, uptime, pending jobs).
- The orchestrator aggregates the registry to provide fleet-wide visibility and detect stale nodes.

### Coordinated Actions

- The orchestrator can read the registry and schedule work (e.g. data refresh, screenshot capture) targeting specific roles or capabilities.
- Agents can publish status and logs back to a shared location (`data/agents/results.jsonl` per existing tooling).

## Observability Example

A thin HTTP shim on the orchestrator exposes the active fleet count:

```bash
curl https://blackroad.local/agents | jq '.count'
```

Backed by the registry, this allows dashboards or GitHub Actions to display how many agents are online and which commit they are tracking.

## Next Steps

1. Standardize the `agent.json` schema and commit an example to the repo for reference.
2. Decide which sync option applies to each device class and automate the installation scripts.
3. Wire the orchestrator to the registry feed and expose metrics (Prometheus scrape, Grafana panel, or Slack digest).

This layered approach keeps every device up to date while preserving enough autonomy for the agents to coordinate intelligent work.
