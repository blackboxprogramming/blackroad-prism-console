---
title: "Raspberry Pi 500 Plus Lands as Debian 13 Takes the Stage"
date: "2025-09-18"
tags: [raspberry-pi, debian, hardware]
description: "The Raspberry Pi 500 Plus upgrades the keyboard PC while Debian 13 'Trixie' arrives with new architectures and security features."
---

The Raspberry Pi ecosystem is having a busy end of summer. Raspberry Pi 500 Plus,
an upgraded take on the keyboard PC, is joining shelves just as Debian 13 "Trixie"
lands with refreshed kernels, architectures, and hardening. Here are the highlights
and how to get ready for the changes.

## Raspberry Pi 500 Plus: mechanical keys and more memory

Raspberry Pi's latest keyboard-integrated machine keeps the compact form factor but
steps up just about everything inside:

- **Memory and storage**: 16 GB of LPDDR4x RAM and an onboard M.2 2280 slot with a
  bundled 256 GB SSD replace the old 8 GB + microSD-only limitation.
- **Mechanical typing experience**: low-profile caps sit on Gateron KS-33 Blue
  switches, while an onboard RP2040 running QMK handles RGB lighting and macros.
- **Connectivity and compute**: a quad-core Cortex-A76 SoC, Wi-Fi 5, Bluetooth,
  gigabit Ethernet, dual micro HDMI, three USB-A ports, and USB-C power complete
the package.
- **Pricing**: the standalone unit comes in at $200, or $220 for the Desktop Kit
  that bundles power, cables, and a mouse. The non-Plus Pi 500 remains on sale at
  $100 after the recent $10 price bump.

## Broader price adjustments across Compute Modules

Memory cost volatility is hitting other boards too. Raspberry Pi is raising prices
by $5 on 4 GB Compute Module 4 and 5 variants and by $10 on their 8 GB counterparts.
Lower-density 1 GB and 2 GB models are spared for now, but the bump underscores how
the AI and HBM boom is pressuring LPDDR and DDR supply chains.

## Debian 13 "Trixie" arrives

Debian's latest stable release shipped on August 9, 2025 with a quick 13.1 point
release on September 6. Key updates include:

- **Kernel**: Linux 6.12 LTS as the default, supported through December 2026.
- **Architectures**: official 64-bit RISC-V support and retirement of x86 32-bit
  (i386) and MIPS builds.
- **Security and networking**: expanded return- and jump-oriented programming
  mitigations, plus HTTP/3 out of the box.
- **Reproducibility and localization**: more packages now build reproducibly and
  translation coverage continues to improve.
- **Hardware enablement**: better tuning for Raspberry Pi 5 and newer SoC families.

The Raspberry Pi OS team is already preparing a Trixie-based release. Early adopters
report a roughly ten-minute upgrade from Bookworm on a Pi 5, though custom services
or packages may demand a bit of manual cleanup.

## What to do next

- **Plan your upgrades**: budget the price changes into upcoming purchases—stock up
  on 4 GB modules soon if your projects depend on them.
- **Experiment with Pi 500 Plus**: mechanical keyboard fans finally have a turnkey
  Pi option with premium switches and real storage; expect community keymap and
  lighting profiles to follow quickly.
- **Test Debian 13**: clone your current Bookworm setup onto a spare SD or SSD and
  run through the Trixie upgrade path so you're ready when Raspberry Pi OS flips
  the switch.

Need deeper benchmarks or a step-by-step Raspberry Pi OS (Trixie) image prep guide?
Reach out—we're already digging in.
