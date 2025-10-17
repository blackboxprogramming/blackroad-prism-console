# PR Bundle Validation Sprint

Run this fast pass to confirm the Slack, Asana, GitLab, and tooling adapters are configured end to end
before you rely on the automation in production. Each section below lists the prerequisites, how to
trigger the workflow, what you should see, and the common recovery actions when something misbehaves.

## 0. Preflight
- **Secrets**: Confirm the following repository or organization secrets exist and point at non-demo
  credentials: `SLACK_WEBHOOK_URL`, `ASANA_PAT`, `ASANA_PROJECT_ID`, `GITLAB_REPO_SSH`,
  `GITLAB_SSH_PRIVATE_KEY`, and (optionally) `DISCORD_WEBHOOK_URL`.
- **Branch protections**: Apply the baseline described in
  [`docs/BRANCH_PROTECTIONS.md`](BRANCH_PROTECTIONS.md) before testing. The automation assumes the
  checks listed there are required in order to merge.

## 1. Slack smoke test (`notify-slack.yml`)
1. Open a throwaway pull request targeting the `bootstrap` branch.
2. Watch the `notify-slack` workflow run; it posts to the channel mapped to `#dev-prs`.
3. **Expected**: A message appears in Slack with the PR title, author, and link.
4. **If missing**: Verify the webhook URL points at the channel, not a direct message. Re-run the
   workflow and inspect the job logs for non-200 responses.

## 2. Manual approval gate (`manual-approval` status)
1. On the same PR, confirm that the check `probot/manual-approval` initially reports `failure`.
2. Add the `manual-approval` label (only reviewers/team leads should perform this step).
3. **Expected**: The status flips to `success` and merges are allowed once CI, CodeQL, and Gitleaks
   pass.
4. **If it stays red**: Validate the GitHub App installation still has the required scopes and that
   the label name matches exactly (`manual-approval`).

## 3. Asana task lifecycle
1. When the PR opens, the `asana-open-on-pr.yml` workflow should create a task titled `PR: <title>` in
   the default Asana project, with the PR URL in the notes.
2. After the PR merges, `asana-close-on-merge.yml` should complete the task.
3. **Failures usually mean**: the PAT lacks project access, `ASANA_PROJECT_ID` is incorrect, or the
   `jq` query returned empty data. Use the `opt_fields` already provided in the workflow when tweaking
   queries.

## 4. Gitleaks & CodeQL coverage
1. Add a harmless change (for example, edit documentation) and push it to the PR to trigger all
   checks.
2. Confirm both `Gitleaks` and `CodeQL` appear in the PR status list.
3. **If a false positive appears**: capture the finding and prepare a scoped allowlist entry in
   `.gitleaks.toml`. (We can supply a `fixtures/**` template if needed.)

## 5. Discord release notification (optional)
1. Create a tag such as `v0.0.1` and publish a GitHub release from it.
2. **Expected**: A message shows up in the Discord channel mapped to `#releases` (or your custom
   alias).
3. **If silent**: Check that the webhook still exists, the channel permits webhook posts, and the
   workflow uses the same URL.

## 6. GitLab mirror consent gate
1. Merge into `main` (or fast-forward it) and ensure the `mirror-to-gitlab.yml` workflow runs.
2. Visit the GitLab project and confirm the commit SHA matches GitHub.
3. **First-run notes**: The workflow accepts the GitLab host key using `StrictHostKeyChecking=accept-new`.
4. **If mirroring stalls**: Confirm the deploy key remains active and is not used by other jobs.

## 7. Repository dispatch plumbing
1. Trigger a `repository_dispatch` event with the type `sync_airtable` and a small JSON payload. You
   can do this with `gh api repos/:owner/:repo/dispatches -f event_type=sync_airtable -F client_payload='{"ping":true}'`.
2. Watch `dispatch-listener.yml` for the payload.
3. **Troubleshooting**: Ensure the automation token has `repo` scope and that the workflow is not
   limited by `if:` conditions.

## 8. Tools adapter handshake (optional)
1. Start the adapter service and include your `X-Tools-Token` header when calling endpoints.
2. Exercise:
   - `get_secret` → returns a masked preview.
   - `use_secret` → returns a ticket ID.
   - `http_request` to `channel_alias:dev_prs` using the ticket → posts to Slack.
   - *(Optional)* `ping_pi` read-only check.
3. Record the responses in the validation log so we know the adapter can broker follow-up automations.

## 9. Enforce branch protections
1. In GitHub, enable **Require status checks to pass** and list `CI / build`, `CodeQL`, and `Gitleaks`.
2. Turn on **Dismiss stale pull request approvals when new commits are pushed**.
3. *(Optional)* Enable **Require signed commits** once the team is ready (see
   `docs/SECURITY_BASELINE.md`).

## 10. Post-merge tidy-up
- Run `labels-sync.yml` to refresh labels.
- Dependabot will open pull requests on its next scheduled run (weekly by default). Trigger it
  manually if you want to validate today.

---

## Optional hardening add-ons
- **Production environment gating**: Create a `Production` environment, move production-only secrets
  there, require reviewers, and update release workflows to reference `environment: Production`.
- **Kubernetes read-only tool**: Extend the tools adapter with a `k8s_exec` handler that only allows
  describe/logs/get verbs until explicit consent is captured.
- **Signed commits policy**: When the team is ready, enforce signed commits on `main` and point folks
  at the signing quick-start in `docs/SECURITY_BASELINE.md`.

## Quick rescue playbook
- **Slack**: Validate the webhook uses a channel destination; rotate it if you suspect leakage.
- **Asana**: Confirm the PAT can see the project (use the numeric GID in the URL) and manually
  re-run the workflow if a transient error occurred.
- **Discord**: Ensure the server allows webhook posts and that moderators approved the integration.
- **GitLab mirror**: Verify the deploy key is scoped correctly. For pull mirroring, configure the job
  in GitLab instead of pushing from GitHub.
- **Gitleaks**: For noisy fixtures, add a tight path allowlist.
- **CodeQL**: Make sure the language packs align with the stack (Java, Go, Ruby, etc.).

## Getting help / next steps
If you need the automation partner to regenerate bundles or provide allowlists, share the GitHub
repository URL and branch name (for example, `infra/bootstrap`). They can ship an updated patch,
including optional `.gitleaks.toml` entries or extra channel aliases.
