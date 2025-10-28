# Asset & Data Classification Policy

## Purpose
Ensure all assets and data are classified and handled appropriately to protect confidentiality and integrity.

## Scope
All hardware, software, services, and data owned or processed by BlackRoad.

## Requirements
- Maintain an inventory of assets with owners and classification in Notion.
- Assign one of four data classes (Public, Internal, Confidential, Restricted) using the definitions in the data-handling guide.
- Apply retention requirements for each class and document exceptions.
- Require encryption in transit and at rest for Confidential and Restricted data.
- Prohibit copying production data into lower environments unless tokenized/anonymized.

## Operational Practices
- Review asset inventory quarterly during the access review cycle.
- Tag cloud resources with `owner`, `environment`, and `data_class` for automated reporting.
- Enforce DLP controls: disable Notion export for former staff, block public S3 buckets, and use presigned URLs for data sharing.

## How Enforced
- `env-guard` workflow prevents commits containing production database identifiers.
- Terraform guardrails ensure storage encryption and no public S3 buckets.
- AWS Config + Security Hub continuously monitor for drift and feed alerts to Security.

Evidence comes from: `env-guard`, `evidence-pack` (AWS Config/Security Hub reports).
