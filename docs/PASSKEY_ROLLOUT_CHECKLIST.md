# Passkey Rollout Checklist (BlackRoad Stack)

This playbook maps the passkey upgrade guidance to the BlackRoad identity surface so that operations, engineering, and finance admins can move to phishing-resistant FIDO2 authenticators with minimal downtime. It assumes the current stack of Okta SSO (`id.blackroadinc.us`), the GitHub organization `BlackRoadOrg`, DigitalOcean and AWS consoles, Cloudflare, Stripe, Brex, and the "BlackRoad Vault" 1Password tenants.

## 1. Enroll at least two passkeys per admin

- **Hardware to stage:** Issue each privileged operator two FIDO2 security keys (e.g., YubiKey 5C NFC + YubiKey 5 Nano) and confirm each has a platform authenticator (Mac Touch ID, Windows Hello, iOS/Android passkey). Label the hardware keys and capture their serials in the 1Password "Security" vault.
- **GitHub (`BlackRoadOrg`):**
  1. Navigate to Settings → Password and authentication → Passkeys.
  2. Register platform authenticator (Touch ID / Windows Hello) and both hardware keys.
  3. Download and print recovery codes; store copies with operations lead and in the sealed offsite envelope.
- **Okta (`id.blackroadinc.us`):**
  1. Settings → Security → Multifactor → Factor Enrollments: set "Security Key or Biometric" to required for Super Admins and App Admins.
  2. Each admin: My Settings → Extra Verification → Set up → Security Key or Biometric. Register platform authenticator + two hardware keys. Keep one hardware key offsite.
  3. Re-run the enrollment flow for any automation/break-glass accounts documented in `ops/okta-sso-runbook.md`.
- **Cloud consoles:**
  - **AWS preview environments:** IAM Identity Center → Settings → Authentication → Enable passkeys. Register both hardware keys for admins and disable SMS. For the root account, enable security key MFA and store the second key offsite.
  - **DigitalOcean:** Account → Security → Passkeys. Add passkeys for both hardware keys and remove SMS fallback. Regenerate recovery codes and file them in 1Password + vault envelope.
  - **Cloudflare:** My Profile → Authentication. Add security keys and platform authenticator; disable phone/SMS.
- **Finance + billing (Stripe, Brex):** Add FIDO2 keys, rotate recovery codes, and ensure alerts route to `security@blackroad.io`.
- **1Password (BlackRoad Vault):** Each account owner adds both hardware keys under Settings → Two-factor authentication → Security keys. Print Emergency Kits and append serial numbers + storage location notes.

## 2. Enforce passkey policy + recovery readiness

- **Okta policy:** Create an Admins policy set that requires WebAuthn/FIDO2 for Super Admins, App Admins, and anyone assigned to production publishing groups. Leave TOTP as break-glass; disable SMS/voice factors.
- **GitHub organization policy:** In `BlackRoadOrg` → Settings → Authentication security, require passkeys/security keys for organization owners and production deployers. Pair with the existing "Require 2FA" control.
- **Recovery codes:**
  - Generate Okta admin recovery codes (`/admin/help/forgot_password` → Admin Console). Print on archival paper, seal in tamper-evident envelope, and log in the DR inventory.
  - GitHub: export org owner recovery codes after passkey enrollment. Store alongside Okta codes with sign-off from the Security lead.
  - AWS root: download the credential report, confirm MFA serials, and store the root account recovery set with finance leadership.
- **1Password vault update:** Create an entry `2025-10 Passkey rollout` capturing: admin name, devices enrolled, hardware key serials, on/offsite location, and recovery code storage notes.

## 3. Remove weak factors and stale authenticators

- **Sweep deprecated methods:** For each surface above, delete SMS/voice factors, legacy TOTP seeds stored in Authy/Google Authenticator, and unused app passwords. Document removals in the rollout log.
- **Audit GitHub PATs + app passwords:** Use Settings → Developer settings → Personal access tokens to prune unused tokens. Enable fine-grained PATs with short expiry for remaining automation.
- **Okta:** Reports → Security → Administrator. Export the "Factors" report to confirm only WebAuthn/TOTP remain. Archive a copy in `security@blackroad.io` inbox for compliance.
- **Device attestation check:** Spot check that enrolled hardware keys present FIDO2 attestation metadata. Record any keys lacking attestation for follow-up replacement.

## 4. 15-minute implementation sprint

| Minute | Task | Owners |
| --- | --- | --- |
| 0-3 | Stage two hardware keys per admin, open GitHub + Okta security tabs, retrieve existing recovery code envelopes. | Security lead + IT support |
| 3-8 | GitHub passkey enrollment for all org owners, download new recovery codes, store in 1Password + envelope. | Engineering lead |
| 8-11 | Okta WebAuthn enrollment & policy flip for Admins policy set, verify break-glass account. | IAM engineer |
| 11-13 | Cloud consoles (AWS, DigitalOcean, Cloudflare) passkey enablement + SMS removal. | Cloud operations |
| 13-15 | Finance consoles (Stripe, Brex) passkey enablement, confirm alerts, log completions in `security@blackroad.io`. | Finance ops |

**Exit criteria:** Every privileged admin has two registered passkeys (one hardware key stored offsite), SMS factors are disabled, recovery codes are sealed and logged, and the rollout log in 1Password is updated with timestamps and owner signatures.
