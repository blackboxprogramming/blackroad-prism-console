# Agent Lineage UI & API Specification

This document captures the implemented surface for the Agent Lineage Framework. It
covers backend endpoints, the Hugging Face automation hook, and the new console UI
flows.

## REST API

The FastAPI service in `api/agents.py` exposes the following endpoints under
`/api/agents`:

| Method & Path | Description |
| --- | --- |
| `POST /spawn` | Validate payload, create registry entry, materialise an agent configuration file, enqueue Hugging Face publish, append audit log, and return the new `agent_id` with the predicted Hugging Face Space URL. |
| `GET /` | Convenience listing that returns `{ "agents": [...] }` for existing integrations. |
| `GET /registry` | Returns the entire registry payload from `registry/lineage.json`. |
| `GET /{id}` | Fetches details for a single agent. |
| `PATCH /{id}` | Updates `description`, `domain`, or `status` for an agent and rewrites the generated YAML config. |
| `POST /{id}/revert` | Removes the agent from the registry, deletes the generated config file, and records a revert event. |

### Persistence & Automation

* **Registry:** `registry/lineage.json` holds the authoritative list of agents.
* **Config template:** Each spawn copies `configs/agent_template.yaml` into
  `configs/agents/<agent_id>.yaml` with substituted metadata.
* **Audit log:** Every mutating action appends a line to `logs/agent_actions.log`.
* **Hugging Face:** Background tasks call `scripts/hf_publish.publish_to_huggingface`
  which attempts to create/update a Space (or exports a local artifact fallback).

Rate limiting enforces three `POST /spawn` calls per actor (header `x-agent-actor`
or client IP) per rolling hour.

## Frontend Console

The React page `frontend/src/pages/AgentLineage.jsx` registers a new `/agents`
route in the Prism Console. The page provides:

* **Spawn Button & Form:** Opens an inline form with validation for name, base
  model, domain, description, and optional parent selection sourced from the
  current registry.
* **Agent List:** Data grid backed by `GET /api/agents/registry` with columns for
  lineage metadata, Hugging Face link, and status chips.
* **Actions:** Buttons to view details (inline expand), pause/archive via
  `PATCH /{id}`, and revert via `POST /{id}/revert`.
* **Inline Editing:** Expanded rows allow editing description/domain with a save
  button that persists through the API.
* **Status Toasts:** Success and error feedback uses `frontend/src/components/StatusToast.jsx`.

## Automation Script

`scripts/hf_publish.py` exposes `publish_to_huggingface` and `DEFAULT_NAMESPACE`.
It generates a model card, attempts to push metadata via `huggingface_hub`, and
always writes a local mirror under `registry/huggingface/` for auditability.

## Execution

Run the FastAPI surface with:

```bash
uvicorn api.agents:app --reload
```

The Vite dev server automatically picks up the `/agents` route once the backend is
available at `VITE_API_BASE` (defaults to same origin).
