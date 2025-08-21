#!/usr/bin/env bash
# /opt/blackroad/iam/vault_bootstrap.sh
set -euo pipefail
VAULT_ADDR=${VAULT_ADDR:-http://127.0.0.1:8200}
if [ ! -f /root/VAULT_SHARES.txt ]; then
  vault operator init -key-shares=5 -key-threshold=3 -format=json >/tmp/vault.json
  jq -r '.unseal_keys_b64[]' /tmp/vault.json > /root/VAULT_SHARES.txt
  chmod 600 /root/VAULT_SHARES.txt
  jq -r '.root_token' /tmp/vault.json >/root/VAULT_TOKEN
  chmod 600 /root/VAULT_TOKEN
fi
export VAULT_TOKEN=$(cat /root/VAULT_TOKEN)
vault operator unseal $(sed -n '1p' /root/VAULT_SHARES.txt)
vault operator unseal $(sed -n '2p' /root/VAULT_SHARES.txt)
vault operator unseal $(sed -n '3p' /root/VAULT_SHARES.txt)

vault secrets enable -path=secret kv-v2 2>/dev/null || true

cat <<'POL' | vault policy write lucidia-app -
path "secret/data/lucidia/*" { capabilities = ["read"] }
POL
cat <<'POL' | vault policy write ci -
path "secret/data/ci/*" { capabilities = ["read"] }
POL
cat <<'POL' | vault policy write admin -
path "secret/data/*" { capabilities = ["create", "read", "update", "delete", "list"] }
POL

vault write auth/oidc/config oidc_discovery_url="http://keycloak:8080/realms/BlackRoad" \
  oidc_client_id="vault" oidc_client_secret="vault-secret" default_role="reader" 2>/dev/null || true
vault write auth/oidc/role/reader bound_audiences="vault" \
  allowed_redirect_uris="http://vault:8200/ui/vault/auth/oidc/oidc/callback" \
  user_claim="sub" policies="lucidia-app" 2>/dev/null || true

vault kv put secret/lucidia/database PASSWORD=$(openssl rand -hex 16) >/dev/null
