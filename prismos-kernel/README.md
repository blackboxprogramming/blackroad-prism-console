# PrismOS Kernel

This crate is a bare-metal experimental kernel for the Prism project.

## Build & Run

```bash
./build.sh       # builds the kernel for x86_64-prismos
qemu-system-x86_64 -drive format=raw,file=target/x86_64-prismos/debug/bootimage-prismos-kernel.bin
```

// TODO: document debugging and development tips.
