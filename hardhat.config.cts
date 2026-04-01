const { HardhatUserConfig } = require("hardhat/config");
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const config = {
  solidity: "0.8.20",
  networks: {
    hashkeyTestnet: {
      url: "https://testnet.hsk.xyz",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 133,
    },
  },
};

module.exports = config;
