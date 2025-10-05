# Pi Cortex Observability Bundle (v3)

This bundle wires up a lightweight observability stack for the Pi Cortex fleet:

- **InfluxDB 2.x** for time-series storage
- **Grafana** pre-provisioned with an InfluxDB datasource and the "Pi Cortex – Ops Panel" dashboard
- **Telegraf** agent configurations for Raspberry Pi nodes and the Pi Ops MQTT heartbeat stream

The directory layout mirrors the environments you need to touch:

```
observability/
├── mac/                  # Docker compose stack for your Mac (InfluxDB + Grafana)
│   ├── docker-compose.yml
│   ├── .env.example      # Copy to .env and drop in secrets (Influx token)
│   └── grafana/
│       └── provisioning/ # Datasource + dashboard provisioning
└── pis/
    ├── telegraf.pi.conf
    └── telegraf.pi-ops.mqtt.conf
```

## Quick start

### 1. Bring up InfluxDB + Grafana on your Mac

```bash
cd observability/mac
cp .env.example .env  # optional: you can leave GF_INFLUX_TOKEN blank for the first boot
# start the stack
docker compose up -d
open http://localhost:8086
```

InfluxDB is bootstrapped with the following defaults:

| Setting | Value |
| --- | --- |
| Username | `admin` |
| Password | `adminadmin` |
| Organization | `pi-cortex` |
| Bucket | `telemetry` |

Log into the InfluxDB UI and create a **Read/Write token** for the `telemetry` bucket. Copy the token somewhere safe.

Update `observability/mac/.env` and set `GF_INFLUX_TOKEN` to the new token, then reload Grafana so the datasource picks it up:

```bash
printf 'GF_INFLUX_TOKEN=%s\n' '<paste token>' > observability/mac/.env  # this overwrites the file
cd observability/mac
docker compose up -d grafana
open http://localhost:3000  # admin/adminadmin
```

### 2. Point each Pi to your Mac

For every Raspberry Pi, edit the corresponding Telegraf config file under `observability/pis/` and replace the placeholders:

- `{INFLUX_HOST}` – the IP or hostname of your Mac (reachable from the Pi network)
- `{INFLUX_TOKEN}` – the Read/Write token you generated for the `telemetry` bucket
- `{MQTT_HOST}` / `{MQTT_USERNAME}` / `{MQTT_PASSWORD}` – only in the Pi Ops MQTT config

Then copy the config to the Pi and restart Telegraf. Example for `pi-holo` and `pi-sim`:

```bash
sudo apt update && sudo apt install -y telegraf
scp observability/pis/telegraf.pi.conf pi@pi-holo.local:/home/pi/telegraf.conf
ssh pi@pi-holo.local 'sudo mv telegraf.conf /etc/telegraf/telegraf.conf && sudo systemctl enable --now telegraf'
```

For Pi Ops (MQTT heartbeat stream), push the MQTT variant:

```bash
scp observability/pis/telegraf.pi-ops.mqtt.conf pi@pi-ops.local:/home/pi/telegraf.conf
ssh pi@pi-ops.local 'sudo mv telegraf.conf /etc/telegraf/telegraf.conf && sudo systemctl restart telegraf'
```

### 3. Watch the dashboard

Grafana lives at [http://localhost:3000](http://localhost:3000) (credentials `admin/adminadmin`). The **Pi Cortex – Ops Panel** dashboard will light up as soon as the first metrics land.

## Telegraf configuration notes

- `telegraf.pi.conf` collects CPU, memory, disk, system uptime, and Raspberry Pi SoC temperature (`/sys/class/thermal/thermal_zone0/temp`).
- `telegraf.pi-ops.mqtt.conf` subscribes to `system/heartbeat/+` via MQTT and writes any JSON payload fields into InfluxDB along with topic metadata.

Feel free to customize intervals, measurement tags, or additional inputs as you expand observability coverage.
