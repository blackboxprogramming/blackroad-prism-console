# Performance Stack Quickstart

This repository now contains everything needed to drive an OBS performance with
beat-quantised captions and gestures:

1. **Prosody sidecar** (`services/prosody-sidecar`)
   - FastAPI service for syllable-aware pacing and SSML output.
2. **Performance conductor** (`apps/performance-conductor`)
   - TypeScript/Node service that handles OBS commands, schedules captions, and
     forwards overlays/gestures over WebSockets.
3. **Performance overlay** (`apps/performance-overlay`)
   - Browser source that renders rolling captions and lightweight gesture icons.

## Run the stack locally

1. Start the sidecar:
   ```bash
   cd services/prosody-sidecar
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn sidecar:app --reload --port 8000
   ```
2. Launch the conductor (requires OBS WebSocket credentials):
   ```bash
   cd apps/performance-conductor
   npm install
   PROSODY_URL=http://127.0.0.1:8000 OBS_PASSWORD=your_password npm run dev
   ```
3. Serve the overlay:
   ```bash
   cd apps/performance-overlay
   npm install
   npm start
   ```
4. Point an OBS Browser Source at `http://localhost:7777` and send a performance
   payload to the conductor:
   ```bash
   curl -X POST http://localhost:5050/perform \
     -H "Content-Type: application/json" \
     -d @perf.json
   ```

Use the `/cmd` endpoint for live adjustments such as `{"line":"/beat 128"}` or
`{"line":"/theme neon-vapor"}`.
