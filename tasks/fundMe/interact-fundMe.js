const { task } = require("hardhat/config");

task("interact-fundMe", "interact with deployed FundMe contract.")
  .addParam("addr", "fundMe contract address")
  .setAction(async (args, hre) => {
    const fundMeFactory = await ethers.getContractFactory("FundMe");
    // 通过合约工厂函数，以及fundMe部署的地址，获取合约对象fundMeFactory.attach
    const fundMe = fundMeFactory.attach(args.addr);

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
    const firstAccountAmount = await fundMe.fundersToAmount(
      firstAccount.address
    );
    const secondAccountAmount = await fundMe.fundersToAmount(
      secondAccount.address
    );
    console.log(
      blueBright(`---- Balance of first account: ${firstAccountAmount} ----`)
    );
    console.log(
      blueBright(`---- Balance of second account: ${secondAccountAmount} ----`)
    );
  });

module.exports = {};
