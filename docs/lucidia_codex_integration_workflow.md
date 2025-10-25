# Lucidia–Codex Integration Workflow

This guide documents how to combine OpenAI Codex, GitHub, VS Code, and Lucidia Basic Memory to build a memory-aware development loop. It covers environment preparation, configuration snippets, data persistence, context sharing, and validation steps.

## 1. Step-by-Step Integration Plan

1. **Prepare Accounts & Prerequisites**  
   - Ensure access to OpenAI Codex (ChatGPT Plus/Pro or Enterprise) and a GitHub account with the right repository permissions.  
   - Install **VS Code** with the official Codex extension from the Marketplace so tasks can be launched directly from the editor.  
   - Confirm repository access and licences for Copilot/Codex if GitHub-hosted models will run in Actions or Codespaces.

2. **Configure Dev Container or Codespaces**  
   - Provision a GitHub Dev Container or Codespace that installs the Codex CLI, Lucidia Basic Memory client, and project dependencies.  
   - Mount persistent storage volumes for Basic Memory knowledge stores to survive container rebuilds.

3. **Install Codex CLI & Basic Memory**  
   - Install the Codex CLI globally inside the container (for example, `npm i -g @openai/codex` or `brew install --cask codex`).  
   - Add **Basic Memory** (Lucidia) via the Model Context Protocol (MCP) so Codex can persist context:  
     ```bash
     codex mcp add basic-memory bash -c "uvx basic-memory mcp"
     ```  
     Optionally scope memory to a project name:  
     ```bash
     codex mcp add basic-memory bash -c "uvx basic-memory mcp --project your-project-name"
     ```  
   - Verify the MCP installation with `codex mcp list` and confirm `basic-memory` is registered.

4. **Connect GitHub Repositories to Codex**  
   - Authorise Codex to access the repository via the ChatGPT/Codex UI or CLI so tasks run against a cloned sandbox copy.  
   - Ensure the repository includes an `AGENTS.md` file that outlines build, test, and style instructions for Codex.

5. **Integrate Basic Memory Into Daily Flow**  
   - Reference persistent notes when prompting Codex (e.g., “@codex switch to my work project; use the API design note for authentication work”).  
   - Use Basic Memory MCP functions such as `write_note`, `read_note`, `search_notes`, and `recent_activity` to maintain project docs. Codex keeps knowledge bases isolated per project.

6. **Optional: GitHub Actions Automation**  
   - Enable GitHub Actions workflows that call Codex. Set `models: read` in the workflow permissions block when invoking GitHub Models.  
   - Authenticate with `GITHUB_TOKEN` and run Codex CLI tasks (e.g., trigger on `codex-task` label and execute `codex task run ...`).

7. **VS Code Integration**  
   - Configure the Codex extension to execute inside the dev container and set tasks for common operations (tests, linting).  
   - Use Remote Containers features so the Codex extension and CLI share the containerised environment.

8. **Iterate & Review**  
   - Assign tasks through Codex in VS Code or ChatGPT, review generated diffs, and commit once validated.  
   - Capture decisions and notes in Basic Memory and optionally archive them in version control.

## 2. Sample Configuration Snippets

### `devcontainer.json`

```json
{
  "name": "lucidia-codex-env",
  "image": "mcr.microsoft.com/devcontainers/base:debian",
  "postCreateCommand": "npm install -g @openai/codex && pip install basic-memory",
  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "lts"
    },
    "ghcr.io/devcontainers/features/python:1": {
      "version": "3.11"
    }
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "openai.codex",
        "ms-vscode.remote-repositories"
      ],
      "settings": {
        "codex.executionEnvironment": "container",
        "codex.mcp.basicMemory.project": "main",
        "terminal.integrated.scrollback": 5000
      }
    }
  },
  "mounts": [
    "source=basic-memory-data,target=/home/vscode/.basic-memory,type=volume",
    "source=codex-config,target=/home/vscode/.config/codex,type=volume"
  ]
}
```

### VS Code `settings.json`

```json
{
  "codex.enabled": true,
  "codex.mcp.enabled": true,
  "codex.mcp.basicMemory.project": "main",
  "codex.model": "codex-1",
  "codex.reasoningEffort": "medium",
  "codex.githubAuthentication": "true",
  "editor.codeActionsOnSave": {
    "source.fixAll": true
  },
  "terminal.integrated.defaultProfile.linux": "bash"
}
```

### GitHub Actions Workflow

```yaml
name: Codex Automated Task
on:
  workflow_dispatch:
    inputs:
      prompt:
        description: 'Natural-language task for Codex'
        required: true
permissions:
  contents: write
  models: read
jobs:
  codex-run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Codex CLI
        run: npm install -g @openai/codex
      - name: Execute Codex Task
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          codex task run --prompt "${{ github.event.inputs.prompt }}" --repo ${{ github.repository }} --branch main
```

## 3. Data Persistence & Context-Sharing Schema

- **Storage Layer**: Basic Memory stores structured notes either locally (for example, `~/.basic-memory`) or through the hosted service. Mount the storage directory as a persistent volume inside the container so context survives rebuilds.
- **Schema & Structure**: Organise knowledge by project. Each note carries metadata (title, tags, project) plus Markdown or YAML bodies. Reference code or external resources via `memory://` URLs.
- **Operations**: Use MCP calls like `write_note`, `read_note`, `search_notes`, `recent_activity`, and `build_context` to retrieve relevant context before coding.
- **Context Sharing**: In VS Code or ChatGPT, request the correct project context (“Switch to my work project”) or call `build_context memory://project-name` to preload discussion history.
- **Security & Access**: Keep Basic Memory directories out of public repos (`.gitignore`). Store Basic Memory Cloud credentials in secrets or environment variables.

## 4. Testing Plan & Success Criteria

| Phase | Action | Success Criteria |
| --- | --- | --- |
| Environment Setup | Build the dev container or Codespace with Codex CLI and Basic Memory. | Container builds cleanly; `codex` and `basic-memory` commands are available; `codex mcp list` shows `basic-memory`. |
| Context Persistence | Create a note via `write_note`, rebuild the container, and confirm it persists with `read_note`. | Notes remain accessible across restarts. |
| Codex Task Execution | Ask Codex to implement a feature using stored notes for guidance. | Generated diffs align with memory guidance and pass tests. |
| GitHub Integration | Trigger the GitHub Actions workflow with a sample prompt. | Workflow runs Codex task successfully and publishes results to the repo. |
| Multi-session Context Sharing | Start a new session and query previous documentation. | Codex retrieves the correct information via Basic Memory or `build_context`. |
| Failure Handling | Introduce an error (e.g., invalid `memory://` link) and troubleshoot via reinstalling or reconfiguring MCP. | Issues are diagnosed and resolved following documented steps. |
| Security & Permissions | Audit workflow permissions and secrets usage. | Sensitive data is protected; tokens only have required scopes. |

---

By following this workflow, teams can combine Codex automation with Lucidia Basic Memory’s persistent context to deliver a repeatable, memory-aware development experience across local containers, GitHub Actions, and VS Code sessions.
