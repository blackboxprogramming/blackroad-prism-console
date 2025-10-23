# Prism Virtual Filesystem

This directory tree mirrors the shared state used by Prism agents. It
contains subdirectories for agent manifests, IPC buffers, logs,
contradiction reports, snapshots, and collaborative symphonies.

- `agents/` – registered agent manifests
- `ipc/` – IPC message buffers
- `logs/` – rolling log files per agent
- `contradictions/` – contradiction reports
- `snapshots/` – memory dumps for resilience (e.g. `mathematica/complex_rotation_recurrence.{yaml,json}` captures the core rotation recurrence for the Mathematica branch)
- `symphonies/` – collaborative compositions

_Last updated on 2025-09-11_
