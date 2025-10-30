# Treasury Policy (Fiat + Crypto)

## 1. Header & Metadata

- **Policy ID:** FIN-TREAS-####
- **Owner:** CFO / Treasury Committee
- **Approvers:** Founders / Board
- **Effective Date:**
- **Review Date:**
- **Status:** Draft / Active / Archived
- **Links:** Treasury dashboard, multisig addresses, custody docs

---

## 2. Purpose & Scope

Define how company funds (fiat + crypto) are held, allocated, and safeguarded. Covers all treasury operations including custody, disbursement, investment, and reporting.

**Goal:** ensure liquidity, safety, transparency, and mission alignment.

---

## 3. Objectives

1. Maintain minimum 12-month operating runway.
2. Preserve principal while enabling strategic growth.
3. Diversify holdings across fiat, stablecoins, and core assets.
4. Enable decentralized transparency without compromising security.
5. Comply with all relevant legal and tax regulations.

---

## 4. Structure

### Fiat Treasury

| Account   | Bank  | Currency | Purpose            | Signers          |
|-----------|-------|----------|--------------------|------------------|
| Operating | Chase | USD      | Payroll, vendors   | CFO + Controller |
| Reserve   | USDC  | USD      | 6-month buffer     | CFO + Founder    |

### Crypto Treasury

| Wallet          | Network  | Purpose           | Custody Type     | Signers                                   |
|-----------------|----------|-------------------|------------------|-------------------------------------------|
| Main Treasury   | Ethereum | Core reserves     | Multisig (3/5)   | Founder, CFO, Community Lead              |
| Ops Wallet      | Polygon  | Operational payments | Hot wallet    | Ops + Security                            |
| Grants Wallet   | Ethereum | Grants payouts    | Multisig (2/3)   | Treasury Committee                        |

---

## 5. Allocation Strategy

| Asset Type              | Target % | Min % | Max % | Notes                |
|-------------------------|----------|-------|-------|----------------------|
| Fiat                    | 50%      | 40%   | 60%   | Operating liquidity  |
| Stablecoins (USDC, DAI) | 25%      | 20%   | 35%   | Yield-bearing reserves |
| BTC                     | 10%      | 5%    | 15%   | Strategic asset      |
| ETH                     | 10%      | 5%    | 15%   | Ecosystem exposure   |
| UTIL (native token)     | 5%       | 0%    | 10%   | Alignment reserve    |

**Rebalancing:** quarterly or if holdings deviate more than 10% from target allocation.

---

## 6. Controls & Signatures

- **Multisig Policy:** minimum 3-of-5 signers for any transaction > $10,000 or 10,000 UTIL.
- **Signer Rotation:** review every 6 months or upon personnel change.
- **Emergency Wallet:** cold storage with 4-of-7 recovery quorum.
- **Transaction Limits:** per-wallet and per-day caps enforced by smart contracts.
- **Dual Verification:** all outgoing transfers require secondary verification by a non-initiating signer.

---

## 7. Reporting & Transparency

| Report Type        | Frequency | Audience         | Channel           |
|--------------------|-----------|------------------|-------------------|
| Treasury Snapshot  | Monthly   | Community        | Governance forum  |
| Audit Report       | Annual    | Board / Holders  | Public site       |
| Multisig Activity  | Real-time | Internal         | Dashboard         |

**Dashboard Metrics:**

- Fiat + crypto balances
- Allocation by category
- Runway projection
- Unrealized gain/loss
- Treasury inflows/outflows

---

## 8. Compliance & Risk

- **KYC/AML:** apply to counterparties for OTC or large transfers.
- **Insurance:** explore custodial coverage for cold storage assets.
- **Regulatory:** align with jurisdictional reporting and tax standards.
- **Incident Response:** maintain a predefined contact tree and cold wallet isolation procedures.

---

## 9. Review Cycle

- **Quarterly:** allocation and risk review by Treasury Committee.
- **Annual:** external audit and policy version update.
- **Ad-hoc:** triggered by material market or operational changes.

**Change Control:** versioned on Git; amendments require 67% governance approval.

---

## 10. Sign-Off

| Name           | Role            | Signature | Date |
|----------------|-----------------|-----------|------|
|                | CFO             |           |      |
|                | Founder         |           |      |
|                | Treasury Chair  |           |      |

---

### Metadata Summary

- **Owner:** CFO / Treasury Committee
- **Approvers:** Founders
- **Review Cadence:** Quarterly
- **Status:** Template Ready 🏦
- **Next Step:** Populate with real wallet data and set reporting cadence.

