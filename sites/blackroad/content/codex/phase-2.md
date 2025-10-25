---
type: codex-prompt
id: phase-2
slug: phase-2
title: "Phase 2 — Pi Bring-Up & First Light"
summary: "Bench bring-up card and Codex prompt set for spinning up the hologram stack from blank SD cards."
owner: "blackroad"
tags: ["codex","pi","mqtt","hologram","sim"]
model_hint: "Codex"
temperature: 0
updated: "2025-09-13"
version: "1.0.0"
canonical_repo: "blackboxprogramming/blackroad-prism-console"
copy_filename: "codex_phase_02.txt"
---

Here’s Phase 2 — Pi Bring-Up & First Light. Paste this into Codex.

⸻

**Codex Prompt — Phase 2 (bench bring-up: Pi images, services, MQTT wiring, sanity checks)**

Move from blank SD cards to first-light renders in one sitting. Capture the bench card, systemd services, Codex prompt blocks, and helper scripts so a tech can flash and boot every Pi, wire MQTT, and validate the stack without referring elsewhere.

## Bring-up card (print this)

1. **Flash images**
   - Use Raspberry Pi Imager per board.
   - Profiles: `pi-holo` (Pi 5, Desktop), `pi-ops` (Pi 5, Lite), `pi-sim` (Pi Zero W, Lite), `pi-400` (Desktop).
   - In the gear ⚙️ panel set hostname, user, SSH, locale; add Wi-Fi only for the Zero W.

2. **First boot order**
   1. **Pi-Ops → broker**
      ```bash
      sudo apt update
      sudo apt install -y mosquitto mosquitto-clients
      sudo systemctl enable --now mosquitto
      mosquitto_sub -h localhost -t '#' -v   # leave running in one terminal
      ```
   2. **Pi-Holo → renderer deps**
      ```bash
      sudo apt update
      sudo apt install -y git python3-pip libatlas-base-dev
      git clone git@github.com:blackboxprogramming/blackroad-prism-console.git ~/blackroad
      cd ~/blackroad/pi_holo
      ./install.sh
      ```
   3. **Pi-Sim → simulator**
      ```bash
      sudo apt update
      sudo apt install -y python3-pip
      git clone git@github.com:blackboxprogramming/blackroad-prism-console.git ~/blackroad
      cd ~/blackroad/pi_sim
      ./install.sh
      ```
   4. **Pi-400 → operator console**
      ```bash
      sudo apt update
      sudo apt install -y nodejs npm
      git clone git@github.com:blackboxprogramming/blackroad-prism-console.git ~/blackroad
      cd ~/blackroad/prism-console
      npm install
      npm run dev
      ```

3. **Network & MQTT wiring**
   - Set `/etc/hosts` across devices with static IPs.
   - Verify broker reachable: `mosquitto_sub -h pi-ops -t 'holo/#'`.
   - Publish heartbeat from Pi-Holo: `mosquitto_pub -h pi-ops -t 'holo/status' -m '{"status":"up"}'`.

4. **Service checklist**
   - `systemctl status holo-renderer`
   - `systemctl status holo-simulator`
   - `systemctl status holo-orchestrator`

5. **Smoke tests**
   - Render test frame: `python3 -m holo.render --pattern grid`
   - Simulator emit telemetry: `python3 -m holo.sim --mode telemetry`
   - Console subscribe dashboard tiles update.

## Codex prompt blocks

- `codex_phase_02.txt` → canonical instructions for Codex (checked into repo).
- Mirror the sections above; ensure ASCII only.
- Keep deterministic outputs for CI comparison.

## Hand-off artifacts

- `/artifacts/pi/bring_up_card_phase_2.pdf`
- `/artifacts/pi/systemd/`
- `/artifacts/pi/mqtt_wiring.json`
- `/artifacts/pi/smoke_results_phase_2.json`

## Validation

1. Run `python -m pi.verify --phase 2`.
2. Expect `OK: 15 checks, 0 failures`.
3. Archive artifacts + logs to `/archive/pi/phase_2/YYYYMMDD`. 
