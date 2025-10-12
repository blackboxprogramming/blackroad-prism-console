# BlackRoad SOC 2 Governance Scaffold

This package provides the lightweight documentation, automation, and evidence structure required to operate against the SOC 2 Trust Services Criteria without slowing product delivery. Import the CSVs into Notion, publish the policies as individual pages, and wire the GitHub Actions to the appropriate secrets to start producing evidence automatically.

## Contents

- `notion/controls.csv` – starter control catalog mapped to SOC 2 criteria.
- `policies/` – concise, enforceable security policies with automation hooks.
- `templates/` – post-mortem, change ticket, and access review templates.
- `slack/announcements.md` – ready-to-send enablement copy for #security and #announcements.
- `asana-tasks.csv` – bulk-upload for governance work tracking.
- `data-handling.md` – classification guide and retention table.
- `evidence-page.md` – blueprint for the monthly Notion evidence index.
- `vendor-database.csv` – Airtable/Notion vendor register with required metadata.

Align each policy's "How enforced" section with the automation added in `.github/workflows/` and `br-infra-iac/` to ensure humans only approve exceptions while bots gather routine evidence.
