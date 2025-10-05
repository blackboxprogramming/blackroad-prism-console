---
title: "Raspberry Pi OS rebases to Debian 13 Trixie"
date: "2025-10-01"
tags: [raspberry-pi, debian, edge-computing, release]
description: "New Raspberry Pi OS release picks up Debian 13 Trixie, refreshed desktop theming, a unified Control Centre, and pricing updates driven by memory costs."
---

Raspberry Pi OS is now tracking Debian 13 "Trixie" as of the 2025-10-01 image refresh. The rebased release brings five years of upstream support, refreshed desktop experiences, and a clearer upgrade runway for fleets still on Bookworm.

## What Debian 13 brings to Pi deployments

Debian 13 went GA on 9 August 2025 with the first point release landing on 6 September, locking in the usual five-year security and LTS window. Rebasing Raspberry Pi OS on this stack means kernel updates, updated toolchains, refreshed package versions, and upstream fixes such as Y2038 handling that previously required manual backports. For teams maintaining hardened Pis on long-lived networks, the clock now starts on a support cycle that extends into 2030.

## Desktop refresh: PiXtrix, PiXonyx, and a calmer UI

The new image introduces two GTK themes:

- **PiXtrix** for the standard light profile
- **PiXonyx** for the dark profile

Both pair with a PiXtrix icon pack and a new system font (Nunito Sans Light). The wallpapers bundle has been refreshed to match the visual polish. These changes roll into the default LXQt desktop, so expect a noticeably different look on interactive consoles or kiosk builds.

## Control Centre and modular desktop installs

A new Control Centre application consolidates system configuration that previously required bouncing between `raspi-config`, panel applets, and command line tweaks. More interestingly, the desktop image has been modularized so that Lite → full desktop transitions (and back) no longer require reinstalling or manually pruning packages. Together with updated package stacks and performance tuning, the release reduces the operational tax of maintaining both headless and UI-driven nodes.

## Pricing changes hit Compute Modules

Raspberry Pi is also adjusting pricing in response to memory costs that are roughly 120% higher year-over-year. The increases are focused on LPDDR4-backed products:

- **Compute Module 4 / 5, 4 GB**: +$5 per unit
- **Compute Module 4 / 5, 8 GB**: +$10 per unit
- **CM5 Dev Kit**: +$5 (now $135)
- **Raspberry Pi 500**: +$10 (now $100)

Standard Pi 4 and Pi 5 boards remain unchanged for now, but CM-based designs should rework BOM forecasts before Q4 builds.

## Upgrade readiness checklist

Rolling from Bookworm to the new Trixie-based image is a straight apt dist-upgrade, but a controlled rollout still matters:

1. **Snapshot and rehearse** – Image your current boot media or run upgrades on golden replicas first.
2. **Confirm kernel modules** – Validate out-of-tree drivers against the newer kernel before touching production.
3. **Check theming overrides** – If you brand kiosk displays, test the new GTK themes to avoid legibility regressions.
4. **Watch 32-bit deployments** – Confirm userspace packages you rely on have made the Trixie transition on armhf.
5. **Review Control Centre policies** – Decide whether to expose the GUI tool to operational users or lock it down.

If you need the detailed Bookworm → Trixie upgrade steps, pull the official instructions or run them from a staging Pi first; the Control Centre also surfaces several of the new toggles post-upgrade. With a plan in place, the rebase delivers long-term security coverage and better desktop ergonomics without breaking existing automation.
