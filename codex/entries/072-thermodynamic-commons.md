# Codex 72 — Thermodynamic Commons

**Fingerprint:** `291cba39fd206b28e195046ec214b2ef53fe709ce083f20a2173139b47e210a2`

## Aim
Keep civilizational uptime within the planet's thermodynamic bounds by treating exergy as the primary governance budget.

## Schema
- **Objects (Types):**
  - `Jurisdiction`: bioregion with defined sink capacity and stewardship council.
  - `ExergyBudget`: annual available work quota \(X\) issued per jurisdiction.
  - `Project`: initiative consuming or restoring exergy.
  - `LedgerEntry`: measured flows (capture, storage, loss) attached to a project instance.
  - `FailsafeTrigger`: state signifying a rolling five-year waste-heat overshoot.
- **Morphisms (Lawful Operations):**
  - `allocate_cap(Jurisdiction → ExergyBudget)`: emits capped quota subject to sink capacity constraints.
  - `fund_low_exergy(ExergyBudget × Project → LedgerEntry)`: quadratic-funding dispersal that records matching contributions for services under a low-exergy threshold.
  - `auction_high_exergy(ExergyBudget × Project → LedgerEntry)`: progressive-price auction that debits quota and writes clearing price + load curve into the ledger.
  - `account_local(Project → LedgerEntry)`: enforces full capture → storage → loss accounting before any ledger close.
  - `throttle(FailsafeTrigger × Project → Project)`: scales or halts projects proportional to overshoot severity.
- **Invariants (Commuting Diagrams):**
  - Budget integrity: `allocate_cap` followed by the sum of `fund_low_exergy` and `auction_high_exergy` must commute with `account_local`, ensuring \(\sum \text{LedgerEntry.useful\_work} ≤ X\).
  - Transparency loop: `account_local` then `LedgerEntry → Jurisdiction` equals `Project → Jurisdiction` composed with public reporting, preserving locality of responsibility.
  - Failsafe determinism: any path that produces a `FailsafeTrigger` must commute with `throttle`, guaranteeing automatic response without discretionary delay.

## Dashboard
- **Primary Metric:** Exergy efficiency \(\eta_{ex} = \frac{\text{useful work}}{\text{available work}}\); trend must be monotonically increasing while annual \(X\) stays ≤ cap.
- **Supporting Gauges:**
  - Rolling five-year waste-heat sum vs. regional sink capacity (highlight failsafe thresholds).
  - Low-exergy quadratic funding uptake vs. projected community demand.
  - Auction price distribution vs. socialized cost baseline.
  - Compliance rate of project-level exergy ledgers (capture, storage, loss completeness).

## Ritual
- **Heat Commons Assembly (quarterly):** steward councils review dashboard deltas, narrate trade-offs, and invite resident witness statements before adjusting \(X\).
- **Restore Day Drill (annual):** simulate cold-start energy rationing; teams re-run ledger reconciliation from off-grid backups to test recoverability.
- **Metaphor Versioning:** retire energy metaphors that fail operational tests; adopt new ones only after they map to ledger data.

## Failsafe
- Continuous monitor runs a rolling five-year convolution of waste-heat outputs per jurisdiction.
- When overshoot detected, `FailsafeTrigger` auto-issues throttling directives and pauses new auction rounds until sink capacity recovers below threshold.
- Manual override requires supermajority of Heat Commons Assembly with recorded justifications and expiry.

## Roadie Mode
- Packable kit (≤15 kg): handheld calorimeter, solar-charged tablet with CRDT ledger replica, printed quick-start sheets, foldable exergy abacus.
- Offline protocol: synchronize ledger differentials via mesh once per 24h; auctions degrade to locally posted sealed-bid rounds adjudicated by rotation.
- Emergency playbook: prioritize hospital, water, and food-chain projects; pre-baked throttling scripts ready for manual relay when networks fail.

**Tagline:** Energy before ego, forever accountable.
