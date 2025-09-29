# Shai-Hulud Supply Chain Worm Response Guide

The Shai-Hulud worm is actively compromising packages across the npm ecosystem. The malware steals developer credentials and republishes infected packages under hijacked maintainer accounts, enabling rapid propagation. Follow the guidance below to contain exposure and harden development environments.

## Immediate Actions

1. **Inventory dependencies.** Enumerate all direct and transitive packages in `package-lock.json`, `yarn.lock`, and `pnpm-lock.yaml`. Pay special attention to releases published after **16 September 2025**.
2. **Pin to safe releases.** Freeze dependencies to versions vetted before the outbreak window and rebuild lockfiles from trusted baselines.
3. **Rotate credentials.** Replace all npm tokens, GitHub PATs, SSH keys, cloud API keys, and CI/CD secrets. Invalidate compromised tokens in the respective registries and identity providers.
4. **Enforce phishing-resistant MFA.** Require hardware security keys or FIDO2 authenticators for developer accounts in npm, GitHub, cloud consoles, and SSO platforms.
5. **Audit GitHub integrations.** Remove unused OAuth applications, GitHub Apps, personal access tokens, deploy keys, webhooks, and repository secrets. Tighten branch protections, enable secret scanning, and require signed commits where feasible.
6. **Monitor CI/CD.** Inspect GitHub Actions workflows and other pipeline definitions for unauthorized steps. Redeploy runners from clean images and revoke cached credentials.

## Detection Workflow

Use the helper script `scripts/shai_hulud_scan.py` to compare your lockfiles against a curated registry of known compromised packages.

```bash
python scripts/shai_hulud_scan.py path/to/repository
```

The script reads `security/shai_hulud_compromised_packages.json` by default. Update that file as new intelligence becomes available, or supply an alternate registry via `--registry`.

For each flagged package, rebuild from source, verify checksums against trusted mirrors, and consult upstream maintainers before restoring supply.

## Ongoing Monitoring

- Subscribe to alerts from CISA, npm, GitHub, and other ecosystem security teams.
- Integrate software composition analysis (SCA) scans into CI/CD and block builds that introduce unreviewed dependencies.
- Capture tamper-proof audit logs for package publishing, CI credential usage, and infrastructure access.
- Run credential-hygiene playbooks quarterly and after any suspected compromise.
- Conduct incident-response tabletop exercises that cover supply-chain worm scenarios.

Document investigation findings, maintain immutable evidence, and coordinate with legal, communications, and affected upstream maintainers as needed.
