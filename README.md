# BlackRoad Prism Console

This repository powers the BlackRoad Prism console and a Vite/React site under `sites/blackroad`.

## Quickstart

Install dependencies:

```bash
npm ci
(cd sites/blackroad && npm i --package-lock-only)
```

## Development

```bash
cd sites/blackroad
npm run dev
```

## Build

```bash
cd sites/blackroad
npm run build
```

## Tests

```bash
npm test
```

Additional operational docs live in the [`docs/`](docs) folder.

## Codex Sync & Deploy

An initial scaffold for the end-to-end BlackRoad deployment flow lives in
`scripts/blackroad_sync.py`. The helper currently exposes three
subcommands:

```bash
# Push local commits to GitHub and trigger connector jobs
python3 scripts/blackroad_sync.py push

# Update an iOS Working Copy clone
python3 scripts/blackroad_sync.py refresh-working-copy --path /path/to/clone

# Pull latest code and restart services on the droplet
python3 scripts/blackroad_sync.py deploy --host user@droplet
```

The script only prints the operations it would perform, acting as a
placeholder for future automation.
