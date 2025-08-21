# Egress Policy

Egress is denied by default. Only connections to the local network are permitted.

Allowed destinations:
- 10.0.0.0/8
- 127.0.0.1

Use `ops/scripts/egress-test.sh` to apply firewall rules.
