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
