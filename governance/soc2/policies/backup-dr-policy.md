# Backup & Disaster Recovery Policy

## Purpose
Guarantee timely recovery from data loss or availability incidents by maintaining tested backups and disaster recovery procedures.

## Scope
All production systems storing or processing customer data, as well as critical internal services.

## Requirements
- Define RPO/RTO targets for each system; review annually.
- Automate database backups (e.g., RDS snapshots) with retention aligned to classification requirements.
- Replicate critical data across availability zones and enable encryption at rest.
- Maintain a disaster recovery runbook covering failover steps, communications, and responsibilities.
- Conduct at least one restore or DR drill annually; document results and remediation actions.

## Operational Practices
- Monitor backup jobs for failures and alert `#security`/on-call when issues arise.
- Store backup configuration and Infrastructure as Code in version control.
- Document dependencies between services to prioritize recovery sequencing.

## How Enforced
- Terraform guardrails configure AWS Config rules that validate encryption and backup settings.
- `evidence-pack` captures backup job logs, DR test notes, and related AWS outputs monthly.
- Access review workflows ensure only authorized personnel can trigger restores.

Evidence comes from: `evidence-pack`, AWS Config reports.
