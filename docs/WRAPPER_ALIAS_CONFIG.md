# Wrapper Alias & Consent Configuration

This reference captures the alias and consent patterns that the PR automation wrapper can load into its system prompt or runtime configuration. Copy the sections that apply to your deployment and drop them into the prompt or config block that the wrapper reads.

## Channel aliases

Add the aliases below under the `ALIASES` block of the system prompt, then bind them inside the wrapper configuration.

```yaml
channel_aliases:
  dev_prs:   "#dev-prs"
  dev_ci:    "#dev-ci"
  releases:  "#releases"
  security:  "#security"
  incidents: "#incidents"     # optional
  staging:   "#staging-feed"  # optional
  prod:      "#prod-feed"     # optional
```

Example wrapper mapping:

```json
{
  "channels": {
    "dev_prs":   "https://hooks.slack.com/services/…",
    "dev_ci":    "https://hooks.slack.com/services/…",
    "releases":  "https://discord.com/api/webhooks/…",
    "security":  "https://hooks.slack.com/services/…",
    "incidents": "https://hooks.slack.com/services/…",
    "staging":   "https://hooks.slack.com/services/…",
    "prod":      "https://hooks.slack.com/services/…"
  }
}
```

## Service/project aliases

Add the aliases below to the prompt so the model can refer to services without handling raw IDs. Store the actual IDs and tokens as secrets in the wrapper.

```yaml
service_aliases:
  asana_default_project: "ASANA_PROJECT_ID_MAIN"
  asana_ops_project:     "ASANA_PROJECT_ID_OPS"
  airtable_default_base: "AIRTABLE_BASE_ID_MAIN"
  airtable_backlog_table:"Backlog"
  gitlab_group:          "gitlab.com/your-group"
  github_org:            "blackboxprogramming"
```

Example environment mapping:

```json
{
  "services": {
    "asana": {
      "projects": {
        "ASANA_PROJECT_ID_MAIN": "120…",
        "ASANA_PROJECT_ID_OPS":  "120…"
      }
    },
    "airtable": {
      "bases": {
        "AIRTABLE_BASE_ID_MAIN": "app…"
      },
      "tables": {
        "Backlog": "tbl…"
      }
    },
    "gitlab": { "group": "your-group" },
    "github": { "org": "blackboxprogramming" }
  }
}
```

## Environment aliases

Use the following environment aliases to couple Slack routing with GitHub environment secrets. Wrappers should resolve the `secretsScope` field into the appropriate GitHub Environment and respect the approval requirements.

```yaml
env_aliases:
  dev:     { slack: "dev_ci",  secretsScope: "dev" }
  staging: { slack: "staging", secretsScope: "staging" }
  prod:    { slack: "prod",    secretsScope: "production", approvalsRequired: true }
```

Guidance for the wrapper:

- Map `secretsScope` to the GitHub environment and its secrets.
- If `approvalsRequired` is `true`, enforce a manual approval step before injecting secrets.

## Host aliases

Extend the Pi host list with descriptive aliases. Keep default actions read-only or dry-run until explicit consent is captured.

```yaml
pi_aliases:
  pi_core:      "ssh://pi-core"
  pi_builder:   "ssh://pi-builder"
  pi_observer:  "ssh://pi-observer"
```

Example SSH configuration:

```sshconfig
Host pi-builder
  HostName 192.168.1.60
  User pi
  IdentityFile ~/.ssh/id_ed25519_pi_builder
  StrictHostKeyChecking accept-new

Host pi-observer
  HostName 192.168.1.61
  User pi
  IdentityFile ~/.ssh/id_ed25519_pi_observer
  StrictHostKeyChecking accept-new
```

## Consent defaults (optional hardening)

To tighten default guardrails, add the following rules to the system prompt or wrapper policy:

- Public posts: require consent for every request.
- `repo_dispatch` to production: require consent and an approver tag.
- `git_ops` push/mirror: require consent and an approver tag.
- `ping_pi` write/modify commands: require consent and a command allowlist.

Example allowlist for Pi write operations:

```json
{
  "pi_write_allowlist": [
    "systemctl restart core-service",
    "sudo cp /opt/core/config.yaml /opt/core/config.yaml.bak",
    "sudo rsync -a /opt/core/ /opt/core.bak/"
  ]
}
```

## Example tool calls with aliases

- **Post release note to `#releases` (Discord)**

  ```json
  {
    "tool": "http_request",
    "id": "bbx-010",
    "args": {
      "method": "POST",
      "url": "channel_alias:releases",
      "headers": { "Content-Type": "application/json" },
      "body": { "content": "Release *v1.2.3* is live in prod." }
    }
  }
  ```

- **Create an Asana task in the default project**

  1. Resolve the alias:

     ```json
     {
       "tool": "memory_recall",
       "id": "bbx-011",
       "args": { "key": "service_aliases.asana_default_project" }
     }
     ```

  2. Request the token via `use_secret` (wrapper injects value at runtime):

     ```json
     {
       "tool": "use_secret",
       "id": "bbx-012",
       "args": {
         "name": "ASANA_PAT",
         "purpose": "Create task in asana_default_project",
         "target": "service_alias:asana_default_project"
       }
     }
     ```

## Wrapper glue summary

- Resolve any `channel_alias:` or `service_alias:` reference before executing tool calls.
- Expose `get_secret(name)` for metadata only—never surface secret values to the model.
- Use `use_secret(name, purpose, target)` to create approval tickets and inject secrets at execution time.
- When evaluating `env_aliases`, pick the corresponding secrets environment and honor approval flows.
- Enforce the consent rules before allowing public posts, Git operations, production dispatches, or Pi write commands.

Use this reference as a drop-in appendix for prompt updates or wrapper configuration PRs.
