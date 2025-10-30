# GitHub Fine-Grained PAT Matrix

This matrix documents least-privilege access for the three automation agents currently interacting with BlackRoad repositories. Each token must be issued per repository unless noted otherwise.

| Agent | Purpose | Preferred Auth | Repository Scope | Permissions |
| --- | --- | --- | --- | --- |
| Cadillac | Synchronize product documentation and open pull requests with content updates. | `GITHUB_TOKEN` when running via GitHub Actions; otherwise a fine-grained PAT dedicated to the target repo. | Specific documentation repos only (e.g., `blackroad/blackroad-docs`). Issue one token per repo when external. | `Contents: Read & Write`, `Metadata: Read`. No administrative scopes. |
| Lucidia | Execute analytics workflows that require reading data snapshots and opening analysis reports. | `GITHUB_TOKEN` within org workflows; per-repo fine-grained PAT for external scheduling service. | Analytics repos requiring report updates (e.g., `blackroad/analytics-*`). Separate tokens per repo to avoid cross-repo access. | `Contents: Read & Write`, `Issues: Read` (for posting findings), `Metadata: Read`. |
| Codex | Code-quality bot that reads source, leaves review comments, and occasionally opens fix branches. | Repository `GITHUB_TOKEN` for CI-based reviews; fine-grained PAT only if the bot runs off-platform. | Target application repo only. | `Contents: Read & Write`, `Pull requests: Read & Write`, `Metadata: Read`. |

## Operational Notes
- Never grant `Actions`, `Administration`, or `Security events` scopes to these tokens.
- Approvers must verify the repo list and permissions against this matrix before approving a token request.
- Record each issued token in the central inventory with owner, purpose, scope, and rotation date.
- Rotate tokens at least every 90 days or immediately after an incident involving the associated agent.
