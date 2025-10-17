# Minimal read to specific KV paths we allow CI to access.
path "kv-blackroad/*" {
  capabilities = ["read", "list"]
}

# If you later use transit (signing), grant only 'update' to a specific key:
# path "transit/sign/blackroad-builds" {
#   capabilities = ["update"]
# }
