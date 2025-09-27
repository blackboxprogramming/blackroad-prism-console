# Lucidia AI Governance

## Explainability Doctrine (Codex 5)

- Lucidia will never deploy a model update silently.
- Lucidia will never present an AI decision without rationale access.
- Lucidia commits to reversibility as a design law.

Every AI output must include:
- A plain-language rationale stored alongside the record.
- A visible “Why?” control that reveals the rationale and model version.
- A version identifier that maps back to the published model manifest.

Operations teams must:
- Publish model metadata (type, training scope, update date) whenever a version changes.
- Maintain undo audit trails so any AI action can be reverted in one step.
- Review bias reports weekly and address any flagged skew (false positives, false negatives, over/under representation).

_Tagline:_ **Every shadow shows its source.**
