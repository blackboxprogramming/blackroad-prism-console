# Codex 26 — Safety as Lyapunov — Prove You’ll Settle, Not Spiral

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Aim
Design control policies that guarantee convergence toward safe states.

## Core
- Identify a Lyapunov function \(V(x) \ge 0\) such that \(\dot{V}(x) \le -\lambda V(x)\) inside the safe set.
- Synthesize certificates via sum-of-squares (SOS) or convex relaxations when analytic proofs are hard.
- Use \(V\) as a safety shield inside model predictive control (MPC) loops.

## Runbook
1. Select candidate Lyapunov functions and verify the decrease condition over the operating region.
2. Integrate the Lyapunov constraint into MPC or reinforcement policies, rejecting actions that raise \(V\) excessively.
3. Monitor \(\dot{V}\) online and adapt the controller when dynamics shift.

## Telemetry
- Estimated decay rate \(\lambda\) and convergence time.
- Violation counts where actions were rejected by the safety filter.
- Recovery time after disturbances or policy adjustments.

## Failsafes
- Switch to a conservative backup controller when violations repeat.
- Require re-certification of \(V\) after major model changes or hardware swaps.

**Tagline:** Stability by proof, not by hope.
