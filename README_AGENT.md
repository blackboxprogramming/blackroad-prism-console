# BlackRoad Agent Seed

The "BlackRoad agent" starts as a small, legible harness you can run on a Pi, a Jetson, or a laptop.
This first sketch is intentionally humble: no network calls, no mystery binaries, just the bones of
an agent that can grow into a trustworthy companion.

## Repository layout

```
agent/      <- runtime + config primitives for the core loop
plugins/    <- extension points the runtime can mount at startup
cli/        <- human-facing entry points for local experimentation
```

## What exists today

- A **dataclass-powered configuration layer** (`agent/config.py`) that describes the persona, plugin
  mounts, and workspace for the agent.
- A **minimal runtime** (`agent/runtime.py`) that boots plugins and routes messages through them in
  order.
- A **base plugin helper** (`plugins/base.py`) you can subclass to stitch in tools, models, and
  external services.
- A **tiny CLI** (`cli/agent.py`) that wires everything together and ships with an `EchoPlugin`
  placeholder so you can exercise the flow immediately.

## How to try it

```bash
python -m cli.agent "open the north road"
```

You should see the echo response from the placeholder plugin. Swap in your own plugin modules, or
point the runtime at a different config, and the same harness will orchestrate your custom stack.

## Next steps

1. Define a richer plugin contract that can stream tokens, schedule background work, and persist
   memories to local storage.
2. Build a filesystem-backed workspace manager that keeps agent artifacts neat and inspectable.
3. Introduce declarative personas so you can swap between "navigator", "builder", and "companion"
   profiles with a flag.
4. Wire in local/offline models (whisper, llama, vision) through plugins that you opt into at boot.

The guardrails stay simple: everything runs locally, every action is inspectable, and you own the
loop. This document evolves with each layer we add.
