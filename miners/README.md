# Miners (learn-mode, low power)

> Education & telemetry only — not profit. Everything is **off by default**, throttled, and easy to duty-cycle so average watts ≈ “rounding error”.

## Services included
- **Monero (xmrig)** – CPU PoW, best for demos
- **Verus (verusminer)** – efficient CPU algo (still tiny on a Pi)
- **Litecoin (scrypt CPU demo)** – educational; real LTC needs Scrypt ASICs
- **Chia farmer** – ultra-low energy **farming** of pre-plotted drives

## Compose (don’t start until you’re ready)
```bash
docker compose -f miners/miners-compose.yml config   # validate only
docker compose -f miners/miners-compose.yml up -d xmrig          # enable xmrig (example)
docker compose -f miners/miners-compose.yml stop xmrig           # stop
```

## Native systemd (xmrig, throttled, hardened)
# Miners pack (opt-in, throttled)

Educational miners designed for demos and power-budget experiments. Everything defaults to low impact and requires explicit opt-in.

## Services included
- **Monero (xmrig)** – CPU PoW; best for demos
- **Verus (verusminer)** – efficient CPU algo; still tiny on a Pi
- **Chia farmer** – ultra-low energy **farming** of pre-plotted drives
- **Litecoin (scrypt CPU demo)** – educational only (real LTC needs Scrypt ASICs)
- **Jetson CUDA (xmrig-cuda)** – GPU learn-mode on NVIDIA Jetson (see `miners/jetson/`)
**Important:** These are for education, not profit. We hard-cap CPU, add temp
watchers, and recommend duty cycles so average watts are tiny (and “solar-offsetable”).

## Services included
- **Monero (xmrig)** – CPU PoW; best fit for a Pi in learn-mode
- **Verus (verusminer)** – efficient CPU algo; still tiny on a Pi
- **Chia (farmer/harvester only)** – ultra-low energy, needs pre-plotted drives

## Turn on (only what you want)
```bash
# Monero xmrig (Docker):
docker compose -f miners/miners-compose.yml up -d xmrig

# stop anytime:
docker compose -f miners/miners-compose.yml stop xmrig
```

### Jetson CUDA (learn-mode)
```bash
docker compose -f miners/jetson/jetson-compose.yml config
docker compose -f miners/jetson/jetson-compose.yml up -d xmrig-cuda
```
Stop the Jetson container with:
```bash
docker compose -f miners/jetson/jetson-compose.yml stop xmrig-cuda
```

Native systemd (xmrig, throttled, hardened)

```bash
# Verus (Docker):
docker compose -f miners/miners-compose.yml up -d verusminer

# Chia farmer (you must mount /mnt/plots with your plots):
docker compose -f miners/miners-compose.yml up -d chia

Turn off

docker compose -f miners/miners-compose.yml stop xmrig

Native systemd (Monero) instead of Docker

sudo cp miners/xmrig/xmrig.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now xmrig.service
sudo systemctl status xmrig --no-pager
```

## Duty-cycle to hit “near-zero” average watts
Run 15 min per hour:
```
0 * * * *   systemctl start xmrig.service
15 * * * *  systemctl stop xmrig.service
```

## Safety
- CPU caps (`cpus: 0.25` / `CPUQuota=25%`)
- Temp watcher for Docker xmrig (`watch-temp.mjs`)
- No keys or secrets here. Addresses (if used elsewhere) are always masked/digested in logs.

Duty-cycle (crontab) to get near-zero average watts

Run 15 minutes per hour:

0 * * * *   systemctl start xmrig.service
15 * * * *  systemctl stop xmrig.service

---
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
