# Codex 20 — The Governance Charter

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Principle
Lucidia is not ruled by whim. Decisions live in a framework: open, accountable, reversible. Governance is the scaffolding that lets freedom stand.

## Non-Negotiables
1. **Open Proposals:** Any significant change begins as an RFC (Request for Comment), visible to all stakeholders.
2. **Deliberation Windows:** Every RFC has a clear discussion period before decision.
3. **Consensus Priority:** Aim for agreement; fall back to majority only when necessary.
4. **Recorded Votes:** Outcomes and rationales are logged permanently in the repo.
5. **Appeal Path:** Decisions can be challenged via new RFCs; no decision is immune to review.
6. **Codex Protection:** Foundational codices (1–11) require supermajority + waiting period to amend.

## Implementation Hooks (v0)
- `/rfcs` directory in repo, template includes rationale, risks, codex references.
- Governance labels in issue tracker: proposal, discussion, vote, accepted/rejected.
- Markdown log: `/docs/governance/decisions.md` auto-updated from merges.
- GitHub Action: enforce discussion window before merge.

## Policy Stub (drop into GOVERNANCE.md)
- Lucidia commits to transparent, participatory governance.
- Lucidia records all decisions and keeps them open for review.
- Lucidia treats governance as a living process, not a frozen constitution.

**Tagline:** Shared table, shared power.
