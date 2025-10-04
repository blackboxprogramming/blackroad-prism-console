# Quiet Loop Experiment — Charged Drift

## Micro-concept
Stay with the first charged tension: the instant when a muted signal tips past the threshold and makes itself known.

## Prototype
A one-line update governs the state: `state = damping * state + impulse`. Each impulse comes from a centered uniform draw scaled by `drift`. We keep the loop quiet by refusing to log anything until the magnitude escapes the `threshold`.

Run `python experiments/quiet_loop.py` and watch only the breaches print.

## What invited more
The first surprise lands at step 14 with the default seed. The breach exposes how the damping lets a single impulse ring for multiple beats. Tweaking `drift` or `threshold` quickly shifts the cadence, encouraging additional probes around stability versus resonance.

## Next motion
Nudge the threshold dynamically (e.g., cool it over time) and see whether the loop keeps producing sparse, meaningful spikes or collapses into chatter.
