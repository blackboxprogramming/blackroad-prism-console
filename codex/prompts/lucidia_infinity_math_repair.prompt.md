# Codex Repair Prompt – Lucidia Infinity Math Deployment

"Debug and repair the Lucidia Infinity Math System deployment at `/srv/lucidia-math` with these steps:"

---

## 1. Service Startup Issues

* If `systemctl status lucidia-math` shows errors:

  * Check Python virtualenv path and adjust `ExecStart`.
  * Ensure Gunicorn is installed inside the venv.
  * If missing dependencies, run `pip install -r requirements.txt`.
  * Verify `ui.py` exposes `app` object (`app = Flask(__name__)`).
  * Restart service: `systemctl daemon-reload && systemctl restart lucidia-math`.

---

## 2. Port & Proxy Conflicts

* If `curl http://127.0.0.1:8500/health` fails:

  * Confirm Gunicorn is bound to `127.0.0.1:8500`.
  * If port is taken, reassign to 8600 and update Nginx.
  * Run `ss -tlnp | grep gunicorn` to check process.

---

## 3. Nginx Errors (404 or Bad Gateway)

* Check `/etc/nginx/sites-enabled/blackroad.conf`:

  * Ensure location block:

    ```nginx
    location /math/ {
      proxy_pass http://127.0.0.1:8500/;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header Host $host;
    }
    ```
  * Run `nginx -t && systemctl reload nginx`.
  * If 404 persists, ensure SPA fallback:

    ```nginx
    location /math {
      try_files $uri /index.html;
    }
    ```

---

## 4. Frontend Portal Issues

* If `/math` loads blank in React SPA:

  * Check that route is added in `App.jsx` or router config:

    ```jsx
    <Route path="/math/*" element={<InfinityMath />} />
    ```
  * Ensure component imports `/api/math/*` endpoints.
  * Open browser dev console → check for 404 API calls.

---

## 5. Logs & Diagnostics

* View Gunicorn logs: `journalctl -u lucidia-math -n 100 --no-pager`.
* View Nginx logs: `/var/log/nginx/error.log` and `access.log`.
* Print last 50 lines of contradiction log to confirm system output.

---

## 6. Repair Actions

* If Gunicorn crashes: isolate broken module (`logic.py`, `primes.py`, etc.), disable import, restart service, then patch module.
* If API responds but UI fails: rebuild frontend (`npm run build`), redeploy `index.html`.
* If output files not generated: check `/srv/lucidia-math/output/` permissions and create missing dirs.

---

## 7. Validation

* `curl http://127.0.0.1:8500/health` → `{ "status": "ok" }`.
* `curl https://blackroad.io/math` → UI loads.
* Run one demo from each module (Logic, Primes, Waves, etc.) to confirm.
* Contradiction log contains at least one entry.

---

"Goal: automatically repair Lucidia Infinity Math deployment so `/math` portal serves correctly under Nginx, systemd service stays active, and all modules produce output. Provide step-by-step fixes for service, proxy, and UI."

