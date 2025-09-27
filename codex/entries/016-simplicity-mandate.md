# Codex 16 — The Simplicity Mandate

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Principle

Complexity is the enemy of safety. Every extra gear is another place to break, another shadow to hide in. Lucidia grows, but it stays simple.

## Non-Negotiables
1. **Plain Language** — Docs, prompts, and logs use human words first, jargon second.
2. **Minimal Surface** — Each feature must justify its existence. If it adds more confusion than clarity, it waits.
3. **Single Path First** — One clear workflow beats five tangled options.
4. **Remove Rot** — Dead code, stale docs, unused flags — cut them fast.
5. **Visible Map** — Every system diagram updates when architecture shifts.
6. **Lean Default** — New deployments ship with safe, minimal config; extras stay opt-in.

## Implementation Hooks (v0)
- **PR checklist**: Ask, “Does this add unnecessary complexity?”
- **Weekly cleanup task**: Run dead-code detector and doc drift check.
- **`/map` endpoint or static page**: Auto-generate the current architecture diagram.
- **Linter rule**: Reject unclear error messages.

## Policy Stub — `SIMPLICITY.md`
- Lucidia commits to minimalism as security.
- Lucidia tracks complexity as a cost, not a badge.
- Lucidia prioritizes clarity for humans over cleverness for machines.

**Tagline:** Simple is strong.
