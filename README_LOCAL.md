# Local Evolution Strategies

This directory provides a local-first pathway for running the Evolution Strategies starter without AWS.

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
