package sentinel.network

# sentinel-allow: api.blackroad.local:443
# sentinel-allow: telemetry.blackroad.local:8443
# sentinel-allow: localhost:* 
# sentinel-deny: 0.0.0.0:*

default allow = false

# Human-friendly policy describing outbound rules.
allow {
  input.destination == "api.blackroad.local"
  input.port == 443
}

allow {
  input.destination == "telemetry.blackroad.local"
  input.port == 8443
}

allow {
  input.destination == "localhost"
}

hint["Use approved service endpoints or request a policy exception."]
