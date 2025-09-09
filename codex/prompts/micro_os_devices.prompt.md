CODEx PROMPTS — Micro-OS Device Backplane & Agents

# What’s possible (quick facts)

* **Emotion colors on a fan = use LEDs, not the PWM lead.** The 4-pin PC fan header’s PWM only controls **speed**. Lighting is separate: either 12 V “RGB” (4-pin, not addressable) or **5 V ARGB** (3-pin, digitally addressable—WS2812/SK6812-class). For fully programmable colors, pick **5 V ARGB** or a WS2812 ring/strip and drive it from the Pi.
* **Pi Zero 2 W video:** one **mini-HDMI** out; **no DSI** connector, so a second display must be SPI/GPIO/USB-display. Dual native outputs = use a Pi 4/5 or let the **Jetson** drive the big screen and the Pi run the “phone-size” SPI display.
* **LED control from Pi:** the `rpi_ws281x` userspace lib is still the go-to for WS2812/“NeoPixel” control (GPIO18 with level shifting recommended).
* **Jetson telemetry / fan:** read temps and load via **tegrastats**; many Jetsons expose a `target_pwm` sysfs knob for the case fan (board-specific). Start with tegrastats; control PWM if your carrier exposes it.
* **Custom OS images:** Pi images are best produced with **pi-gen** / **rpi-image-gen**; Jetson uses **JetPack** (SDK Manager or SD image) then a first-boot script.

# Architecture v1 (LLM-native “micro-OS”)

**Backplane (server you already run):** extend `blackroad-api` (Express + Socket.IO) with a **Devices bus**:

* `ws topic`: `devices/<id>/telemetry`, `devices/<id>/command`
* `http endpoints`: `POST /api/devices/<id>/telemetry`, `POST /api/devices/<id>/command`, `GET /api/devices`
* **Auth**: use your `X-BlackRoad-Key` header.

**Agents (edge):**

* **Pi-LED Agent** (Zero/Zero 2/4/5): drives a WS2812 ring/strip = **emotion colors** (calm/ok/busy/hot/error) and patterns (pulse, breathe). Subscribes to `devices/pi-01/command`, publishes temps, button/touch events.
* **Display Agent (Pi mini screen & Jetson big screen):** each listens for `display.show` events and renders images/video on its assigned screen (`target: mini|main|both`).
* **Jetson Agent:** parses **tegrastats** → telemetry; optionally writes `target_pwm` if available to react to heat/load; relays LLM status (token/s) so the LED can “breathe” while generating.

**Wiring the screens:** Let the **Jetson** drive the main monitor (HDMI/DP). Put a **small SPI IPS** on the Pi Zero 2 W (e.g., ILI9341/ILI9488 2–3.5″) or a tiny HDMI. The Zero has no DSI, so avoid the official 7″ DSI.

---

# Prompt 1 — Devices Backplane (`codex-backplane v1`)

**Goal:** Add a secure device bus to `blackroad-api`.

**Do**

1. Add Socket.IO namespace `/devices`. Rooms are device IDs.
2. Endpoints:
   * `POST /api/devices/:id/telemetry` (auth) → broadcast to room + store last state in SQLite.
   * `POST /api/devices/:id/command` (auth) → emit to room; 202 accepted.
   * `GET /api/devices` → list last-seen + roles.
3. **Types**:

```json
{ "id":"pi-01","role":"led|mini|main|jetson","ts":"iso","cpu":48.2,"gpu":42,"load":0.35,"llm":{"state":"idle|gen","tps":12.3} }
{ "type":"display.show","target":"mini|main|both","mode":"image|video|url","src":"https://...|file://...","fit":"contain|cover" }
{ "type":"led.emotion","emotion":"ok|busy|hot|error|thinking","brightness":0.4 }
```

**Acceptance**

* `ws` join/emit works; last-seen persists; auth required.

---

# Prompt 2 — Pi Emotion LED Agent (`codex-pi-led v1`)

**Goal:** Deploy a Pi service that maps system/LLM states to LED **emotion colors**.

**Do**

1. Install `rpi_ws281x` and drop:
   * `/srv/pi-led/emotion_led.py` (service below)
   * `/etc/systemd/system/pi-emotion-led.service`
2. Defaults: GPIO18, 16 pixels, brightness 0.3. Patterns:
   * `ok` = solid green, `busy` = amber breathe, `hot` = red pulse, `thinking` = blue swirl, `error` = red blink.
3. Subscribes to `/devices` bus; falls back to polling `GET /api/devices/pi-01/commands` if ws down.
4. ENV: `LED_PIN`, `LED_COUNT`, `BACKPLANE_URL`, `DEVICE_ID`, `BR_KEY`.

**Acceptance**

* Posting `{type:"led.emotion","emotion":"hot"}` updates within 100 ms.
* On over-temp (CPU>75 °C) auto-override to red until back <70 °C.

---

# Prompt 3 — Jetson Agent (`codex-jetson-agent v1`)

**Goal:** Publish temps/load via **tegrastats** and obey basic fan targets if sysfs exists.

**Do**

1. Install `/srv/jetson-agent/jetson_agent.py` + systemd unit.
2. Parse `tegrastats` each second → `cpu,gpu,ram,gpu_mem,temp_cpu,temp_gpu`.
3. If `/sys/devices/pwm-fan/target_pwm` exists, accept `{type:"fan.set","pwm":0-255}`; otherwise ignore gracefully.
4. Emit `llm.state` hints (idle/gen) when `/api/llm/health` flips or token streaming observed.

**Acceptance**

* `curl -XPOST /api/devices/jetson/telemetry` payloads appear in `/devices` room.
* Setting `{type:"fan.set","pwm":160}` writes sysfs when available.

---

# Prompt 4 — Display Agents (`codex-display v1`)

**Goal:** Two lightweight viewers (Pi mini & Jetson main) that render on command.

**Do**

1. `/srv/display-agent/display_agent.py` (runs with `--role mini|main`).
2. Listens for `display.show` → launches `feh` (image) or `mpv` (video/url) full-screen on the selected output; times out/replaces on next command.
3. Accepts `{type:"display.clear"}`.

**Acceptance**

* Sending `display.show` with `target:"mini"` shows on Pi, not Jetson; `both` shows both.

---

# Prompt 5 — Image Build Hooks (`codex-osimage v1`)

**Goal:** Reproducible Pi images + first-boot for Jetson.

**Do**

1. Add a `pi-gen` profile with `stage-led` and `stage-display` that preinstalls the agents + enables the services; output `blackroad-pi-led-YYYYMMDD.img`.
2. Add a Jetson first-boot script that installs `jetson_agent.py`, enables it, and writes `X-BlackRoad-Key`.
3. Document a one-liner `curl | sh` bootstrap for bare Pi OS.

**Acceptance**

* Fresh Pi boots with LED agent online; Jetson first boot brings telemetry in ≤60 s.

