# Enabling GitHub Copilot Agent Features for this repo

This project does not control the Codespaces chat quick-actions from repository files — those UI features are provided by GitHub Copilot's agent service and require proper Copilot client registration at the organization or Codespace level.

If you'd like Copilot agent quick-actions and repo-specific instructions to appear in the Codespaces chat panel, follow these steps (org admin or repo admin privileges may be required):

1. Register an OAuth application / client with GitHub Copilot Cloud

- Navigate to your GitHub organization's Copilot / Apps console (or follow your enterprise admin process).
- Create a new OAuth client for Copilot agents and record the Client ID and Client Secret.
- Configure the client to allow dynamic registration from Codespaces if your org supports it.

2. Configure Codespaces / Copilot to use the client

- In the GitHub org or repo settings, set the Copilot client ID/secret or create the mapping required by your environment.
- Verify that the Codespace is provisioned with the appropriate Copilot settings.

3. Add repo-level instructions (optional but recommended)

- Place a `.github/copilot-instructions.md` in the repository root (we already provide one). Copilot will read it and can use it to bias auto-generated suggestions and quick actions when the agent environment is active.
- The `COPILOT_SETUP.md` and `.github/copilot-instructions.md` are documentation; they do not bypass Copilot service authentication requirements.

4. Test the integration

- Open a Codespace for this repo with Copilot enabled.
- Open the Codespaces chat panel and attempt to interact with the agent features (Generate instructions / Quick actions).
- If you see an OAuth error about client registration, confirm the client ID/secret were set correctly in the org/Copilot settings.

Notes & security

- Client secrets must be stored securely (do not commit them to the repository). Use your organization's secret management (GitHub Secrets, HashiCorp Vault, etc.).
- Only allow Copilot clients you trust; agent features may suggest code or run automation that interacts with your repo.
- If you need a templated JSON for the Copilot client registration request or example environment variable names, tell me and I will provide them.
