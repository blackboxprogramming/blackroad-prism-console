BlackRoad.io — Site

Static Vite + React + Tailwind site served at / on blackroad.io.
NGINX proxies /api to the backend and /ws for WebSockets.

## Local dev

cd sites/blackroad
npm i
npm run dev
# open http://localhost:5173

## Build

npm run build   # outputs to sites/blackroad/dist

## Preview

npm run preview # http://localhost:5174

## Testing

npm test           # runs Playwright smoke + regression suite (starts local dev server automatically)
npm run e2e        # alias for the same Playwright test runner

## Deployment

GitHub Pages builds and deploys `dist` on every push to `main` via `.github/workflows/site-build.yml`.
Pages URL: https://blackroad.io

To switch to Vercel or Cloudflare Pages, add the respective project tokens as repository
secrets and enable the `pr-preview-vercel.yml` or `pr-preview-cloudflare.yml` workflows.
Production is served by the repository’s NGINX/Caddy configs; GitHub Pages hosts the static assets.

⸻


_Last updated on 2025-09-11_
