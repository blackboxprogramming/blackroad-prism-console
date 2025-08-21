BlackRoad.io — Site

Static Vite + React + Tailwind site served at / on blackroad.io.
NGINX proxies /api to the backend and /ws for WebSockets.

Local dev

cd sites/blackroad
npm i
npm run dev
# open http://localhost:5173

Build

npm run build   # outputs to sites/blackroad/dist

Preview

npm run preview # http://localhost:5174

Production is served by the repository’s NGINX/Caddy configs. Artifacts are also uploaded from CI.

⸻

