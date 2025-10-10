# Treasury Policy (Fiat + Crypto)

## 1. Purpose & Scope
- Define the governance, operations, and safeguards for BlackRoad's multi-asset treasury, covering both traditional fiat holdings and on-chain crypto positions.
- Applies to the Treasury Committee, Finance Operations, Compliance, and any delegated custodial partners managing wallets, bank accounts, or automated agents handling treasury flows.

## 2. Objectives
- **Liquidity:** Maintain sufficient near-term liquidity to cover 12 months of operating expenses and capital commitments without forced asset sales.
- **Yield:** Optimize risk-adjusted yield through laddered deposits, low-volatility DeFi strategies, and conservative fixed-income instruments approved by the Treasury Committee.
- **Safety:** Prioritize principal protection with tiered custody, insurance coverage, and real-time monitoring to detect anomalies or custody degradation.
- **Decentralization:** Diversify custody across independent institutions and multi-signature wallets to avoid single points of failure while maintaining operational efficiency.

## 3. Structure
- **Governance Bodies:** Treasury Committee (policy owners), Finance Operations (day-to-day execution), Compliance (monitoring and audits).
- **Custodial Footprint:**
  - Tier-1 fiat banks for operating accounts, payroll, and vendor payments.
  - Qualified custodians and regulated exchanges for crypto reserves and yield deployments.
  - Self-hosted hardware-secured multisig wallets for strategic crypto holdings and emergency reserves.
- **Authorized Signers:** Maintain a current roster with role-based limits (e.g., CFO, Head of Finance Ops, Compliance Officer, Controller) recorded in signatories.json and mirrored in bank/custodian platforms.

## 4. Allocation Strategy
- **Strategic Mix:** 60–70% fiat instruments (operating cash, insured deposits, short-duration treasuries), 20–30% stablecoins, and up to 10% in approved crypto assets aligned with protocol partnerships.
- **Stablecoin Buffer:** Hold a rolling 90-day operating expense buffer in diversified, fully-reserved stablecoins (e.g., USDC, PYUSD) with automated rebalancing.
- **Liquidity Tiers:**
  - Tier 0 (Immediate): checking accounts and hot wallets for weekly expenses.
  - Tier 1 (Near-Term): money market funds, instant-settlement stablecoin pools, short-term treasuries.
  - Tier 2 (Strategic): longer-duration bonds, staking positions, low-volatility liquidity provision subject to stop-loss triggers.
- **Rebalancing:** Monthly review by Treasury Committee with automated alerts when allocations drift by >5% from targets.

## 5. Controls & Signatures
- **Multisig Policy:**
  - Operating wallets: 2-of-3 signatures (Finance Ops, Controller, Compliance).
  - Strategic reserves: 3-of-5 signatures (CFO, CEO, Head of Finance Ops, Compliance, External Custodian).
- **Approval Workflow:**
  - Payments above $250K or 50K USDC require dual approval including Compliance.
  - Yield deployments and redemptions require documented risk assessment and Committee sign-off.
- **Limits:** Daily transaction caps per wallet, automated withdrawal whitelists, and enforced cooling-off periods for newly whitelisted addresses.

## 6. Reporting & Transparency
- **Dashboards:** Real-time treasury dashboard covering balances, exposures, counterparty risk scores, and drift against targets. Hosted within the Prism console with role-based access.
- **Cadence:**
  - Weekly liquidity snapshot shared with Finance leadership.
  - Monthly Treasury Committee review packet, including performance vs. benchmarks and incident log.
  - Quarterly board report with audited statements and variance analysis.
- **Disclosures:** Public transparency page summarizing aggregate holdings, stablecoin attestations, and third-party audit badges without revealing sensitive counterparty details.

## 7. Compliance & Risk
- **AML/KYC:** Enforce bank-level KYC for all fiat partners, chain analytics screening for on-chain counterparties, and Travel Rule compliance for cross-border transfers.
- **Insurance:** Maintain crime, cyber, and custody insurance with coverage limits aligned to peak balance scenarios and reviewed annually.
- **Business Continuity:** Document recovery procedures for lost keys, exchange outages, and bank failures, including cold-storage backups and pre-arranged alternative rails.
- **Incident Response:** 24/7 monitoring with escalation playbooks, immediate freeze authority for Compliance, and post-incident reviews capturing lessons learned.

## 8. Review Cycle
- **Policy Review:** Comprehensive policy refresh every six months by the Treasury Committee, or sooner if regulatory changes or material incidents occur.
- **Allocation Updates:** Monthly rebalance recommendations documented in meeting minutes, with emergency sessions permitted for market dislocations.
- **Audit Trail:** Maintain immutable records of policy updates, approvals, and allocation changes in the governance registry for SOC 2 and internal audits.
