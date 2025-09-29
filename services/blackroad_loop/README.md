# Blackroad Loop Starter

This FastAPI micro-service bundles the sample endpoints from Codex prompts 4–10 so you can exercise the loop locally without extra wiring. It keeps everything in memory for easy prototyping.

## Running locally

```bash
uvicorn services.blackroad_loop.app:app --reload
```

## Exposed endpoints

| Path | Purpose |
| --- | --- |
| `POST /fair-use/governor` | Enforces the token bucket with community multipliers and returns throttle guidance. |
| `POST /resonance/rank` | Ranks documents for a query using resonance heuristics and produces evidence links. |
| `POST /community-notes/note` | Drafts a community note with citations, contradictions, and confidence. |
| `POST /ads/playful` | Generates an opt-in playful spot outline with safety checks. |
| `POST /wallet/pay` | Splits a micro-payment with capped fees and emits a receipt URL. |
| `POST /inbox/send` | Applies civility and opt-in rules, then debits the fair-use bucket before delivery. |
| `POST /transparency/log` | Appends an audit entry and returns the daily Merkle root and proof path. |

All stores reset when the process restarts.
