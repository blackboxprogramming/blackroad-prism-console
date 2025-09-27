# Jetson miners (learn-mode, CUDA, low power)

- Tested on NVIDIA Jetson with JetPack (has nvidia-container-runtime & CUDA).
- Everything is throttled / duty-cycled. Thermal guard uses `tegrastats`.

## build xmrig-cuda (CUDA plugin) on Jetson
```bash
cd miners/jetson
docker build -t xmrig-cuda-arm64 .
```

run (compose)

```bash
docker compose -f miners/jetson/jetson-compose.yml config
docker compose -f miners/jetson/jetson-compose.yml up -d xmrig-cuda
# stop:
docker compose -f miners/jetson/jetson-compose.yml stop xmrig-cuda
```

native systemd

```bash
sudo cp miners/jetson/xmrig-cuda.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now xmrig-cuda.service
sudo systemctl status xmrig-cuda --no-pager
```

safety knobs
- nvpmodel power mode (lower TDP)
- duty-cycle timer
- temp brake (tegrastats) -> stops the miner if SoC gets hot

---
