const { blue, green } = require("chalk");
const { DECIMAL, INIT_ANSWER } = require("../helper-hardhat-config");
const { network } = require("hardhat");

const {
  DEVELOPMENT_CHAINS,
  NETWORK_CONFIG,
  LOCK_TIME,
} = require("../helper-hardhat-config");

module.exports = async function ({ getNamedAccounts, deployments }) {
  if (DEVELOPMENT_CHAINS.includes(network.name)) {
    console.log(blue("Start to deploy MockV3Aggregator"));
    const { deploy } = deployments;
    const { firstAccount } = await getNamedAccounts();
    console.log(blue(`first account: `), green(firstAccount));

    const mockV3Aggregator = await deploy("MockV3Aggregator", {
      from: firstAccount,
      args: [DECIMAL, INIT_ANSWER],
      log: true,
    });
  } else {
    console.log("skip deploying MockV3Aggregator contract");
  }
};

// 暴露tag
module.exports.tags = ["all", "mock"];
