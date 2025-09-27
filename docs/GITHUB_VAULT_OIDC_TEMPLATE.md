# GitHub ↔ HashiCorp Vault OIDC Integration Template

This guide describes how to configure GitHub Actions to request short-lived credentials from HashiCorp Vault using OpenID Connect (OIDC). Pair this with [`templates/security/github-actions-oidc-vault-template.yml`](../templates/security/github-actions-oidc-vault-template.yml) to keep long-lived secrets out of CI.

## Prerequisites

- HashiCorp Vault 1.10+ with the JWT/OIDC auth method enabled.
- GitHub organization or enterprise plan with GitHub Actions enabled.
- Administrative access to configure GitHub organization-level security settings.
- A secrets engine path (e.g., `kv-v2`) containing the materials the workflow needs.

## High-level flow

1. GitHub Actions automatically issues an OIDC token scoped to the running workflow.
2. Vault verifies the token against the configured GitHub issuer and bound claims.
3. Vault issues a short-lived token (or wraps secret data) under a specific role.
4. The workflow reads required secrets and uses them during the job.
5. Tokens expire automatically and should not be stored.

## Vault configuration steps

### 1. Enable and configure the JWT auth method

```bash
vault auth enable jwt

vault write auth/jwt/config \
  oidc_discovery_url="https://token.actions.githubusercontent.com" \
  bound_issuer="https://token.actions.githubusercontent.com"
```

### 2. Create a Vault role for GitHub workflows

Update the placeholders to match your organization, repository, and branch filters. Limit `bound_subject` or `bound_claims` to the workflows that require access.

```bash
vault write auth/jwt/role/github-oidc-blackroad-build \
  user_claim="sub" \
  bound_audiences="vault" \
  bound_subject="repo:BlackRoadOrg/prism-console:ref:refs/heads/main" \
  token_policies="prism-console-ci" \
  token_explicit_max_ttl="15m" \
  token_ttl="5m"
```

- Use multiple roles if different repositories or environments require distinct privileges.
- If you need to support pull requests from forks, use `bound_claims` with `repository_owner` and `repository` plus branch protection rules.

### 3. Define a Vault policy for CI access

The policy should read only the minimal paths required by the workflow.

```hcl
# file: policies/prism-console-ci.hcl
path "kv/data/blackroad/prism-console/ci" {
  capabilities = ["read"]
}

path "transit/sign/prism-console" {
  capabilities = ["update"]
}
```

Load the policy:

```bash
vault policy write prism-console-ci policies/prism-console-ci.hcl
```

### 4. Store secrets and set transit keys

```bash
vault kv put kv/blackroad/prism-console/ci api_token="example" signing_key="<base64-key>"
```

## GitHub organization configuration

1. Navigate to **Settings → Security → Actions → OpenID Connect**.
2. Add a new trust relationship pointing to your Vault instance:
   - **Provider URL:** `https://token.actions.githubusercontent.com`
   - **Audience:** `vault`
3. Optionally restrict repositories allowed to request tokens.
4. Avoid storing long-lived Vault tokens in repository or organization secrets. Use the OIDC token exchange at runtime.

## Workflow hardening checklist

- [ ] Require environments and approvals for deployments.
- [ ] Enable branch protection and required status checks for `main` and release branches.
- [ ] Rotate secrets regularly in Vault and ensure TTLs align with workflow runtime.
- [ ] Enable audit logging in Vault and monitor for unusual access patterns.
- [ ] Use GitHub Actions reusable workflows to centralize vault-auth steps.

## Local validation tips

- Use `vault write auth/jwt/login role=<role-name> jwt=<jwt>` with a locally generated workflow JWT to validate configuration before enabling in production.
- Test on a staging repository before rolling out to all workflows.
- Combine with [`sops`](https://github.com/mozilla/sops) or [`git-crypt`](https://github.com/AGWA/git-crypt`) for configuration files that must live in the repository but should remain encrypted at rest.

