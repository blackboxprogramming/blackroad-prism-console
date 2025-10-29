# Pi Forever + Mac Cortex Bring-Up Card

*Keep this card near the bench for day-one wiring and smoke tests.*

## Side A — Layout & Roles

| Node       | Hardware | Role | Key Services |
|------------|----------|------|--------------|
| **Mac**    | Apple Silicon Mac | Cortex / Agent | Runs AI stack, UI, orchestration scripts.
| **Pi-Holo**| Raspberry Pi 5    | Hologram renderer | Drives pyramid display, consumes `holo/cmd`, optional Pi Camera.
| **Pi-Ops** | Raspberry Pi 5    | Operations hub | Mosquitto broker, monitoring, shared storage.
| **Pi-Sim** | Raspberry Pi Zero W | Simulator / dashboards | Renders `sim/output` topics.
| **Pi-400** | Raspberry Pi 400  | Admin / rescue | SSH jump box, HDMI switch tap-in.

### Network Spine
- All Pis on gigabit switch via Ethernet (Pi Zero W may stay on Wi-Fi).
- Mac on same LAN (Wi-Fi or USB-C Ethernet dongle).
- Mosquitto broker on **Pi-Ops**; everyone speaks MQTT.

### MQTT Topics
- `agent/output` – Mac publishes user-facing content.
- `holo/cmd` – Pi-Holo renders hologram cues.
- `sim/output` – Pi-Sim displays telemetry or dashboards.
- `monitor/#` – Pi-Ops aggregates logs and metrics.
- `system/heartbeat/<node>` – Each device pings presence.

### Shared Storage
- Optional `/srv/assets` on Pi-Ops via Samba or NFS for hologram media and shared artifacts.

---

## Side B — First-Light Checklist & Commands

### 1. Prep SD Cards (Raspberry Pi Imager)
- Pi-Holo: Pi 5 with desktop. Set hostname `pi-holo`, enable SSH, camera (if needed).
- Pi-Ops: Pi 5 Lite. Hostname `pi-ops`, enable SSH.
- Pi-Sim: Pi Zero W Lite. Hostname `pi-sim`, Wi-Fi creds.
- Pi-400: Desktop image. Hostname `pi-400`, enable SSH.

### 2. Boot Order
1. Power **Pi-Ops**, confirm Mosquitto running.
2. Bring up Mac, join LAN, run agent heartbeat.
3. Power Pi-Holo, verify holo render loop.
4. Boot Pi-Sim and Pi-400 as needed.

### 3. Mac Fast-Path Setup
```bash
python3 -m venv ~/agent-venv
source ~/agent-venv/bin/activate
pip install paho-mqtt fastapi uvicorn opencv-python pillow
cat <<'PY' > mac_agent.py
import json, time, paho.mqtt.client as mqtt
c = mqtt.Client(client_id="mac-agent")
c.connect("pi-ops.local", 1883, 60)
def publish(topic, payload):
    c.publish(topic, json.dumps(payload), qos=1)
publish("system/heartbeat/mac", {"ts": time.time(), "role": "agent"})
publish("holo/cmd", {"mode": "quad_image", "path": "/srv/assets/demo.png"})
publish("sim/output", {"text": "hello from mac"})
PY
python mac_agent.py
```

### 4. Pi-Ops Broker & Ops Tools
```bash
sudo apt update && sudo apt install -y mosquitto mosquitto-clients btop
sudo systemctl enable --now mosquitto
mosquitto_sub -h localhost -t '#' -v  # sanity check
```

### 5. Pi-Holo Renderer
```bash
pip install paho-mqtt pygame pillow
cat <<'PY' > holo_render.py
import json, pygame, paho.mqtt.client as mqtt
pygame.init(); screen = pygame.display.set_mode((720, 720))
def on_msg(c, u, m):
    payload = json.loads(m.payload)
    if payload.get("mode") == "quad_image":
        img = pygame.image.load(payload["path"]).convert()
        quad = pygame.transform.smoothscale(img, (360, 360))
        for x in (0, 360):
            for y in (0, 360):
                screen.blit(quad, (x, y))
        pygame.display.flip()
client = mqtt.Client("pi-holo")
client.connect("pi-ops.local", 1883, 60)
client.subscribe("holo/cmd")
client.on_message = on_msg
client.loop_forever()
PY
```
(Optional) systemd unit:
```bash
sudo tee /etc/systemd/system/holo.service >/dev/null <<'UNIT'
[Unit]
Description=Hologram Renderer
After=network-online.target
[Service]
ExecStart=/usr/bin/python3 /home/pi/holo_render.py
Restart=always
User=pi
[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl enable --now holo.service
```

### 6. Pi-Sim Subscriber
- Lightweight Pygame or console subscriber listening on `sim/output`.

### 7. Pi-400 Admin Comforts
```bash
ssh-copy-id pi@pi-ops.local
ssh-copy-id pi@pi-holo.local
ssh-copy-id pi@pi-sim.local
cat >> ~/.bashrc <<'EOB'
alias ph='ssh pi@pi-holo.local'
alias po='ssh pi@pi-ops.local'
alias ps='ssh pi@pi-sim.local'
EOB
```

### 8. Monitoring & Scaling Tips
- Start with `btop`, `journalctl -f`, simple MQTT loggers.
- Optional: Telegraf → InfluxDB/Grafana (Mac Docker or Pi-Ops).
- Need more acceleration? Add Pi 5 + Hailo AI HAT or Coral USB TPU.
- For large models, burst to cloud and stream results back.

### Physical Reminders
- Individual power supplies per Pi; avoid powering from USB hubs.
- Label cables, keep Pi camera adapters handy (15↔22-pin).
- WAVLINK splitter is clone-only; no extended desktop.
- Custom displays may require extra modes in `/boot/firmware/config.txt`.
