#!/usr/bin/env bash
set -e
node deploy/check_llm_health.js
node deploy/check_llm_ready.js
