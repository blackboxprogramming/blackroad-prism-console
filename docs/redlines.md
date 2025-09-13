# Redlines

`legal.redline` provides deterministic comparison of contract versions.

```bash
python -m cli.console legal:redline --old artifacts/legal/C001_v1.md --new artifacts/legal/C001_v2.md
```

The command writes unified diff markdown and structured JSON under `artifacts/legal/redlines` and computes a simple risk score based on changed clause identifiers.
