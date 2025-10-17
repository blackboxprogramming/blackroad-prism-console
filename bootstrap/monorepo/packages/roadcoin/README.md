# RoadCoin ERC-20 Suite

This package contains a complete Hardhat + Foundry setup for the RoadCoin ERC-20 token.  It is wired
for dual test coverage, static analysis via Slither, and a simple deployment script that targets the
local Anvil devnet.

## Commands

```bash
npm install              # install npm dependencies
npm run lint             # prettier + solhint (via hardhat) checks
npm run build            # hardhat compile
npm run test             # hardhat test suite (TypeScript)
npm run test:foundry     # forge test suite (Solidity)
npm run coverage         # solidity-coverage (optional)
npm run slither          # run static analysis (requires slither installed)
```

### Foundry prerequisites

Install Foundry and the testing libraries:

```bash
foundryup
forge install foundry-rs/forge-std openzeppelin/openzeppelin-contracts --no-commit
```

### Environment variables

Copy `.env.example` to `.env` and set the following values:

- `ANVIL_RPC_URL` – JSON-RPC endpoint of the devnet (defaults to `http://127.0.0.1:8545`).
- `PRIVATE_KEY` – deployer private key for scripts (Anvil defaults work for local dev).
- `ETHERSCAN_API_KEY` – optional, enables verification commands.

## Directory structure

```
packages/roadcoin/
├── contracts/               # Solidity sources
├── forge/                   # Foundry tests & scripts
├── script/                  # Foundry deployment scripts
├── test/hardhat/            # Hardhat tests (TypeScript)
├── hardhat.config.ts        # Hardhat configuration
├── foundry.toml             # Foundry configuration
├── slither.config.json      # Static analysis configuration
└── README.md
```

Extend `contracts/RoadCoin.sol` or add new modules under `contracts/` as your protocol grows.
