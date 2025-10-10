<!-- FILE: /SECURITY_BASELINE.md -->
# Security Baseline

- Enforce SSH key authentication; passwords disabled.
- UFW allows 22/tcp from admin IPs, 80/443/tcp, WireGuard UDP 51820.
- Vault stores all secrets; no plaintext in repos.
- Images signed with cosign before deployment.
- Monthly key rotation and vulnerability scans in CI.
- Treat CISA Known Exploited Vulnerabilities (KEV) as priority-one incidents: perform a daily KEV catalog sync, auto-create remediation tickets for any new matches, and block deployments for services with unresolved KEV findings.
