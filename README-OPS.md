# Ops quickstart
Bridge runs on :4000; nginx routes /api and /ws

## Hybrid Deploy

Static site is served via GitHub Pages at https://blackroad.io.
API and NGINX configs deploy over SSH with `.github/workflows/prism-ssh-deploy.yml`.
Actions require secrets `DEPLOY_HOST`, `DEPLOY_USER`, and `DEPLOY_KEY`.

API health check: http://127.0.0.1:4000/api/health

On the server you can run:

```sh
scripts/nginx-ensure-and-health.sh
scripts/nginx-enable-tls.sh   # optional TLS helper
```

## Cleanup broom

`usr/local/sbin/br-cleanup.sh` audits the API, Yjs, bridges, nginx, IPFS, and more. It defaults to a read-only `audit` mode and can also `fix` or `prune`.

```sh
sudo br-cleanup.sh audit | tee /srv/ops/cleanup-audit.txt
sudo br-cleanup.sh fix   | tee /srv/ops/cleanup-fix.txt
sudo br-cleanup.sh prune | tee /srv/ops/cleanup-prune.txt
```

To run nightly, install the service and timer from `etc/systemd/system/` and reload systemd:

```sh
sudo cp etc/systemd/system/br-cleanup-nightly.* /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now br-cleanup-nightly.timer
```

An optional sudoers snippet is in `etc/sudoers.d/br-cleanup`.


## PD↔Jira sandbox smoke

- Configure the sandbox credentials (see `.env` or Secrets Manager) including `PD_*_SANDBOX`, `JIRA_*_SANDBOX`, `SMOKE_SYSTEM_KEY`, and `RUNBOOK_URL_SANDBOX`.
- Ops Portal exposes a **Run PD+Jira Smoke** button on `/ops` once your ops identity is stored locally. The button calls `/api/smoke/pd-jira?sandbox=1`, which opens and resolves a PagerDuty + Jira pair in under 90 seconds.
- The smoke flow also lives in GitHub Actions as `.github/workflows/pd-jira-smoke.yml`. Trigger it manually with the service identity (`vars.SMOKE_ACTOR_EMAIL` and `vars.SMOKE_ACTOR_GROUPS`).
- A one-hour throttle prevents repeated sandbox pages. Results surface in the heatmap snapshot as system `sandbox`, including PD and Jira links.


_Last updated on 2025-10-31_
