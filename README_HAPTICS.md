# Ops Haptics Add-on

This add-on pairs a small Arduino with the Pi-Ops stack to surface reflex alerts using light, sound, and vibration.

## Contents

| Path | Purpose |
| --- | --- |
| `arduino/HapticsAlert.ino` | Firmware that parses serial alert lines and drives the LED (D13), buzzer (D9), and vibration motor (D5). |
| `pi-ops/ops_haptics_bridge.py` | Python bridge that subscribes to `ops/reflex/alert` MQTT events and forwards them to the Arduino. |
| `pi-ops/ops_haptics_bridge.service` | systemd unit to launch the bridge on boot. |

## Flash the Arduino

1. Connect the Arduino to your workstation with USB.
2. Open `arduino/HapticsAlert.ino` in the Arduino IDE.
3. Select the correct board/port and upload at **115200 baud**.

The sketch expects newline-terminated lines formatted as `kind=<kind>,dur=<ms>,int=<0-255>`.

## Deploy on Pi-Ops

```bash
scp pi-ops/ops_haptics_bridge.py pi-ops/ops_haptics_bridge.service pi@pi-ops.local:/home/pi/
ssh pi@pi-ops.local \
  'sudo apt update && sudo apt install -y python3-pip && \
   pip install --break-system-packages paho-mqtt pyserial && \
   sudo mv /home/pi/ops_haptics_bridge.service /etc/systemd/system/ && \
   sudo systemctl daemon-reload && \
   sudo systemctl enable --now ops_haptics_bridge'
```

The service runs the bridge as the `pi` user and connects to `/dev/ttyACM0`.

## Test the Loop

With the bridge running, publish a test alert:

```bash
mosquitto_pub -h pi-ops.local -t ops/reflex/alert -m '{"kind":"node_lost","meta":{"dur_ms":1200,"intensity":255}}'
mosquitto_sub -h pi-ops.local -t ops/reflex/haptic_status -v
```

The Arduino will blink the D13 LED for every alert. `temp_high` and `node_lost` also buzz on D9; `node_lost` additionally pulses the D5 motor.

## Wiring Notes

- **Vibration motor (D5)**: drive through an NPN transistor (2N2222/2N3904), add a ~1 kΩ base resistor and a flyback diode (1N4148/1N4007) across the motor leads.
- **Buzzer (D9)**: for an active buzzer, add ~100 Ω in series. Piezo buzzers can be driven directly with the PWM output at low duty.
- **Power**: use the Arduino 5 V rail for the motor only if the USB supply can provide the stall current; otherwise power the motor from an external 5 V source and share ground.

## Serial Protocol Cheat Sheet

Each MQTT alert is converted into a single serial line:

```
kind=<alert-kind>,dur=<duration-ms>,int=<intensity-0-255>\n
```

- `dur` is clamped to 50–5000 ms.
- `int` is clamped to 0–255 and is used as the PWM duty cycle for the buzzer and motor.
- Arduino responses prefixed with `ACK:` are published to `ops/reflex/haptic_status` with the `state` set to `ack`.
