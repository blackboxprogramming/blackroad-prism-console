<!-- FILE: /SECURITY_BASELINE.md -->
# Security Baseline

- Enforce SSH key authentication; passwords disabled.
- UFW allows 22/tcp from admin IPs, 80/443/tcp, WireGuard UDP 51820.
- Vault stores all secrets; no plaintext in repos.
- Images signed with cosign before deployment.
- Monthly key rotation and vulnerability scans in CI.
