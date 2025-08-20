# Security Hardening

- All containers run as non-root users where possible.
- mTLS is enforced between services via Traefik and Vault-issued certificates.
- UFW is configured with a default deny policy; only internal mirrors and registry are allowed for egress.
- Secrets are stored in HashiCorp Vault and mounted at runtime using short-lived tokens.
