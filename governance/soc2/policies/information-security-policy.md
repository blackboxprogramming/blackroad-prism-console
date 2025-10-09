# Information Security Policy

## Purpose
BlackRoad maintains a security program that protects customer, employee, and company data across code, cloud infrastructure, and business operations. This policy defines the governance structure, risk management cadence, and accountability for implementing security controls aligned with SOC 2 Trust Services Criteria.

## Scope
Applies to all BlackRoad personnel, contractors, systems, and data assets, including production and corporate environments.

## Program Governance
- The Head of Security owns the security program and reports quarterly to the executive team.
- Policies are reviewed and re-approved at least annually or when material changes occur.
- A cross-functional security guild meets monthly to review risks, incidents, and remediation progress.

## Risk Management
- Maintain a living risk register in Notion with risk owners, treatments, and review dates.
- Track the top five risks publicly in `#security`; update status weekly.
- Conduct annual security awareness training and targeted sessions after major incidents.

## Control Environment
- Enforce least privilege via SSO (Okta) with MFA across all systems.
- Require change management practices for all production deployments.
- Operate security monitoring (Security Hub, GuardDuty, CloudWatch) with defined alert routing.

## Third Parties
- Vet vendors before onboarding, ensuring data protection agreements are executed.
- Reassess vendors annually and ahead of renewals using the vendor register.

## How Enforced
Automation provides ongoing assurance:
- GitHub Actions (`policy-guard`, `env-guard`, `access-review`, `evidence-pack`) document adherence.
- AWS Terraform guardrails enable AWS Config, Security Hub, and GuardDuty.
- Slack announcements keep teams informed of policy expectations.

Evidence comes from: `policy-guard`, `access-review`, `evidence-pack`.
