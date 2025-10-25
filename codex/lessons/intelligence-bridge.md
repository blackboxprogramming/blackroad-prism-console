---
title: Lucidia ⇄ Prism Bridge
when: 2025-03-12
---

## Purpose

Connect the in-process ReflexBus to Prism's real-time EventBus so that Lucidia can observe, reason, and act with the same timeline as Codex.

## Flow

1. **Schema contract** – every event conforms to `schemas/lucidia/intelligence-event.schema.json`.
2. **Bridge handshake** – `lucidia-bridge.py` connects over `/api/event/bridge`, replays any offline queue, and requests hydration.
3. **Validation + storage** – `prism-bridge.ts` validates via Ajv, persists to SQLite, and rebroadcasts via SSE.
4. **Recovery** – on restart the bridge replays `getHydrationEvents(200)` so memory + guardian handlers regain state in <1 s.
5. **Offline replay** – unsent events are spooled to `logs/lucidia_bridge_queue.jsonl` and flushed once connectivity returns.

## Teaching Notes

* Guardian stays the single arbiter: policy updates publish on `guardian.policy.update` and Roadie only records them.
* Memory deltas emit on `memory.deltas.*` with success/failure annotations so Codex shows both impact and reflection.
* When extending the system, emit events via `lucidia.intelligence.make_event` and always call `BUS.emit(event['topic'], event)`.
