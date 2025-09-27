# Integration Tests

## PR Flow
- Open PR → Slack posts to `#dev-prs`
- Probot status `probot/manual-approval` fails until label added
- Add `manual-approval` by authorized reviewer → status success
- Merge PR → Asana task completed

## Releases
- Tag `v*` + publish release → Discord release message

## Mirroring
- Push to `main` → GitLab mirror receives commits; verify SHA

## Security
- Gitleaks blocks leaked secrets in PRs
- CodeQL scans PRs + scheduled weekly
