#!/usr/bin/env bash
set -euo pipefail

# Create DKMS packages for Debian/Ubuntu and RHEL/Fedora
MODULE_NAME="nvidia-open"
VERSION="${1:-580.76.05}"

OUTPUT_DIR="dist"
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

DKMS_SRC="dkms/${MODULE_NAME}/${VERSION}"
mkdir -p "$DKMS_SRC"

# Expect kernel sources in kernel-open/ from NVIDIA's repo
cp -r kernel-open/* "$DKMS_SRC"/

cat > "$DKMS_SRC/dkms.conf" <<EOD
PACKAGE_NAME=$MODULE_NAME
PACKAGE_VERSION=$VERSION
BUILT_MODULE_NAME[0]="nvidia"
BUILT_MODULE_NAME[1]="nvidia-modeset"
BUILT_MODULE_NAME[2]="nvidia-uvm"
BUILT_MODULE_NAME[3]="nvidia-drm"
MAKE[0]="make modules -j$(nproc)"
CLEAN="make clean"
AUTOINSTALL=yes
EOD

# tarball for manual dkms add
Tarball="$OUTPUT_DIR/${MODULE_NAME}-${VERSION}.dkms.tar.gz"
tar -C dkms -czf "$Tarball" .

# Build .deb and .rpm using fpm
fpm -s dir -t deb -n "${MODULE_NAME}-dkms" -v "$VERSION" --prefix=/usr/src -C dkms . \
  -p "$OUTPUT_DIR/${MODULE_NAME}-dkms_${VERSION}_all.deb"

fpm -s dir -t rpm -n "${MODULE_NAME}-dkms" -v "$VERSION" --prefix=/usr/src -C dkms . \
  -p "$OUTPUT_DIR/${MODULE_NAME}-dkms-${VERSION}-1.noarch.rpm"
