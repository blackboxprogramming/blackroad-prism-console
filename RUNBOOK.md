# Local Development Runbook

## VS Code
Use **Dev Containers: Reopen in Container** and ensure port 3000 is forwarded.

```bash
npm run dev                   # website at http://localhost:3000
pytest -q                    # run tests
brc plm:items:load --dir fixtures/plm/items
brc mfg:spc:analyze --op OP-200 --window 50
```

# GitHub Guardian Runbook

After merging the policy baseline PR, apply repository settings:

```bash
OWNER=<org> REPO=<repo> bash scripts/gh/perms_guard.sh ci,perms-assert main
OWNER=<org> REPO=<repo> bash scripts/gh/sync_labels.sh
gh workflow run perms-assert
```

To rotate tokens, regenerate the PAT used for `gh` and update repository secrets.

---

# Runbook

## Restoring from Backup

1. Retrieve Restic snapshots from MinIO:
   ```bash
   restic -r s3:http://minio:9000/lucidia restore latest --target /restore
   ```
2. Restore the Postgres database:
   ```bash
   docker exec -i deploy-postgres psql -U lucidia -d lucidia < /restore/postgres.sql
   ```
3. Restore Qdrant snapshots by copying the restored storage directory to the qdrant volume.
4. Restart the stack:
   ```bash
   docker compose -f deploy/docker-compose.yml restart
   ```
<!-- FILE: /RUNBOOK.md -->
# BlackRoad Stack Runbook

## Bootstrap
1. `bash infra/provision.sh`
2. Access Gitea at `https://blackroad.io`.

## Rotate
- Update images via CI and redeploy with `docker compose pull && docker compose up -d`.

## Failover
- Promote Postgres replica: `docker exec postgres-replica repmgr standby promote`.

## Restore
1. Retrieve backup from MinIO using restic.
2. `restic restore latest --target /restore`.

## Site Down Checklist
- Run `ops/health/check.sh`.
- Inspect `docker compose ps`.

## Nginx Runtime Checks

Use the following steps to create real log activity, reload Nginx safely, and
validate response compression when investigating runtime behaviour.

1. **Validate configuration and reload the service**
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   journalctl -u nginx -n 50 --no-pager
   ```
   For Docker deployments:
   ```bash
   docker compose exec nginx nginx -t && docker compose exec nginx nginx -s reload
   docker compose logs -n 50 nginx
   ```
2. **Verify `Content-Encoding` headers from the running service**
   ```bash
   curl -sI --http2 -H 'Accept-Encoding: br,gzip' https://YOUR.DOMAIN \
     | awk 'BEGIN{IGNORECASE=1}/^Content-Encoding:/{print}'
   ```
   Sample multiple paths to confirm the negotiated encoding:
   ```bash
   for p in / /index.html /assets/app.js /assets/app.css; do
     curl -sI -H 'Accept-Encoding: br,gzip' "https://YOUR.DOMAIN$p" |
       awk -v p="$p" 'BEGIN{IGNORECASE=1}/^Content-Encoding:/{print p,$2}'
   done | sort | uniq -c
   ```
3. **Count gzip/brotli usage from access logs**
   Add the `Content-Encoding` field to your access log format once:
   ```nginx
   log_format main_ce '$remote_addr - $remote_user [$time_local] "$request" '
                     '$status $body_bytes_sent "$http_referer" "$http_user_agent" '
                     '$sent_http_content_encoding';
   access_log /var/log/nginx/access.log main_ce;
   ```
   Reload, generate traffic, then tally encodings:
   ```bash
   awk '{
     enc=$NF; if(enc=="gzip")gz++; else if(enc=="br")br++; else if(enc=="-")none++;
   } END {printf "br=%d gzip=%d none=%d\n", br, gz, none}' /var/log/nginx/access.log
   ```
   For Docker logs emitted to stdout:
   ```bash
   docker compose logs nginx | awk '{
     enc=$NF; if(enc=="gzip")gz++; else if(enc=="br")br++; else if(enc=="-")none++;
   } END {printf "br=%d gzip=%d none=%d\n", br, gz, none}'
   ```
4. **List active listeners and compare with configuration**
   ```bash
   ss -ltnp | awk '$1=="LISTEN" && $NF ~ /nginx/{print $4}' | sort -u
   sudo nginx -T | awk '/^\s*listen\b/{print $2}' | sed 's/;//' | sort -u
   ```
5. **Perform a quick TLS sanity check**
   ```bash
   openssl s_client -connect YOUR.DOMAIN:443 -servername YOUR.DOMAIN -brief </dev/null | sed -n '1,25p'
   sudo certbot renew --dry-run
   ```

## DNS and Tor
- Deploy NSD with `infra/dns/deploy.sh` on ns1/ns2.
- Tor service uses `/infra/tor/torrc`; start with `tor -f torrc`.

## Runtime Controller Developer Mode Checklist

Use the following steps to confirm the runtime controller is actually running with its developer-mode settings enabled:

1. **Verify environment/configuration flags**
   ```bash
   printf 'DEV_MODE=%q\n' "$DEV_MODE"
   systemctl show controller.service -p Environment | sed 's/^Environment=//'
   grep -RIE --line-number --include='*.env' \
     '(^|\s)(dev(eloper)?_mode|debug)\s*=\s*(1|true)\b' \
     /etc /opt /srv /etc/default /etc/sysconfig 2>/dev/null | head
   ```
2. **Load the controller without errors**
   ```bash
   python3 - <<'PY'
   try:
       import runtime_controller as rc
       a = rc.RuntimeController().decide(
           rc.Metrics(
               eur=0.95,
               reject_pct=1.2,
               stale_pct=0.3,
               psu_load_pct=78,
               thermal_headroom_c=7,
               latency_p95_ms=180,
               accepts=1200,
               rejects=12,
               hw_errors=0,
           )
       )
       print("controller_ok", a.directive, a.step_pct, a.reason)
   except Exception as e:
       print("controller_error", type(e).__name__, str(e))
       raise
   PY
   ```
3. **Confirm the service is serving developer-mode responses**
   ```bash
   if [ -n "${PORT:-}" ]; then
     curl -fsS "http://localhost:${PORT}/health" && echo
     curl -fsS "http://localhost:${PORT}/version" && echo
   else
     echo "PORT not exported; probing default 8080"
     curl -fsS "http://localhost:8080/health" && echo
     curl -fsS "http://localhost:8080/version" && echo
   fi
   ss -tulpn | awk '/LISTEN/ && /controller|python|gunicorn|uvicorn/ {print}'
   journalctl -u controller.service -n 80 --no-pager | sed -n '1,40p'
   ```

If the controller is containerized, adapt the steps with the appropriate tooling:

```bash
docker ps --format '{{.ID}}\t{{.Names}}\t{{.Ports}}' | grep -i controller
docker exec -it <CID> printenv DEV_MODE
docker exec -it <CID> curl -fsS localhost:PORT/version
kubectl get po -n <ns> -l app=controller
kubectl logs deploy/controller -n <ns> --tail=100
kubectl exec -n <ns> deploy/controller -- printenv DEV_MODE
kubectl port-forward -n <ns> deploy/controller 8080:PORT &
curl -fsS localhost:8080/version
```

> **Tip:** In `btop`, press `f` to filter on the controller process; a healthy developer loop emits small CPU blips roughly every 60 seconds.

**Success criteria**

- `DEV_MODE` (or an equivalent flag) resolves to `1`/`true` in either the environment or configuration.
- The Python probe prints `controller_ok …` with a directive, step percentage, and reason without triggering a traceback.
- The `/version` endpoint or logs show developer/debug markers and verbose reasoning strings.
