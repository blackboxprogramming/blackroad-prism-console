#!/bin/bash
set -euo pipefail
VAULT_ADDR=${VAULT_ADDR:-http://10.0.0.10:8200}
VAULT_TOKEN=${VAULT_TOKEN:-root}
export VAULT_ADDR VAULT_TOKEN
vault secrets enable -path=secret kv || true
vault secrets enable transit || true
vault policy write blackroad ../../security/vault-policies.hcl
