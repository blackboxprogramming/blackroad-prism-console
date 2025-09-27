# Codex 5 — The Explainability Doctrine

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Principle

No judgment without a reason. No automation without a breadcrumb. If Lucidia acts, the “why” must travel with it.

## Non-Negotiables
1. **Rationale Storage** – Every classification, suggestion, or action stores a plain-language rationale string alongside the result.
2. **One-Click “Why?”** – Every UI element derived from AI has a “Why?” link that surfaces its rationale.
3. **Undo Always** – Users can reverse any AI action with a single step; the system preserves prior state.
4. **Versioned Outputs** – When logic changes (model update, rule tweak), outputs are tagged with version IDs. Owners can trace which engine made the call.
5. **Model Transparency** – Publish the high-level model type, training scope, and update date. No hidden, silent swaps.
6. **Bias Checks** – Log and flag patterns of skew (false positives, false negatives, over-representation). Share reports with the dev team weekly.

## Implementation Hooks (v0)
- Assignments table stores a non-null rationale field.
- UI adds a “Why?” button that reveals the stored rationale and model version.
- `/undo` endpoint rolls back the last assignment without data loss.
- Action logs capture `{action, actor, rationale, model_version, timestamp}`.
- Model manifest records the type, scope, and update date for each version.
- Bias report recalculates after every assignment and surfaces heuristic flags.

## Policy Stub
- Lucidia will never deploy a model update silently.
- Lucidia will never present an AI decision without rationale access.
- Lucidia commits to reversibility as a design law.

**Tagline:** Every shadow shows its source.
