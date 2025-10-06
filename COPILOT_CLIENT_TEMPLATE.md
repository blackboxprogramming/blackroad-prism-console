# Copilot OAuth client template

Use this JSON as a template when requesting or registering a GitHub Copilot OAuth client with your organization's Copilot console. Replace placeholders with your org-specific values and never commit secrets.

```json
{
  "name": "BlackRoad Prism Console Copilot Client",
  "redirect_uris": ["https://copilot.apps.github.com/oauth/callback"],
  "scopes": ["repo", "workflow", "codespaces"],
  "description": "OAuth client for Copilot agent features in BlackRoad Prism Console Codespaces"
}
```

Recommended secret names (store in GH org or repo secrets):

- `COPILOT_CLIENT_ID`
- `COPILOT_CLIENT_SECRET`

Do NOT commit client secrets to the repository. Use GitHub Secrets or your secret manager.
