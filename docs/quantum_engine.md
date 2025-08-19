# Lucidia Quantum Engine

This module provides a local-only quantum simulation backend based on TorchQuantum.
It is intended for research features in Lucidia and a gated demo inside BlackRoad.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r envs/quantum/requirements.txt
```

## Deterministic runs

All execution is seeded. Use `--seed` on the CLI to reproduce results.

## Limits

- Maximum wires: 8
- Maximum shots: 2048
- Default timeout: 60s

## Examples

```bash
lucidia-quantum run --example vqe --wires 4 --shots 1024
lucidia-quantum bench --suite smoke
lucidia-quantum qasm --in model.ckpt --out model.qasm
```
