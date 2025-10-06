# Registering a GitHub Copilot OAuth Client (step-by-step)

This doc shows the typical steps to register an OAuth client for GitHub Copilot agent features and wire it into Codespaces. Workflow and UI may vary by GitHub plan and organization.

1. Prepare

- Choose who will hold the client secrets (org-level GitHub Secrets or a secrets manager).
- Decide which redirect URI to use (Copilot commonly uses `https://copilot.apps.github.com/oauth/callback`).

2. Create the OAuth client

- In GitHub Enterprise / Org admin console, find the Copilot or OAuth client registration area.
- Create a new client using the `COPILOT_CLIENT_TEMPLATE.md` as a guide.
- Record the Client ID and Client Secret; store them in your secrets manager.

3. Store secrets in GitHub (or an appropriate secret store)

- In the GitHub organization or repository settings, add the following secrets (recommended names):
  - `COPILOT_CLIENT_ID`
  - `COPILOT_CLIENT_SECRET`

4. Enable Copilot agent features for Codespaces

- Follow your org's Copilot/Codespaces configuration UI to enable agent features and point it at the registered client.
- If an option to allow dynamic registration exists, enable it for Codespaces in the org.

5. Verify from a Codespace

- Start a Codespace for this repository with the Copilot extension enabled.
- Open the Codespaces chat panel and choose Generate instructions / Quick actions.
- If you receive an OAuth error, verify the client ID/secret are correctly set as org secrets and that Copilot agent features are enabled.

Security notes

- Client secrets are powerful; limit their visibility and rotate regularly.
- Use least-privilege scopes where possible. The sample template uses broad scopes (repo, workflow, codespaces) as an example — tighten per your policies.
