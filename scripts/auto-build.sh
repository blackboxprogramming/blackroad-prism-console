#!/usr/bin/env bash
# Simple automation script to install dependencies and build the project.
# Allows automated agents to trigger builds regularly.
set -euo pipefail

pnpm install --frozen-lockfile
pnpm build
