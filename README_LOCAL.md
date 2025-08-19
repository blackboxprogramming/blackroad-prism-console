# Local ES Starter

This directory provides a local-first workflow for experimenting with
Evolution Strategies on the classic CartPole control task.  It avoids the
AWS-specific tooling of the original project and runs entirely on a laptop.

## Setup

```bash
bash scripts/setup_local.sh
```

This creates `.venv`, installs dependencies from `requirements-local.txt` and
verifies the environment.  MuJoCo is skipped by default.  To enable it later:

```bash
pip install mujoco gymnasium[mujoco]
```

## Train

```bash
bash scripts/run_local.sh train --iterations 50
```

Checkpoints are written to `checkpoints/es_cartpole/` and TensorBoard logs to
`runs/es_local`.

## TensorBoard

```bash
bash scripts/run_local.sh tb
```

## Logs

```bash
bash scripts/run_local.sh logs
```

## Extending

The code under `local/` is modular and torch-only, making it easy to plug in new
environments or policies.  MuJoCo or Atari environments can be added by
installing the appropriate extras and modifying `run_cartpole.py`.
