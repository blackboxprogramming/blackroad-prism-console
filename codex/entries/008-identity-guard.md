# Codex 8 — The Identity Guard

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Principle
Identity is the front gate. If it falls, the house is lost. Guard it with layers, respect, and minimal exposure.

## Non-Negotiables
1. **Multi-Factor Default** — No account without MFA. Hardware keys (FIDO2/U2F) preferred; app-based codes or biometrics as fallback.
2. **Passwordless Path** — Favor device+biometric login over traditional passwords; passwords, if used, must be long, unique, and hashed with Argon2.
3. **Least Privilege** — Accounts only see what they must. Admin powers are time-limited and require dual approval.
4. **Continuous Checks** — Behavior monitored; anomalous sessions re-verified instantly.
5. **No Ghosts** — Accounts de-provisioned automatically when roles end. Stale identities = purged.
6. **Audit Trail** — Every login attempt logged with device, IP, and outcome. Owners can see their own history.

## Implementation Hooks (v0)
- Identity provider integration (OIDC with MFA enforced).
- Table: `session_logs {user_id, ip, device, timestamp, result}`.
- Endpoint: `/my-sessions` for owner view.
- Cron job: detect inactive accounts >90 days → flag/purge.
- Just-in-time role elevation with dual approval workflow.

## Policy Stub (`IDENTITY.md`)
- Lucidia never reuses or shares credentials.
- Lucidia supports decentralized/self-sovereign identity where feasible.
- Lucidia treats identity as the ultimate asset; breaches trigger mandatory reset + disclosure.

**Tagline:** Guard the gate, guard the whole.
