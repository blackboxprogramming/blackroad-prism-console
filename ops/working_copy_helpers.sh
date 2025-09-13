#!/usr/bin/env bash
# Helpers for iOS Working Copy Shortcuts
case "$1" in
  pull) git pull --rebase ;;
  merge) git merge --no-edit origin/main || true ;;
  push) git push ;;
  deploy) bash ops/bluegreen_deploy.sh ;;
  *) echo "usage: $0 {pull|merge|push|deploy}" ;;
esac
