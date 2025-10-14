#!/bin/bash
# Raspberry Pi 4 Mini Tower - Developer Mode Setup
# Run this after first boot: curl -sSL https://your-url/setup.sh | bash

set -e

echo "==> Updating system..."
sudo apt update && sudo apt full-upgrade -y

echo "==> Installing essentials..."
sudo apt install -y git python3-pip python3-venv htop vim curl wget \
  build-essential i2c-tools lm-sensors docker.io docker-compose

echo "==> Adding pi user to docker group..."
sudo usermod -aG docker $USER

echo "==> Enabling I2C for OLED and sensors..."
sudo raspi-config nonint do_i2c 0

echo "==> Installing Python libs..."
pip3 install --upgrade pip
pip3 install RPi.GPIO rpi_ws281x adafruit-circuitpython-ssd1306 pillow psutil luma.oled

echo "==> Setting up fan control service..."
cat <<SERVICE | sudo tee /etc/systemd/system/fancontrol.service
[Unit]
Description=Fan PWM Control
After=multi-user.target

[Service]
ExecStart=/usr/bin/python3 /home/$USER/fancontrol.py
Restart=always
User=$USER

[Install]
WantedBy=multi-user.target
SERVICE

# Simple fan control script
cat <<'PYTHON' > /home/$USER/fancontrol.py
import RPi.GPIO as GPIO
import time
import os

FAN_PIN = 18
GPIO.setmode(GPIO.BCM)
GPIO.setup(FAN_PIN, GPIO.OUT)
fan = GPIO.PWM(FAN_PIN, 25000)
fan.start(0)

def get_temp():
    out = os.popen("vcgencmd measure_temp").readline()
    return float(out.replace("temp=", "").replace("'C\n", ""))

try:
    while True:
        t = get_temp()
        duty = 0 if t < 50 else 50 if t < 65 else 100
        fan.ChangeDutyCycle(duty)
        time.sleep(5)
except KeyboardInterrupt:
    fan.stop()
    GPIO.cleanup()
PYTHON

sudo systemctl enable fancontrol.service
sudo systemctl start fancontrol.service

echo "==> Setting up OLED stats script..."
cat <<'PYTHON' > /home/$USER/oledstats.py
from luma.core.interface.serial import i2c
from luma.oled.device import ssd1306
from PIL import Image, ImageDraw, ImageFont
import psutil
import time
import socket

serial = i2c(port=1, address=0x3C)
device = ssd1306(serial)
font = ImageFont.load_default()

while True:
    img = Image.new("1", device.size, 0)
    draw = ImageDraw.Draw(img)

    ip = socket.gethostbyname(socket.gethostname())
    cpu = psutil.cpu_percent()
    mem = psutil.virtual_memory().percent

    draw.text((0, 0), f"IP: {ip}", font=font, fill=255)
    draw.text((0, 12), f"CPU: {cpu}%", font=font, fill=255)
    draw.text((0, 24), f"RAM: {mem}%", font=font, fill=255)

    device.display(img)
    time.sleep(2)
PYTHON

echo "==> Developer Mode setup complete."
echo "Reboot, then check fan + OLED. Happy hacking! ⚡"
