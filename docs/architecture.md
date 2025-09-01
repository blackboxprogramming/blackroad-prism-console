# BlackRoad Architecture (SSOT)

## Portals
- **BlackRoad.io** — public creative suite: Roadie, Lucidia, Athena, RoadBook, RoadView, RoadChain.
- **BlackRoadInc.us** — enterprise/infra: Genesis Road (RIA), RoadChain/ RoadCoin, investor/admin, SSO.

> Based on Codex Build Brief (UI • Features • Setups) [oai_citation:4‡codex-brief-blackroad.txt](file-service://file-5XetBpV4rRS3we1nWZ5FKc).

## Stack
- Frontend: Next.js + Tailwind (two apps).
- APIs: Python Flask services; Socket.IO for realtime.
- Workers: Celery + Redis.
- Data: PostgreSQL, Redis, MinIO (S3).
- Chain: RoadChain (geth-compatible) @ `:8545`.
- Auth: Lucidia SSO (JWT short-lived + refresh).
- Edge: NGINX reverse proxy @ `:80/:443` with `/health` and `/api/health` hard-paths.

## Canonical ports
- io app `:9000`, inc app `:8000`, SSO `:7000`, API `:4000`, RPC `:8545`, MinIO `:9001` [oai_citation:5‡codex-brief-blackroad.txt](file-service://file-5XetBpV4rRS3we1nWZ5FKc).

## NGINX (always-green pattern)
- Serve `/var/www/blackroad/index.html` (fallback SPA).
- `/health` → 200; `/api/health` → `{ok:true}`.
- Proxy `/api/*` to `127.0.0.1:4000`.
- WebSocket upgrade for `/socket.io/` [oai_citation:6‡THE BRAND AND NGINX SETUP THAT WORK.txt](file-service://file-Rd9Jh7adPjc2hCUCdE43uE).

## Systemd
- `blackroad-api.service` runs Node/Flask API with `Restart=always` [oai_citation:7‡THE BRAND AND NGINX SETUP THAT WORK.txt](file-service://file-Rd9Jh7adPjc2hCUCdE43uE).

## Observability
- `/api/ops` (see `api/ops_middleware.js`): `{ ok, version, last_deploy, error_rate_5m }`.
- Logs: NGINX access/error; API request logs; structured events feed.

## Delivery order
1) SSO + Landing + Health
2) All-AI dashboard + Services API
3) Roadie + Lucidia chat UIs
4) RoadBook/ RoadView CRUD
5) RoadChain explorer + Wallet
6) Billing/Admin
7) Polish/Accessibility [oai_citation:8‡codex-brief-blackroad.txt](file-service://file-5XetBpV4rRS3we1nWZ5FKc).
