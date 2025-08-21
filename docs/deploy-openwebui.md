# Deploy Open WebUI

Use `deploy_openwebui.sh` to run Open WebUI behind NGINX with optional TLS and SSO.

## Quick start

```bash
sudo install -m 0755 tools/deploy_openwebui.sh /usr/local/bin/deploy_openwebui.sh
sudo DOMAIN=openwebui.blackroad.io /usr/local/bin/deploy_openwebui.sh deploy
```

## Issue TLS certificates

```bash
sudo ACME_EMAIL=you@blackroad.io /usr/local/bin/deploy_openwebui.sh cert
```

Set environment variables to customize image tag, backends, or OIDC settings.
Re-running the deploy command is safe and idempotent.
