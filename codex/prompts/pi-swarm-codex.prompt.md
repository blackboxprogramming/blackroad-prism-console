# Pi Swarm Codex

A single reference sheet for coordinating the Mac "cortex" agent with Raspberry Pi holo, sim, and ops nodes via MQTT.

---

## 0. Conventions
- **Broker**: `pi-ops.local`
- **Topics**: `holo/cmd`, `sim/output`, `monitor/#`, `agent/output`, `system/heartbeat/<node>`
- **Messages**: JSON payloads, UTF-8, QoS 1
- **Placeholders**: `{{like_this}}`

---

## 1. Core Agent Prompt (Mac "cortex")
Use this system prompt for the local model that translates intent into MQTT envelopes.

```
You are the Agent for a Raspberry Pi swarm. Never render UI locally unless asked.
Turn intent into MQTT messages that edge devices can act on.

- Output only valid JSON envelopes (no prose).
- Prefer lightweight payloads (paths/ids over blobs).
- Validate target topics and required fields before emitting.
- If missing data, emit a single 'ask' object describing what you need.

Schemas:
holo/cmd: { "mode": "quad_image|text|video|effect", "path": "...", "text": "...", "duration_ms": 0, "params": { ... } }
sim/output: { "view": "text|panel|graph", "text": "...", "values": [..], "unit": "...", "ttl_s": 0 }
agent/output: { "channel": "log|status|result|error", "text": "...", "meta": { ... } }
monitor/call: { "service": "ping|temp|disk|gpu", "target": "pi-holo|pi-ops|pi-sim|mac", "interval_s": 0 }
```

---

## 2. One-Shot "Do the Thing" Template
Structure for user prompts sent to the agent.

```
USER PROMPT → Agent

Goal: {{short goal}}
Context: {{1-3 bullets}}
Deliverable: {{what the user wants to see}}
Constraints: {{limits like time/model/resolution}}
Now produce the exact MQTT envelopes, in order, to achieve the Goal.
```

### Expected Agent Output
```
{
  "emit": [
    { "topic": "holo/cmd", "payload": { "mode":"text", "text":"{{headline}}", "duration_ms": 5000 } },
    { "topic": "sim/output", "payload": { "view":"panel", "text":"{{mini_status}}", "ttl_s": 30 } },
    { "topic": "agent/output", "payload": { "channel":"status", "text":"Sent holo and sim cues" } }
  ]
}
```

---

## 3. Hologram (Pi-Holo) Prompt Pack
- **A. Quad image**
  ```
  { "topic": "holo/cmd",
    "payload": { "mode": "quad_image", "path": "/srv/assets/{{file}}.png", "duration_ms": {{ms}} } }
  ```
- **B. Text marquee**
  ```
  { "topic":"holo/cmd",
    "payload": { "mode":"text", "text":"{{line1}}\n{{line2}}", "duration_ms": {{ms}},
      "params": { "font":"DejaVuSans.ttf", "size": 28, "scroll":"horizontal" } } }
  ```
- **C. Video loop**
  ```
  { "topic":"holo/cmd",
    "payload": { "mode":"video", "path": "/srv/assets/{{clip}}.mp4", "params": { "loop": true, "volume": 0.0 } } }
  ```
- **D. Quick effects**
  ```
  { "topic":"holo/cmd",
    "payload": { "mode":"effect", "params": { "name":"pulse", "speed": 1.2, "intensity": 0.7 }, "duration_ms": 4000 } }
  ```

---

## 4. Simulation (Pi-Sim) Prompt Pack
- **A. Text panel**
  ```
  { "topic":"sim/output",
    "payload": { "view":"text", "text":"{{title}}\n{{body}}", "ttl_s": 120 } }
  ```
- **B. Mini graph**
  ```
  { "topic":"sim/output",
    "payload": { "view":"graph", "values": {{[list_of_numbers]}}, "unit":"{{°C|%|ms}}", "ttl_s": 60 } }
  ```
- **C. Multi-panel status**
  ```
  { "topic":"sim/output",
    "payload": { "view":"panel", "text":"CPU: {{x}}%\nTemp: {{y}}°C\nNet: {{z}}Mbps", "ttl_s": 30 } }
  ```

---

## 5. Ops & Health (Pi-Ops)
- **A. Ping a node**
  ```
  { "topic":"monitor/call",
    "payload": { "service":"ping", "target":"{{node}}", "interval_s": 0 } }
  ```
- **B. Subscribe + log**
  ```
  { "topic":"monitor/call",
    "payload": { "service":"disk", "target":"pi-holo", "interval_s": 300 } }
  ```
- **C. Heartbeat**
  ```
  { "topic":"system/heartbeat/{{node}}",
    "payload": { "ts": {{unix_ts}}, "role":"{{role}}", "ok": true, "temp_c": {{float}}, "uptime_s": {{int}} } }
  ```

---

## 6. Apple-Side "Planner→Emitter" Prompt
Developer prompt to chain planning and envelope emission.

```
Task: {{plain English}}
Devices: { holo: displays image/text/video, sim: text/graph, ops: broker, mac: compute }
Rules:
- Output a single JSON with "emit": [ {topic, payload}, ... ] and nothing else.
- Prefer idempotent commands (include duration/ttl).
- If filesystem paths are referenced, they must live under /srv/assets.
```

---

## 7. Error & Ask Pattern
Single follow-up request when requirements are missing.

```
{ "ask": { "missing": ["{{asset_path}}"], "reason": "asset not found on /srv/assets",
  "suggest": ["scp {{file}} pi@pi-ops.local:/srv/assets/"] } }
```

---

## 8. Tiny Code Stubs
- **Publish helper (Python)**
  ```python
  import json, paho.mqtt.client as mqtt
  mq = mqtt.Client("mac-agent"); mq.connect("pi-ops.local",1883,60)
  def emit(topic, payload): mq.publish(topic, json.dumps(payload), qos=1)
  # example
  emit("holo/cmd", {"mode":"text","text":"hello","duration_ms":4000})
  ```
- **Safe subscriber (Pi-Holo renderer skeleton)**
  ```python
  import json, pygame, paho.mqtt.client as mqtt
  pygame.init(); screen = pygame.display.set_mode((720,720))
  def on_message(c,u,m):
      try:
          p=json.loads(m.payload)
          # handle p["mode"]...
      except Exception as e:
          print("bad payload", e)
  c=mqtt.Client("pi-holo"); c.on_message=on_message
  c.connect("pi-ops.local",1883,60); c.subscribe("holo/cmd"); c.loop_forever()
  ```

---

## 9. Bring-Up Script Prompts
- **A. First-light sequence**
  - Goal: First-light of the stack.
  - Deliverable: MQTT envelopes to show "HELLO" on holo, show "Stack online" on sim, and log status.
  - Constraints: Holo text duration 5s; sim TTL 60s.
- **B. Asset push then render**
  - Goal: Display `/srv/assets/logo.png` for 8s on holo.
  - Context: If missing, ask for `scp` command.
  - Deliverable: MQTT envelopes only.
- **C. Rolling status ticker**
  - Goal: Every 30s, update sim panel with CPU/Temp pulled from monitor topics.
  - Deliverable: One-time emit to start polling + first panel update.
- **D. Dual-phase reveal (demo)**
  - Goal: Fade in hologram logo, then marquee the event title.
  - Deliverable: Sequential envelopes triggering `effect:pulse` for 3s followed by marquee text for 10s.
- **E. Ambient loop reset (demo)**
  - Goal: Ensure holo returns to ambient video loop after demos.
  - Deliverable: MQTT envelopes to stop active effects and start `/srv/assets/ambient.mp4` looping silently.

---

## 10. Guardrails
Paste into the agent system prompt.

```
- Never emit non-JSON text.
- Never embed binary data; reference paths.
- Keep payloads under 8KB.
- Include duration/ttl so displays self-clear.
- If in doubt, emit a single 'ask'.
```

---

## 11. Print-Friendly Layout Tips
- Export to PDF using a monospace-friendly theme.
- Keep section headers collapsed or hide code fences when printing to fit on one page.
- Highlight sections 3, 4, and 9 for hologram demo quick reference.
