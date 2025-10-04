import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import * as dotenv from "dotenv";

dotenv.config();

const rpcUrl = process.env.ANVIL_RPC_URL ?? "http://127.0.0.1:8545";
const privateKey = process.env.PRIVATE_KEY ??
  "0x59c6995e998f97a5a0044966f09453840e3fcf24e8356b5b1eaa5c32e5d6d9f5";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.25",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    tests: "test/hardhat"
  },
  networks: {
    hardhat: {},
    anvil: {
      url: rpcUrl,
      accounts: [privateKey]
    }
  },
  gasReporter: {
    enabled: process.env.CI ? true : false,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY ?? ""
  }
};

export default config;
