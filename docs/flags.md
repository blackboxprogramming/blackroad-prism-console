# Feature Flags

- `ai_tools`: enables LLM evals & ChatOps AI helpers.
- `security_scans`: enables semgrep/trivy/gitleaks/checkov (advisory).
- `heavy_linters`: enables expensive/strict lint/test jobs.
- `web_performance`: enables Lighthouse and size-limit jobs.

Flip flags in `.github/feature-flags.yml` or via `/toggle` ChatOps commands (where supported).
