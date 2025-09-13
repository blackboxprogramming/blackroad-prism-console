#!/usr/bin/env bash
set -e
curl -fsS http://127.0.0.1:4000/api/health >/dev/null && echo "$(date -Is) ok" || echo "$(date -Is) FAIL"
