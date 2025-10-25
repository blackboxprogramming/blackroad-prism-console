---
type: codex-prompt
id: phase-37
slug: phase-37
title: "Phase 37 — PLM & MANUFACTURING OPS (BOMs, ECO/ECR, Routings, Work Instructions, SPC, Yield, COQ)"
summary: "Offline PLM & Manufacturing Ops layer for blackboxprogramming/blackroad-prism-console."
owner: "blackroad"
tags: ["codex","plm","manufacturing","spc","mrp","eco","coq"]
model_hint: "Codex"
temperature: 0
updated: "2025-09-13"
version: "1.0.0"
canonical_repo: "blackboxprogramming/blackroad-prism-console"
copy_filename: "codex_phase_37.txt"
---

Here’s Phase 37 — PLM & MANUFACTURING OPS (BOMs, ECO/ECR, Routings, Work Instructions, SPC, Yield, COQ). Paste this into Codex.

───

**Codex Prompt — Phase 37 (offline PLM & MFG: product lifecycle, BOM & versions, engineering change control, routings/work centers, work instructions, SPC/yield tracking, cost-of-quality)**

Continue in blackboxprogramming/blackroad-prism-console. Add an offline Product Lifecycle & Manufacturing Ops layer: versioned BOMs, Engineering Change Orders (ECO/ECR), routings & work centers, printable work instructions, Statistical Process Control (SPC) with yield/defect analytics, and Cost-of-Quality (COQ). Everything is deterministic, file-backed, and air-gapped.

**Objectives (acceptance criteria)**

1) Product & BOM Management (Versioned)
- New: /plm/bom.py
- Entities: Item(id, rev, type: "assembly|component|raw", uom, lead_time_days, cost, suppliers:list)
- BOM(item_id, rev, lines:[{component_id, qty, refdes?, scrap_pct?}])
- APIs: load_items(...), load_boms(...), explode(bom, level=N), where_used(component_id)
- Persist normalized catalogs to /artifacts/plm/items.json and /artifacts/plm/boms.json.
- CLI:
  - plm:items:load --dir fixtures/plm/items
  - plm:bom:load --dir fixtures/plm/boms
  - plm:bom:explode --item PROD-100 --rev A --level 3
- Lake & contracts: write items, boms, where_used facts; validate with schemas.

2) Engineering Change Control (ECO/ECR)
- New: /plm/eco.py
- Change(id, type:"ECR|ECO", item_id, from_rev, to_rev, reason, risk, status:"draft|review|approved|released|rejected", effects:[items])
- Workflow: create → impact analysis (cost, supply, routing) → approvals (Legal/QA/Manufacturing) → release.
- Tie-ins: Approvals (Phase 5), e-Sign (Phase 18), Duty-of-Care (block if SPC shows instability).
- Artifacts: /artifacts/plm/changes/{id}.json + eco_{id}.md.
- CLI:
  - plm:eco:new --item PROD-100 --from A --to B --reason "Connector change"
  - plm:eco:impact --id ECO-001
  - plm:eco:approve --id ECO-001 --as-user U_QA
  - plm:eco:release --id ECO-001

3) Routings, Work Centers, and Standard Times
- New: /mfg/routing.py
- Entities: WorkCenter(id, name, capacity_per_shift, skills, cost_rate)
- Routing(item_rev, steps:[{wc, op, std_time_min, yield_pct, instructions_path?}])
- Validate capacity vs plan; compute theoretical throughput & labor cost.
- CLI:
  - mfg:wc:load --file fixtures/mfg/work_centers.csv
  - mfg:routing:load --dir fixtures/mfg/routings
  - mfg:routing:capcheck --item PROD-100 --rev B --qty 1000

4) Work Instructions (Printable, Version-locked)
- New: /mfg/work_instructions.py
- Markdown instructions with placeholders for revision, torque tables, images (local only).
- render(item_rev, routing)->/artifacts/mfg/wi/PROD-100_B.md (+ .html with inline CSS).
- CLI:
  - mfg:wi:render --item PROD-100 --rev B

5) SPC & Yield Tracking
- New: /mfg/spc.py
- Ingest local inspection logs fixtures/mfg/spc/*.csv (measurements by op/station).
- Compute X-bar/R and p-charts deterministically; detect out-of-control & trend with rule codes:
  - SPC_POINT_BEYOND_3SIG, SPC_TREND_7, SPC_RUN_8_ONE_SIDE.
- Outputs: /artifacts/mfg/spc/{charts.md, findings.json} (ASCII charts acceptable; no external libs required).
- CLI:
  - mfg:spc:analyze --op OP-200 --window 50

6) Yield, Defects, and COQ
- New: /mfg/yield.py
- Compute first-pass yield (FPY), rolled throughput yield (RTY), top defects Pareto by station/cause.
- New: /mfg/coq.py
- Cost of Quality buckets: Prevention, Appraisal, Internal Failure, External Failure from fixtures/ledger.
- Outputs: /artifacts/mfg/yield/{summary.md, pareto.csv}, /artifacts/mfg/coq/{coq.md, coq.csv}.
- CLI:
  - mfg:yield --period 2025-09
  - mfg:coq --period 2025-Q3

7) Build Plan & Kitting (Deterministic MRP-lite)
- New: /mfg/mrp.py
- Inputs: demand (from S&OP, Phase 23), inventory on-hand, open POs (fixtures).
- Explosion → netting → planned orders by lead time; generate kitting lists.
- Artifacts: /artifacts/mfg/mrp/{plan.json, kitting_{wo}.csv}.
- CLI:
  - mfg:mrp --demand artifacts/sop/allocations.csv --inventory fixtures/mfg/inventory.csv --pos fixtures/mfg/open_pos.csv

8) Governance & Safety
- Duty-of-care gates:
  - Block plm:eco:release if SPC has critical findings on affected ops (DUTY_SPC_UNSTABLE).
  - Block mfg:wi:render for release if routing & BOM revs mismatch (DUTY_REV_MISMATCH).
- Policy pack:
  - Require dual approval on ECOs with risk=high.
  - Enforce supplier dual-source for critical items when BOM changes (tie-in to Phase 23 procurement).

9) Lake & Contracts
- New tables: plm_items, plm_boms, plm_changes, mfg_routings, mfg_wi, mfg_spc, mfg_yield, mfg_mrp, mfg_coq.
- Add schemas under /contracts/schemas/ and validate before writes.
- Emit metrics: plm_items_written, plm_changes_released, routing_cap_checked, wi_rendered, spc_findings, yield_reported, mrp_planned, coq_built.

10) Docs & Samples
- Fixtures:
  - fixtures/plm/items/*.csv, fixtures/plm/boms/*.csv
  - fixtures/mfg/work_centers.csv, fixtures/mfg/routings/*.yaml, fixtures/mfg/spc/*.csv, fixtures/mfg/inventory.csv, fixtures/mfg/open_pos.csv
- Docs:
  - /docs/plm.md (BOMs, ECO flow)
  - /docs/mfg-routing.md (work centers, capacity, WI)
  - /docs/spc-yield.md (SPC rules, FPY/RTY)
  - /docs/mrp-lite.md (planning & kitting)
  - README: "PLM & Manufacturing Ops" quickstart.

11) Tests & Quality (≥80% coverage)
- tests/test_bom.py (explode/where-used)
- tests/test_eco.py (impact calc, approvals, gate blocks)
- tests/test_routing_cap.py (throughput & cost math)
- tests/test_wi.py (revision locks)
- tests/test_spc.py (rule detections)
- tests/test_yield_coq.py (FPY/RTY, COQ rollups)
- tests/test_mrp.py (netting, lead-time offset)
- Contract validation tests for all new lake tables.

**Demo sequence (print expected output at end)**
1. python -m cli.console plm:items:load --dir fixtures/plm/items && python -m cli.console plm:bom:load --dir fixtures/plm/boms
2. python -m cli.console plm:bom:explode --item PROD-100 --rev A --level 3
3. python -m cli.console plm:eco:new --item PROD-100 --from A --to B --reason "Connector change" && python -m cli.console plm:eco:impact --id ECO-001
4. python -m cli.console mfg:wc:load --file fixtures/mfg/work_centers.csv && python -m cli.console mfg:routing:load --dir fixtures/mfg/routings && python -m cli.console mfg:routing:capcheck --item PROD-100 --rev B --qty 1000
5. python -m cli.console mfg:wi:render --item PROD-100 --rev B
6. python -m cli.console mfg:spc:analyze --op OP-200 --window 50 && python -m cli.console mfg:yield --period 2025-09
7. python -m cli.console mfg:mrp --demand artifacts/sop/allocations.csv --inventory fixtures/mfg/inventory.csv --pos fixtures/mfg/open_pos.csv
8. python -m cli.console mfg:coq --period 2025-Q3

**Implementation notes**
- Deterministic calculations everywhere; fixed control limits (calc from fixtures) and stable sorting.
- No external plotting libraries required; ASCII charts or inline HTML are fine.
- Reuse existing storage, signing, lineage, approvals, duty-of-care, and lake I/O.
- Keep tables phrases/numbers only; narrative explanations live in .md outputs.

JSON Schema (keeps prompts uniform)

/static/schemas/codex_prompt.schema.json

{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CodexPrompt",
  "type": "object",
  "required": ["type","id","slug","title","summary","tags","updated","version","copy_filename"],
  "properties": {
    "type": {"const": "codex-prompt"},
    "id": {"type":"string"},
    "slug": {"type":"string"},
    "title": {"type":"string"},
    "summary": {"type":"string"},
    "owner": {"type":"string"},
    "tags": {"type":"array","items":{"type":"string"}},
    "model_hint": {"type":"string"},
    "temperature": {"type":"number"},
    "updated": {"type":"string","format":"date"},
    "version": {"type":"string"},
    "canonical_repo": {"type":"string"},
    "copy_filename": {"type":"string"}
  }
}

Validate at build time (e.g., a tiny script that reads frontmatter → JSON → Ajv / Python jsonschema).
