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

## Deployment

Run the scaffolded end-to-end sync script to push local changes and deploy them
to the live environment:

```bash
python scripts/blackroad_sync.py
```

The script pushes to GitHub, fans out to connector webhooks, refreshes an iOS
Working Copy checkout and issues a remote deploy on the droplet when configured
via environment variables.

Additional operational docs live in the [`docs/`](docs) folder.
