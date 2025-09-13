#!/bin/sh
set -e
export GNUPGHOME="$(pwd)/build/signing/gnupg"
(cd dist/wheels && sha256sum -c SHA256SUMS && gpg --batch --verify SHA256SUMS.asc SHA256SUMS)
python -m venv .venv
. .venv/bin/activate
pip install --no-index --find-links dist/wheels blackroad-prism-console
python -m cli.console preflight:check
printf '\nOffline install complete\n'
