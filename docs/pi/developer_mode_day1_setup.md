# Raspberry Pi Tower Developer Mode Day 1 Setup

This guide assumes the Raspberry Pi has been assembled in the ElectroCookie tower with cooling, RGB lighting, and an SSD attached via USB/SATA adapter or dock.

## 1. First Boot Preparation (on workstation)

```bash
# Identify boot medium (SSD recommended) and flash Raspberry Pi OS (Lite or Desktop)
# Replace /dev/sdX with the correct device for your SSD or USB stick
sudo rpi-imager
# or use Raspberry Pi Imager CLI
# sudo rpi-imager --cli --os raspberrypi_os_lite_arm64 --storage /dev/sdX --hostname pi-tower --username pi --password 'change-me'

# Enable SSH and configure Wi-Fi before first boot (if not using Ethernet)
# Mount the boot partition and add:
cat <<'WPA' | sudo tee /media/$USER/boot/wpa_supplicant.conf
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=US

network={
    ssid="YOUR_WIFI_SSID"
    psk="YOUR_WIFI_PASSWORD"
}
WPA

sudo touch /media/$USER/boot/ssh
```

## 2. Initial Login & System Update

```bash
# Default credentials if not customized during imaging: pi / raspberry
ssh pi@pi-tower.local

# Update EEPROM for SSD boot reliability
sudo rpi-eeprom-update -a
sudo reboot

# Reconnect after reboot
ssh pi@pi-tower.local

# Update packages
sudo apt update && sudo apt full-upgrade -y
sudo apt install -y git python3-pip python3-venv docker.io docker-compose-plugin \
    htop lm-sensors i2c-tools lsb-release vim unzip curl wget neofetch
```

## 3. Storage & Dock Verification

```bash
# Confirm SSD and dock devices
lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINT
lsusb

# Optional: move root filesystem to SSD if still booting from SD
# Follow official docs: https://www.raspberrypi.com/documentation/computers/raspberry-pi.html
```

## 4. Enable Interfaces & Services

```bash
# Enable SSH, VNC, I2C, SPI, camera if needed
sudo raspi-config nonint do_ssh 0
sudo raspi-config nonint do_vnc 0
sudo raspi-config nonint do_i2c 0
sudo raspi-config nonint do_spi 0

# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

## 5. Fan & RGB Control

```bash
# Install Python dependencies for RGB (GPIO18 / PWM0, WS281x strip)
python3 -m pip install --user --upgrade pip
python3 -m pip install --user rpi_ws281x adafruit-circuitpython-neopixel gpiozero

# Create systemd service directory
mkdir -p ~/services
cat <<'PY' > ~/services/pi_tower_status.py
#!/usr/bin/env python3
import os
import subprocess
import time

from gpiozero import CPUTemperature, PWMLED
from rpi_ws281x import PixelStrip, Color

LED_PIN = 18
LED_COUNT = 8
FAN_PIN = 12  # PWM-capable pin via transistor/fan controller

strip = PixelStrip(LED_COUNT, LED_PIN, brightness=128, auto_write=False)
strip.begin()

fan = PWMLED(FAN_PIN)
fan.value = 0.3

cpu = CPUTemperature()

def color_for_temp(temp_c):
    if temp_c < 50:
        return Color(0, 0, 255)
    if temp_c < 65:
        return Color(0, 255, 0)
    return Color(255, 0, 0)

while True:
    temp = cpu.temperature
    strip_color = color_for_temp(temp)
    for i in range(LED_COUNT):
        strip.setPixelColor(i, strip_color)
    strip.show()

    fan.value = min(1.0, max(0.3, (temp - 40) / 40))
    time.sleep(5)
PY
chmod +x ~/services/pi_tower_status.py

cat <<'SERVICE' | sudo tee /etc/systemd/system/pi-tower-status.service
[Unit]
Description=Pi Tower Fan and RGB Controller
After=network.target

[Service]
Type=simple
User=pi
Environment=PYTHONUNBUFFERED=1
ExecStart=/usr/bin/env python3 /home/pi/services/pi_tower_status.py
Restart=on-failure

[Install]
WantedBy=multi-user.target
SERVICE

sudo systemctl daemon-reload
sudo systemctl enable --now pi-tower-status.service
```

## 6. Developer Mode Tooling

```bash
# Install monitoring stack (Grafana + InfluxDB + Telegraf) via Docker compose
mkdir -p ~/stacks/monitoring
cat <<'YML' > ~/stacks/monitoring/docker-compose.yml
version: "3.8"
services:
  influxdb:
    image: influxdb:2.7
    restart: unless-stopped
    volumes:
      - ./influxdb:/var/lib/influxdb2
    ports:
      - "8086:8086"

  grafana:
    image: grafana/grafana:10.4.3
    restart: unless-stopped
    depends_on:
      - influxdb
    ports:
      - "3000:3000"
    volumes:
      - ./grafana:/var/lib/grafana

  telegraf:
    image: telegraf:1.30
    restart: unless-stopped
    depends_on:
      - influxdb
    volumes:
      - ./telegraf/telegraf.conf:/etc/telegraf/telegraf.conf:ro
    environment:
      - HOST_PROC=/host/proc
      - HOST_SYS=/host/sys
    network_mode: "host"
    pid: "host"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
YML

mkdir -p ~/stacks/monitoring/telegraf
cat <<'TELEGRAF' > ~/stacks/monitoring/telegraf/telegraf.conf
[agent]
  interval = "10s"
  round_interval = true

[[outputs.influxdb_v2]]
  urls = ["http://localhost:8086"]
  token = "$INFLUX_TOKEN"
  organization = "pi-tower"
  bucket = "metrics"

[[inputs.cpu]]
  percpu = true
  totalcpu = true
  fielddrop = ["time_*"]

[[inputs.mem]]
[[inputs.disk]]
[[inputs.diskio]]
[[inputs.net]]
[[inputs.temp]]
  fieldpass = ["temp"]
TELEGRAF

# Launch the monitoring stack
cd ~/stacks/monitoring
INFLUX_TOKEN=changeme docker compose up -d
```

## 7. Optional Dev Containers

```bash
mkdir -p ~/stacks/dev
cat <<'DEVYML' > ~/stacks/dev/docker-compose.yml
version: "3.8"
services:
  python:
    image: python:3.11-slim
    command: sleep infinity
    volumes:
      - ../workspace:/workspace
    working_dir: /workspace

  node:
    image: node:20
    command: sleep infinity
    volumes:
      - ../workspace:/workspace
    working_dir: /workspace
DEVYML

cd ~/stacks/dev
docker compose up -d
```

## 8. Verification Checklist

```bash
# Confirm services
systemctl status pi-tower-status.service

# Docker stacks
docker ps

# Sensor readings
vcgencmd measure_temp
htop

# Network
hostname -I
```

## 9. Security & Maintenance

- Change default passwords immediately (`passwd`).
- Configure unattended upgrades (`sudo apt install unattended-upgrades` and enable).
- Set up regular snapshots or backups of SSD using `rsync` or `restic`.
- Document any GPIO pin usage for future expansions.

This script delivers a ready-to-develop Raspberry Pi tower with monitoring, automation, and containerized tooling in approximately 10 minutes post-boot.
