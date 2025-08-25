# Prism Project

Prism unifies a minimal bare-metal operating system **PrismOS** with a web-based environment **PrismWeb**.
This repository provides an initial scaffold for experiments across hardware and cloud.

## Repository Structure

- `prismos-kernel/` – Rust `no_std` kernel targeting `x86_64-prismos` with memory, filesystem and shell stubs plus a QEMU build script.
- `backend/` – Node.js + SQLite API skeleton with migration and route placeholders.
- `prism-web/` – React + Tailwind frontend scaffold offering multi-tab desktop metaphors.
- `agents/` – IPC-driven agents grouped into `core`, `elite` and `novelty` tiers, each responding to ping.
- `tests/` – Jest stubs covering database, auth, projects, logs and agent tiers.
- `.github/workflows/` – Placeholder CI workflows for tests, backend and frontend builds.

Each subdirectory contains a README or TODO comments describing how to extend the stub into a full implementation.
