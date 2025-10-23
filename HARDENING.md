# Security Hardening

- All containers run as non-root users where possible.
- mTLS is enforced between services via Traefik and Vault-issued certificates.
- UFW is configured with a default deny policy; only internal mirrors and registry are allowed for egress.
- Secrets are stored in HashiCorp Vault and mounted at runtime using short-lived tokens.

## SSH Key Hygiene & Rotation

1. **Inventory existing keys**
   - Local: `ls -l ~/.ssh/` and `ssh-add -l || :`
   - GitHub: `gh ssh-key list` or `gh api user/keys | jq '.[].title'`
2. **Remove weak or unused materials**
   - Drop RSA/passwordless keys from the agent: `ssh-add -d ~/.ssh/id_rsa || :`
   - Shred archived keys: `shred -u ~/.ssh/id_rsa || :`
   - Delete stale GitHub keys: `gh ssh-key delete <key-id>`
3. **Create fresh, labeled ed25519 keys per device**
   - `ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519_blackroad_<host> -C "deploy@blackroad.io::<host>::$(date +%Y-%m-%d)"`
   - Load with an 8h agent lifetime: `ssh-add -t 28800 ~/.ssh/id_ed25519_blackroad_<host>`
   - Publish to GitHub: `gh ssh-key add ~/.ssh/id_ed25519_blackroad_<host>.pub -t "blackroad::<host>::$(date +%Y-%m-%d)"`
4. **Harden client configuration** (`~/.ssh/config`)

   ```sshconfig
   Host *
     IdentitiesOnly yes
     PubkeyAuthentication yes
     PasswordAuthentication no
     KbdInteractiveAuthentication no
     ServerAliveInterval 30
     ServerAliveCountMax 3
   ```

5. **Lock down servers** (`/etc/ssh/sshd_config`)

   ```sshconfig
   Protocol 2
   PubkeyAuthentication yes
   PasswordAuthentication no
   PermitRootLogin prohibit-password
   ChallengeResponseAuthentication no
   PermitEmptyPasswords no
   ClientAliveInterval 30
   ClientAliveCountMax 3
   AllowUsers deploy admin
   ```

   Validate and reload: `sudo sshd -t && sudo systemctl reload sshd`

6. **Rotate host keys when necessary**
   - Regenerate: `sudo ssh-keygen -A`
   - Restart service: `sudo systemctl restart sshd`
   - Refresh trusted keys (e.g., CI runners): `ssh-keyscan -t ed25519 your.host >> ~/.ssh/known_hosts`

## Secrets Rotation Strategy

- **Option A — Vault (AppRole or GitHub OIDC)**
  - Store deploy keys/DB credentials in Vault KV.
  - Issue short-lived tokens at job start and scope environment variables to the steps that need them.
  - Recommended TTLs: CI tokens 15–60 min; DB creds 15 min; cloud creds 15 min.
- **Option B — SOPS + age**
  - Generate an age keypair: `age-keygen -o ~/.config/sops/age/keys.txt`
  - Encrypt environment files: `sops --age <AGE_PUBKEY> --encrypt env.production > env.production.enc`
  - Decrypt just-in-time in CI: `sops --decrypt env.production.enc > env.production`

**Rotation cadence**
- SSH user keys every 90 days (or immediately on device loss)
- CI deploy keys / PATs every 30 days (migrate to OIDC when possible)
- DB/API credentials every 15–30 days (favor ephemeral issuance)

## Policy Guardrails (OPA/Rego)

Enforce SSH key hygiene via CI by adding `policy/ssh.rego`:

```rego
package ssh

default allow = false

allow {
  input.key.type == "ed25519"
  input.key.age_days <= 90
  input.key.comment_matches
  not input.key.passwordless
}
```

Reject PRs that introduce weak/expired keys or missing metadata.

## CI/CD Integration Snippets

- Require GitHub Actions OIDC for short-lived credentials:

  ```yaml
  permissions:
    id-token: write
    contents: read

  jobs:
    deploy:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - name: Get cloud creds via OIDC
          run: ./scripts/assume_role_oidc.sh
        - name: Decrypt secrets (SOPS)
          run: sops --decrypt env.production.enc > env.production
        - name: Deploy
          env:
            SSH_AUTH_SOCK: ${{ steps.ssh_agent.outputs.ssh-auth-sock }}
          run: ./scripts/deploy.sh
  ```

- Ephemeral SSH keys for CI:

  ```yaml
  - name: Add SSH key (expires in 1h)
    uses: webfactory/ssh-agent@v0.9.0
    with:
      ssh-private-key: ${{ secrets.EPHEMERAL_DEPLOY_KEY }}
  ```

## Quick Checklist

- No RSA user keys; all ed25519 (or hardware-backed) with passphrases.
- Unique key per device with clear labels; no reuse.
- Servers disable password authentication; root access via keys + sudo only.
- CI uses OIDC-issued short-lived cloud credentials; no long-lived PATs.
- Secrets managed via Vault or SOPS and decrypted only at runtime.
- Rego gate blocks expired or weak keys.
- Rotation calendar enforced (90d user / 30d CI / 15–30d DB/API).
