# Pi-Ops First-Light Checklist

Use the `scripts/pi_ops_first_light.sh` helper after deploying the kiosk
bundle to drive the displays, publish device heartbeats, and push a status
card to the mini panel (or a sim panel endpoint).

## Prerequisites

- The Pi kiosk service is installed via `install_pi_ops_kiosk.sh`.
- The Grafana dashboard with UID `pi-ops-ultra` is imported on your
  workstation or observability host.
- The backplane API is reachable from where you run the script
  (defaults to `http://127.0.0.1:4000`).
- The API expects an `X-BlackRoad-Key` header; export `BR_KEY` if so.

## Run the script

```sh
# From the repo root
BR_KEY=your-origin-key \
BACKPLANE_URL=http://pi-ops.local:4000 \
GRAFANA_URL=http://mac-host:3000/d/pi-ops-ultra/ops?orgId=1&kiosk&refresh=5s \
scripts/pi_ops_first_light.sh
```

Environment variables:

| Variable            | Default                                                              | Description |
| ------------------- | -------------------------------------------------------------------- | ----------- |
| `BACKPLANE_URL`     | `http://127.0.0.1:4000`                                              | Base URL for `/api/devices/*` endpoints. |
| `GRAFANA_URL`       | `http://127.0.0.1:3000/d/pi-ops-ultra/ops?orgId=1&kiosk&refresh=5s` | URL pushed into the kiosk + status card. |
| `DISPLAY_MINI_ID`   | `display-mini`                                                       | Device ID for the mini SPI display. |
| `DISPLAY_MAIN_ID`   | `display-main`                                                       | Device ID for the ultrawide monitor. |
| `LED_DEVICE_ID`     | `pi-01`                                                              | Device ID for the LED Pi heartbeat. |
| `JETSON_DEVICE_ID`  | `jetson-01`                                                          | Device ID for Jetson telemetry. |
| `SIM_PANEL_URL`     | *(empty)*                                                            | Optional endpoint to receive a JSON status post. |
| `BR_KEY`            | *(empty)*                                                            | API key appended as `X-BlackRoad-Key`. |

The script executes the following steps:

1. Wake both displays via `display.wake` commands.
2. Push vivid SVG test patterns to the mini and main panels.
3. Publish telemetry heartbeats for the Pi LED and Jetson agents.
4. Attempt to post a `pi-ops.first-light` event to `SIM_PANEL_URL`; if the
   endpoint is unset or fails, a fallback status card is rendered on the
   mini display instead.

On success you should see the ultrawide Grafana view on the main display
and a “First light complete” card on the mini panel.
