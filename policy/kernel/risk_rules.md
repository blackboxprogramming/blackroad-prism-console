# Risk Rules

Risk is computed using simple heuristics:

- **Salesforce opportunity amount**: amounts ≥250k add 3 risk, ≥1M add 6 total.
- **GitHub repository**: pushes to the default branch and push events add risk.
- **Environment**: payloads targeting `env=prod` add 2 risk.
- **PII**: events flagged with `pii=true` add 2 risk.

Risk scores are clamped between 0 and 10.
