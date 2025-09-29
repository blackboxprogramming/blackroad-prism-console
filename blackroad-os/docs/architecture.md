# BlackRoad Agent Architecture

BlackRoad OS agents are designed as small, composable daemons that can run on a Raspberry Pi, Jetson, or any other Linux-capable edge board. This document maps the core components that ship with the skeleton repository and outlines the next milestones.

## Core loop

1. **Configuration load** – Parse YAML configuration into typed settings. Merge with environment overrides and ensure directories exist.
2. **Manifest discovery** – Load the action catalog and make it available to transports and plugins.
3. **Plugin bootstrap** – Dynamically import plugin modules, instantiate them with the agent context, and call `start()`.
4. **Transport bring-up** – Bring up HTTP/MQTT endpoints so peers or operators can issue commands.
5. **Task dispatch** – Accept action requests, look up the owning plugin, and execute asynchronously.
6. **Graceful shutdown** – Stop transports, flush telemetry, and call `stop()` on each plugin.

## Plugin surfaces

Plugins encapsulate specialized behavior such as flashing firmware, monitoring sensors, or exposing accelerator runtimes. Each plugin receives:

- A reference to the agent context (configuration, logger, task runner).
- A copy of its manifest entry including default options.
- Structured lifecycle hooks (`configure`, `start`, `execute`, `stop`).

The skeleton repository includes three illustrative plugins:

- `telemetry` – Emits synthetic CPU, memory, and temperature metrics.
- `flasher` – Pretends to flash disk images to block devices while validating arguments.
- `model_runtime` – Routes inference requests to a backend implementation.

## Runtime abstraction

Inference backends share a common interface (`RuntimeBackend`) with a `run()` coroutine that returns structured results. Implementations can wrap llama.cpp binaries, ONNX runtimes, TensorRT engines, or cloud failovers while keeping the agent contract stable.

## Transport strategy

Two transport stubs demonstrate how the agent can be reached:

- **HTTP** – Provides REST-style endpoints for health checks and action invocation.
- **MQTT** – Subscribes to command topics and publishes telemetry to cluster peers.

The transports share a lightweight `Transport` base class so we can add SSH command bridges or peer-to-peer overlays later.

## Roadmap checkpoints

- [ ] Replace stub telemetry with psutil-based collectors and board-specific sensors.
- [ ] Integrate real flashing tools (Raspberry Pi Imager CLI, Jetson flash utilities).
- [ ] Implement gossip discovery and signed command channel.
- [ ] Package llama.cpp and TensorRT runtimes with download/build automation.
- [ ] Provide systemd unit files and container images for turnkey deployment.
