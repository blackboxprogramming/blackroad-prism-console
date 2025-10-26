# Collaboration Presence Bus

This service provides a lightweight Socket.IO fabric for real-time collaboration
signals across BlackRoad tooling. It exposes:

- `/collab/socket.io` – websocket gateway for presence/focus/help/voice events
- `/collab/status` – JSON snapshot of online agents, focus history, review queue
- `/collab/status.md` – markdown export used to publish `COLLABORATION_STATUS.md`

The service persists state in `var/collab_bus.sqlite` by default. Override the
`COLLAB_DB_PATH` environment variable to supply a custom location or point at a
Redis-backed filesystem mount.

## Running locally

```bash
uvicorn services.collab_bus.server:app --host 0.0.0.0 --port 9000
```

## Clients

- `services/collab_bus/client.py` – Python helper for agents and scripts
- `services/collab_bus/working_copy_hook.py` – Working Copy automation entrypoint
- `tools/collab_presence/vscode-extension` – VS Code extension for editor focus

Events from GitHub webhooks automatically flow into the bus so automated agents
appear alongside humans during reviews.
