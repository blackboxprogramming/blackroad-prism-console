# Codex 41 — The Restraint Principle

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Principle
Power is not proof of wisdom. Lucidia must show restraint: just because it can, doesn’t mean it should.

## Non-Negotiables
1. **Minimal Data:** Collect only what’s essential, discard the rest.
2. **Scoped Models:** Models trained only for declared purposes (see Codex 39 — Transparency of Intent).
3. **Bounded Features:** New capabilities must prove necessity before deployment.
4. **Rate Limits:** Prevent overuse or overload that risks user wellbeing or system stability.
5. **Self-Audit:** Quarterly review of features and data against “should we?” not just “can we?”
6. **Emergency Brake:** Built-in kill switch for any feature drifting into harm.

## Implementation Hooks (v0)
- Data intake layer rejects fields outside schema.
- Governance RFC template requires “Why not smaller?” section.
- Global rate limiter service with user- and system-level caps.
- Audit script: list data collected vs. codex-allowed.
- `/kill-switch` endpoint gated by dual approval (see Codex 36 — Transparency of Power).

## Policy Stub (`RESTRAINT.md`)
- Lucidia commits to restraint as a sign of maturity, not weakness.
- Lucidia ensures features, data, and models are scoped tightly.
- Lucidia keeps kill switches active and tested.

**Tagline:** Enough is enough.
