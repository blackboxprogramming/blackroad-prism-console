# RoadChain Monorepo Bootstrap Kit

This repository now includes a drop-in starter kit for building the RoadChain stack from scratch.  It
lives under `bootstrap/monorepo` and bundles:

- **PR checklist** – `PR_CHECKLIST.md` keeps reviews consistent across teams.
- **Automation** – `.github/workflows/ci.yml` runs RoadWeb lint/tests, Hardhat/Foundry suites, and a
devnet smoke test out of the box.
- **Developer tooling** – `Makefile` consolidates install, lint, test, and devnet commands.
- **Devnet compose** – `docker-compose.devnet.yml` spins up an Anvil node and RoadWeb watcher.
- **RoadWeb app** – `apps/roadweb` contains a Vite + React hello world that pings the devnet.
- **RoadCoin ERC-20** – `packages/roadcoin` ships Hardhat + Foundry scaffolding, tests, Slither config,
and deployment script.

Copy the directory into a fresh repo (or re-root it) to fast-track new RoadChain environments.  See
component READMEs for more detailed usage instructions.
