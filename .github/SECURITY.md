# Security Policy

- Report vulnerabilities privately to: security@blackroad.io
- Do not open public issues for security matters.
- Protected branches require reviews and passing checks (CI build, CodeQL, Gitleaks).
- We rotate secrets every 90 days (see `docs/SECRET_ROTATION.md`).
- Enable Org-level 2FA, Secret Scanning, and Push Protection.

## Scope
This applies to this repository (code, workflows, and the Probot app scaffold under `/.bots`).

## Incident Handling
- Limit blast radius; revoke tokens; rotate secrets; add temporary branch restrictions.
- Document postmortem under `docs/incidents/` (private repo recommended).
