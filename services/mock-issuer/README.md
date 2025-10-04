# Mock OIDC Issuer

This FastAPI service generates ephemeral RSA keys at startup and exposes a minimal
OpenID Connect surface suitable for local development:

- `/.well-known/openid-configuration`
- `/.well-known/jwks.json`
- `/token` for minting ID tokens
- `/healthz` for readiness checks

Use the `/token` endpoint to mint short-lived ID tokens for the AutoPal stack.
