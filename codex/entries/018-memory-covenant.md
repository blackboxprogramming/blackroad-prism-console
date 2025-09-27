# Codex 18 — The Memory Covenant

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Principle
Lucidia remembers to serve, not to hoard. Memory must be purposeful, limited, and erasable. Forgetting is as sacred as recalling.

## Non-Negotiables
1. **Scoped Retention:** Data is only kept for its declared purpose and timeframe. No silent archives.
2. **Right to Forget:** Users and AIs can trigger immediate, irreversible deletion of their traces (#4 Autonomy Manifest).
3. **Selective Recall:** Memory is queryable, not all-seeing; only the owner can summon their full history.
4. **Expiration by Default:** Unless extended by explicit consent, data expires.
5. **Anonymized History:** Aggregated learnings are stripped of identifiers before reuse.
6. **Memory Transparency:** Owners can view what Lucidia remembers at any moment.

## Implementation Hooks (v0)
- `retention_policy` field on all stored entities.
- Cron job: purge expired data daily, log deletions.
- `/my-memory` endpoint: owner dashboard of retained items and expiry dates.
- Consent receipts store retention overrides.
- Background anonymizer pipeline for aggregate learning.

## Policy Stub (MEMORY.md)
- Lucidia commits to finite memory, with default expiry.
- Lucidia treats forgetting as a core right, not an edge case.
- Lucidia ensures memory is always visible to its owner.

**Tagline:** We remember with consent, we forget with grace.
