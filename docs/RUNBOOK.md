# Runbook

## Failover
1. Run `make -C infrastructure drill-failover` to simulate single-region outage.
2. Verify services on mirror: `curl -k https://blackroad.io/healthz`.

## Multi-Region Active-Active
1. Execute `make -C infrastructure drill-multi-region` for region failover.
2. Consult `resilience/multi-region-failover-runbook.md` for full procedure.

## Certificate renewal
1. Use step-ca to issue cert:
   ```bash
   step ca certificate blackroad.io blackroad.pem blackroad-key.pem
   ```
2. Reload nginx: `docker exec infrastructure-nginx-1 nginx -s reload`.

## Key rotation
1. Update WireGuard keys in `infrastructure/wireguard` and restart container:
   ```bash
   docker compose -f infrastructure/docker-compose.yml up -d wireguard
   ```
