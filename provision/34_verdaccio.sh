#!/bin/bash
set -euo pipefail

apt-get install -y docker.io
mkdir -p /srv/verdaccio
cat <<CFG > /srv/verdaccio/config.yaml
storage: /srv/verdaccio/storage
uplinks:
  npmjs:
    url: https://registry.npmjs.org/
packages:
  '@*/*':
    access: $all
    publish: $authenticated
    proxy: npmjs
  '**':
    access: $all
    publish: $authenticated
    proxy: npmjs
middlewares:
  audit:
    enabled: false
CFG
