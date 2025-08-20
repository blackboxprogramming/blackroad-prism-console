# BlackRoad.io Portal — Full‑Stack Scaffold

A production‑ready scaffold for the BlackRoad‑style portal you described. Includes:

- **Frontend**: React + Vite + Tailwind, dark UI, Timeline/Tasks/Commits tabs, Agent Stack with live charts, Wallet (RC), Contradictions, Session Notes, and Run/Revert/Mint actions.
- **Backend**: Express + Socket.IO, JWT auth, endpoints for timeline/tasks/commits/agents/wallet/notes, and real‑time system metrics. Optional guarded shell execution.

## Quick Start

### 1) Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
# server at http://localhost:4000
```

### 2) Frontend
```bash
cd ../frontend
npm install
npm run dev
# app at http://localhost:5173
```

### 3) Login
Use **username** `root` and **password** `Codex2025`.

### Configure
- `backend/.env` — set `JWT_SECRET`, `CORS_ORIGIN` (comma‑separated origins), and `ALLOW_SHELL` (defaults to `false`).
- Change the API base by setting `VITE_API_BASE` in `frontend` (defaults to `http://localhost:4000`).

### Deploy Notes
- Put backend behind Nginx (reverse proxy) with TLS.
- Build frontend: `npm run build` → serve `dist/` via Nginx or the backend as static assets.
- Replace in‑memory store with Postgres/Redis when ready.
- Wire real agents to `/api/actions/*` and stream richer events over Socket.IO.

---

This scaffold is intentionally clean and compact so you can drop in your own logic fast.
