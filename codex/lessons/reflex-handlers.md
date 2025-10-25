---
title: Reflex Handlers & Memory Deltas
when: 2025-03-12
---

## Reflex Topics

* `observations.*` – Roadie health signals, Guardian contradictions, Codex observations.
* `intents.*` – future hook for planning intents; reserve namespace now for autonomy.
* `actions.*` – Roadie ledger updates, orchestrated tasks, Codex journaling triggers.
* `guardian.*` – contradictions in, policy updates + audits out; never bypass.
* `codex.*` – journaling + teaching card commitments.
* `memory.*` – deltas, snapshots, resets.

## Handler Guidelines

1. **Emit canonical events** using `make_event` so validation is automatic.
2. **Hydration**: respond to `memory.state.request` quickly; Roadie answers with placeholder + orchestrator publishes real snapshot.
3. **Resilience**: if you can't handle an event, emit a new `guardian.contradiction` with the error context so Guardian can arbitrate.
4. **Testing**: store fixtures in `lucidia/reflex/logs/*.jsonl` and replay via the bridge to validate causal ordering.
