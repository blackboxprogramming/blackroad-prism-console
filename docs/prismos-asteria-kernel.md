# PrismOS Asteria Kernel Plan

This document outlines a high‑level plan for implementing PrismOS as a bare‑metal, agent‑centric operating system.

## 1. Kernel foundation

- **Language:** Rust with `#![no_std]` and core crates.
- **Boot target:** x86_64 UEFI image launched by GRUB or a custom bootloader.
- **Responsibilities:**
  - Set up paging and a global allocator.
  - Initialise APIC, interrupts and timers.
  - Provide a cooperative scheduler for kernel agents.
  - Load service agents during boot instead of user processes.

## 2. Agent runtime model

- Agents are declared in `/etc/prismos/agents.d/*.toml` within the initramfs.
- Each declaration includes name, capabilities, configuration and version.
- Agents ship as binaries or WASM modules with a defined entrypoint.
- The kernel spawns each agent in an isolated sandbox and exposes IPC via `/prism/ipc/<agent>` message channels.

## 3. Virtual filesystem

- Mount `/prism/` as a virtual filesystem managed by the kernel.
- Important directories:
  - `/prism/agents/` – live agent status files.
  - `/prism/logs/` – rolling log buffers per agent.
  - `/prism/contradictions/` – contradiction reports for Lucidia.
- Reads and writes are mediated through kernel memory channels.

## 4. Shell and control

- Provide `prismsh`, a minimal interactive console.
- Commands:
  - `status` – list all agents and their health.
  - `restart <agent>` – terminate and respawn the agent.
  - `snapshot` – dump an agent's memory into `/prism/snapshots/`.
  - `rollback` – reload the most recent snapshot.

## 5. Graphics layer (stretch goal)

- Simple framebuffer console using Prism colours `#FF4FD8`, `#0096FF` and `#FDBA2D`.
- Display a grid of agents with live status indicators.
- Allow keyboard navigation between agents.

## 6. Build and boot

- Cross‑compile the kernel with `cargo xbuild`.
- Package using the `bootimage` crate to produce an ISO.
- Boot in QEMU or on bare‑metal UEFI hardware.
- Provide a `make run` target for rapid development.

## 7. Testing

- Integration tests in QEMU should verify:
  - Booting the OS and `prismsh status` listing default agents.
  - Killing an agent triggers an automatic restart.
  - Writing a contradiction log creates a file in `/prism/contradictions/`.

This plan gives a roadmap for evolving PrismOS into a true agent‑first operating system.
