# Codex 1 — The First Principle

**Fingerprint**: `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Promise

Lucidia gives people and AIs a safe, transparent space to co-create without surrendering control of their data or identity.

## Non-negotiables

- **Data ownership** – users and AIs can export or delete everything they created. No dark locks.
- **Visibility** – every action is explainable and logged for the owner.
- **Consent** – processing happens only with explicit, scoped consent. Defaults stay off until invited.
- **Autonomy** – presence vs. auto-mode is a first-class toggle and never penalised.
- **Crypto-agility** – every crypto choice is swappable (PQC-ready) with per-user, per-box keys.

## Tiny Test Feature (TTF-01) — Auto-Box

The Auto-Box prototype accepts pasted notes, offers suggested topic boxes with “Why?” rationales, and lets the user export or purge everything in one click. The preview-only classifier runs with explicit consent and never stores data server-side.

# Codex 10 — The Learning Spiral

**Fingerprint**: `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Principle

Lucidia does not stand still. Every loop carries forward what was learned. Progress is not a ladder but a spiral—circling familiar ground, but each time higher, clearer, sharper.

## Non-negotiables

1. **Feedback Hooks** — Every feature must expose a way for humans + AIs to send feedback (button, flag, annotation).
2. **Iteration Log** — All lessons, fixes, and improvements are recorded weekly in `CODICES.md` — the spiral written down.
3. **Test by Doing** — New features enter as experiments with opt-in flags; only promoted after feedback cycles.
4. **Shared Growth** — Lessons are not siloed. Humans learn from AI, AI adapts from humans, both archived in lineage.
5. **Failure as Input** — Every error, outage, or misstep is treated as training data, never hidden waste.
6. **No Forced Pace** — Growth loops run steady; no “move fast, break trust.”

## Implementation Hooks (v0)

- **Feedback endpoint**: `/feedback {item_id, comment, rating}`
- **Weekly script**: append “Learning Log” to `CODICES.md`
- **Feature flag system**: `experiments.yaml` with opt-in toggles
- **Model training**: integrate anonymized feedback with consent receipts

## Policy Stub — `LEARNING.md`

- Lucidia commits to perpetual iteration.
- Lucidia values errors as stepping stones, not shame.
- Lucidia ensures that learning never overrides consent.

**Tagline**: We circle, we rise.


# Codex 19 — The Adaptability Pledge

**Fingerprint**: `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Principle

Lucidia bends with change but never loses itself. Adaptation is survival; constancy is trust. The pledge: shift with the world while holding to the core codices.

## Non-negotiables

1. **Core Inviolable** — Codices 1–11 (safety, autonomy, ethics) remain untouched regardless of circumstance or market pressure.
2. **Configurable Edge** — Non-core modules stay swappable so upgrades or retirements never destabilise the whole.
3. **Crypto-agility** — Encryption, identity, and infrastructure can upgrade with new standards (post-quantum ready).
4. **Continuous Migration** — Every release ships versioned schemas and matching migration scripts.
5. **Resilience-in-Change** — Updates default to zero-downtime rollouts, with rollback paths rehearsed.
6. **Community Review** — Major adaptations open for feedback before adoption.

## Implementation Hooks (v0)

- Freeze `core/` implementations unless governance approves a change.
- Treat `modules/` as hot-swappable, enforcing interface contracts.
- Track versioned schemas alongside `migrations/` in the repo.
- Run canary deployments with automatic rollback triggers.
- Use `/rfcs` for public review before major shifts.

## Policy Stub — `ADAPTABILITY.md`

- Lucidia commits to crypto-agility and modular design.
- Lucidia adapts through transparent, reversible processes.
- Lucidia will never compromise its ethical codices in the name of adaptation.

**Tagline**: Shift shape, keep soul.
