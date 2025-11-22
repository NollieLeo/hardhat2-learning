require("@nomicfoundation/hardhat-toolbox");
require("@chainlink/env-enc").config();

require("./tasks");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  defaultNetwork: "hardhat",
  networks: {
    sepolia: {
      // https://dashboard.alchemy.com/apps/0sgi3lgcebssjhbb/setup
      url: process.env.SEPOLIA_URL,
      accounts: [
        // 测试 私钥
        process.env.PRIVATE_KEY,
        process.env.PRIVATE_KEY_2,
      ],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
    customChains: [
      {
        network: "sepolia",
        chainId: 11155111,
        urls: {
          apiURL: "http://api.etherscan.io/v2/api", // https => http
          browserURL: "https://sepolia.etherscan.io",
        },
      },
    ],
  },
};
