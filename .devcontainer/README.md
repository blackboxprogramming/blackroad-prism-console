# GitHub Codespaces Setup

This repository is configured to work with GitHub Codespaces, providing you with a fully-configured development environment in the cloud.

## Getting Started with Codespaces

### Option 1: Create a new Codespace

1. Click the **Code** button on the repository page
2. Select the **Codespaces** tab
3. Click **Create codespace on [branch-name]**
4. Wait for the environment to build (first time may take 5-10 minutes)

### Option 2: Use the badge

Click on the badge below to create a new Codespace:

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/blackboxprogramming/blackroad-prism-console)

## What's Included

Your Codespace comes pre-configured with:

- **Node.js 20** - Latest LTS version
- **Python 3.11** - With pip and virtual environment support
- **AWS CLI** - For cloud deployments
- **Terraform 1.6.6** - Infrastructure as code
- **GitHub CLI** - For GitHub operations
- **VS Code Extensions**:
  - Terraform
  - Prettier (code formatter)
  - ESLint (JavaScript linter)
  - Python & Pylance
  - GitHub Copilot (if you have access)
  - GitLens
  - Makefile Tools

## Port Forwarding

The following ports are automatically forwarded:

- **Port 3000**: Website (Next.js development server)
- **Port 4000**: Backend API
- **Port 8000**: LLM API

You'll receive notifications when services start on these ports.

## Quick Commands

After your Codespace is ready, you can run:

```bash
# Start the development server
npm run dev

# Run tests
npm run test
pytest -q

# Lint code
npm run lint

# Format code
npm run format
```

## Environment Variables

If you need environment variables:

1. A `.env` file will be created from `.env.example` during setup
2. Update the `.env` file with your values
3. For secrets, use [Codespaces secrets](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-encrypted-secrets-for-your-codespaces)

## Post-Create Setup

The Codespace automatically runs a post-create script that:

- Installs global Node.js tools (commitlint)
- Installs Python dependencies from `requirements.txt` and `requirements-dev.txt`
- Installs Node.js project dependencies
- Sets up pre-commit hooks
- Creates `.env` from `.env.example` if needed

## Customizing Your Codespace

You can customize the Codespace configuration by editing files in the `.devcontainer/` directory:

- `devcontainer.json` - Main configuration file
- `Dockerfile` - Custom image configuration
- `post-create.sh` - Setup script that runs after container creation

## Troubleshooting

### Codespace is slow
- Try rebuilding the container: **Codespaces: Rebuild Container** from the Command Palette (Cmd/Ctrl+Shift+P)

### Dependencies not installed
- Run the post-create script manually: `bash .devcontainer/post-create.sh`

### Port not accessible
- Check that the service is running
- Ensure the port is forwarded in the Ports panel (usually at the bottom of VS Code)

## Resources

- [GitHub Codespaces Documentation](https://docs.github.com/en/codespaces)
- [Dev Containers Documentation](https://containers.dev/)
- [Repository README](../README.md)
- [Local Development Runbook](../RUNBOOK.md)

## Cost Considerations

GitHub provides free Codespaces hours for personal accounts. Check your [billing settings](https://github.com/settings/billing) to monitor usage.

For organization repositories, check with your organization admin about Codespaces policies and quotas.
