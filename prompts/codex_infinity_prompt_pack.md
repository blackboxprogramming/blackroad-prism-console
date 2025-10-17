# Codex Infinity Prompt Pack

## Overview

This pack contains pre-rendered "infinity" prompts for key BlackRoad edge nodes alongside a monorepo scaffold starter. Each prompt captures the agent goal, constraints, and I/O wiring so they can be dropped directly into a code-generation workflow.

## Included Prompts

- **Jetson agent** – `JETSON_AGENT_PROMPT.md`
- **Pi-Holo renderer** – `PI_HOLO_PROMPT.md`
- **Pi-Ops dashboard** – `PI_OPS_PROMPT.md`
- **Pi Zero display** – `PI_ZERO_PROMPT.md`
- **Arduino sensor bridge** – `ARDUINO_UNO_PROMPT.md`
- **General monorepo scaffold** – `GENERAL_REPO_SCAFFOLD_PROMPT.md`

Each prompt lives in the `downloads/` bundle delivered with this repository snapshot. They are copy-ready for downstream code-generation systems.

## Custom Rendering

To customize a prompt on demand, run the `render.py` helper from the `codex_infinity_prompts` pack:

```bash
cd /mnt/data/codex_infinity_prompts
python3 render.py pi_ops \
  --project ops \
  --node pi_ops \
  --lang python \
  --goal "Web dashboard at 1600x600 with MQTT + SQLite ring buffer" \
  --io "{input: system/heartbeat/*, agent/output; output: web ui}" \
  --constraints "- RAM < 100MB\n- Mosquitto localhost\n- systemd unit included" \
  --out out/PI_OPS_PROMPT_custom.md
```

Adjust the `--project`, `--node`, and goal-specific flags to target a different service. The renderer will emit a tailored Markdown prompt to the specified `--out` path, ready for ingestion by your preferred codegen agent.
