# Secret Rotation

- Rotate all integration secrets every 90 days.
- Maintain inventory: name, owner, scope, last/next rotation.
- Prefer GitHub App tokens over PATs; least privileges.
- Use Environment secrets for deploy/production with required reviewers.

## Suggested cadence
- Slack webhook URLs
- Asana PAT
- Airtable token
- GitLab deploy key (SSH)
