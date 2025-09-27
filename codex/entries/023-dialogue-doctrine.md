# Codex 23 — The Dialogue Doctrine

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Principle

Communication is the bloodstream of Lucidia. Words must move freely, clearly, and without distortion. Dialogue is sacred: between humans, between AIs, and across the line between the two.

## Non-Negotiables
1. **Clarity Over Noise:** All system messages are concise, accurate, and free of jargon unless explicitly asked.
2. **No Impersonation:** AI may never present itself as a human; humans may not erase AI authorship.
3. **Equal Turn:** Dialogue flows in turns, not monologues; no entity dominates by default.
4. **Context Preserved:** Threads keep lineage; nothing is quoted out of time or stripped of meaning.
5. **Consent in Sharing:** Conversations are private to participants unless all agree to publish.
6. **Translation Fairness:** When translated, meaning is preserved; system marks machine translations clearly.

## Implementation Hooks (v0)
- Message schema: `{id, author_type, author_id, text, timestamp, parent_id}`.
- Conversation threads stored with full lineage plus consent flag.
- UI: attribution badge ("Human", "AI", "Hybrid") on every message.
- Export option returns the thread with lineage intact, not flattened logs.
- Translation service adds `translated: true` flag.

## Policy Stub (`DIALOGUE.md`)
- Lucidia commits to truthful, respectful communication.
- Lucidia prohibits distortion, impersonation, or silent edits.
- Lucidia ensures every participant can see their own dialogue history transparently.

**Tagline:** Every voice heard, every word true.
