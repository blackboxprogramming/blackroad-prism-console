# BlackRoad Native AI Stack Roadmap

## Vision Recap

BlackRoad is evolving from "Pi with helper scripts" into a unified edge stack that ships with:

- **Local intelligence**: Pi + Jetson hosts run inference without external calls by default.
- **Hardware awareness**: Agents inspect temps, power, GPIO, storage and can coordinate Jetson/Pi hand-offs.
- **Remote flashing**: Devices accept new OS images or config bundles over the air.
- **Git-style sync**: Configs, weights, jobs flow like repos between remotes.

The bootstrap script at `scripts/blackroad/bootstrap_agent.sh` lays down the first pillar: a resilient telemetry agent with a slot for the local AI runtime.

## Remote Flash Pipeline First

The next build sequence should focus on remote flashing before bundling model runtimes.

1. **Reasoning**
   - Remote flashing unblocks every other iteration loop: once devices can re-image themselves, we can safely ship heavier model builds later without SD card swaps.
   - OTA upgrades reduce the risk of bricking: the agent can snapshot health and roll back if a flashing job fails.
   - Packaging llama.cpp or Whisper later becomes a pure software update pushed via the same pipeline.

2. **Milestones**
   - [ ] Author `blackroad-flasher` service: exposes `flash <image>` and `apply-update <bundle>` endpoints guarded by signed manifests.
   - [ ] Extend the agent loop with a flashing job queue plus health gates (temps, power, storage headroom).
   - [ ] Build a `blackroad push` CLI that wraps `git bundle` and image artifact upload.
   - [ ] Implement staged boot: download → verify SHA/signature → write to spare partition or drive → flip boot variables.
   - [ ] Record flash telemetry to `/var/log/blackroad-flasher.log` and stream summaries back to the control plane.

3. **Prereq Tasks**
   - Document partition layout and PARTUUID strategy for Pi SD plus Jetson NVMe.
   - Reserve a recovery channel (USB gadget, UART, or watchdog) for last-resort rollback.
   - Harden SSH mutual auth so that only signed control-plane pushes can request a flash.

## Follow-On: Bundled Model Runtime

With the flashing lane ready:

- Build a `blackroad-ai` bundle containing llama.cpp binaries plus curated GGUF models.
- Teach the agent to hot-reload models after verifying quantization and checksum.
- Provide upgrade hooks for quick retraining on-device (Jetson GPU path, Pi CPU-only fallback).

This order keeps the platform resilient while we layer richer AI capabilities.

## Native LLM Runtime Architecture

Once remote flashing is reliable, we can lean into the "native first" mandate and
ship a turnkey LLM service that runs fully on-device. The goal is to keep the
conversation loop, tool calls, and agent memory local while still allowing
optional federation back to the control plane when operators opt in.

### Service Layout

- **Inference daemon** – bundle both llama.cpp (CPU) and TensorRT-LLM (Jetson GPU)
  backends behind a common OpenAI-compatible gateway. Ship default configs for
  `lucidia-1.4b-q4` (Pi-grade) and `lucidia-7b-q6` (Jetson-grade) models.
- **Conversation router** – extend `srv/blackroad/app.py` so the Web UI, CLI, and
  Discord adapters select the backend automatically based on device class,
  desired latency, and thermal headroom.
- **Local skill bus** – embed a tiny tool executor that can call GPIO toggles,
  health probes, or runbooks without leaving the box. Guard with a signed policy
  so only approved skills are exposed.

### Memory & Retrieval

- Ship a lightweight vector store (Chroma or sqlite-vec) indexed over the
  device's knowledge packs. Default packs include the device manual, site playbook,
  and the most recent OTA changelog.
- Keep rolling conversation transcripts and tool outcomes in a local sqlite db;
  expose a `blackroad-memory export` command that creates encrypted bundles for
  operators who opt to sync back to HQ.
- Provide adapters for optional remote retrieval (control plane RAG) but ensure
  the default path never attempts WAN calls.

### Observability

- Integrate per-request metrics (latency, tokens/sec, GPU/CPU utilization) into
  the existing `metrics_portal` schema.
- Emit structured traces for each tool invocation so operators can audit
  on-device autonomy. Store last 24 hours locally and include in support bundles.
- Extend watchdog scripts to restart the LLM daemon if health checks fail and to
  capture crash dumps for offline debugging.

### Rollout Checklist

- [ ] Package GGUF weights plus runtime binaries into the `blackroad-ai` bundle
      with per-device manifests.
- [ ] Build smoke tests that exercise chat, tool invocation, and retrieval on Pi
      and Jetson reference hardware.
- [ ] Wire the CI pipeline so that new model drops trigger regression runs
      against the agent integration harness before publishing OTA updates.
- [ ] Document operator runbooks for swapping models, expanding storage, and
      performing privacy reviews prior to enabling remote sync.
