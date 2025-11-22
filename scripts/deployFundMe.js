const { ethers } = require("hardhat");
const { blue, blueBright, green } = require("chalk");

async function verifyFundMe(fundMeAddr, fundMeArg) {
  return await hre.run("verify:verify", {
    address: fundMeAddr,
    constructorArguments: fundMeArg,
  });
}

async function main() {
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

  // init 2 accounts
  const [firstAccount, secondAccount] = await ethers.getSigners(); // 获取配置中的两个account
  // fund contract with first account
  // fund会生成transaction，后续操作需要等待transaction完成
  const fundTxWithFirstAccount = await fundMe
    .connect(firstAccount)
    .fund({ value: ethers.parseEther("0.005") });
  await fundTxWithFirstAccount.wait();
  // check balance of contract
  const balanceOfContract = await ethers.provider.getBalance(fundMe.target);
  console.log(
    blueBright(`---- Balance of the contract is ${balanceOfContract} ----`)
  );

  // fund contract with second account
  const fundTxWithSecondAccount = await fundMe
    .connect(secondAccount)
    .fund({ value: ethers.parseEther("0.005") });
  await fundTxWithSecondAccount.wait();
  console.log(
    blueBright(`---- Balance of the contract is ${balanceOfContract} ----`)
  );

  // check mappings
  const firstAccountAmount = await fundMe.fundersToAmount(firstAccount.address);
  const secondAccountAmount = await fundMe.fundersToAmount(
    secondAccount.address
  );
  console.log(
    blueBright(`---- Balance of first account: ${firstAccountAmount} ----`)
  );
  console.log(
    blueBright(`---- Balance of second account: ${secondAccountAmount} ----`)
  );
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
