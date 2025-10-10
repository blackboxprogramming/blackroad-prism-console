# Microsoft Agent Framework Overview

Microsoft Agent Framework is an open-source SDK and runtime that unifies previous capabilities from Semantic Kernel and AutoGen into a cohesive toolkit for multi-agent workflows. It is currently in public preview under the MIT License and offers first-class support for both Python and .NET development.

## Key Features
- **Unified Orchestration:** Combines Semantic Kernel's state management, telemetry, and enterprise features with AutoGen's multi-agent orchestration.
- **Workflow Control:** Adds durability, human-in-the-loop coordination, and governance to support production-ready agent systems.
- **Interoperability:** Supports Agent2Agent (A2A) communication across runtimes, OpenAPI integrations, and dynamic tool attachment via the Model Context Protocol (MCP).
- **Flexible Patterns:** Enables sequential, concurrent, handoff, group chat, and graph-based workflows, including Microsoft's "Magentic One" pattern.
- **Deployment Pipeline:** Allows teams to build locally and deploy to Azure AI Foundry with observability, compliance, and scaling support.

## Getting Started
Developers can begin by experimenting locally with Python or .NET agents, then use the built-in interoperability features to connect additional services or tools. When ready for production, the same projects can be moved into Azure AI Foundry for managed hosting and monitoring.

### Install the .NET SDK (8.0 or later)
Microsoft Agent Framework ships first-class .NET samples that rely on the modern SDK toolchain. Install the latest long-term support release (currently **8.0.x**) and verify that the CLI is on your path:

```bash
# macOS
brew install --cask dotnet-sdk

# Ubuntu / Debian
wget https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt-get update && sudo apt-get install -y dotnet-sdk-8.0

# Windows (PowerShell)
winget install Microsoft.DotNet.SDK.8
```

Confirm the installation before running any samples:

```bash
dotnet --info
dotnet --list-sdks
```

If Visual Studio Code or Visual Studio prompts for an SDK download, accept the installer—this places the runtime in `~/Library/dotnet` on macOS (as shown in the on-screen workflow) and automatically wires up shell integration.

### Create your first agent project
With the SDK installed, create a new console application and reference the Microsoft Agent Framework NuGet package:

```bash
dotnet new console -n AgentQuickstart
cd AgentQuickstart
dotnet add package Microsoft.Agent.Framework --prerelease
dotnet run
```

You can now connect the .NET agent to Python peers through A2A or MCP adapters, iterate locally, and publish to Azure AI Foundry when production-ready.

### Map on-screen prompts to CLI commands
During the Microsoft Agent Framework quickstart, the guided UI may surface buttons such as **Open Start Server**, **Open workspace**, **Refer to changes first**, or **Wait for working copy**. You can complete each of these actions directly from the terminal instead:

- **Open Start Server** → run `dotnet run` from your agent project directory to boot the local host process.
- **Open workspace** → launch your editor of choice (for example `code .` for VS Code or `open AgentQuickstart.sln` on macOS) once the project scaffold is created.
- **Refer to changes first** → use Git commands like `git status` and `git diff` to inspect pending edits before continuing.
- **Wait for working copy** → pull the latest changes with `git pull` (or `git fetch` followed by `git merge`) until the working tree is clean.

Having the CLI equivalents handy keeps the setup script unblocked even when the interactive checklist stalls on these prompts.
