# Codespaces Stack Overview

This repository, `blackroad-prism-console`, ships a hybrid Node.js + Python toolchain.

- **Node.js / TypeScript** power the Next.js frontend and Express API, defined in [`package.json`](../package.json).
- **Python 3.11** tools and services rely on [`requirements.txt`](../requirements.txt) for data science, automation, and service helpers.

The existing `.devcontainer/devcontainer.json` already installs both runtimes and VS Code extensions suited for this stack, so you can connect from GitHub Codespaces or VS Code Desktop without additional setup.
