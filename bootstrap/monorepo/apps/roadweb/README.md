# RoadWeb Hello World

A minimal Vite + React single-page app that exercises RoadChain devnet connectivity.  The default
view shows the latest block number fetched from the local Anvil node and displays a quick-start
checklist for frontend developers.

## Commands

```bash
npm install                 # install dependencies
npm run dev                 # launch Vite dev server (default port 5173)
npm run build               # type-check + production build
npm run preview             # serve the production build
npm run lint                # eslint + prettier checks
npm run test                # vitest unit tests
```

Set `VITE_ANVIL_RPC` to point at the JSON-RPC endpoint you want to consume.  When the devnet
compose stack is running this defaults to `http://localhost:8545`.
