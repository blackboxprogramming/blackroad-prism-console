# Secure Integration Playbook

This playbook documents the process for securely integrating the BlackRoad Prism Console
with collaboration and productivity platforms, while minimizing credential exposure and
maintaining strong observability.

## Key Management

- Generate unique API tokens per service and environment (dev, staging, production).
- Store secrets exclusively in the centralized secret manager (e.g., HashiCorp Vault,
  AWS Secrets Manager, or GCP Secret Manager).
- Never embed credentials directly in code, configuration files checked into Git, or
  container images. Use environment variables or runtime secret injection.
- Rotate all tokens every 90 days or immediately after personnel changes. Maintain an
  automated rotation pipeline where supported by the provider.
- Leverage the provided SSH public key (`ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIALZUAoxnX6H/IWWB9kRMoKtP3C+r/jqYj/JnAT2ME2S`)
  only for provisioning automation hosts. Do not embed private keys in CI/CD.

## Platform Integrations

### Slack
- Use a dedicated Slack app with granular OAuth scopes. Restrict the bot token to
  required channels via Slack's allowlist features.
- Route outgoing webhooks through the integration gateway with request signing and
  rate limiting. Enable Slack's signing secret validation in all webhook handlers.
- Archive audit logs in the SIEM for message actions and administrative events.

### Asana
- Configure a service account with project-level permissions only. Avoid personal
  access tokens tied to individual employees.
- Enforce OAuth state parameter checks in redirect flows and require HTTPS callbacks.
- Sync tasks via scheduled jobs that respect Asana's concurrency limits; capture task
  metadata in the central data warehouse for reporting.

### GitLab & GitHub
- Centralize repository access via SSO-backed groups. Enforce branch protection and
  signed commits across both platforms.
- Use GitHub/GitLab Apps for automation rather than personal tokens. Scope tokens to
  specific repositories and operations.
- Mirror security alerts (Dependabot, CodeQL, GitLab SAST/DAST) into the incident
  management queue with automated triage playbooks.

### Discord
- Create a dedicated Discord bot with limited guild permissions and disable default
  intents not required by the workflow.
- Proxy outbound Discord webhooks through the integration gateway to apply standard
  authentication and logging.
- Require multi-factor authentication for administrators and rotate bot tokens when
  staff changes occur.

### Airtable
- Use service tokens with base-scoped access. Disallow personal Airtable API keys in
  production workflows.
- Implement row-level validation before syncing to Airtable to prevent accidental
  leakage of sensitive data.
- Enable request signing on the integration gateway and verify Airtable's
  `X-Airtable-Checksum` header.

### Automation Bots
- Maintain a registry of all bots with ownership metadata, scopes, and runtime
  environments.
- Enforce static analysis and dependency scanning on bot code before deployment.
- Run bots in isolated namespaces with least-privilege IAM roles. Monitor outbound
  network traffic for anomalies.

## Monitoring & Incident Response

- Send integration gateway logs, provider audit logs, and CI/CD event streams to the
  centralized SIEM (e.g., Splunk, Datadog) with 30-day hot retention and one-year cold
  storage.
- Configure automated alerts on authentication failures, token usage spikes, and scope
  escalations. Tie alerts to PagerDuty/ops on-call rotations.
- Maintain a runbook for revoking tokens, rotating keys, and disabling integrations.
  Test the runbook quarterly through tabletop exercises.

## Compliance & Documentation

- Update the data flow diagrams and Records of Processing Activities (RoPA) whenever a
  new integration is added or scopes change.
- Document integration owners, service-level objectives, and dependency matrices in the
  internal wiki. Require sign-off from security and compliance leads before production
  rollout.
- Review this playbook every six months to ensure alignment with evolving regulatory
  requirements and organizational policies.
