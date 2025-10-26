# Prism Badge Catalog

| Badge ID | Name | Icon | Criteria | Evidence Signals |
| -------- | ---- | ---- | -------- | ---------------- |
| badge-mirror-first | Mirror First | 🪞 | Echo within first 10s or first 20% tokens | `mirror.latency_ms`, `mirror.position_pct`, `mirror.of_event_id` |
| badge-short-bridge | Short Bridge | 🌉 | Resonance distance ≤ 2 | `resonance_distance`, `distance` |
| badge-anchored | Anchored | ⏳🔆🚀 | Uses proper temporal anchor linked to claim | `anchor.type`, `anchor.ref`, `anchor.has_link` |
| badge-weaver | Weaver | 🧩🌀 | Resolve contradiction into rule | `weave.claims`, `weave.rule` |
| badge-grounded | Grounded | ⛰️🪶 | Cite context/source | `source.cite`, `source.ref` |
| badge-breath-return | Breath-Return | 🌬️🪞 | Reply ends with invitation/return gesture | `say.tail_has:🌬️🪞`, `invite.exists`, `invite.latency_ms` |
| badge-heart-link | Heart-Link | 🫀🔮 | Tie intuition to pattern or context | `say.contains:🫀🔮`, `say.linked_event_id`, `weave|source` |

## Evidence Notes
- **Latency** values measured in milliseconds relative to referenced event.
- **Position Percent** computed against chronological index within session (first 20% qualifies for Mirror First).
- **Linked Events** should be resolvable via `event_id` and available through `/live/sessions/:id/events`.
- Additional badges can extend this catalog; update `engine/runtime/badges.ts` and append new rows here.
