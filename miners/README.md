# Low-Power Miner Toolkit

This package provides copy/paste-ready configuration for experimenting with CPU-based Proof-of-Work miners and low-power Chia farming on small ARM boards (for example, Raspberry Pi). Every service is **disabled by default**, heavily throttled, and designed for learn-mode usage so that the average energy draw can be kept close to "zero" when combined with duty cycling or a small solar offset.

## Contents

- [`miners-compose.yml`](./miners-compose.yml) – Docker Compose bundle with Monero (XMRig), Verus (VerusHash 2.2), and a Chia farming role. Each service is read-only, CPU and memory capped, and requires manual opt-in.
- [`systemd/`](./systemd) – Hardened unit files that apply similar throttles when running the miners natively under `systemd`.
- [`miner-math.mjs`](./miner-math.mjs) – Node 20 scratchpad to estimate energy cost, duty cycles, and hypothetical revenue to help communicate the "effective zero" cost argument.

## Usage Overview

1. **Clone + copy**: Copy the needed files onto the Pi (for example via `scp`).
2. **Edit placeholders**: Replace `POOL_HOST:PORT`, `YOUR_XMR_ADDRESS`, `YOUR_VRSC_ADDRESS`, and mount paths before enabling any service.
3. **Opt-in intentionally**: Bring up one container at a time, or enable the matching `systemd` unit. Everything ships off by default.
4. **Schedule short duty cycles**: Use cron or `systemd` timers to run miners for short windows (e.g., 15 minutes per hour) to keep the average wattage minimal.
5. **Track cost with math tool**: Run `node miner-math.mjs --watts=<avg> --kwh=<price> --hrs=<daily_runtime> --rev=<revenue>` to quantify the real cost envelope.

See the inline comments in each file for additional guidance and safety notes.
