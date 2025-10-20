# Docker Build Debugging Quickstart

VS Code now understands BuildKit's new debugging hooks. This repo includes a
sample Dockerfile and a matching launch configuration so you can try it out
immediately.

## Prerequisites

- VS Code with the **Docker DX** extension (v2.0 or later).
- Docker Desktop 4.31+ with Buildx 0.29 or newer (`docker buildx version`).
- Experimental build debugging enabled by invoking builds with `--debug`.

## Files added for you

- `.vscode/launch.json` — Adds **Docker Build: sites/blackroad (BuildKit debug)**.
  Launch this configuration to attach VS Code to the next BuildKit session.
- `docker/Dockerfile.build-debug` — Minimal multi-stage build that compiles the
  marketing site (`sites/blackroad`) and serves it with Caddy. Each stage is
  separated so you can pause, inspect environment variables, or open a shell in
  the active layer.

## Running the debug build

1. From the repo root run the build in debug mode:
   ```bash
   docker build --debug -f docker/Dockerfile.build-debug .
   ```
2. In VS Code open **Run & Debug → Docker Build: sites/blackroad (BuildKit debug)**
   and press **Start**. VS Code will attach to the live BuildKit session.
3. Step through instructions, inspect the filesystem after each layer, or open a
   shell when prompted by the Docker extension.

Because the Dockerfile is grounded in the actual BlackRoad site, any issues you
find while debugging map directly to production assets.
