#!/usr/bin/env bash
# Simple build script for PrismOS
# TODO: install bootimage if missing
set -e
cargo build --target x86_64-prismos.json
# TODO: run in QEMU
