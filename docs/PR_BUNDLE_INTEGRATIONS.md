# PR Bundle Integration Checklist

The PR bundle unlocks integration testing with external systems. Use this checklist to wire up the
mandatory services before enabling automated sync jobs or approvals.

## Slack
- **Incoming webhook**: Create an app-scoped webhook in the target workspace and store the URL in
  the `SLACK_WEBHOOK_URL` secret. Limit the webhook to the `#pr-bundle` (or equivalent) channel and
  disable posting elsewhere.
- **Side-channel protection**: Require signed requests using Slack's signing secret and verify the
  timestamp and signature inside relay functions (`scripts/notifications/*`). Rotate the signing
  secret quarterly.
- **Secrets handling**: Mount the webhook URL in CI via the secrets manager (e.g., Vault path
  `kv/team-pr/slack`). Never commit the URL to the repository. Use runtime templating to inject it
  into deployment manifests.
- **Monitoring**: Configure Slack app-level audit logs and subscribe to the webhook error events so
  failures surface in the observability stack.

## Asana (Auth Bot)
- **GitHub App**: Register a GitHub App (Probot-compatible) dedicated to PR approvals. Grant it
  `pull_request`, `checks`, and `metadata` read/write scopes. Install the app on repositories that
  participate in the PR bundle flow.
- **Bot authentication**: Generate an Asana Personal Access Token scoped to the integration project
  and store it as `ASANA_AUTH_BOT_TOKEN`. Map GitHub App installations to Asana workspace/team IDs.
- **Approval workflow**: Implement a Probot handler that listens for review requests tagged with the
  `asana-approval` label. When triggered, the bot opens/updates an Asana task, assigns the
  approver, and posts back the approval decision to the PR conversation.
- **Manual override**: Allow a `/asana approve` slash command in PR comments that the bot validates
  against Asana task status before merging. All actions should be logged to `logs/asana-auth-bot/`.

## GitLab Mirroring
- **Deploy key**: Provision an SSH deploy key with read/write privileges on the GitLab project and
  add the corresponding public key under the GitHub repository's deploy keys. Use it for mirroring
  rather than personal tokens.
- **Gitleaks in CI**: When using Gitleaks, inject the deploy key via an SSH agent step before the
  scan runs. Configure the pipeline to fetch from the mirrored repository and push leak reports
  back to GitHub as PR comments.
- **Alternate CI/CD tooling**: For runners orchestrated via Grunt or Ansible, template the mirroring
  configuration (remote URL, refspecs, schedules) inside the respective playbooks. Ensure inventory
  vars store the SSH key path and that the tasks include a `known_hosts` entry for `gitlab.com`.
- **Sync cadence**: Run the mirror job at least hourly and after every protected-branch merge. Track
  mirror status in the deployment dashboard and alert if lag exceeds two sync cycles.

## Evidence & Auditing
- Record integration setup evidence (screenshots, config exports) under `evidence/pr-bundle/`.
- Update `README_PR_AUTOMATION.md` with the integration status matrix once each service is live.
- Link the evidence bundle in the PR description when requesting security review.
