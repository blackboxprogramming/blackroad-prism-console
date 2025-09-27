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

# Codex 21 — The Interface Promise

**Fingerprint**: `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Principle

The interface is where trust lives or dies. Every Lucidia surface stays clear, honest, and kind — no tricks, no hidden levers.

## Non-Negotiables

1. **No Dark Patterns** — No deceptive defaults, forced consent, or endless nags.
2. **Consistency** — The same action delivers the same result across web, mobile, CLI, or API.
3. **Accessibility** — Keyboard navigation, screen reader support, and high-contrast modes are mandatory.
4. **Explain-in-Place** — Buttons, toggles, and warnings carry contextual help; no buried manuals.
5. **Respect Attention** — Notifications stay rate-limited and quiet by default.
6. **AI Surfaces Clearly** — AI-generated or suggested content wears an explicit badge.

## Implementation Hooks (v0)

- **Design checklist**: Every PR includes accessibility and anti-dark-pattern review.
- **Component library**: Enforce ARIA labels and keyboard navigation.
- **Notification system**: Opt-in channels with rate limits.
- **AI badge**: Automatically append to AI-sourced outputs.

## Policy Stub — `INTERFACE.md`

- Lucidia commits to honesty in its interface design.
- Lucidia bans manipulative or coercive UI patterns.
- Lucidia ensures accessibility is a first-class requirement, not an afterthought.

**Tagline**: Clarity is the interface of care.

