# Local Evolution Strategies

This directory provides a local-first pathway for running the Evolution Strategies starter without AWS.
# Local ES Starter

This directory provides a local-first workflow for experimenting with
Evolution Strategies on the classic CartPole control task.  It avoids the
AWS-specific tooling of the original project and runs entirely on a laptop.

## Setup

```bash
bash scripts/setup_local.sh
```

## Training CartPole

```bash
bash scripts/run_local.sh
```

TensorBoard will be available on [http://localhost:6006](http://localhost:6006).

Checkpoints are saved under `checkpoints/es_cartpole/`.

## Extending

The code is structured to make it easy to swap environments or models. To enable MuJoCo or Atari later, install the relevant `gymnasium` extras and update `run_cartpole.py`.
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

_Last updated on 2025-09-11_
