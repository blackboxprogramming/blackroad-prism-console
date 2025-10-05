# Firstlight Add-on (macOS)

The Firstlight bundle contains two small utilities that exercise the
Prism stack from a local macOS console.

## Scripts

- `full_first_light.py` — announces **SYSTEM ONLINE** to the holo,
  posts a simulator panel, listens for heartbeat traffic, and prints a
  summary of which nodes checked in along with the average latency
  observed for each heartbeat.
- `test_patterns.py` — runs a quick visual sweep by cycling text sizes
  on the holo, showing an optional logo image, and emitting a panel plus
  a tiny chart to the simulator.

## Usage

```bash
# Activate your environment first
source ~/agent-venv/bin/activate

# Full bootstrap and heartbeat sweep
python agents/mac/full_first_light.py

# Visual sanity pass
python agents/mac/test_patterns.py
```

Environment variables are supported for overriding the MQTT host, port,
and timing parameters:

```bash
MQTT_HOST=pi-ops.local MQTT_PORT=1883 WINDOW_S=15 \
    python agents/mac/full_first_light.py
CYCLE_DELAY=2.0 python agents/mac/test_patterns.py
```
