# Ops Haptics Add-On

This package provides a simple haptics stack that reacts to alerts on the `ops/reflex/alert` topic and drives an Arduino-based buzzer and vibration motor assembly.

## Contents

| Path | Description |
| ---- | ----------- |
| `arduino/HapticsAlert.ino` | Arduino sketch that listens for serial commands and drives the LED, buzzer, and vibration motor. |
| `pi-ops/ops_haptics_bridge.py` | Python bridge that connects MQTT alerts to the Arduino over USB serial. |
| `systemd/ops_haptics_bridge.service` | Systemd service unit to run the bridge on boot. |

## Hardware wiring

* **Microcontroller:** Arduino Uno (or compatible) connected over USB to the Pi-Ops host.
* **LED:** Uses the onboard `D13` LED to flash for each alert.
* **Buzzer:** Connect an active buzzer to `D9` (PWM). Add a ~100 Ω series resistor when using an active buzzer, or drive a passive piezo directly via PWM at modest duty cycle.
* **Vibration motor:** Connect a coin vibration motor to `D5` through an NPN transistor (e.g., 2N2222). Place a 1 kΩ resistor between `D5` and the transistor base, and a flyback diode (1N4148/1N4007) across the motor leads (cathode to +5 V) to protect against voltage spikes.
* **Power:** Use the Arduino’s 5 V rail for both buzzer and motor. Ensure the USB port or external supply can provide the required current.

## Arduino deployment

1. Open `arduino/HapticsAlert.ino` in the Arduino IDE or the CLI.
2. Select the target board and port, and flash at `115200` baud.
3. After reset, the sketch prints `READY` once the serial port is up.

## Pi-Ops bridge installation

```bash
scp pi-ops/ops_haptics_bridge.py pi-ops/ops_haptics_bridge.service pi@pi-ops.local:/home/pi/
ssh pi@pi-ops.local \
  'sudo apt update && \
   sudo apt install -y python3-pip && \
   pip install --break-system-packages paho-mqtt pyserial && \
   sudo mv /home/pi/ops_haptics_bridge.service /etc/systemd/system/ && \
   sudo systemctl daemon-reload && \
   sudo systemctl enable --now ops_haptics_bridge'
```

The bridge listens to `ops/reflex/alert`, forwards events to `/dev/ttyACM0`, and publishes acknowledgements to `ops/reflex/haptic_status`.

## Testing

With the Arduino connected and the service running, publish a sample alert and confirm the acknowledgement stream:

```bash
mosquitto_pub -h pi-ops.local -t ops/reflex/alert -m '{"kind":"node_lost","meta":{"dur_ms":1200,"intensity":255}}'
mosquitto_sub -h pi-ops.local -t ops/reflex/haptic_status -v
```

You should observe:

* The Arduino LED flashing for at least 200 ms.
* The buzzer sounding for `temp_high` and `node_lost` alerts.
* The vibration motor pulsing for `node_lost` alerts.
* An MQTT status message confirming the alert delivery (or reporting any parsing/serial errors).

## Serial protocol

The bridge sends newline-terminated ASCII lines:

```
ALERT <kind> <duration_ms> <intensity>
```

* `<kind>` matches the alert kind from MQTT (e.g., `node_lost`, `temp_high`).
* `<duration_ms>` is the duration to run the effect.
* `<intensity>` maps to the PWM duty cycle (0–255).

The Arduino responds with either `ACK <kind>` after playing the haptic pattern or `ERR <reason>` if the command is malformed.
