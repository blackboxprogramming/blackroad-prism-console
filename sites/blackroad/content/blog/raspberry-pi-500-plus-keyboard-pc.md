---
title: "Raspberry Pi 500+ Brings Desktop-Class Storage to the Keyboard PC"
date: "2025-02-14"
tags: [hardware, raspberry-pi, edge-computing]
description: "Hands-on notes about the Raspberry Pi 500+ refresh: NVMe storage, mechanical keys, and what the upgrades mean for keyboard-first makers."
---

The Raspberry Pi 500+ keeps the compact, everything-in-the-keyboard silhouette of the Pi 500, but upgrades almost every subsystem that matters for real-world productivity.

## Headline hardware changes

- **Memory:** 16 GB of LPDDR4X RAM doubles the previous flagship, removing the tightest constraint on browsers, compilers, and lightweight virtual machines.
- **Storage:** A built-in 2280 NVMe slot ships populated with a 256 GB drive. Sequential transfers around 893 MB/s reads and 778 MB/s writes are a step-change from microSD performance, and you can still fall back to the microSD slot when you need removable media.
- **Keyboard and power controls:** The membrane deck is gone. In its place is a low-profile mechanical board using Gateron KS-33 Blue switches with per-key RGB, plus a soft power button that glows green when active and red in standby.

The SoC remains the same 2.4 GHz Cortex-A76 quad-core from the Pi 5 family, so CPU-bound workloads will feel familiar. Thermal behavior is also similar: idle temperatures rise slightly because of the NVMe drive, but sustained loads stay well within spec and power draw tracks the older model.

## Practical takeaways

- **General-purpose desktop:** The extra RAM and faster storage make multitasking smoother. You can keep more browser tabs, a code editor, and a containerized service running without paging out.
- **Maker workflows:** Booting from NVMe still incurs a bootloader delay (around 22.6 s versus 16.4 s from a fast microSD), yet once the system is up, package installs, large git clones, and local artifact caches feel dramatically faster.
- **User experience:** The mechanical key feel and per-key lighting turn the integrated keyboard from a compromise into a feature. Paired with the illuminated power button, the device finally behaves like a purpose-built desktop instead of a Pi hidden in plastic.

If you loved the Pi 400 and Pi 500 as approachable all-in-one PCs, the 500+ is the "ultimate" expression of that concept: more RAM, proper storage, and a typing experience worth living with. Makers chasing raw GPIO flexibility will still prefer a board-only Pi 5, but for day-to-day creative or educational workflows, this is the most polished Raspberry Pi keyboard computer yet.
