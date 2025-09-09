require("@nomicfoundation/hardhat-toolbox");
module.exports = {
  solidity: "0.8.20",
  networks: {
    // set ETH_RPC_URL + PK in env to deploy to your L2 testnet or local node
    custom: { url: process.env.ETH_RPC_URL, accounts: [process.env.DEPLOYER_PK] }
  }
};
