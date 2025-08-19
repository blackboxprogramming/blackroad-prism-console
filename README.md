# NVIDIA Open GPU Kernel Modules

This repository mirrors NVIDIA's open source GPU kernel modules and provides hardened build and packaging tooling.

## How to Build

Use the provided container image for reproducible builds:

```bash
docker build -f .codex/Dockerfile.kmod -t nvidia-open-kmod .
docker run --rm -v "$PWD:/src" -w /src nvidia-open-kmod make modules -j"$(nproc)"
```

## Supported Kernels / Architectures

- Kernels: 5.15, 6.1, 6.6
- Architectures: x86_64, aarch64

## DKMS Packages

After building, create DKMS packages (.deb and .rpm):

```bash
./.codex/make-dkms.sh 580.76.05
```

Packages are placed in `dist/`.

## Secure Boot

For Secure Boot environments, sign modules with your Machine Owner Key (MOK) and enroll the certificate using `mokutil --import`.

## License

Kernel modules in this repository are dual licensed under MIT/GPLv2. Proprietary NVIDIA userspace components are **not** distributed here.
