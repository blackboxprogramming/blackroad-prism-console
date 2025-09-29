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
