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
```bash
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
