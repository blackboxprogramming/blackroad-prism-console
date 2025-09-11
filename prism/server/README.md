# Prism Server

This server exposes several endpoints:

- `POST /intel/diff` – returns diff intelligence including summaries and predicted tests.
- `GET /graph` – returns collected resource graph nodes and edges.
- `POST /graph/event` – ingest an event (used in tests).
- `POST /graph/rebuild` – rebuild graph (no-op for now).
- `GET /mode` / `PUT /mode` – query or change current policy mode.
- `POST /diffs/apply` – apply a diff subject to policy guardrails.
- `POST /run` – run commands subject to policy guardrails.

Diff intelligence uses simple heuristics to extract changed symbols and map nearby test files.

Policy modes available: playground, dev, trusted, prod. Each mode defines capability decisions for write and exec operations.

## Tests

Run unit tests:

```bash
pnpm -C prism/server test
```
