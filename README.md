<!-- FILE: /srv/blackroad-api/README.md -->
# BlackRoad.io Backend (API + Socket.IO + SQLite)

This is a production-ready Express backend for **blackroad.io**, featuring:

- Express API with modular routers
- Cookie-session auth + bcrypt password hashing
- SQLite (via better-sqlite3) with auto-migrations
- Socket.IO real-time metrics
- RoadCoin wallet ledger (mint + transfer)
- Agents, tasks, notes, timeline, commits, contradictions
- LLM bridge to local `lucidia-llm` (FastAPI on port 8000)
- Deployment webhook (optional) + healthcheck
- NGINX & systemd examples

---

## Quick Start

```bash
# On server
sudo mkdir -p /srv/blackroad-api
cd /srv/blackroad-api
# Copy the extracted files here (from the provided zip)

cp .env.example .env   # then edit secrets
npm install

# First run will create the SQLite DB and apply migrations.
npm run seed           # creates the admin (uses env vars)

# Start (dev)
npm run dev

# Start (prod, optional systemd below)
npm start
```

### Environment

Edit `.env`:

```
NODE_ENV=production
PORT=4000
DB_PATH=/srv/blackroad-api/blackroad.db
SESSION_SECRET=...
JWT_SECRET=...
SOCKET_SECRET=...
ALLOWED_ORIGIN=https://blackroad.io
ADMIN_EMAIL=root@blackroad.io
ADMIN_PASSWORD=Codex2025
ADMIN_NAME=Root
LUCIDIA_LLM_URL=http://127.0.0.1:8000
DEPLOY_WEBHOOK_SECRET=...
ALLOW_DEPLOY_RUN=false
LOG_DIR=/var/log/blackroad-api
```

### NGINX

Use the provided snippet at `./nginx/blackroad_api_snippet.conf` inside your main server block.

### systemd

Use `./system/blackroad-api.service` and `./system/lucidia-llm.service` (optional) then:

```bash
sudo cp system/blackroad-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now blackroad-api

# Optional LLM stub
sudo apt-get install -y python3-venv
sudo mkdir -p /srv/lucidia-llm
cp -r lucidia-llm/* /srv/lucidia-llm/
cd /srv/lucidia-llm
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
sudo cp /srv/blackroad-api/system/lucidia-llm.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now lucidia-llm
```

### Healthcheck

```
curl -s http://127.0.0.1:4000/api/health | jq
```

### Default Admin

- Email: `root@blackroad.io`
- Password: `Codex2025`

> **Change these immediately in production.**

---

## Project Layout

```
/srv/blackroad-api
├── server_full.js
├── package.json
├── .env.example
├── src/
│   ├── config.js
│   ├── logger.js
│   ├── db.js
│   ├── auth.js
│   ├── rateLimiter.js
│   ├── socket.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── agents.js
│   │   ├── wallet.js
│   │   ├── notes.js
│   │   ├── tasks.js
│   │   ├── timeline.js
│   │   ├── contradictions.js
│   │   ├── commits.js
│   │   ├── metrics.js
│   │   ├── health.js
│   │   ├── llm.js
│   │   └── deploy.js
│   ├── services/
│   │   ├── agentService.js
│   │   ├── walletService.js
│   │   ├── llmService.js
│   │   ├── metricsService.js
│   │   └── notifyService.js
│   └── utils/
│       ├── crypto.js
│       └── validate.js
├── db/
│   └── migrations/
│       └── 0001_init.sql
├── scripts/
│   ├── seed_admin.js
│   └── deploy.sh
├── system/
│   ├── blackroad-api.service
│   ├── lucidia-llm.service
│   └── healthcheck.sh
└── nginx/
    └── blackroad_api_snippet.conf
```

---

## Security Notes

- Put **strong secrets** in `.env`.
- Set `NODE_ENV=production` in production.
- Set `ALLOW_DEPLOY_RUN=false` unless you need auto-deploy.
- SQLite file permissions should restrict non-root access.
- NGINX adds further security headers; see snippet.
