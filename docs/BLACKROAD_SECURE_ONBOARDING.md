# BlackRoad Secure Onboarding Guide

This checklist standardizes how engineers and operators join the BlackRoad ecosystem while safeguarding credentials, wallets, and confidential data. Pair this document with role-specific runbooks and keep it updated as policies evolve.

## 1. Pre-onboarding

- [ ] Confirm background checks and required legal agreements (NDA, contractor agreements) are signed.
- [ ] Assign an onboarding sponsor responsible for verifying completion of this checklist.
- [ ] Provide the newcomer with hardware wallet procurement instructions (do **not** ship pre-initialized devices).
- [ ] Create identity in the corporate IdP (Okta/Azure AD/etc.) with least-privilege baseline group membership.

## 2. Device and identity setup

- [ ] Issue managed laptop with full disk encryption, biometric/PIN unlock, and latest OS updates installed.
- [ ] Enroll device in endpoint management (MDM/EDR) and verify compliance posture.
- [ ] Require phishing-resistant MFA (FIDO2 security key) for IdP, GitHub, Vault, cloud consoles, and password manager.
- [ ] Provision enterprise password manager vault; share onboarding collection containing required URLs and policy docs only (no secrets).

## 3. Account provisioning

- [ ] Invite user to GitHub organization with least-privilege team(s); require SSO enforcement and 2FA before access.
- [ ] Provision read-only access to production repositories; elevate to write after training completion.
- [ ] Grant access to HashiCorp Vault via dynamic groups mapped from IdP; verify short-lived token issuance only.
- [ ] Issue time-bound access to cloud accounts using Just-In-Time (JIT) workflows (e.g., AWS IAM Identity Center).

## 4. Wallet and key management

- [ ] Guide user through hardware wallet initialization in person or via secure video; ensure seed phrase written on two separate cards.
- [ ] Store sealed seed cards in separate, access-controlled physical locations; never digitize seeds.
- [ ] Register wallet public keys in inventory system; never collect seeds or PINs centrally.
- [ ] Configure watch-only wallets on managed devices to monitor treasury balances without exposing private keys.

## 5. Repository & CI hygiene

- [ ] Install commit signing keys (GPG or SSH-SIG) and enforce signed commits.
- [ ] Configure `pre-commit` hooks or `git-secrets` to block accidental secret commits.
- [ ] Provide training on using [`templates/security/github-actions-oidc-vault-template.yml`](../templates/security/github-actions-oidc-vault-template.yml) and Vault workflows.
- [ ] Require branch protection, code reviews, and status checks for critical repositories.

## 6. Secrets access workflow

- [ ] Demonstrate retrieving secrets via Vault CLI with SSO/OIDC auth; prohibit copying secrets into personal notes.
- [ ] Walk through CI/CD secret usage, highlighting audit logs and revocation process.
- [ ] Set expectations for regular secret rotation (quarterly minimum) and emergency rotation triggers.

## 7. Training & compliance

- [ ] Complete security awareness and incident response training modules.
- [ ] Review acceptable use policy, data classification standards, and secure coding guidelines.
- [ ] Provide escalation matrix for reporting lost devices, suspected compromise, or wallet anomalies.

## 8. Verification & sign-off

- [ ] Sponsor reviews checklist, confirms evidence (screenshots, ticket links) stored in onboarding tracker.
- [ ] Security team audits first privileged action (e.g., first merge, first Vault access) for anomalies.
- [ ] Document completion in HRIS / access management system and schedule 30-day follow-up review.

## 9. Offboarding reminder

Maintain a mirrored offboarding checklist that revokes GitHub, Vault, wallet access, and cloud roles within SLA when a user departs. Ensure hardware wallets are inventoried and, if necessary, rotated to remove departing custodians from multi-sig configurations.

