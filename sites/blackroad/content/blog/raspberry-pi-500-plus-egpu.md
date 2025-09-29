---
title: "Raspberry Pi 500+ Hits 118 FPS With External GPU"
date: "2025-03-18"
tags: [hardware, raspberry-pi, edge-computing]
description: "Jeff Geerling demonstrates full eGPU acceleration on the Raspberry Pi 500+, pointing toward a future of more modular Pi hardware."
---

## What happened

- Raspberry Pi modder Jeff Geerling patched the Pi 500+ kernel with ~15 lines to enable external GPU (eGPU) support over the built-in M.2/PCIe slot.
- Using an adapter, he connected an AMD Radeon RX 7900 XT and ran Horizon Chase Turbo through the Box64 compatibility layer at roughly 118 frames per second.
- The experiment highlights two current bottlenecks: the Pi 500+'s quad-core CPU and its single PCIe Gen 3 lane.
- The Pi 500+ is the first Pi to ship with a native M.2 slot, bundling 16 GB of LPDDR4X memory and a pre-installed 256 GB NVMe SSD while supporting full-size 2280 drives.

## Why it matters

Pushing the Pi 500+ into eGPU territory breaks the board's low-power stereotype and hints at a modular future where Raspberry Pi devices can tap into desktop-class accelerators with minimal tweaks. While today's performance is limited by CPU throughput and PCIe bandwidth, the proof-of-concept signals that future Pi revisions—or third-party spin-offs—could unlock broader PCIe expansion, better multi-core performance, and more official GPU pathways for makers and embedded edge deployments.

## What to watch next

- Whether the Raspberry Pi Foundation upstreams kernel support for high-power PCIe devices like GPUs.
- Follow-on experiments that explore more power-efficient GPUs or AI accelerators through the same slot.
- Updates from Geerling and the community on stability, thermal constraints, and power delivery solutions for sustained eGPU workloads on the Pi 500+.

