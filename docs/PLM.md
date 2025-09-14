# Offline PLM & Manufacturing Ops Layer

This module set provides basic offline Product Lifecycle Management (PLM)
capabilities for air‑gapped deployments.  All artifacts are stored as flat
JSON files with accompanying SHA256 hashes so that the data can be audited
or exported without external dependencies.

## Bills of Materials

`plm/bom_manager.py` manages versioned BOMs.  Use the `plmctl` CLI:

```bash
# create a BOM revision A
python plm/bom_manager.py new --bom WIDGET --effectivity 2024-01-01 \
    --lines CPU:1,CASE:1

# revise to revision B
python plm/bom_manager.py revise --bom WIDGET --from A --effectivity 2024-06-01 \
    --lines CPU:1,CASE:1,BATTERY:1

# show differences between revisions
python plm/bom_manager.py diff --bom WIDGET --a A --b B
```

## Engineering Change Orders

`plm/eco_controller.py` exposes simple functions mimicking REST endpoints
for creating and approving ECOs.  Records are stored under
`artifacts/plm/eco` and mirrored into the Lucidia memory log so that
future changes can learn from prior decisions.

## Routings & Work Centers

`plm/routings.json` defines example work centers and routing steps with
cycle times.  The data can be consumed by other tools to generate printable
work instructions.

## Manufacturing Quality

`plm/quality/spc_engine.py` provides utilities for recording sample
measurements and computing basic X-bar and range charts.  Yield tracking is
available per work center and will emit SOC alerts and Lucidia memories if
performance drops below a specified SLA.

## Cost of Quality

`plm/finance/coq_tracker.py` records prevention, appraisal and failure
costs.  A `rollup()` function returns totals for dashboard views in the
finance layer.

## Governance & Audit

All modules write data into the `artifacts/` tree.  Each JSON artifact is
accompanied by a `.sha256` file containing the hash of the contents.  These
files can be packaged and exported for ISO9001 or SOX style audits without
reliance on external infrastructure.
