# Supply Chain & Vendor Risk Management

This module manages suppliers, purchase orders, vendor risk, and logistics for offline
operations. All data is stored as local JSON to support air‑gapped deployments and is
hash‑chained by the surrounding repository.

## Vendor Registry
- `supply/vendors.json` holds the approved vendor list (AVL).
- Each vendor records category, approvals, audit history, and risk rating.
- `supplyctl vendor` commands manage the registry and audits.

## Purchase Orders
- Purchase orders are saved under `supply/po/` and progress through
  `draft → approved → received → closed`.
- `supplyctl po` commands create and advance POs; `po export` produces a
  PDF‑friendly snapshot for auditors.
- Approval hooks tie into the finance layer for cost controls.

## Vendor Risk
- Risk factors include financial, geopolitical, cyber, and compliance signals.
- Updates flow to Lucidia memory for long‑term learning.
- `supplyctl risk` exposes updates and reporting for auditors and SOC integration.

## Logistics & Tier Mapping
- Shipments live in `supply/logistics.json` with carrier, incoterms, and ETA.
- Multi‑tier supplier maps identify single‑source bottlenecks.
- `supplyctl logistics` manages shipments and tier dependencies.

## Compliance
- Supports ISO 28000 supply‑chain security controls.
- Artifacts exportable for SOX and SEC 10-K supplier risk disclosures.
