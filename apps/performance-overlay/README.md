# Performance Overlay

Static browser overlay that listens to the conductor WebSocket feed and renders
beat-synced captions with lightweight gesture icons. Serve it locally and point
an OBS Browser Source at the exposed URL (defaults to `http://localhost:7777`).

```bash
cd apps/performance-overlay
npm install
npm start
```

The server uses Express to host the `public/index.html` file and any supporting
assets.
