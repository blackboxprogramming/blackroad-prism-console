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

## Post-merge checklist

- [ ] Rebuild local `.env` files and verify agent manifests have the minimal scopes required for their tasking.
- [ ] Run `npm run lint` and `npm test -- --runInBand` locally to confirm the API package scripts still pass.
- [ ] Confirm GitHub Actions (`ci.yml`, deploy workflows) completed successfully for the merge commit.
- [ ] Review dependency diffs for unexpected upgrades; freeze minors if the CI image diverges from prod.
- [ ] Double-check secrets and telemetry destinations for the release to ensure no credentials leaked in logs.
