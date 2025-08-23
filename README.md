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

## Codex Pipeline

This repo ships with a chat-first deployment helper at
`codex/tools/blackroad_pipeline.py`. The script accepts plain‑English
commands and orchestrates git pushes, connector stubs and droplet
deploys in one flow:

```bash
python3 codex/tools/blackroad_pipeline.py "Push latest to BlackRoad.io"
python3 codex/tools/blackroad_pipeline.py "Refresh working copy and redeploy"
```

It relies on environment variables for remote hosts and tokens
(`GIT_REMOTE`, `DROPLET_HOST`, `SLACK_WEBHOOK`).
