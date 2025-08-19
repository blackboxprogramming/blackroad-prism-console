# Runbook

## Restoring from Backup

1. Retrieve Restic snapshots from MinIO:
   ```bash
   restic -r s3:http://minio:9000/lucidia restore latest --target /restore
   ```
2. Restore the Postgres database:
   ```bash
   docker exec -i deploy-postgres psql -U lucidia -d lucidia < /restore/postgres.sql
   ```
3. Restore Qdrant snapshots by copying the restored storage directory to the qdrant volume.
4. Restart the stack:
   ```bash
   docker compose -f deploy/docker-compose.yml restart
   ```
