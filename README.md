![Build](https://github.com/blackboxprogramming/blackroad-prism-console/actions/workflows/monorepo-matrix.yml/badge.svg) ![E2E](https://github.com/blackboxprogramming/blackroad-prism-console/actions/workflows/playwright.yml/badge.svg) ![Deploy](https://github.com/blackboxprogramming/blackroad-prism-console/actions/workflows/deploy-blackroad.yml/badge.svg)
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
