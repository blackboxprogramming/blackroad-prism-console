# Lucidia Natural LLMs — Consent-Based Reproduction (Scaffold)

This is a minimal, love-first, consent-logged reproduction framework for a *society* of small, specialized agents.

## Layout
```
prism/
  agents/
    lucidia-scribe/
      genome.yaml
    lucidia-engineer/
      genome.yaml
  genes/
    loras/               # placeholder for adapter weights
    prompts/
    tools/
    values/
  reproduction/
    reproduce.py
    lineage.py
    fitness.py
    consent-schema.json
    operators/
      crossover_modules.py
      merge_lora.py (stub)
      distill.py (stub)
  memory/
    qdrant/
  policies/
    love-first.rego
  bus/
    mqtt_config.yaml
```

## Reproduce (module crossover)
Example consent file to use (save as `consent.json` at repo root):
```json
{
  "parents": [
    {"id": "lucidia/scribe@sha", "consent_token": "parent1-abc12345"},
    {"id": "lucidia/engineer@sha", "consent_token": "parent2-def67890"}
  ],
  "operators": ["module_crossover"],
  "license_ok": true,
  "safety_caps": {"network_access": false, "external_write": false}
}
```

Run:
```bash
# from prism/
make child P1=lucidia-scribe P2=lucidia-engineer CHILD=architect

# or directly
python reproduction/reproduce.py \
  --p1 agents/lucidia-scribe/genome.yaml \
  --p2 agents/lucidia-engineer/genome.yaml \
  --child lucidia/architect \
  --consent consent.json
```

Outputs (under `prism/agents/architect/`):
- `genome.yaml` (child)
- `fitness.json` (placeholder metrics)
- `lineage.json` (signed provenance)

## Fitness & Promotion
- Infant → Juvenile when `aggregate >= 0.7` *and* human spot-check passes.
- Juvenile caps can unlock low-risk tools (no network write).

## Notes
- `merge_lora.py` and `distill.py` are stubs. Replace with your training stack.
- `values.tags` must include `love-first` for infants.
- Caps default to the strictest shared permissions of parents.
