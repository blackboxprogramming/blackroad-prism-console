# Standard Operating Procedures (SOP) Engine

The `sops` module provides a lightweight framework for defining and executing
BlackRoad's enterprise-grade SOPs. Procedures are authored in YAML using the EPA
SOP format (`title`, `purpose`, `scope`, `procedure`, `quality_control`).

## CLI Usage

```
blackroad sops run <procedure>
```

Example:

```
blackroad sops run release_deployment_flow
```

Each step execution emits an immutable JSON record with a SHA256 hash to
`sops/records/`.  These records form the basis for GAAP/10-K level audits and
compliance reporting.

## Dashboard Stub

A minimal Flask dashboard is available in `sops/ui/app.py` for browsing and
triggering SOPs via a web interface.  It can be started with:

```
python sops/ui/app.py
```

This module is a scaffold and will be extended with Lucidia triggers,
predictive checks, and strategic-fit analytics in future phases.
