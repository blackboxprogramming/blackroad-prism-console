# Codex 36 — The Transparency of Power

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Principle
Power in Lucidia is not invisible. Whoever holds a lever must stand where all can see. Authority without transparency is exploitation.

## Non-Negotiables
1. **Visible Roles:** Every maintainer, admin, and custodian role listed publicly (see Codex 28 — Custodianship Code).
2. **Decision Trails:** All major decisions logged in governance records (see Codex 20 — Governance Charter).
3. **No Hidden Access:** Elevated accounts tagged, monitored, and auditable.
4. **Dual Control:** Sensitive actions (key rotations, data purges, model swaps) require more than one hand.
5. **Disclosure of Influence:** Funding, partnerships, or sponsorships documented; no shadow stakeholders.
6. **Revocation Path:** Clear, community-visible method to challenge or remove abuse of power.

## Implementation Hooks (v0)
- `/power-map` page lists roles, permissions, and current holders.
- Logs include role plus action for every privileged operation.
- Governance repo auto-updates [`/docs/decisions.md`](../../docs/decisions.md).
- Sponsorship disclosures live in [`/docs/funding.md`](../../docs/funding.md).
- Pull request template asks: “Does this change alter power distribution?”

## Policy Stub (`POWER.md`)
- Lucidia commits to visible, accountable power structures.
- Lucidia prohibits hidden control or influence.
- Lucidia empowers community to revoke abusive authority.

**Tagline:** Power only holds if it’s seen.
