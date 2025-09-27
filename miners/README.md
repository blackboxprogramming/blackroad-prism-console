# Miners (learn-mode, low power)

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

Duty-cycle (crontab) to get near-zero average watts

Run 15 minutes per hour:

0 * * * *   systemctl start xmrig.service
15 * * * *  systemctl stop xmrig.service

---
