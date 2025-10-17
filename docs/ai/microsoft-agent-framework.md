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
