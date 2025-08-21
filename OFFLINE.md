# Offline Bootstrap

This document describes how to prepare the Lucidia stack for air‑gapped operation.

1. Preload container images and models using `bootstrap-offline.sh`.
2. Start the stack with `docker compose -f deploy/docker-compose.yml up -d`.
3. Verify chat and embedding requests succeed via the local Ollama service at `http://localhost:11434`.
