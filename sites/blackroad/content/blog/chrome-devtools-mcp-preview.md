---
title: "Chrome DevTools MCP Preview"
date: "2025-02-14"
tags: [agents, tooling, chrome]
description: "Google's Chrome team ships a Model Context Protocol server that lets AI agents watch and control live DevTools sessions."
---

Google's Chrome team has released a public preview of a Chrome DevTools MCP server, giving AI coding agents direct access to the browser's live runtime. The server implements the Model Context Protocol so that agents can connect over MCP and issue DevTools commands without manual mediation.

## Why it matters

- Agents can now observe DOM nodes, CSS, and console output directly from a running Chrome instance rather than inferring state from static files.
- Performance workflows open up: an agent can start a trace on a target URL, collect and analyze the results, suggest optimizations, and rerun the trace to confirm improvements.
- Access to DevTools APIs brings parity with what human engineers use when debugging production issues, tightening the loop between code generation and validation.

## Early caveats

- The release is labeled a public preview, and the GitHub issues tracker already highlights connection bugs, noisy logging, and viewport control gaps that need work.
- Orchestrating multiple MCP tools remains difficult—benchmarks like LiveMCP-101 show even advanced agents stumble on complex multi-step scenarios.

## Getting started

The project repository, `chrome-devtools-mcp`, includes setup instructions, API specifications, and example commands. Installing the server locally makes it straightforward to prototype: launch the MCP service, point your agent at it, and experiment with DevTools calls such as `performance_start_trace` followed by result inspection.

While the tooling is still stabilizing, having "eyes" on the browser at runtime could be a turning point for autonomous coding agents. We'll keep experimenting and report back as the integrations mature.
