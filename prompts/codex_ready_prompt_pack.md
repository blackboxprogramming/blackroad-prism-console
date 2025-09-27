# Codex-Style Prompt Pack

This document aggregates ready-to-use prompts organized by task category. Replace placeholder tokens like `{{REPO}}`, `{{BRANCH}}`, `{{CHANNEL_ALIAS}}`, and `{{PROJECT_ALIAS}}` with values matching your project before use. Pair instruction prompts with the provided tool-call JSON when external actions are required.

---

## A. General Coding & Repo Scaffolding

1. **Scaffold CI for language X**

   ```text
   Create a minimal CI workflow for {{LANG}} in {{REPO}} that:
   - runs lint and unit tests on PR and main,
   - caches deps,
   - exposes “CI / build” as a required status.
   Output .github/workflows/ci.yml only.
   ```

2. **Repository bootstrap**

   ```text
   Add CODEOWNERS, SECURITY.md, PR/Issue templates, .editorconfig, and pre-commit config that includes gitleaks and basic hygiene. Keep everything minimal and secure defaults. Output the file tree and contents.
   ```

3. **Monorepo package add**

   ```text
   In a Node monorepo using npm workspaces, add a new package “{{PKG}}” under /packages with TypeScript + Jest + eslint config and workspace scripts. Output all changes.
   ```

4. **Refactor request**

   ```text
   Refactor {{FILE}} to remove side effects, add DI for {{SERVICE}}, keep tests green. Return diff with explanations.
   ```

5. **Docstring / README**

   ```text
   Write a concise README for {{REPO}} describing purpose, CI, branch protections, and how to run tests locally in <100 lines.
   ```

---

## B. GitHub Actions (CodeQL, Gitleaks, Labels, Auto-Merge)

1. **CodeQL languages**

   ```text
   Generate a CodeQL workflow scanning {{LANGS}} for {{REPO}}; PR + scheduled weekly; required status “CodeQL”.
   ```

2. **Gitleaks tuning**

   ```text
   Add gitleaks workflow to run on PR + main. Include a .gitleaks.toml allowlist for {{KNOWN_FALSE_POSITIVES}}. Output both files.
   ```

3. **Labels sync**

   ```text
   Create labeler.yml with labels for type: bug/feature, priority: high, manual-approval, severity:critical; plus the labels-sync workflow.
   ```

4. **Dependabot ecosystems**

   ```text
   Add Dependabot config with ecosystems: github-actions, npm, pip. Weekly schedule. Output only .github/dependabot.yml.
   ```

5. **Auto-merge bot PRs**

   ```text
   Create a workflow that auto-merges Dependabot PRs for patch/minor when tests pass, but never for major. Output .github/workflows/dependabot-auto-merge.yml.
   ```

---

## C. Slack / Discord (Outbound Only)

1. **Notify PR open to #dev-prs**

   ```text
   Generate a Slack notification step that posts PR opened events to {{CHANNEL_ALIAS}} with author, repo, and PR URL. Use Incoming Webhook. Output workflow steps only.
   ```

   Tool-call JSON

   ```json
   {
     "tool": "http_request",
     "id": "slack-post-001",
     "args": {
       "method": "POST",
       "url": "channel_alias:{{CHANNEL_ALIAS}}",
       "headers": { "Content-Type": "application/json" },
       "body": { "text": "*PR Opened* by {{AUTHOR}} in {{REPO}}: {{PR_URL}}" }
     }
   }
   ```

2. **Notify release to Discord**

   ```text
   Post release published events to releases channel with tag, title, and URL. Output notify-discord.yml.
   ```

---

## D. Asana (PR Lifecycle)

1. **Create task on PR open**

   ```text
   Create a GitHub Actions workflow that creates an Asana task in {{PROJECT_ALIAS}} when a PR is opened. Task title “PR: {{TITLE}}”, notes include repo, author, PR URL. Output workflow only.
   ```

   Tool-calls (sequence)

   ```json
   {
     "tool": "use_secret",
     "id": "asana-ticket-001",
     "args": {
       "name": "ASANA_PAT",
       "purpose": "Create PR task",
       "target": "service_alias:{{PROJECT_ALIAS}}"
     }
   }

   {
     "tool": "http_request",
     "id": "asana-request-001",
     "args": {
       "method": "POST",
       "url": "https://app.asana.com/api/1.0/tasks",
       "headers": { "Content-Type": "application/json" },
       "body": {
         "data": {
           "projects": ["service_alias:{{PROJECT_ALIAS}}"],
           "name": "PR: {{TITLE}}",
           "notes": "Repo: {{REPO}} | Author: {{AUTHOR}} | URL: {{PR_URL}}"
         }
       },
       "ticket": "{{TICKET_FROM_PREV_STEP}}"
     }
   }
   ```

2. **Close Asana task on merge**

   ```text
   Add a workflow that finds the Asana task created for the PR (based on PR URL in notes) and sets completed=true when the PR merges. Include jq usage. Output only that workflow.
   ```

---

## E. GitLab Mirroring (SSH Deploy Key)

1. **Mirror on push to main**

   ```text
   Create a workflow that pushes --mirror to {{TARGET_SSH}} using SSH private key from secrets. Include StrictHostKeyChecking accept-new and no leaking of key. Output only mirror-to-gitlab.yml.
   ```

   Consent-gated tool-call

   ```json
   {
     "tool": "git_ops",
     "id": "mirror-001",
     "args": {
       "action": "git_mirror",
       "params": { "target": "{{TARGET_SSH}}" }
     }
   }
   ```

2. **Bi-directional note**

   ```text
   Document how to set GitLab pull mirror with read-only GitHub deploy key instead of pushing from Actions. Output a short Markdown doc.
   ```

---

## F. Probot GitHub App (Manual Approval + Escalate Critical)

1. **Manual approval gate**

   ```text
   Create a Probot app that sets a failing status ‘probot/manual-approval’ unless the PR has label ‘manual-approval’. If the label is present, set success. Output app.js and config.
   ```

2. **Critical escalation hook**

   ```text
   Add an issues.labeled listener that logs a JSON for severity:critical; note where to integrate Slack relay securely. Output only the added code snippet.
   ```

---

## G. Tools Adapter (Aliases + Safe Secret Injection)

1. **Add alias mapping**

   ```text
   Extend the Tools Adapter to resolve channel_alias:{{KEY}}, service_alias:{{KEY}}, and env_aliases (dev, staging, prod). Include consent gates for public posts, push/mirror, and production secrets. Summarize changes only.
   ```

2. **New tool: k8s_exec (dry-run)**

   ```text
   Add a tool `k8s_exec(namespace, resource, command, args?, contextAlias?)` that runs `kubectl` read-only commands (get/describe/logs) and blocks modifying operations unless consent is recorded. Provide just the handler function and register it.
   ```

   Tool-call

   ```json
   {
     "tool": "k8s_exec",
     "id": "k8s-001",
     "args": {
       "namespace": "default",
       "resource": "deploy/core-api",
       "command": "describe",
       "args": [],
       "contextAlias": "kube_staging"
     }
   }
   ```

---

## H. Pi Operations (Read-Only by Default)

1. **Service check**

   ```text
   Check core-service on pi_core with systemctl and return a short status summary, avoiding pager truncation. Then propose a safe next step if degraded. Output only tool-call JSON.
   ```

   Tool-call

   ```json
   {
     "tool": "ping_pi",
     "id": "pi-001",
     "args": {
       "hostAlias": "pi_core",
       "command": "systemctl",
       "args": ["status", "core-service", "--no-pager"]
     }
   }
   ```

2. **Tail logs (sanitized)**

   ```text
   Fetch last 200 lines of core-service logs on pi_core. Redact tokens/URLs in output. Output only tool-call JSON.
   ```

   Tool-call

   ```json
   {
     "tool": "ping_pi",
     "id": "pi-002",
     "args": {
       "hostAlias": "pi_core",
       "command": "journalctl",
       "args": ["-u", "core-service", "-n", "200", "--no-pager"]
     }
   }
   ```

---

## I. Security & Policy

1. **Secret scanning allowlist**

   ```text
   Generate a .gitleaks.toml with an allowlist for known test fixtures under /fixtures/** but still block real secrets elsewhere. Output only the file.
   ```

2. **Signed commits policy doc**

   ```text
   Write a short doc explaining when to enable “Require signed commits” and how to onboard devs to SSH/GPG commit signing. <100 lines.
   ```

3. **CVE action plan**

   ```text
   Create a security/patch.md that explains how to respond to a CVE in a transitive npm dependency with Dependabot + pinning + release. <120 lines.
   ```

---

## J. Testing & Coverage

1. **Unit test template (Node/Jest)**

   ```text
   Add a unit test template for an HTTP route handler that uses supertest with coverage thresholds (branches/statements 80%). Output only the test file.
   ```

2. **Python pytest boilerplate**

   ```text
   Add pytest.ini with coverage settings and a sample test for a Flask route. Keep it minimal. Output both files.
   ```

---

## K. repo_dispatch & Relays

1. **repo_dispatch cheat**

   ```text
   Create a minimal script that triggers repository_dispatch event “sync_airtable” with a JSON payload using a GH token. Output only the script.
   ```

2. **Slack slash command relay note**

   ```text
   Document a Node express handler that verifies Slack signing secret and forwards a repository_dispatch to GitHub. No tokens printed. <120 lines.
   ```

---

## L. Airtable Sync (Release Tags)

1. **Upsert record**

   ```text
   Create a workflow that on tag push (v*) creates a record in Airtable {{BASE_ALIAS}}/{{TABLE_ALIAS}} with fields Tag, Repository, Timestamp. Output workflow only.
   ```

   Tool-call

   ```json
   {
     "tool": "http_request",
     "id": "airtable-001",
     "args": {
       "method": "POST",
       "url": "https://api.airtable.com/v0/service_alias:{{BASE_ALIAS}}/{{TABLE_ALIAS}}",
       "headers": { "Content-Type": "application/json" },
       "body": {
         "fields": {
           "Tag": "{{TAG}}",
           "Repository": "{{REPO}}",
           "Timestamp": "{{ISO_NOW}}"
         }
       },
       "ticket": "{{AIRTABLE_TICKET}}"
     }
   }
   ```

---

## M. AI (ask_cloud) Meta Prompts

1. **Release summary**

   ```text
   Summarize highlights since tag {{PREV_TAG}} for {{REPO}} into a Slack-friendly paragraph, include top 3 PRs with titles and authors. Keep under 10 lines.
   ```

2. **Risk diff**

   ```text
   Review diff for {{FILE_OR_DIR}} and assess potential risk areas (security, performance, data integrity). Output a prioritized bullet list with mitigation suggestions.
   ```

3. **Runbook draft**

   ```text
   Draft an incident runbook for “core-service degraded” including detection signals, triage steps, safe rollback, and verification checks. Keep it <120 lines.
   ```

---

## N. Documentation & Governance

1. **Short ADR template**

   ```text
   Create an Architecture Decision Record template (ADR) with context, options, decision, consequences, and link to PR. <80 lines.
   ```

2. **Contributing guide**

   ```text
   Write CONTRIBUTING.md covering branch model, PR reviews, commit message style, running tests, and how to request a security review. <150 lines.
   ```

---

## Bonus Requests

- Ask for more prompts with: `Generate 10 more prompts for X` (where X = GitHub Actions, Slack, Asana, Pi, etc.).
- Provide a repo path + service to receive tailored prompts, e.g., “/packages/api + Airtable backlog”.

Have fun and mix-and-match prompts to speed up daily workflows while staying within security guardrails.
