# Mobile Control Stack

This kit turns the iPhone into a lightweight remote that orchestrates the Lucidia fleet without trying to run the agents on the handset. Import the bundled Termius snippets and HTTPBot collection, point them at the backplane, and every command fans out to the Pis and Jetson that actually execute the work.

## Components

* **Termius snippets.** Pre-baked SSH/HTTP helpers for urgent fixes or rollbacks.
* **HTTPBot collection.** One-tap API calls to the backplane for LED, display, and deploy actions.

> **Prerequisites**
>
> * The backplane must be live and reachable over Tailscale or another private network.
> * Each board (`lucidia-a`, `lucidia-b`, `pi400`, `pizero`, `jetson-01`) should be running the `blackroad-agent` systemd service and polling `/api/devices/:id/commands` for work.
> * Have a valid `X-BlackRoad-Key` (or daily override) ready; unauthenticated calls are rejected.

## Termius snippets

1. In Termius, go to **Settings → Snippets → Import** and choose [`termius-snippets.json`](./termius-snippets.json).
2. Edit the sync variables once (press and hold a snippet → **Variables**):

   | Variable | Example | Purpose |
   | -------- | ------- | ------- |
   | `BACKPLANE_URL` | `https://prism-control.tailnet.ts.net:4000` | Root URL for the BlackRoad backplane. |
   | `BR_KEY` | `lucidia-prod-secret` | Value for the `X-BlackRoad-Key` header. |
   | `DAILY_KEY` | `LUCIDIA-AWAKEN-2024-09-01` | Optional daily override key. |

3. Run a snippet while connected to any host (or to the **Local Terminal**) and the bundled curl command will fire against the backplane API.

Snippets cover:

* **`fleet-roll`** — asks every edge board to pull the latest tagged container and restart the `blackroad-agent` service.
* **`rollback-one`** — rolls a single device back to the previous container tag.
* **`tail-logs`** — tails the last 200 lines of the agent log from a chosen device over SSH.

The fleet snippets rely on the `/api/agents/command` endpoint, which enqueues natural-language jobs into the existing command bus. That bus already brokers automation like reindexing and deployments, so fleet rollouts stay consistent with the rest of the ops workflow.【F:apps/api/src/routes/agents/command.ts†L1-L35】

Device-level snippets hit `/api/devices/:id/command`, which stores a TTL-scoped payload and emits it over the `/devices` websocket namespace. The running agents poll `/api/devices/:id/commands` and execute the payload when it matches their device ID.【F:srv/blackroad-api/modules/devices.js†L76-L149】

## HTTPBot collection

1. In HTTPBot, tap **Collections → Import** and load [`httpbot-collection.json`](./httpbot-collection.json). The file uses the Postman v2.1 schema, which HTTPBot understands directly.
2. Set the collection variables (`backplane`, `api_key`, `daily_key`, `display_target`) once and sync them across requests.
3. Every request already sets the auth headers Termius snippets use (`X-BlackRoad-Key` and `X-BlackRoad-Daily`).

Collection highlights:

* **Backplane health** — quick GET to `/api/health` to confirm reachability.
* **Deploy Lucidia stack** — posts `deploy lucidia stack stable` into the command bus.
* **Restart agent service** — instructs a specific device to restart the `blackroad-agent` systemd unit.
* **LED controls** — sends `led.emotion` payloads, which the Pi LED daemon consumes to change ring states.【F:services/pi-led/emotion_led.py†L60-L77】
* **Display controls** — uses `display.show`, `display.wake`, and `display.clear` payloads consumed by the display agent on both screens.【F:srv/display-agent/display_agent.py†L123-L140】
* **Jetson job trigger** — pushes a `run job on jetson` text command into the backplane.

Because both Termius and HTTPBot talk to the same APIs, you can bounce between them without drifting state: the command bus keeps history, and `/api/devices/:id/commands` automatically expires stale orders via `ttl_s` to prevent run-away loops.【F:srv/blackroad-api/modules/devices.js†L101-L149】

## Workflow tips

* Keep Working Copy for Git only — build artifacts should happen on the devices after a `fleet-roll`.
* Pair each HTTPBot action with a Termius log tail so you can instantly confirm success.
* When issuing display commands, favor `ttl_s` shorter than five minutes so idle detection can blank the panels again.
* Store secrets in the Tailscale ACL or 1Password and paste them into Termius/HTTPBot variables; never hardcode them in the JSON files committed here.

With this setup the phone is a remote, not a node. The heavy lifting lives on the Pis and Jetson, and the phone just orchestrates through authenticated API calls.
