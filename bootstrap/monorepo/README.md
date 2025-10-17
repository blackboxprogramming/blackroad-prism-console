# RoadChain Monorepo Bootstrap

This bootstrap kit packages a minimal-but-realistic layout for the RoadChain stack.  Drop the
contents of this directory into a fresh repository to get:

- A root `Makefile` that coordinates dependency install, linting, testing, and devnet orchestration.
- GitHub Actions CI that exercises the web client, the smart-contract suite, and security linters.
- A reproducible devnet powered by Anvil (Foundry) for local blockchain testing.
- A "hello world" RoadWeb React SPA that demonstrates how the frontend talks to the devnet.
- A RoadCoin ERC-20 package with dual Hardhat/Foundry workflows, tests, and Slither integration.

## Layout

```
monorepo/
├── .github/workflows/ci.yml    # shared CI for web + contracts
├── Makefile                    # task entrypoints used locally & in CI
├── PR_CHECKLIST.md             # lightweight checklist for reviews
├── docker-compose.devnet.yml   # Anvil devnet that mirrors CI's expectations
├── apps/roadweb                # RoadWeb hello world + Vite/React toolchain
└── packages/roadcoin           # Hardhat/Foundry project for RoadCoin ERC-20
```

## Usage

1. Copy the directory into the root of a new repository (or rename it to match your repo).
2. Commit the files as-is and push them to your hosting provider.
3. Update package names, org identifiers, and environment secrets as your project evolves.
4. Expand on the placeholder tests to reflect your protocol specifics.

Refer to the inline READMEs inside `apps/roadweb` and `packages/roadcoin` for deeper guidance on
running the respective stacks.
