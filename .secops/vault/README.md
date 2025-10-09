# Vault OIDC (GitHub Actions) — Setup (run locally; do not commit sensitive outputs)

## Prereqs
- Vault server reachable to CI (or via Tailscale/zero-trust).
- Admin token to bootstrap (use once; store securely, never in Git).

## 1) Enable JWT/OIDC auth method
vault auth enable jwt

## 2) Configure JWT with GitHub issuer
vault write auth/jwt/config \
  oidc_discovery_url="https://token.actions.githubusercontent.com" \
  bound_issuer="https://token.actions.githubusercontent.com"

## 3) Create policy for BlackRoad CI (least privilege)
vault policy write blackroad-ci .secops/vault/policy_blackroad.hcl

## 4) Create a role bound to org/repo and branch envs
vault write auth/jwt/role/blackroad \
  role_type="jwt" \
  user_claim="job_workflow_ref" \
  bound_audiences="https://github.com/${GITHUB_ORG}" \
  bound_claims='{"repository":"blackboxprogramming/blackroad-prism-console"}' \
  bound_claims_type="glob" \
  token_policies="blackroad-ci" \
  token_ttl="15m" \
  token_max_ttl="30m"

> Tip: You can scope bound_claims to a specific environment or branch if desired.

## 5) Create a KV path and put a **test secret** (for example purposes)
vault secrets enable -path=kv-blackroad kv
vault kv put kv-blackroad/addresses DEMO="this-is-a-demo-not-real"
