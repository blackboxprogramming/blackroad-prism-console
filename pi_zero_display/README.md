# Pi Zero Display Client

This folder packages a lightweight MQTT display loop tailored for the Pi Zero W.
It listens for JSON payloads that describe either text or image frames, renders
in pygame, and targets a modest 12 FPS refresh to keep CPU usage low.

## Features
- MQTT subscriber that defaults to the `pi-zero/display` topic.
- Text renderer supporting custom foreground/background colours and font sizes.
- Image renderer that accepts base64-encoded PNG/JPEG payloads.
- Fullscreen loop tuned for 12 FPS but configurable via CLI or environment.
- Systemd unit + helper script for single-command bring-up on a Pi Zero W.

## Installation / Bring-up
```bash
# copy the bundle to your Pi Zero
scp -r pi_zero_display pi@pi-zero.local:~

# log in and run once interactively (installs deps into a venv)
ssh pi@pi-zero.local
cd ~/pi_zero_display
bash run.sh --fullscreen
```

The `run.sh` helper ensures a local virtual environment exists and installs the
Python dependencies listed in `requirements.txt`. Subsequent runs reuse the venv
and start the display immediately.

## Systemd service
To run the display client on boot, install the provided service:
```bash
sudo cp ~/pi_zero_display/pi-zero-display.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable pi-zero-display.service
sudo systemctl start pi-zero-display.service
```

Logs are available via `journalctl -u pi-zero-display.service`.

## Configuration
The display accepts both CLI arguments and environment variables. The defaults
are suitable for a 480×320 SPI/mini-HDMI panel.

| Option | Environment | Default | Description |
| ------ | ----------- | ------- | ----------- |
| `--host` | `PI_ZERO_MQTT_HOST` | `localhost` | MQTT broker hostname |
| `--port` | `PI_ZERO_MQTT_PORT` | `1883` | MQTT broker port |
| `--topic` | `PI_ZERO_MQTT_TOPIC` | `pi-zero/display` | Subscription topic |
| `--size` | `PI_ZERO_DISPLAY_SIZE` | `480x320` | Display resolution |
| `--fps` | `PI_ZERO_FPS` | `12` | Target frames per second |
| `--fullscreen` | `PI_ZERO_FULLSCREEN` (`1` to enable) | off | Use fullscreen mode |
| `--username` | `PI_ZERO_MQTT_USERNAME` | _unset_ | MQTT username |
| `--password` | `PI_ZERO_MQTT_PASSWORD` | _unset_ | MQTT password |

## Accepted Payloads
The subscriber expects UTF-8 JSON messages with the following shapes:

### Text
```json
{ "type": "text", "text": "Hello", "color": [255, 255, 255], "bg": [0, 0, 0], "size": 64 }
```

### Image
```json
{ "type": "image", "b64": "<base64 PNG/JPEG>" }
```

## Testing locally
A helper publisher lives at `tools/sim_pub.py` in this repository. From any
machine with network access to the MQTT broker you can send test frames:
```bash
python3 tools/sim_pub.py --text "Hello" --color 0 255 0
python3 tools/sim_pub.py --image path/to/image.png
```

Use `--host`, `--port`, and `--topic` to override the defaults.
