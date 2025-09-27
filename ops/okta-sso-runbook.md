# Okta SSO Runbook

Goal: one front door (MFA), group-based access, SCIM where possible.

## Prep
- Decide Okta org name: blackroadinc (example).
- Groups: All, Ops, Eng, Product, Security, Growth.

## Steps
1. Create tenant → set admin, enable MFA (WebAuthn + TOTP).
2. Custom domain: id.blackroadinc.us → verify TXT, upload cert (wildcard or dedicated).
3. Directory: add Groups above; set default assignment rules (All on invite).
4. Apps (OIDC/SAML as available), assign by Group:
   - Slack, Asana, Jira (Atlassian Cloud), GitHub, Notion.
   - For Slack/Asana: enable SCIM provisioning (auto-deprovision on group removal).
5. Policies:
   - Sign-on: MFA required; lockout thresholds; session length 8h.
   - Password: length ≥12, no reuse 24, rotation 365d (or passkeys preferred).
6. Lifecycle:
   - Joiner: add to All + team group; Okta pushes to apps.
   - Mover: group change ≥ app access change.
   - Leaver: disable in Okta → SCIM deprovisions; rotate shared secrets if any.
7. GitHub OIDC:
   - Create Okta OIDC app; map claims groups → team:*.
   - In GitHub, enforce SSO for org.
8. Test Plan:
   - New user flow (Slack, Asana, Jira, GitHub, Notion).
   - MFA reset, device replacement.
   - Group move (e.g., Growth → Eng).
   - Deprovision (suspend in Okta, confirm in apps).
9. Docs:
   - Notion page “SSO & Access” with screenshots + rollback notes.
   - Add “Break-glass” account (stored in 1Password, hardware key only).
