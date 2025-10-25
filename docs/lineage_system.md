# Agent Creation & Lineage Framework

The Agent Creation & Lineage Framework enables any Codex operator to spawn new
agents from an existing lineage while keeping provenance and governance data in
sync. The system is intentionally lightweight so that it can run locally during
experimentation or be deployed behind an internal API gateway.

## Components

| Component | Purpose |
| --- | --- |
| `registry/lineage.json` | Canonical registry describing every agent, its parent, and Hugging Face URL. |
| `configs/agent_templates/config_template.yaml` | Template used to seed new agent configuration files. |
| `configs/agents/<agent>.yaml` | Realized agent configuration produced at spawn time. |
| `registry/agents/<agent>/README.md` | Human-facing summary of the agent. |
| `registry/agents/<agent>/MODEL_CARD.md` | Lightweight model card with licensing details. |
| `scripts/spawn_agent.py` | CLI and HTTP service that orchestrates agent creation. |
| `hf/push_template.py` | Helper for publishing agent assets to Hugging Face Spaces. |
| `ui/create_agent.html` | Minimal web form for triggering new agent creation. |

## Workflow

1. **Trigger**: Use the `Spawn Agent` UI button or execute the CLI.
2. **Template Duplication**: The CLI copies `config_template.yaml`, injects the
   requested metadata, and persists the resulting file under `configs/agents/`.
3. **Lineage Update**: The registry receives a new entry (UUID, name, parent,
   traits, timestamps, and URLs).
4. **Artifacts**: README and model card documents are generated in
   `registry/agents/<agent>/`.
5. **Publishing**: When a Hugging Face token is provided, the helper pushes the
   generated files into a new Space namespace.
6. **Confirmation**: The CLI and HTTP service return a JSON payload with
   everything needed to reference or further automate the new agent.

## Governance Guards

- **Open Models Only**: The template enforces Apache 2.0 licensing by default.
- **Audit Trail**: Every spawn event emits a timestamped entry in the registry.
- **Opt-In Publishing**: Hugging Face pushes require an explicit token and can be
  disabled with `--skip-publish` or the `publish: false` API flag.
- **Dry Runs**: Operators can simulate agent creation (`--dry-run`) to inspect
  output without mutating the registry.
- **HTTP Gateway**: The bundled HTTP handler exposes `/spawn_agent` for
  automation, returning structured errors and CORS headers for UI integrations.

## Example CLI Usage

```bash
python scripts/spawn_agent.py \
  --name "Ariadne" \
  --base-model "qwen2-7b" \
  --description "Navigator for labyrinthine research threads." \
  --domain "navigation" \
  --temperament "curious" \
  --traits guidance threads mapping \
  --parent Lucidia
```

Add `--skip-publish` to avoid pushing to Hugging Face or `--dry-run` to preview
output. To serve the HTTP endpoint locally run `python scripts/spawn_agent.py --serve`.
