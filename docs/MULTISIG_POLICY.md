# Multisig Quorum Primer and Policy

## Plain-English Primer

### What a quorum means in practice
- **m-of-n** indicates that you hold _n_ total keys and must present _m_ unique keys to authorize a spend.
- Lower _m_ increases availability (fewer signatures required) but makes it easier for attackers to move funds if they obtain multiple keys.
- Higher _m_ improves compromise resistance but reduces recoverability because more keys must stay healthy and reachable.

### Think through failure modes, not just the math
Ask "What single mishap can this setup survive?" and model scenarios such as:
- **Lost device:** phone dies, laptop stolen, hardware wallet misplaced.
- **Theft/compromise:** malware, coerced access, insider misuse.
- **Travel & downtime:** signer stuck in transit, customs, or without a hardware wallet.
- **Collusion:** custodian and teammate go rogue together.
- **Household or site disaster:** fire, flood, or blackout in one location.

### Popular quorums and their trade-offs

| Quorum | Survives this single mishap | Where it excels | Where it struggles |
| --- | --- | --- | --- |
| 2-of-3 | Lose one key _or_ one storage location | Day-to-day usability, travel-friendly operations, small ops teams | If two keys are stolen or coerced, funds are lost |
| 3-of-5 | Lose any two keys/locations | Strong compromise resistance, medium-size treasuries | Slightly slower to coordinate for routine spending |
| 2-of-2 | No single failure is survivable | Dual-control approvals, just-in-time release flows | Any single key loss stalls funds; no resilience |
| 3-of-7 | Lose up to four keys/locations | High-value, board-level treasuries with broad oversight | Operational overhead and coordination cost |
| 1-of-2 (Shamir/guardians) | Lose one share | Emergency recovery vaults where one signer is a backstop | If either share is compromised, the funds are exposed |

### A simple blueprint for most small teams and creators
Adopt a **2-of-3** multisig with the following layout:
1. **Hardware wallet A** — primary signer stored in a home safe.
2. **Hardware wallet B** — secondary signer stored in a workplace or relative's safe in a different city.
3. **Recovery key** — passphrase-protected seed on steel or paper in a bank deposit box or held by a vetted, auditable escrow (not a custodian).

This lets you lose any single key and continue operations, while an attacker must compromise two distinct assets. For travel, carry one device and coordinate a remote co-signer for the second approval.

### When to step up to 3-of-5
- Treasury balances increase or more stakeholders join (e.g., you, a co-founder, CFO, outside director, recovery specialist).
- You need to withstand two simultaneous failures (theft plus device loss, or disaster plus travel).
- You want clearer separation between operational keys and recovery/oversight keys located in different cities or risk domains.

### Practical guardrails for every quorum
- **Geography:** spread keys across locations with distinct risk profiles (home, office, bank vault, escrow).
- **Diversity:** mix hardware wallet vendors/models and passphrase policies to limit single-vendor bugs.
- **Playbooks:** maintain a one-page "If X then Y" guide covering lost devices, travel signings, and emergency payouts.
- **Drills:** rehearse the full signing flow quarterly with only the minimum quorum (use test funds).
- **Access latency:** agree on acceptable "time to sign" (e.g., 30 minutes for payroll vs. 24 hours for large redemptions) and place keys accordingly.
- **Audit trail:** record who signed and when—an internal ledger, ticket comment, or log—so anomalies surface quickly.

### Quick chooser
- **Solo operator or creator with frequent access needs:** use 2-of-3.
- **Small company treasury with multiple approvers:** use 3-of-5.
- **Board-level or reserve funds:** use 3-of-5 or 3-of-7 with clearly delineated operations, recovery, and oversight roles.

## One-Page Multisig Policy

### Roles and responsibilities
| Role | Key purpose | Primary storage location | Backup/Notes |
| --- | --- | --- | --- |
| Operator A | Initiates routine payments, payroll, vendor disbursements | Hardware wallet A in home safe | Passphrase written down separately and stored in sealed envelope |
| Operator B | Secondary approval for daily spends and travel coverage | Hardware wallet B in office/relative's safe (different city) | Paired with dedicated signing laptop kept offline |
| Recovery Steward | Escrow-style backstop for disasters or operator unavailability | Steel seed plate plus passphrase stored in bank deposit box | Access requires documented change-control ticket and two observers |
| Treasurer (optional for 3-of-5) | Oversees treasury allocations and large releases | Hardware wallet stored in corporate vault | Requires CFO + board notification before use |
| Oversight Director (optional for 3-of-5/3-of-7) | Independent sign-off for high-risk moves | Hardware wallet stored with legal/compliance team | Access logged with governance committee |

### Key storage and access controls
- Maintain an updated inventory of key serial numbers, passphrase holders, and storage addresses.
- Store passphrases separately from hardware devices; seal them in tamper-evident envelopes.
- Transport hardware wallets in travel cases with tamper seals; customs letters of explanation kept in encrypted cloud storage.
- Require out-of-band confirmation (voice or secure chat) before every spend to validate intent.
- Log every signing event in the treasury ledger with: transaction ID, signers, location, and change-ticket reference.

### Recovery and incident response
1. **Lost device:**
   - Notify treasury channel, tag Treasurer and Recovery Steward.
   - Rotate the affected key: derive a new seed, update multisig configuration, retire compromised key.
   - Update documentation and conduct a post-mortem within five business days.
2. **Suspected compromise or theft:**
   - Freeze spending; require 3-of-5 (or maximum quorum) to move funds to a clean wallet.
   - Perform malware scans on all signer devices; reissue hardware wallets if needed.
   - Notify legal/compliance and, if material, external auditors within 24 hours.
3. **Disaster at a storage site:**
   - Activate backup key from alternate location.
   - Rebalance storage: create new key, place in a fresh risk domain, and update safekeeping logs.
4. **Signer unavailability (travel, medical, etc.):**
   - Use alternate signer from oversight/recovery pool.
   - Document temporary delegation with start/end dates and approvals.

## Monthly Multisig Drill Checklist
1. **Scheduling:** Pick a drill window, invite all signers, and assign an observer to capture notes.
2. **Scenario selection:** Choose a scenario (lost device, travel signing, emergency payout) and document expected outcomes.
3. **Dry run:** Use a test wallet or minimal-value UTXO to walk through the signing flow with the minimum quorum only.
4. **Access validation:** Confirm each signer can locate their device, unlock passphrases, and connect to the signing workstation.
5. **Communication test:** Execute the out-of-band confirmation channel (secure call or encrypted chat) and log timestamps.
6. **Audit trail:** Record transaction ID (or mock ID), signers involved, and any delays in the treasury ledger or drill log.
7. **Review:** Conduct a 15-minute retro to capture issues, update the "If X then Y" playbook, and assign remediation actions.
8. **Documentation:** File the drill report in the treasury knowledge base and update inventories or policies as required.

