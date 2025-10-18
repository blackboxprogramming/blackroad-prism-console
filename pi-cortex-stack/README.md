# Pi Cortex Stack

This bundle contains everything needed to stand up the Pi Cortex demo stack
across a Mac orchestration node and one or more Raspberry Pi endpoints. It is
intended as an easy way to run the "first light" demo that drives both the
holographic renderer and the simulator panel via MQTT.

## Repository layout

```
pi-cortex-stack/
├── assets/                   # Drop shared assets like logo.png here
├── first_light.py            # Smoke test script that triggers HELLO
├── launch_agents/
│   └── com.blackroad.pi-cortex-agent.plist  # LaunchAgent for auto start
├── mac_agent.py              # Mac-side agent that pushes assets and commands
├── Makefile                  # Convenience targets for day-to-day workflow
├── pi/
│   ├── pi_holo_renderer.py   # MQTT subscriber that renders holo frames
│   ├── pi_ops_heartbeat.py   # Optional heartbeat logger
│   ├── pi_sim_panel.py       # Simple FastAPI panel used by the simulator
│   └── services/
│       ├── pi-holo-renderer.service
│       ├── pi-ops-heartbeat.service
│       └── pi-sim-panel.service
└── scripts/
    ├── install_mac_agent.sh
    └── install_pi_services.sh
```

## Quick start

1. **Install dependencies on the Mac orchestration node.**

   ```bash
   python3 -m venv ~/agent-venv
   source ~/agent-venv/bin/activate
   pip install paho-mqtt pillow opencv-python fastapi uvicorn
   ```

2. **Bring up the Pi Ops box.** This system hosts Mosquitto (MQTT broker) and
   the Samba share used for collecting logs and assets. Follow the steps in the
   "Pi Ops bring-up" section below if you do not already have it running.

3. **Populate the asset directory.** Drop a `logo.png` file and an optional
   audio clip such as `clip.wav` into `pi-cortex-stack/assets/`.

4. **Push assets (and audio) to the broker.**

   ```bash
   make push-assets
   make push-audio  # Optional if you want the demo audio clip
   ```

5. **Run the first light smoke test.** This publishes the asset, audio clip (if
   available), and demo text to verify the full pipeline end-to-end.

   ```bash
   make first-light
   ```

   You should see "HELLO" appear on the holo display and the simulator panel
   update accordingly.

## Mac agent bring-up

The Mac agent is a lightweight Python process that publishes commands to the
MQTT broker and manages shared assets.

### LaunchAgent

A LaunchAgent plist is provided at
`launch_agents/com.blackroad.pi-cortex-agent.plist`. Copy it to the user's
`~/Library/LaunchAgents` directory and load it with:

```bash
launchctl load ~/Library/LaunchAgents/com.blackroad.pi-cortex-agent.plist
```

The agent expects the virtual environment created in the quick start section to
be active when started. The provided LaunchAgent uses `launchctl setenv` to
point at the virtual environment's Python interpreter.

Update the `PI_CORTEX_MQTT_HOST` and `PI_CORTEX_MQTT_PORT` values inside the
plist if your broker runs somewhere other than `localhost:1883`.

### Manual execution

To run the agent manually without launchd:

```bash
source ~/agent-venv/bin/activate
python mac_agent.py run
```

You can also publish assets or audio clips on demand:

```bash
python mac_agent.py push-assets --name logo.png
python mac_agent.py push-audio --name clip.wav
```

## Raspberry Pi bootstrap

All Raspberry Pi components run under `systemd` and rely on a Python virtual
environment that mirrors the packages used by the Mac agent. A convenience
script, `scripts/bootstrap_pi.sh`, prepares the environment and installs the
services in one go.

```bash
cd pi-cortex-stack
./scripts/bootstrap_pi.sh
```

The script will:

1. Ensure the Raspberry Pi has the core Debian packages required by the stack
   (Python tooling, OpenCV/Pillow libraries, ALSA utilities for audio playback,
   etc.).
2. Create (or reuse) the `~/agent-venv` virtual environment and install the
   dependencies listed in `requirements.txt`.
3. Generate a default `.env` from `.env.example` if one does not already
   exist.
4. Create the state and log directories under `/var/lib/pi-cortex` (including
   the new audio stash) and `/var/log/pi-cortex` with the correct permissions
   for the `pi` user.
5. Copy the `systemd` unit files into place (you may be prompted for your sudo
   password) and restart the services so that any configuration changes take
   effect immediately.

You can override the virtual environment location or Python interpreter by
exporting `VENV_DIR` or `PYTHON_BIN` before running the script.

If you prefer to manage the steps manually, the `install_pi_services.sh` helper
still accepts direct invocation.

## Raspberry Pi services

All Raspberry Pi components run as `systemd` services. The provided helper
script `scripts/install_pi_services.sh` installs the unit files into
`/etc/systemd/system` and enables the services.

### Pi Holo Renderer

`pi_holo_renderer.py` subscribes to the `pi/holo/text`, `pi/holo/image`, and
`pi/audio/clip` topics. The renderer stores the current text payload, the most
recent asset frame, and any audio clips under `/var/lib/pi-cortex`. If an HDMI
display is connected it will also open a simple OpenCV window. Audio playback is
handled via `aplay` (or the player specified by `PI_CORTEX_AUDIO_PLAYER`) and
can be disabled by setting `PI_CORTEX_AUDIO_AUTOPLAY=0`. On a headless system
you can disable the window by setting the `PI_CORTEX_HEADLESS=1` environment
variable.

### Pi Sim Panel

`pi_sim_panel.py` runs a FastAPI server that exposes the most recent content the
simulator received from MQTT, including the live audio clip. The service listens
on port 8000 by default and serves a compact status dashboard at `/` that
embeds the latest image and an in-browser audio player.

### Pi Ops Heartbeat (optional)

The optional heartbeat service publishes a timestamped message to the
`pi/ops/heartbeat` topic every 30 seconds so that monitoring systems can verify
that the Pi stack is healthy.

Enable it with:

```bash
sudo systemctl enable --now pi-ops-heartbeat.service
```

## Pi Ops bring-up

1. Install Mosquitto and Samba on the Pi Ops host.
2. Create a share named `pi-cortex` that points to `/var/lib/pi-cortex/shared`.
3. Ensure the MQTT broker is reachable from both the Mac and the Pi endpoints.
4. Update the `.env` files or environment variables on the Mac and Pi devices to
   point at the broker's hostname or IP address.

## Configuration

Configuration is managed via environment variables. Copy `.env.example` to
`.env` in the root of `pi-cortex-stack` and export it before running the agent,
or use your shell's environment. The following variables are recognized:

- `PI_CORTEX_MQTT_HOST` (default `localhost`)
- `PI_CORTEX_MQTT_PORT` (default `1883`)
- `PI_CORTEX_ASSET_DIR` (default `assets`)
- `PI_CORTEX_ASSET_TOPIC` (default `pi/assets/logo`)
- `PI_CORTEX_HOLO_TOPIC` (default `pi/holo/text`)
- `PI_CORTEX_PANEL_TOPIC` (default `pi/panel/text`)
- `PI_CORTEX_HEARTBEAT_TOPIC` (default `pi/ops/heartbeat`)
- `PI_CORTEX_HOLO_STATE_DIR` (default `/var/lib/pi-cortex/holo`)
- `PI_CORTEX_PANEL_STATE_DIR` (default `/var/lib/pi-cortex/panel`)
- `PI_CORTEX_AUDIO_TOPIC` (default `pi/audio/clip`)
- `PI_CORTEX_AUDIO_ASSET` (default `clip.wav`)
- `PI_CORTEX_AUDIO_STATE_DIR` (default `/var/lib/pi-cortex/audio`)
- `PI_CORTEX_AUDIO_AUTOPLAY` (default `1` – set to `0` to disable playback)
- `PI_CORTEX_AUDIO_PLAYER` (default `aplay`)

## Development tips

- Use `make lint` to run basic formatting checks (requires `ruff`).
- Use the simulator panel while iterating so you do not have to have a holo
  display connected.
- The Mac agent logs verbosely to `~/.pi-cortex-agent/logs` by default. Rotate
  the logs periodically when running in long-lived deployments.

