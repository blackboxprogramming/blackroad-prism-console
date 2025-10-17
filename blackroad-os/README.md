# BlackRoad OS Agent

BlackRoad OS is a local-first automation agent that turns commodity edge devices into a cooperative compute fabric. The repository starts with a small but opinionated skeleton focused on:

- **A long-running daemon** that manages lifecycle, telemetry, and job scheduling on a single node.
- **A plugin model** for integrating hardware capabilities and system actions without modifying the core.
- **Local AI runtimes** that expose uniform interfaces for CPU- or GPU-backed inference engines.
- **Cluster-aware transport** so agents can discover peers and coordinate work.
- **Declarative manifests** describing available actions and capabilities.

This first commit establishes the project structure, configuration story, and extension surfaces so we can build the remaining functionality incrementally.

## Getting started

```bash
# Install in a virtual environment
pip install -e .

# Start the agent with the default configuration
blackroad-agent run --config config/default.yaml
```

The default configuration loads a handful of illustrative plugins that exercise the key subsystems without requiring actual hardware. Replace them gradually with production implementations as we add support for more boards and peripherals.

## Layout

- `src/blackroad_agent/agent.py` – Core agent service with lifecycle hooks, plugin registry, and task dispatcher.
- `src/blackroad_agent/config.py` – Typed configuration models and loaders.
- `src/blackroad_agent/plugins/` – Built-in plugin examples for telemetry, flashing, and local model runtimes.
- `src/blackroad_agent/runtime/` – Abstractions for inference backends (CPU via llama.cpp, GPU via TensorRT, etc.).
- `src/blackroad_agent/transport/` – Peer discovery and RPC transports (HTTP and MQTT stubs today).
- `manifests/actions.yaml` – Declarative catalog of actions surfaced through the agent API.
- `config/default.yaml` – Minimal configuration file that wires the example plugins together.
- `docs/architecture.md` – High-level description of the agent process, component boundaries, and roadmap.
- `tests/` – Seed test suite for configuration loading and plugin discovery.

## Roadmap

1. Replace stub plugins with hardware-specific implementations (Pi boot control, Jetson provisioning, etc.).
2. Flesh out the transport layer with gossip-style discovery and secure command dispatch.
3. Integrate concrete model runtimes and expose capability negotiation across the cluster.
4. Ship a Web UI alongside the CLI to inspect nodes, queue jobs, and stream telemetry.

Welcome to the first commit of BlackRoad OS — let’s build the ecosystem together.
