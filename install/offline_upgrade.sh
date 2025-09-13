#!/bin/sh
set -e
. .venv/bin/activate
python -m cli.console version:show
sha256sum -c dist/wheels/SHA256SUMS
pip install --no-index --find-links dist/wheels --upgrade blackroad-prism-console
python -m cli.console version:show
printf 'Offline upgrade complete\n'
