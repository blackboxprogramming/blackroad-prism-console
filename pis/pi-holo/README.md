# Pi-Holo Audio Add-on

This directory contains the MQTT audio playback service for the Pi-Holo along with
helper tooling to publish alerts from macOS workstations.

## Files

- `audio_player.py` — MQTT subscriber that plays audio files with `pygame.mixer`.
- `audio.service` — systemd unit that starts the audio listener during boot.

The macOS publisher lives in `agent/mac/send_audio.py`.

## Installation on the Pi-Holo

```sh
scp pis/pi-holo/audio_player.py pis/pi-holo/audio.service pi@pi-holo.local:/home/pi/
ssh pi@pi-holo.local <<'EOF'
sudo apt update
sudo apt install -y python3-pip
pip install --break-system-packages pygame paho-mqtt
mkdir -p /home/pi/sounds
sudo mv /home/pi/audio.service /etc/systemd/system/audio.service
sudo systemctl daemon-reload
sudo systemctl enable --now audio
EOF
```

Sound files are expected inside `/home/pi/sounds`. Place `alert.wav` (or other
OGG/WAV assets) in that directory.

## Sending audio commands

From a Mac that already publishes MQTT events for Pi-ops:

```sh
python agent/mac/send_audio.py alert.wav 0.8 0  # plays once at 80%
python agent/mac/send_audio.py alert.wav 0.6 1  # loop the clip
python agent/mac/send_audio.py --stop           # stop playback
```

The script uses the same environment variables as the other MQTT helpers:

- `MQTT_HOST`, `MQTT_PORT`, `MQTT_USERNAME`, `MQTT_PASSWORD`
- `MQTT_TLS`/`MQTT_CA_FILE` for TLS settings
- `AUDIO_TOPIC` if you need something other than `holo/audio`

Alternatively you can publish stop messages directly:

```sh
mosquitto_pub -h pi-ops.local -t holo/audio -m '{"stop":true}'
```

To integrate with Reflex automations, publish JSON payloads such as
`{"file":"alert.wav","volume":0.9}` to the `holo/audio` topic alongside your
existing `holo/cmd` banners.
