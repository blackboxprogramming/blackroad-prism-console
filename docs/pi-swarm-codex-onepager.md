# Pi Swarm Codex — MQTT Prompt One-Pager

This sheet keeps the Mac "cortex" and Raspberry Pi nodes aligned. Print or pin it near the ops bench.

---

## 0. Conventions
- **MQTT broker**: `pi-ops.local`
- **Topics**: `holo/cmd`, `sim/output`, `monitor/#`, `agent/output`, `system/heartbeat/<node>`
- **Message format**: JSON payloads, UTF-8 encoded, `qos=1`
- **Placeholder style**: `{{like_this}}`

---

## 1. Core Agent System Prompt (Mac “cortex”)
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
- **User prompt to agent**
  ```
  Goal: {{short goal}}
  Context: {{1-3 bullets}}
  Deliverable: {{what the user wants to see}}
  Constraints: {{limits like time/model/resolution}}
  Now produce the exact MQTT envelopes, in order, to achieve the Goal.
  ```
- **Expected agent output**
  ```json
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
| Cue | JSON Envelope |
| --- | -------------- |
| Quad image (Pepper’s Ghost) | `{ "topic": "holo/cmd", "payload": { "mode": "quad_image", "path": "/srv/assets/{{file}}.png", "duration_ms": {{ms}} } }` |
| Text marquee | `{ "topic":"holo/cmd", "payload": { "mode":"text", "text":"{{line1}}\n{{line2}}", "duration_ms": {{ms}}, "params": { "font":"DejaVuSans.ttf", "size": 28, "scroll":"horizontal" } } }` |
| Video loop | `{ "topic":"holo/cmd", "payload": { "mode":"video", "path": "/srv/assets/{{clip}}.mp4", "params": { "loop": true, "volume": 0.0 } } }` |
| Quick effect | `{ "topic":"holo/cmd", "payload": { "mode":"effect", "params": { "name":"pulse", "speed": 1.2, "intensity": 0.7 }, "duration_ms": 4000 } }` |

---

## 4. Simulation (Pi-Sim) Prompt Pack
| Cue | JSON Envelope |
| --- | -------------- |
| Text panel | `{ "topic":"sim/output", "payload": { "view":"text", "text":"{{title}}\n{{body}}", "ttl_s": 120 } }` |
| Mini graph (values only) | `{ "topic":"sim/output", "payload": { "view":"graph", "values": {{[list_of_numbers]}}, "unit":"{{°C|%|ms}}", "ttl_s": 60 } }` |
| Multi-panel status | `{ "topic":"sim/output", "payload": { "view":"panel", "text":"CPU: {{x}}%\nTemp: {{y}}°C\nNet: {{z}}Mbps", "ttl_s": 30 } }` |

---

## 5. Ops & Health (Pi-Ops)
| Action | JSON Envelope |
| --- | -------------- |
| Ping a node | `{ "topic":"monitor/call", "payload": { "service":"ping", "target":"{{node}}", "interval_s": 0 } }` |
| Subscribe + log (disk example) | `{ "topic":"monitor/call", "payload": { "service":"disk", "target":"pi-holo", "interval_s": 300 } }` |
| Heartbeat (sent by each node) | `{ "topic":"system/heartbeat/{{node}}", "payload": { "ts": {{unix_ts}}, "role":"{{role}}", "ok": true, "temp_c": {{float}}, "uptime_s": {{int}} } }` |

---

## 6. Apple-Side "Planner→Emitter" Prompt
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
```json
{ "ask": { "missing": ["{{asset_path}}"], "reason": "asset not found on /srv/assets", "suggest": ["scp {{file}} pi@pi-ops.local:/srv/assets/"] } }
```

---

## 8. Tiny Code Stubs
- **Python publish helper (Mac)**
  ```python
  import json, paho.mqtt.client as mqtt
  mq = mqtt.Client("mac-agent"); mq.connect("pi-ops.local",1883,60)
  def emit(topic, payload): mq.publish(topic, json.dumps(payload), qos=1)
  # example
  emit("holo/cmd", {"mode":"text","text":"hello","duration_ms":4000})
  ```
- **Safe subscriber skeleton (Pi-Holo)**
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

## 9. Task Macros
| Macro | Goal & Deliverable | Constraints & Notes |
| --- | --- | --- |
| **First-light sequence** | Goal: bring up stack; Deliverable: MQTT envelopes to show "HELLO" on holo, "Stack online" on sim, log status. | Holo text duration 5 s; Sim TTL 60 s. |
| **Asset push then render** | Goal: display `/srv/assets/logo.png` on holo for 8 s. Context: if missing asset, issue `ask` with `scp` hint. | Deliverable: MQTT envelopes only. |
| **Rolling status ticker** | Goal: every 30 s update sim panel with CPU/temp from monitor topics. Deliverable: one-time emit to start polling + first panel update. | Combine monitor subscription with initial summary panel. |
| **Holo spotlight cycle** | Goal: rotate through three key assets on holo with 6 s dwell each; Deliverable: sequence of quad-image envelopes plus status log. | Ensure `/srv/assets/{asset}.png`; include agent status confirming cycle start. |
| **Ambient holo marquee** | Goal: run continuous text ticker with event headline + URL. Deliverable: single text-mode envelope plus sim confirmation card. | Duration 12 s, include scroll params; TTL sim card 45 s. |

---

## 10. Guardrails (include in agent system prompt)
- Never emit non-JSON text.
- Never embed binary data; reference paths.
- Keep payloads under 8 KB.
- Include duration/ttl so displays self-clear.
- If in doubt, emit a single `ask`.

---

## 11. Quick Reference Checklist
1. Confirm broker reachability (`pi-ops.local`).
2. Validate target topic and schema before send.
3. Prefer `/srv/assets/` paths; prompt for upload if missing.
4. Include `duration_ms` or `ttl_s` for every visible output.
5. Mirror intent back via `agent/output` status.
