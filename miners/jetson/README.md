# Jetson miners (learn-mode, CUDA, low power)

These are for **education**, not profit. Everything is throttled / duty-cycled.
Works on NVIDIA Jetson devices with JetPack (CUDA + nvidia-container-runtime).

## Build xmrig-cuda (Jetson)
```bash
cd miners/jetson
docker build -t xmrig-cuda-arm64 .
```

## Run via compose (opt-in)
```bash
docker compose -f miners/jetson/jetson-compose.yml config
docker compose -f miners/jetson/jetson-compose.yml up -d xmrig-cuda
docker compose -f miners/jetson/jetson-compose.yml stop xmrig-cuda
```

## Native systemd (opt-in)
```bash
sudo cp miners/jetson/xmrig-cuda.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now xmrig-cuda.service
sudo systemctl status xmrig-cuda --no-pager
```

## Power / safety knobs
- `nvpmodel` to select low-power modes (see `nvpmodel.sh`)
- duty cycle: BURST/COOL seconds (in env)
- thermal guard via `tegrastats` (stops if too hot)
