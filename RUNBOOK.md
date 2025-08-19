<!-- FILE: /RUNBOOK.md -->
# BlackRoad Stack Runbook

## Bootstrap
1. `bash infra/provision.sh`
2. Access Gitea at `https://blackroad.io`.

## Rotate
- Update images via CI and redeploy with `docker compose pull && docker compose up -d`.

## Failover
- Promote Postgres replica: `docker exec postgres-replica repmgr standby promote`.

## Restore
1. Retrieve backup from MinIO using restic.
2. `restic restore latest --target /restore`.

## Site Down Checklist
- Run `ops/health/check.sh`.
- Inspect `docker compose ps`.

## DNS and Tor
- Deploy NSD with `infra/dns/deploy.sh` on ns1/ns2.
- Tor service uses `/infra/tor/torrc`; start with `tor -f torrc`.
