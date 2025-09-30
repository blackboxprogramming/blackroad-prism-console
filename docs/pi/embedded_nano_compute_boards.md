# Embedded Nano Compute Boards Cheat Sheet

This cheat sheet curates ultra-compact Raspberry Pi Compute Module 4 (CM4) carrier options and Zero-class single-board computers (SBCs) that slot into tiny enclosures while still delivering meaningful I/O. Use it to choose the best board, power, and storage combo for small-footprint builds.

## Quick Comparison

| Board | CPU | Memory | Networking | Display/Camera | Storage | Notable Extras |
| --- | --- | --- | --- | --- | --- | --- |
| **Waveshare CM4-NANO-A** | CM4 SoC (depends on module) | CM4 Lite/eMMC | USB 2.0, Wi-Fi/BLE (module dependent) | DSI, CSI | microSD (Lite) or onboard eMMC | Smallest carrier, CM4-sized, no Ethernet |
| **Waveshare CM4-NANO-B** | CM4 SoC (depends on module) | CM4 Lite/eMMC | Gigabit Ethernet, USB 2.0 | DSI, CSI | microSD (Lite) or onboard eMMC | Adds RJ45 without enlarging footprint |
| **Waveshare CM4-NANO-C** | CM4 SoC (depends on module) | CM4 Lite/eMMC | Gigabit Ethernet, USB 2.0 | DSI, CSI (8 MP onboard) | microSD (Lite) or onboard eMMC | Integrated 8 MP camera module |
| **Orange Pi Zero 2W** | Allwinner H618 quad A53 @ 1.5 GHz | 1–4 GB LPDDR4 | Wi-Fi/BLE, optional USB Ethernet | Mini HDMI, CSI | microSD | Pi Zero 2 W form factor with more RAM |
| **Raspberry Pi Zero 2 W** | Broadcom BCM2710A1 quad A53 @ 1 GHz | 512 MB LPDDR2 | Wi-Fi/BLE | Mini HDMI, CSI | microSD | Baseline 65 × 30 mm board, huge ecosystem |

## Selection Guide by Priority

- **Minimal footprint with Ethernet:** Waveshare **CM4-NANO-B** keeps the same CM4-sized carrier while exposing Gigabit RJ45 for wired deployments.
- **Camera-forward prototypes:** Waveshare **CM4-NANO-C** bakes in an 8 MP module and retains standard CSI/DSI headers for multi-camera rigs.
- **Cost-optimized CM4 Lite builds:** Waveshare **CM4-NANO-A** drops Ethernet and HDMI to minimize BOM and power draw.
- **Zero-sized enclosures that need more RAM/CPU headroom:** **Orange Pi Zero 2W** mirrors Pi Zero 2 W mechanicals but scales to 4 GB RAM and higher clocks.
- **Maximum compatibility with existing Pi Zero hats/cases:** Stick with the **Raspberry Pi Zero 2 W** when 512 MB and standard Zero I/O are enough.

## Recommended Accessories

| Scenario | Accessories |
| --- | --- |
| CM4-NANO-A/B/C | 5 V / 3 A USB-C PSU, 16–64 GB A2 microSD (for Lite) or eMMC CM4, Waveshare heatsink kit, short FFC cables for DSI/CSI, GPIO standoffs |
| Orange Pi Zero 2W | 5 V / 3 A USB-C PSU, 32–128 GB A2 microSD, passive heatsink, USB OTG hub (for keyboard/flash) |
| Raspberry Pi Zero 2 W | 5 V / 2.5 A USB-C or micro-USB PSU with inline switch, 16–64 GB A2 microSD, mini-HDMI to HDMI adapter, 40-pin header kit |

## Ready-to-Flash Images

| Board | Suggested Image | Notes |
| --- | --- | --- |
| CM4 (all variants) | Raspberry Pi OS Lite/Full (arm64) via Raspberry Pi Imager | Enable SSH and Wi-Fi in Imager advanced settings before flashing; select CM4-compatible bootloader if using NVMe/eMMC |
| Orange Pi Zero 2W | Orange Pi OS (Debian/Ubuntu) via Orange Pi USB flashing tool or balenaEtcher | Use the board-specific device tree; first boot requires HDMI or serial console to configure Wi-Fi |
| Raspberry Pi Zero 2 W | Raspberry Pi OS Lite (32-bit) via Raspberry Pi Imager | Preconfigure SSH and Wi-Fi; consider 64-bit beta for heavier workloads, but 32-bit remains most stable |

## Deployment Checklist

1. **Flash storage** with the selected OS image, enabling SSH and Wi-Fi credentials ahead of time for headless setups.
2. **Attach accessories** (heatsink, camera, Ethernet hat) before final enclosure assembly to avoid repeated disassembly.
3. **Validate power budget:** ensure total peripheral draw stays within 5 V / 3 A. CM4-NANO boards with USB devices benefit from powered hubs.
4. **Update firmware** after first boot (`sudo rpi-eeprom-update -a` on CM4/Zero 2 W, vendor tool on Orange Pi).
5. **Snapshot baseline image** using `dd` or `rpi-clone` once configured, enabling quick recovery for future deployments.

With these quick references you can move straight from board selection to a reproducible, flashable deployment for embedded projects.
