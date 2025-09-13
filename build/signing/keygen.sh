#!/bin/sh
set -e
DIR="$(dirname "$0")/gnupg"
mkdir -p "$DIR"
chmod 700 "$DIR"
export GNUPGHOME="$DIR"
if gpg --list-keys demo@example.com >/dev/null 2>&1; then
  exit 0
fi
gpg --batch --pinentry-mode loopback --passphrase '' --quick-generate-key 'demo@example.com' rsa2048 sign 1d
