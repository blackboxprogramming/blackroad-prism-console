# Runtime status and next steps

## Current checks
- `bash tools/verify-runtime.sh` confirms Node v22.19.0 and npm 11.4.2 are available in the container, but the API on port 4000 and the LLM stub on port 8000 are not running yet. 【e14104†L1-L7】

## How to get things working
1. **Provision backend dependencies.** On the host that will run the API, follow the quick-start flow (`cd /path/to/your/working/copy && sudo bash ops/install.sh && bash tools/verify-runtime.sh`) so the installer can scan sources, install missing packages, and prepare your `.env` and database. 【F:README.md†L31-L52】
2. **Bring up the API.** After the installer finishes, start the Express server (e.g., via your process manager or `node srv/blackroad-api/server_full.js`) and re-run `bash tools/verify-runtime.sh` until the `/health` probe on port 4000 turns green. 【F:README.md†L113-L125】【F:srv/blackroad-api/server_full.js†L1-L44】
3. **Launch the LLM stub if you don’t have a live model.** The health script prints the exact virtualenv + `uvicorn` command to boot the FastAPI echo stub shipped in `srv/lucidia-llm`. Run that command so the checker can see `/health` on port 8000. 【F:README.md†L17-L24】【F:tools/verify-runtime.sh†L12-L22】
4. **Spin up the web UI.** From `sites/blackroad`, install dependencies and run `npm run dev` (Vite) to preview the front-end locally on http://localhost:5173. Use `npm run build` for production assets or `npm run preview` for a static check. 【F:sites/blackroad/README.md†L1-L24】
5. **Smoke the API once it’s live.** Use the sample curl calls (`/api/subscribe/config`, `/api/subscribe/status`, etc.) to verify auth/session flow and Stripe endpoints on port 4000. 【F:README.md†L142-L153】

## After everything is online
- Re-run `bash tools/verify-runtime.sh` to confirm both ports are healthy before shipping changes.
- Capture the output (or screenshots for PRs) so other contributors can confirm the environment is behaving.
- If a step fails, reference the quick-start installer and health checker logs when filing an issue or pinging the automation bots.
