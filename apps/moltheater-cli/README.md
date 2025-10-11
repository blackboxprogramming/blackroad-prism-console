# Moltheater CLI

Creator-facing helpers for converting Lua/ECM snippets or compact coding-key markup into conductor JSON payloads.

## Usage

```bash
pnpm --filter @blackroad/moltheater-cli build
node apps/moltheater-cli/dist/cli.js path/to/sample.lua > perf.json
```

Read from stdin and parse coding-key notation:

```bash
echo '[We|p1.00|e0.00|p0] [really|p0.85|e0.35|p+2*] [need|p0.92|e0.18|p+1]' \
  | node apps/moltheater-cli/dist/cli.js - --format key --bpm 122 --time 4/4
```

## Python helper

A lightweight mirror for coding-key conversion lives at `python/key_to_json.py`:

```bash
echo '[hello|p0.9|e0.2]' | python apps/moltheater-cli/python/key_to_json.py
```
