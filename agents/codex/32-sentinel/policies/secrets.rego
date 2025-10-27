package sentinel.secrets

# sentinel-allow: scope:read-only
# sentinel-allow: scope:deploy
# sentinel-deny: scope:root
# sentinel-default-ttl: 900
# sentinel-max-ttl: 3600


default allow = false

allow {
  input.scope == "read-only"
}

allow {
  input.scope == "deploy"
  input.ttl <= 3600
}

hint["Secrets must stay scoped and short-lived; request rotation if longer."]
