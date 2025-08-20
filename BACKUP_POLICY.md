<!-- FILE: /BACKUP_POLICY.md -->
# Backup Policy

- **RPO:** 1 hour
- **RTO:** 4 hours
- Daily restic backups to MinIO bucket `lucidia-backups`.
- Weekly verify using `restic check`.
- Quarterly full restore rehearsal using `ops/backup/restore_example.md`.
