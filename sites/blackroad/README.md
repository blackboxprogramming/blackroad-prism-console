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

Vercel previews are available out of the box: add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and
`VERCEL_PROJECT_ID` repository secrets and the `PR Preview — Vercel` workflow will deploy PRs
automatically. The same deployment path powers `/deploy-preview [env]` via ChatOps for manual
rebuilds or targeted aliases. Production is served by the repository’s NGINX/Caddy configs; GitHub
Pages hosts the static assets.

⸻


_Last updated on 2025-09-11_
