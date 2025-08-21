<!-- /opt/blackroad/dr/dr_runbook.md -->
# Disaster Recovery Runbook
1. Provision a new host and run `/opt/blackroad/bootstrap/host_init.sh --plan` then apply.
2. Restore services:
   ```
   /opt/blackroad/dr/dr_restore.sh 2024-06-19
   ```
RPO: 24h
RTO: 2h
