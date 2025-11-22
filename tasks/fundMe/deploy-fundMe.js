const { task } = require("hardhat/config");
const { blue, blueBright, green } = require("chalk");

async function verifyFundMe(fundMeAddr, fundMeArg) {
  return await hre.run("verify:verify", {
    address: fundMeAddr,
    constructorArguments: fundMeArg,
  });
}

task("deploy-fundMe", "deploy FundMe contract").setAction(async (args, hre) => {
  // create factory
  const fundMeFactory = await ethers.getContractFactory("FundMe");
  // deploy contract from factory
  console.info(blue("---- Start to deploy FundMe. ----"));
  const fundMeArgs = [100];
  const fundMe = await fundMeFactory.deploy(...fundMeArgs);
  // wait to deploy
  await fundMe.waitForDeployment();
  console.log(
    green(
      `---- Contract has been deployed successfully, contract address is ${fundMe.target}. ----`
    )
  );
  // verify
  if (
    hre.network.config.chainId === 11155111 &&
    process.env.ETHERSCAN_API_KEY
  ) {
    console.log(
      blue("---- Waiting for 5 confirmations and continue to verify ----")
    );
    await fundMe.deploymentTransaction().wait(5);
    console.info(blue("---- Continue to verify. ----"));
    await verifyFundMe(fundMe.target, fundMeArgs);
  } else {
    console.log(blue("---- skip testnet verification ----"));
  }
});

module.exports = {};
