# Hardware-Backed Private Key Hardening Checklist

This quick-start note captures the minimal-but-meaningful upgrades you can apply anywhere SSH, TLS, or wallet signing keys are used. The goal: stop parking private keys on shared drives and move key generation + storage into hardware so the private material never leaves.

## Principles

- **Keys stay inside hardware**: Generate private keys on a TPM, smartcard, HSM, or FIDO2 security key and mark them non-exportable. Distribute only the public portion or certificates.
- **No shared "keys" folders**: Remove WebDAV/NAS/Dropbox mounts that contain raw private keys. Secrets managers carry wrapped symmetric keys or API tokens—not raw long-term private keys.
- **Lifecycle discipline**: Create, label, rotate, and retire keys on a schedule that aligns with NIST SP 800-57. Archive only what policy requires, and wrap backups with a hardware-protected key-encryption key.
- **Admin interfaces are fenced**: Bind administrative panels to private networks/VPN, enforce MFA + device certificates, and gate access with allow-lists/ACLs.

## What “good” looks like

| Area | Controls |
| --- | --- |
| Hardware-backed key generation | Every SSH, TLS, code-signing, and wallet key is created on a TPM/HSM/smartcard/YubiKey. Keys are marked non-exportable and referenced via hardware engines. |
| Storage | No central key share. Private keys live only on the device that generated them. Secrets managers store wrapped symmetric keys or API tokens, not raw private keys. |
| Backups | Only policy-mandated keys are backed up. Backups are encrypted/wrapped, inventoried, and include lifecycle metadata (creation, rotation, retirement, destruction). |
| Admin plane | Admin UIs and consoles bind to RFC1918/VPN addresses, require MFA + device certificates, and sit behind explicit ACLs/IP allow-lists. |

## Fast start

### 1. Provision a hardware key for SSH/TLS

#### Option A – YubiKey / smartcard (FIDO2 + PIV)

```bash
# Install tooling (macOS: brew install ykman, Linux: sudo apt install yubikey-manager)
ykman list

# Enable PIV and generate a non-exportable P-256 key in slot 9a (TLS/server auth)
ykman piv keys generate --pin-policy ALWAYS --touch-policy CACHED --algorithm ECCP256 9a pubkey.pem
ykman piv certificates generate 9a pubkey.pem server-cert.pem --subject "CN=ssh-prod-ed25519-2025-10"

# Generate an SSH key backed by the FIDO2 interface (resident key keeps metadata on-device)
ssh-keygen -t ed25519-sk \
  -O resident \
  -O verify-required \
  -C "ssh-prod-ed25519-2025-10" \
  -f ~/.ssh/id_ed25519_sk_yk

# Add the public key to authorized_keys / CA
ssh-copy-id -i ~/.ssh/id_ed25519_sk_yk.pub user@server
```

Notes:
- `ed25519-sk` keys never expose the private key; authentication requires touch + PIN (if configured).
- Use `ssh-add -K ~/.ssh/id_ed25519_sk_yk` (macOS) or `ssh-add ~/.ssh/id_ed25519_sk_yk` (Linux) to register the key with your agent.
- For TLS, point OpenSSL or certbot at the PKCS#11 provider (for YubiKey, `pkcs11:...` URIs via `opensc-pkcs11.so`).

#### Option B – TPM-backed key (PCs, servers, Raspberry Pi)

```bash
sudo apt install -y tpm2-tools softhsm2 opensc
tpm2_getrandom 8

# Create an SSH key bound to the TPM via the OpenSSH security key provider
ssh-keygen -t ecdsa-sk \
  -O resident \
  -O application=ssh:prod \
  -O verify-required \
  -f ~/.ssh/id_ecdsa_sk_tpm \
  -C "ssh-prod-ecdsa-$(date +%Y-%m)"

# (OpenSSH 9.3+) specify the TPM provider when listing/using keys
echo "SecurityKeyProvider /usr/lib/ssh/tpm.so" | sudo tee -a /etc/ssh/ssh_config.d/10-tpm.conf
ssh-copy-id -i ~/.ssh/id_ecdsa_sk_tpm.pub user@server
```

For TLS on Linux, pair `tpm2-pkcs11` with your ACME client:

```bash
p11tool --provider /usr/lib/libtpm2_pkcs11.so --login --generate-rsa --bits 3072 --label tls-prod-$(date +%Y)
certbot certonly \
  --csr /etc/ssl/csr/tls-prod.csr \
  --key-path "pkcs11:token=TPM2Token;object=tls-prod-$(date +%Y)" \
  --cert-path /etc/ssl/certs/tls-prod.crt
```

### 2. Label and rotate

1. Name keys by purpose + environment + creation date (for example, `ssh-prod-ed25519-2025-10`).
2. Store the labels in your CMDB or secrets inventory alongside contact owner + rotation cadence.
3. Calendar the rotation (for example, 12 months) and create a deactivation ticket 30 days before expiry.
4. Follow NIST SP 800-57 lifecycle phases: `Generate → Activate → Distribute (public only) → Rotate → Revoke → Destroy`.

### 3. Kill the shared “keys” folder

1. Inventory network shares (`mount`, `df`, or your NAS console) and locate directories containing `.pem`, `.key`, `.p12`, or `id_*.pub` pairs.
2. Notify owners and replace each private key with a hardware-backed equivalent. Keep only sanitized public keys or certificates in shared storage.
3. Migrate application credentials into a secrets manager that supports audit trails, MFA, per-secret ACLs, and automatic rotation. Store wrapped symmetric keys or API tokens—never raw private keys.
4. Remove or lock down the old share. Archive encrypted backups if policy demands, logged under change control.

### 4. Fence off admin interfaces

```bash
# Example: bind NGINX admin UI to LAN, require mutual TLS, and enforce TOTP-based MFA
server {
  listen 10.10.0.5:8443 ssl http2;
  server_name admin.internal.example.com;

  ssl_certificate /etc/ssl/certs/admin.crt;
  ssl_certificate_key "pkcs11:token=AdminHSM;object=admin-key";
  ssl_client_certificate /etc/ssl/certs/device-ca.pem;
  ssl_verify_client on; # device cert required

  auth_jwt "Admin UI";
  auth_jwt_key_file /etc/nginx/jwt-admin-signing.jwk;
  auth_jwt_require claim.mfa == "totp";

  allow 10.10.0.0/24;
  allow 100.64.0.0/10; # Tailscale/VPN
  deny all;
}
```

Complement the network fencing with IdP policies:

- Require phishing-resistant MFA (FIDO2/WebAuthn) for admin groups.
- Enforce device compliance (certificate + posture check) before issuing admin sessions.
- Log and alert on out-of-policy attempts; ship logs to your SIEM.

## Why it matters

- **NIST SP 800-57** underscores that cryptographic strength collapses when private keys leak; protecting keys and enforcing lifecycle management is foundational.
- **OWASP Secrets Management Cheatsheet** cautions against storing long-term keys in plaintext shares and encourages hardware-backed storage with centralized inventory and auditing.

## Validation checklist

- [ ] Every SSH/TLS/code-signing key has a hardware origin and is non-exportable.
- [ ] Shared drives have been purged of private keys; only public artifacts remain.
- [ ] Backup inventory shows encrypted, lifecycle-controlled copies only where required.
- [ ] Admin interfaces resolve only on LAN/VPN, require MFA + device certs, and enforce allow-lists.

