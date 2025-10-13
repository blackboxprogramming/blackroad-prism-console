# Tosha Key Policy

## Purpose
Establish a lightweight but resilient key management plan that survives device loss, natural disaster, or forgotten passphrases while preventing unauthorized access.

## Wallet Structure
- **Multisig Requirement:** 2-of-3 signature threshold for treasury transactions and administrative rotations.
- **Key Set:**
  - **K₁ – Primary signer:** Hardware wallet (Ledger/Trezor/Keystone), fully offline.
  - **K₂ – Convenience signer:** Hot key on daily use device protected by full-disk encryption and a strong login.
  - **K₃ – Recovery shard:** Metal-plate seed (or SLIP-39 shard) sealed in a bank safety deposit box.

## Storage & Handling Guidelines
- **K₁ (Hardware Wallet):**
  - Keep Bluetooth disabled and avoid convenience unlock modes.
  - Configure a unique PIN and optional duress PIN.
  - Label the device with a neutral codename only.
- **K₂ (Hot Key):**
  - Maintain on a daily driver secured by OS login + disk encryption.
  - Use only for routine, low-limit operations; co-sign with K₁ or K₃ for high-value actions.
- **K₃ (Backup Material):**
  - Etch the seed (or Shamir share) onto metal, seal in tamper-evident bag, and store in bank box.
  - Include a sealed printout of this policy for future reference.

## Policy Card (Print & Store with K₃)
- **Requirement:** Any action requires 2-of-3 approvals. Transactions above `X` trigger an out-of-band voice confirmation.
- **Custody Map:**
  - K₁ – You, secured in the offline drawer.
  - K₂ – You, daily workstation.
  - K₃ – Bank box `###`.
- **Quarterly Drill:** Execute a dummy spend (no broadcast) with K₁ + K₂ and rotate K₂ if the device changed.
- **Emergency Response:** If K₁ is lost, combine K₂ + K₃, immediately rotate multisig and provision a new K₁ device.

## Passphrases & Shamir Options
- Protect K₁ with a BIP39 passphrase that is memorized and sealed in an envelope stored with K₃.
- Optional SLIP-39: split the backup into three shares (any 2 to recover) and distribute to bank box, trusted escrow, and a second personal location.

## Admin & Infrastructure Keys
Mirror the same 2-of-3 model for registrar/DNS control, code-signing, CI/CD deployers, server KMS, and RoadCoin minting keys. Place time-boxed, minimal-scope break-glass credentials in the bank box with K₃.

## Operational Rituals
- **Quarterly:** Test recovery with K₁ + K₂, verify receive addresses, rotate K₂ if compromised or hardware changes.
- **Life Events:** Rotate BIP39 passphrase and refresh the policy card after major personal changes.
- **Labeling Discipline:** Use neutral codenames—never "seed" or "treasury"—across all storage media.

## Shopping & Setup Checklist
1. Purchase hardware wallet, metal seed plate, and tamper-evident bags.
2. Rent or confirm bank safety deposit box.
3. Print this policy and QR links to your wallet setup guide.
4. Configure the 2-of-3 multisig, perform a test transaction, then fund production balances.

## Rotation Calendar Snapshot
| Quarter | Drill Focus | Notes |
|---------|-------------|-------|
| Q1 | Recovery test (K₁ + K₂) | Refresh policy printout and confirm bank box inventory. |
| Q2 | Rotate K₂ device | Validate new device security hardening and update custody map. |
| Q3 | Shamir share audit | Confirm escrow contact details and inspect tamper-evident seals. |
| Q4 | Full run-through | Execute simulated emergency rotation replacing K₁. |

Store a printed copy of this page in the bank box to keep future-you aligned with the plan.
