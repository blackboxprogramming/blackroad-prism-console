# BlackRoad — Secure Onboarding

> Goal: keep user devices & CI minimal-trust, short-lived, and auditable.

## 0) Accounts & SSO
- Enforce org-wide **2FA** and, where possible, SSO with device checks.
- Require passkeys/keys for GitHub sign-in if available.
- Use least privilege for teams; review access quarterly.

## 1) Developer machine baseline
- OS fully updated, disk **encryption enabled** (FileVault/LUKS/BitLocker).
- Password manager with unique strong passwords; passkey where possible.
- SSH keys: ed25519, per-device; add to GitHub; avoid private key reuse.
- Do not store seeds/keys on dev machines. Hardware wallet or HSM only.

## 2) Secrets & keys
- Private keys live **outside** CI; CI fetches short-lived tokens via OIDC.
- Use Vault (or cloud KMS) with tight policies; audit & rotate regularly.
- Never paste secrets in PRs/Issues/Chat; never log raw values.

## 3) Git hygiene
- Pre-commit hooks: lint, typecheck, and **secret scanners** (gitleaks).
- If a secret leaks: revoke → rotate → write post-mortem → update scanners.

## 4) Device loss / compromise
- Immediate account revocation and token rotation.
- Short incident report; reissue device; re-enroll MFA/SSH.

## 5) CI guardrails
- `permissions: contents: read` by default; add only what’s needed per job.
- `id-token: write` for OIDC only in jobs that need Vault.
- Never echo secrets; only masked/digested outputs.

## 6) Backups
- Encrypted, offline backups for critical materials.
- Separation of secrets and their passphrases (two locations).

> If you need organization-wide policy templates (GitHub branch protections, CODEOWNERS, required checks), we can add them next.
