# Black Road OS — Raspberry Pi 5 Base Image Builder

This document captures the workflow for producing the **Black Road OS 1.0.0** base
image for Raspberry Pi 5 hardware. It mirrors the Package 1 specification and is
paired with the automation script at
[`os/builders/build_blackroad_pi5_image.sh`](../builders/build_blackroad_pi5_image.sh).

## Overview

The builder script layers Black Road branding, desktop environment choices, and
performance tuning on top of the official Ubuntu 24.04 LTS (ARM64, preinstalled
server) image for Raspberry Pi. The output artifact is a compressed image named
`blackroad-os-1.0.0-pi5.img.xz` that can be flashed directly onto microSD or SSD
media for Raspberry Pi 5 devices.

The customization covers:

- Custom Plymouth boot theme with Black Road spectrum colours and retro terminal
  copy.
- Lightweight Openbox desktop session managed by LightDM.
- Network stack tuned for cluster deployments (NetworkManager, Avahi, SSH).
- Cecilia’s administrative user with passwordless sudo.
- System identity touchpoints (hostname, `/etc/os-release`, MOTD, neofetch
  profile).
- GPU and CPU tuning for BCM2712 hardware.
- Removal of unused services and package cache cleanup.

## Prerequisites

Run the script on a Linux workstation with sudo/root access. The host must
provide loop device and chroot support. Recommended packages (Ubuntu/Debian):

```bash
sudo apt install --yes wget xz-utils qemu-user-static binfmt-support \
  dosfstools gdisk rsync
```

> **Note:** `qemu-user-static` is optional but useful when executing ARM binaries
> during chroot on x86_64 hosts. The script itself does not require QEMU but
> certain package postinst scripts may expect an ARM runtime.

## Usage

```bash
cd blackroad-prism-console/os/builders
sudo ./build_blackroad_pi5_image.sh
```

Key flags:

- `--workdir <path>` — override the working directory (default:
  `os/build/pi5-base` under the repository root).
- `--force` — redownload the Ubuntu base image even if cached locally.

The script downloads the base image, mounts the partitions, runs all
customisation inside a chroot (`/root/customize_blackroad.sh`), cleans up mounts,
and writes the final archive. The working directory retains the decompressed
image to speed up subsequent rebuilds.

## Customisation steps

Inside the chroot the script performs the following:

1. Updates and upgrades Ubuntu packages.
2. Installs the selected desktop stack (Openbox + LightDM) along with the
   required tooling (build-essential, Git, Node.js, Python, etc.).
3. Installs and enables NetworkManager, Avahi, SSH, and audio utilities.
4. Creates the Plymouth theme at `/usr/share/plymouth/themes/blackroad`, sets it
   as default, and rebuilds initramfs.
5. Configures hostname (`blackroad-pi5`), `/etc/hosts`, and user `cecilia`
   (sudoer with password `blackroad2025`).
6. Configures boot firmware (`config.txt`, `cmdline.txt`) with GPU memory split
   and splash parameters.
7. Replaces `/etc/os-release`, `/etc/motd`, and neofetch config to reflect Black
   Road branding.
8. Installs global npm tooling (`yarn`, `pnpm`) and upgrades `pip`.
9. Disables Bluetooth, CUPS, and Snap services to minimise boot footprint.
10. Cleans apt caches and log directories.

Review or edit the heredoc embedded in the builder script if future releases
require different desktop packages, additional services, or new branding assets.

## Output

Upon success you will find the final image at:

```
<workdir>/blackroad-os-1.0.0-pi5.img.xz
```

The archive is ready for flashing via `xz -dc ... | sudo dd of=/dev/sdX
bs=4M status=progress conv=fsync` as described in the package brief. The
uncompressed image is left in the work directory to permit resealing without
another download.

## Verification checklist

After flashing and first boot on Raspberry Pi 5:

- [ ] Boot animation shows the Black Road Plymouth theme.
- [ ] LightDM greeter allows login to the Openbox session.
- [ ] User `cecilia` can authenticate with `blackroad2025` and run sudo commands
      without a password.
- [ ] `hostnamectl` reports `blackroad-pi5` and `neofetch` displays the custom
      header.
- [ ] SSH and Avahi advertise the host on the network.
- [ ] GPU memory split is 256 MB and the system reports hardware acceleration
      (`glxinfo`, `vkcube`).
- [ ] Temperature readings (`vcgencmd measure_temp`) respond.

Document any deviations or additional tuning in this file so the foundation
image remains reproducible.
