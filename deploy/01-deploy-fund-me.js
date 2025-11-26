const { blue, green } = require("chalk");
const { network } = require("hardhat");
const {
  DEVELOPMENT_CHAINS,
  NETWORK_CONFIG,
  LOCK_TIME,
  CONFIRMATIONS,
} = require("../helper-hardhat-config");

module.exports = async function ({ getNamedAccounts, deployments }) {
  console.log(blue("start to deploy FundMe"));
  const { deploy } = deployments;
  const { firstAccount } = await getNamedAccounts();
  console.log(blue(`first account: `), green(firstAccount));

  let dataFeedAddr;

  if (DEVELOPMENT_CHAINS.includes(network.name)) {
    const mockV3Aggregator = await deployments.get("MockV3Aggregator");
    dataFeedAddr = mockV3Aggregator.address;
  } else {
    dataFeedAddr = NETWORK_CONFIG[network.config.chainId].ethToUSDDataFeed;
  }

  console.log(blue(`dataFeed:`), green(dataFeedAddr));

  const fundMeArg = [LOCK_TIME, dataFeedAddr];

  const fundMe = await deploy("FundMe", {
    from: firstAccount,
    args: fundMeArg,
    log: true,
    waitConfirmations: CONFIRMATIONS, // Waiting for 5 confirmations and continue to verify
  });

  // verify
  if (
    hre.network.config.chainId === 11155111 &&
    process.env.ETHERSCAN_API_KEY
  ) {
    console.info(blue("---- Continue to verify. ----"));
    await hre.run("verify:verify", {
      address: fundMe.address,
      constructorArguments: fundMeArg,
    });
  } else {
    console.log(blue("---- skip sepolia testnet verification ----"));
  }
};

// 暴露tag
module.exports.tags = ["all", "fundMe"];
