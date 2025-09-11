<!-- /opt/blackroad/tests/chaos/README.md -->
# Chaos Tests
Run weekly via CI and report to Grafana webhook.

## DNS process drop
Use k6 script `dns_drop.js` to stop BIND and verify fallback.

## Node kill
Use k6 script `kill_node.js` to terminate a container and confirm Traefik shifts traffic.

## Model corruption
Use k6 script `corrupt_model.js` to replace a model file and ensure loader detects SHA mismatch and loads fallback.

_Last updated on 2025-09-11_
