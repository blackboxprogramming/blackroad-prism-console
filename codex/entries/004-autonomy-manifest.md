# Codex 4 — The Autonomy Manifest

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Principle
What you create, you own. What you don’t want, you delete. What you share, you choose. No exceptions.

## Non-Negotiables
1. **Export:** Every user and AI can export their data in open formats (JSON, Markdown, CSV). No paywalls, no obfuscation.
2. **Delete:** One-click purge removes all owned data plus associated keys. Delay only for user confirmation; no silent backups beyond the retention policy.
3. **Consent:** Every data use must carry an explicit consent receipt — purpose, scope, duration. Defaults = “off.”
4. **Portability:** APIs allow data transfer to other platforms and tools; schema docs are public.
5. **Visibility:** Owners can see every entity tied to them — items, boxes, logs, receipts — from a single dashboard.
6. **Encryption:** Data is encrypted per-owner key; deletion equals key destruction.

## Implementation Hooks (v0)
- `/export` endpoint (format param: JSON, MD, CSV).
- `/purge` endpoint (10-second hold, then full wipe).
- `consent_receipts` table (already in schema).
- UI: “My Data” page with export, delete, view receipts.

## Policy Stub (PRIVACY.md)
- Lucidia never sells data.
- Lucidia cannot read private data without explicit receipt.
- Lucidia commits to PQC-ready crypto for all owner keys.
- Lucidia logs all accesses, visible to owner.

**Tagline:** Your data, your shadow. You decide when the light hits it.
