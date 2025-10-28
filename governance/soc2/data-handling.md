# Data Handling & Classification Rules

| Classification | Description | Examples | Default Retention |
| --- | --- | --- | --- |
| Public | Approved for anyone to view. | Marketing site content, public status updates. | Until superseded. |
| Internal | Operational content for employees/contractors. | Runbooks, project plans, internal dashboards. | 2 years unless longer required. |
| Confidential | Customer data, financials, non-public code. | Production databases, customer support tickets. | Logs 90 days, backups 30 days, other records 3 years. |
| Restricted | Secrets, credentials, encryption keys, PII/PHI. | 1Password vaults, AWS KMS keys, payroll data. | Minimum required by law or until rotated/destroyed. |

## Handling Rules

1. **Production data isolation** – Never copy production data into lower environments without tokenization or anonymization. The `env-guard` GitHub Action blocks references to production database URLs in commits.
2. **Secret management** – Store credentials in 1Password and AWS Systems Manager Parameter Store. Secret scanning (GitHub Advanced Security) runs continuously; monthly 1Password reports feed the evidence pack.
3. **Data exports** – Stripe or billing exports require approval from Security and Finance; notifications route to `#security` when exports are generated.
4. **Retention** – Apply the retention schedule above. Incidents, post-mortems, and risk register entries are retained indefinitely.
5. **Access** – SSO with MFA required for all systems handling Confidential or Restricted data. Access reviews run quarterly via the scheduled GitHub Action.

## CI Guardrail

The `.github/workflows/env-guard.yml` workflow enforces the production data rule with a fast `grep` check:

```bash
grep -R "PROD_DB_URL" . && { echo "❌ Prod DB var referenced"; exit 1; } || true
```

Extend this guard with additional forbidden patterns as new systems come online.
