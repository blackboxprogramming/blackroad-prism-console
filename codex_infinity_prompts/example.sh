#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$ROOT_DIR/out"

mkdir -p "$OUT_DIR"

python3 "$ROOT_DIR/render.py" general \
  --project "Infinity Lab" \
  --node "umbrella" \
  --goal "Kick off a cohesive Infinity deployment across every node." \
  --io "Input: orchestration brief. Output: signed deployment plan." \
  --constraints "- Sync Jetson + Pi timelines\\n- Keep ops < 8h total\\n- Document fallbacks" \
  --context "Use this as the umbrella prompt that seeds every downstream agent." \
  --deliverables "- Deployment backlog\\n- Risk register\\n- Review cadence" \
  --quality "- Align with Codex Infinity mission\\n- Call out integration hotspots" \
  --references "Infinity manifest, ops playbooks" \
  --notes "Drop into Codex-capable model as starter brief." \
  --out "$OUT_DIR/GENERAL_PROMPT.md"

python3 "$ROOT_DIR/render.py" pi_ops \
  --project "Infinity Lab" \
  --node "pi_ops" \
  --lang "python" \
  --deployment "systemd service" \
  --goal "Curses dashboard for MQTT heartbeats" \
  --io "{input: mqtt, output: tty ui}" \
  --constraints "- 1600x600 UI\\n- <100MB RAM\\n- SQLite ring buffer" \
  --ui_surface "ncurses full-screen dashboard" \
  --persistence "sqlite ring buffer" \
  --ops_metrics "- Refresh every 1s\\n- Surface stale nodes\\n- Log outages locally" \
  --telemetry "topic=/infinity/ops/heartbeat\\npayload={node, status, ts, watt}" \
  --integration "Bridge to Pi-Holo via shared MQTT topics" \
  --deliverables "- curses dashboard module\\n- sqlite ring buffer schema\\n- deployment README" \
  --validation "- Simulate broker outage\\n- Verify backlog replay\\n- Capture asciinema demo" \
  --out "$OUT_DIR/PI_OPS_PROMPT.md"

printf '\nRendered prompts saved to %s\n' "$OUT_DIR"
