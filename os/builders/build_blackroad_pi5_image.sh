#!/usr/bin/env bash
set -euo pipefail

# Black Road OS Raspberry Pi 5 base image builder.
#
# This script automates the customization of the Ubuntu 24.04 LTS
# preinstalled server image for Raspberry Pi, applying the branding and
# optimizations required for the "Black Road OS" experience described in
# Package 1 of the build specification.
#
# Usage:
#   sudo ./build_blackroad_pi5_image.sh [--workdir <path>] [--force]
#
# The script must be executed as root (or via sudo) on a Linux host with
# loop device, chroot, and Plymouth tooling available. It will:
#   1. Download and decompress the Ubuntu 24.04 image for Raspberry Pi.
#   2. Attach the image to a loop device and mount the partitions under the
#      selected working directory.
#   3. Chroot into the mounted filesystem and apply all package installs,
#      user creation, branding, and system tuning.
#   4. Clean up mounts, detach the loop device, and compress the customized
#      image into blackroad-os-1.0.0-pi5.img.xz inside the working directory.
#
# The customization steps follow the mission brief and can be adjusted by
# editing the CHROOT_PAYLOAD heredoc below.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DEFAULT_WORKDIR="${REPO_ROOT}/build/pi5-base"
WORKDIR="${DEFAULT_WORKDIR}"
FORCE_DOWNLOAD=false
IMAGE_URL="https://cdimage.ubuntu.com/releases/24.04/release/ubuntu-24.04-preinstalled-server-arm64+raspi.img.xz"
IMAGE_ARCHIVE="${WORKDIR}/ubuntu-24.04-preinstalled-server-arm64+raspi.img.xz"
IMAGE_FILE="${WORKDIR}/ubuntu-24.04-preinstalled-server-arm64+raspi.img"
FINAL_ARCHIVE="${WORKDIR}/blackroad-os-1.0.0-pi5.img.xz"
MOUNT_DIR="${WORKDIR}/mnt"
BOOT_MOUNT="${MOUNT_DIR}/boot/firmware"
LOOP_DEVICE=""

log() { printf '\e[32m[INFO]\e[0m %s\n' "$*"; }
warn() { printf '\e[33m[WARN]\e[0m %s\n' "$*"; }
err() { printf '\e[31m[ERROR]\e[0m %s\n' "$*" >&2; }

usage() {
  cat <<USAGE
Usage: sudo ./build_blackroad_pi5_image.sh [--workdir <path>] [--force]

Options:
  --workdir <path>  Directory for downloads, mounts, and output.
  --force           Redownload the base image even if cached locally.
  -h, --help        Show this message.
USAGE
}

require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    err "This script must be run as root. Use sudo."
    exit 1
  fi
}

require_commands() {
  local -a cmds=(wget xz losetup mount umount chroot realpath)
  local missing=false
  for cmd in "${cmds[@]}"; do
    if ! command -v "${cmd}" >/dev/null 2>&1; then
      err "Missing required command: ${cmd}"
      missing=true
    fi
  done
  if [[ "${missing}" == true ]]; then
    err "Install the missing dependencies before retrying."
    exit 1
  fi
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --workdir)
        shift
        [[ $# -gt 0 ]] || { err "--workdir requires a path"; exit 1; }
        WORKDIR="$(realpath "$1")"
        ;;
      --force)
        FORCE_DOWNLOAD=true
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        err "Unknown argument: $1"
        usage
        exit 1
        ;;
    esac
    shift || true
  done
}

prepare_workdir() {
  mkdir -p "${WORKDIR}" "${MOUNT_DIR}" "${BOOT_MOUNT}"
}

download_image() {
  if [[ -f "${IMAGE_ARCHIVE}" && "${FORCE_DOWNLOAD}" == false ]]; then
    log "Base image archive already present; skipping download"
    return
  fi
  log "Downloading Ubuntu 24.04 Raspberry Pi image"
  wget -O "${IMAGE_ARCHIVE}" "${IMAGE_URL}"
}

decompress_image() {
  if [[ ! -f "${IMAGE_ARCHIVE}" ]]; then
    err "Base image archive missing: ${IMAGE_ARCHIVE}"
    exit 1
  fi
  if [[ -f "${IMAGE_FILE}" ]]; then
    log "Image already decompressed"
    return
  fi
  log "Decompressing image"
  xz -T0 -d -k -f "${IMAGE_ARCHIVE}"
}

attach_loop_device() {
  log "Attaching image to loop device"
  LOOP_DEVICE=$(losetup -f --show -P "${IMAGE_FILE}")
  log "Loop device assigned: ${LOOP_DEVICE}"
}

mount_partitions() {
  log "Mounting partitions"
  mount "${LOOP_DEVICE}p2" "${MOUNT_DIR}"
  mount "${LOOP_DEVICE}p1" "${BOOT_MOUNT}"
}

mount_system_dirs() {
  log "Binding system directories for chroot"
  mount -t proc /proc "${MOUNT_DIR}/proc"
  mount -t sysfs /sys "${MOUNT_DIR}/sys"
  mount --bind /dev "${MOUNT_DIR}/dev"
  mount --bind /dev/pts "${MOUNT_DIR}/dev/pts"
  cp /etc/resolv.conf "${MOUNT_DIR}/etc/resolv.conf"
}

write_chroot_payload() {
  log "Preparing customization payload"
  cat <<'CHROOT' > "${MOUNT_DIR}/root/customize_blackroad.sh"
#!/usr/bin/env bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

log() { printf '\e[32m[CHROOT]\e[0m %s\n' "$*"; }

log "Updating base system"
apt-get update
apt-get upgrade -y

log "Installing desktop and tooling packages"
apt-get install -y \
  openbox lightdm lightdm-gtk-greeter xorg mesa-utils nitrogen tint2 rofi \
  pulseaudio pavucontrol network-manager-gnome \
  build-essential git curl wget vim htop neofetch openssh-server avahi-daemon \
  plymouth plymouth-themes python3 python3-pip nodejs npm vulkan-tools \
  firefox chromium-browser \
  network-manager plymouth-label || true

log "Configuring Plymouth theme"
install -d -m 0755 /usr/share/plymouth/themes/blackroad
cat <<'PLYCONF' > /usr/share/plymouth/themes/blackroad/blackroad.plymouth
[Plymouth Theme]
Name=Black Road OS
Description=Black Road Operating System Boot Theme
ModuleName=script

[script]
ImageDir=/usr/share/plymouth/themes/blackroad
ScriptFile=/usr/share/plymouth/themes/blackroad/blackroad.script
PLYCONF

cat <<'PLYSCRIPT' > /usr/share/plymouth/themes/blackroad/blackroad.script
// Black Road OS Plymouth Boot Theme
Window.SetBackgroundTopColor(0.0, 0.0, 0.0);
Window.SetBackgroundBottomColor(0.0, 0.0, 0.0);

colors = [
  [0.992, 0.729, 0.176],
  [1.0, 0.419, 0.208],
  [1.0, 0.310, 0.847],
  [0.780, 0.325, 1.0],
  [0.388, 0.400, 0.945],
  [0.235, 0.510, 0.976],
  [0.024, 0.714, 0.831]
];

messages = [
  "Black Road MediaLab BIOS v4.06RG",
  "Copyright (C) 2025, Black Road Technologies, Inc.",
  "",
  "BCM2712 CPU at 2.4GHz",
  "Memory Test : 8388608 OK",
  "",
  "> Initializing Black Road OS Kernel...",
  "> Loading device drivers...",
  "> Mounting filesystems...",
  "> Starting network services...",
  "",
  "[ OK ] Hardware initialization complete",
  "[ OK ] All systems operational"
];

text_objects = [];
for (i = 0; i < messages.GetLength(); i++) {
  text_objects[i] = Image.Text(messages[i], 0, 0.714, 0.831, 1.0);
}

line_height = 20;
start_y = 50;

fun refresh_callback() {
  current_time = Plymouth.GetTime();
  for (i = 0; i < messages.GetLength(); i++) {
    delay = i * 0.15;
    if (current_time > delay) {
      if (messages[i].SubString(0, 1) == ">") {
        text_objects[i] = Image.Text(messages[i], 0.992, 0.729, 0.176, 1.0);
      } else if (messages[i].SubString(0, 1) == "[") {
        text_objects[i] = Image.Text(messages[i], 0.063, 0.725, 0.506, 1.0);
      } else {
        text_objects[i] = Image.Text(messages[i], 0.024, 0.714, 0.831, 1.0);
      }
      sprite = Sprite(text_objects[i]);
      sprite.SetX(50);
      sprite.SetY(start_y + (i * line_height));
    }
  }
}

Plymouth.SetRefreshFunction(refresh_callback);

fun progress_callback(duration, progress) {}
Plymouth.SetBootProgressFunction(progress_callback);
PLYSCRIPT

plymouth-set-default-theme -R blackroad || true
update-initramfs -u

log "Configuring hostname and hosts"
echo "blackroad-pi5" > /etc/hostname
cat <<'HOSTS' > /etc/hosts
127.0.0.1       localhost
127.0.1.1       blackroad-pi5
::1             localhost ip6-localhost ip6-loopback

192.168.1.100   blackroad-jetson
192.168.1.101   blackroad-pi5-01
192.168.1.102   blackroad-pi5-02
HOSTS

log "Creating Cecilia user"
if ! id cecilia >/dev/null 2>&1; then
  useradd -m -s /bin/bash -G sudo,audio,video,netdev cecilia
fi
echo "cecilia:blackroad2025" | chpasswd
echo "cecilia ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

log "Enabling services"
systemctl enable ssh || true
systemctl enable avahi-daemon || true
systemctl enable NetworkManager || true
sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config || true

log "Applying firmware configuration"
cat <<'FW' >> /boot/firmware/config.txt

# Black Road OS Optimizations
gpu_mem=256
arm_boost=1
over_voltage=2
arm_freq=2400
FW

if ! grep -q 'plymouth.ignore-serial-consoles' /boot/firmware/cmdline.txt; then
  sed -i '1s/$/ quiet splash plymouth.ignore-serial-consoles/' /boot/firmware/cmdline.txt
fi

log "Branding system metadata"
cat <<'OSR' > /etc/os-release
PRETTY_NAME="Black Road OS 1.0.0"
NAME="Black Road OS"
VERSION_ID="1.0.0"
VERSION="1.0.0 (Spectrum)"
ID=blackroad
ID_LIKE=ubuntu
HOME_URL="https://blackroad.os"
SUPPORT_URL="https://blackroad.os/support"
BUG_REPORT_URL="https://blackroad.os/bugs"
UBUNTU_CODENAME=noble
OSR

cat <<'MOTD' > /etc/motd
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   ██████╗ ██╗      █████╗  ██████╗██╗  ██╗           ║
║   ██╔══██╗██║     ██╔══██╗██╔════╝██║ ██╔╝           ║
║   ██████╔╝██║     ███████║██║     █████╔╝            ║
║   ██╔══██╗██║     ██╔══██║██║     ██╔═██╗            ║
║   ██████╔╝███████╗██║  ██║╚██████╗██║  ██╗           ║
║   ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝           ║
║                                                       ║
║   ██████╗  ██████╗  █████╗ ██████╗                   ║
║   ██╔══██╗██╔═══██╗██╔══██╗██╔══██╗                  ║
║   ██████╔╝██║   ██║███████║██║  ██║                  ║
║   ██╔══██╗██║   ██║██╔══██║██║  ██║                  ║
║   ██║  ██║╚██████╔╝██║  ██║██████╔╝                  ║
║   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝                   ║
║                                                       ║
║              RASPBERRY PI 5 EDITION v1.0.0            ║
║                   BUILD 2025.10.27                    ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝

Welcome to Black Road OS, Cecilia!
MOTD

log "Configuring neofetch"
mkdir -p /home/cecilia/.config/neofetch
cat <<'NEO' > /home/cecilia/.config/neofetch/config.conf
print_info() {
    prin "╔══════════════════════════════════════╗"
    prin "║       BLACK ROAD OS v1.0.0           ║"
    prin "╚══════════════════════════════════════╝"
    info "OS" distro
    info "Kernel" kernel
    info "Uptime" uptime
    info "CPU" cpu
    info "Memory" memory
    info "GPU" gpu_driver
    info "Temperature" temp
}
NEO
chown -R cecilia:cecilia /home/cecilia/.config

log "Disabling unused services"
systemctl disable bluetooth || true
systemctl disable cups || true
systemctl mask snapd || true

log "Python and Node tooling upgrades"
pip3 install --upgrade pip
npm install -g yarn pnpm

log "Cleaning up"
apt-get autoremove -y
apt-get clean
rm -rf /var/log/*
rm -f /root/.bash_history
: > /home/cecilia/.bash_history || true

log "Customization complete"
rm -- "$0"
CHROOT
  chmod +x "${MOUNT_DIR}/root/customize_blackroad.sh"
}

run_chroot_payload() {
  log "Entering chroot environment"
  chroot "${MOUNT_DIR}" /bin/bash /root/customize_blackroad.sh
}

unmount_system_dirs() {
  log "Unmounting chroot binds"
  umount -lf "${MOUNT_DIR}/dev/pts" || true
  umount -lf "${MOUNT_DIR}/dev" || true
  umount -lf "${MOUNT_DIR}/sys" || true
  umount -lf "${MOUNT_DIR}/proc" || true
}

unmount_partitions() {
  log "Unmounting partitions"
  umount -lf "${BOOT_MOUNT}" || true
  umount -lf "${MOUNT_DIR}" || true
}

detach_loop_device() {
  if [[ -n "${LOOP_DEVICE}" ]]; then
    log "Detaching loop device ${LOOP_DEVICE}"
    losetup -d "${LOOP_DEVICE}" || true
  fi
}

compress_image() {
  log "Compressing customized image"
  xz -9 -T0 -f -c "${IMAGE_FILE}" > "${FINAL_ARCHIVE}"
  log "Final image located at ${FINAL_ARCHIVE}"
}

cleanup() {
  set +e
  unmount_system_dirs
  unmount_partitions
  detach_loop_device
}

trap cleanup EXIT

main() {
  parse_args "$@"
  require_root
  require_commands
  prepare_workdir
  download_image
  decompress_image
  attach_loop_device
  mount_partitions
  mount_system_dirs
  write_chroot_payload
  run_chroot_payload
  unmount_system_dirs
  unmount_partitions
  detach_loop_device
  trap - EXIT
  compress_image
  log "Black Road OS base image build completed successfully"
}

main "$@"
