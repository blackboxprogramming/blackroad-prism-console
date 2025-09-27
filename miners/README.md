# Miners pack (opt-in, throttled)

Educational miners designed for demos and power-budget experiments. Everything defaults to low impact and requires explicit opt-in.

## Services included
- **Monero (xmrig)** – CPU PoW; best for demos
- **Verus (verusminer)** – efficient CPU algo; still tiny on a Pi
- **Chia farmer** – ultra-low energy **farming** of pre-plotted drives
- **Litecoin (scrypt CPU demo)** – educational only (real LTC needs Scrypt ASICs)
- **Jetson CUDA (xmrig-cuda)** – GPU learn-mode on NVIDIA Jetson (see `miners/jetson/`)

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
sudo cp miners/xmrig/xmrig.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now xmrig.service
sudo systemctl status xmrig --no-pager
```
