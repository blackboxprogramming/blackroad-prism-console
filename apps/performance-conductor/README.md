# Performance Conductor

A lightweight Node/TypeScript service that connects to OBS, brokers real-time
performance commands, and publishes captions/gestures to browser overlays.

## Getting started

```bash
cd apps/performance-conductor
npm install
npm run build
npm start
```

During development you can run `npm run dev` to execute the TypeScript source
directly through `ts-node`.

### Environment

| Variable        | Default                | Description                                  |
|-----------------|------------------------|----------------------------------------------|
| `PORT`          | `5050`                 | HTTP port for `/cmd` and `/perform`.         |
| `OBS_URL`       | `ws://127.0.0.1:4455`  | OBS WebSocket endpoint.                      |
| `OBS_PASSWORD`  | `your_password`        | OBS WebSocket password.                      |
| `PROSODY_URL`   | _unset_                | Optional FastAPI sidecar base URL (e.g. `http://localhost:8000`). |

The service will always expose a WebSocket server for overlays on port `5051`.

## API

- `POST /cmd` – handle slash-style commands such as `/beat 128`.
- `POST /perform` – submit a performance payload containing the beat-aligned
  word sequence. When `PROSODY_URL` is configured the conductor will call the
  Python sidecar to refine pacing and SSML before scheduling captions.

## Overlay

Use the `performance-overlay` app (see `../performance-overlay`) or any static
file host that serves the provided `index.html` at `http://localhost:7777`.
Point an OBS Browser Source at that URL so it can subscribe to captions and
gestures coming from the conductor’s WebSocket hub.
