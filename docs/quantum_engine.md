# Lucidia Quantum Engine

This module provides a local-only quantum simulation backend with runtime backend
selection. TorchQuantum remains the default simulator, while Pennylane and
Qiskit adapters allow exporting circuits or running small analytic experiments
without leaving the local workstation. It is intended for research features in
Lucidia and a gated demo inside BlackRoad.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r envs/quantum/requirements.txt
```

## Backends

```bash
lucidia-quantum --list-backends
```

The CLI auto-detects TorchQuantum, Pennylane (when installed), and Qiskit. Use
`--backend pennylane` with the `qasm` command to export Pennylane-driven
circuits, or stay with TorchQuantum for batched training flows. Training
commands currently require the TorchQuantum backend.

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
lucidia-quantum --backend pennylane qasm --in model.ckpt --out model.qasm
```
