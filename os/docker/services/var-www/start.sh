#!/usr/bin/env sh
set -eu

exec npm run start -- --port "${PORT:-9000}"
exec node index.js
