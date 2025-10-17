---
title: "Pingora: Cloudflare's Rust Proxy Comes to Everyone"
date: "2025-02-14"
tags: [infrastructure, networking, rust]
description: "What builders gain now that Cloudflare has open-sourced its Pingora edge proxy framework."
---

Cloudflare just turned one of its biggest internal infrastructure bets into an open project: **Pingora**, the Rust framework that has been quietly handling trillions of requests inside the company's edge. If you have ever looked at NGINX or HAProxy and wished you could keep their power while writing custom logic in a memory-safe language, Pingora is the moment to pay attention.

## What Pingora is

Pingora is a programmable proxy and load balancer framework written in async Rust. Out of the box it gives you:

- HTTP/1.1 and HTTP/2 client and server support with first-class TLS termination.
- Built-in gRPC and WebSocket upgrades, so you can run modern bidirectional APIs at the edge.
- Graceful worker reloads and zero-downtime deploys driven by a parent/child process model.
- Pluggable load-balancing and failover strategies that you can extend with Rust traits instead of Lua or custom patches.
- Deep observability hooks for structured logs, counters, and latency histograms that feed Grafana or any OpenTelemetry backend.

## Why Cloudflare built it

Cloudflare grew up on NGINX, but running tens of millions of requests per second pushed past what the stock C codebase could do. Repeatedly patching and extending NGINX meant:

- Hard-to-maintain C modules and Lua scripts scattered across the fleet.
- Latency hit a floor because of locking and memory allocation patterns tuned for smaller workloads.
- Every security review had to revisit use-after-free or buffer bugs waiting to happen.

Pingora's Rust architecture gave them faster startup, lower memory usage, and confidence that the borrow checker would eliminate entire classes of production incidents. The framework composes around async tasks, so one machine can handle more concurrent work with less headroom.

## Open-source momentum

Pingora ships under the Apache-2.0 license and the repository already reflects years of production hardening—Cloudflare migrated major products before they published the code. Better yet, the ecosystem is forming quickly:

- The Internet Security Research Group launched **River**, a ready-to-run reverse proxy that packages Pingora with opinions from Cloudflare, Shopify, and Chainguard. If you want results today, River's releases are worth a test drive.
- Plugins and community crates are starting to appear for things like dynamic upstream discovery, tracing exporters, and request authentication.

## How to get hands-on

If you want to kick the tires, a good flow looks like this:

1. Read Cloudflare's launch post for a high-level tour of the architecture and how they replaced huge portions of their NGINX fleet.
2. Clone the GitHub repo, run through the quick start, and build the sample load balancer—it shows how little code you need to accept TLS traffic, proxy upstream, and export metrics.
3. Decide whether you want to embed Pingora directly or ride with River. Need an API gateway or CDN-like cache with custom logic? Pingora lets you implement the exact pipeline. Want a general-purpose reverse proxy that you can configure right now? River comes with declarative config, systemd units, and packaged releases.

## Where it shines for builders

Pingora is compelling when you need:

- Memory safety and predictability in the proxy tier without writing C.
- Per-tenant or per-request routing logic that would be awkward in NGINX modules.
- A platform to experiment with new protocols—Rust's ecosystem makes QUIC or bespoke transports feel reachable.

Tell me what kind of edge service you have in mind—API gateway, multi-region load balancer, or CDN cache—and I'll sketch a starter configuration using Pingora or River.
