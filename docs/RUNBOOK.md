# Runbook

## Failover
1. Run `make -C infrastructure drill-failover` to simulate outage.
2. Verify services on mirror: `curl -k https://blackroad.io/healthz`.

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
