const { ethers, deployments, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const networkHelpers = require("@nomicfoundation/hardhat-network-helpers");
const { DEVELOPMENT_CHAINS } = require("../../helper-hardhat-config");

!DEVELOPMENT_CHAINS.includes(network.name)
  ? describe("test FundMe contract", async function () {
      let fundMe;
      let firstAccount;

      beforeEach(async function () {
        // 通过deployments.fixture获取部署的tag
        await deployments.fixture(["all"]);
        firstAccount = (await getNamedAccounts()).firstAccount;
        const fundMeDeployment = await deployments.get("FundMe");
        fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address);
        // 添加这行调试代码
        const startingBalance = await ethers.provider.getBalance(
          fundMeDeployment.address
        );
        console.log(
          `Starting Balance: ${ethers.formatEther(startingBalance)} ETH`
        );
      });

      // test fund and success to getFund
      it("fund and getFund successfully", async function () {
        // make sure target reached
        await fundMe.fund({ value: ethers.parseEther("0.5") });
        // 不能再使用helpers，因为是模拟的真实环境，所以采用promise整
        // make sure window is closed
        await new Promise((resolve) => setTimeout(resolve, [181 * 1000]));

        const finalBalance = await ethers.provider.getBalance(
          await fundMe.getAddress()
        );

        // make sure we can get receipt
        const getFundTx = await fundMe.getFund();
        const getFundReceipt = await getFundTx.wait();

        await expect(getFundReceipt)
          .to.be.emit(fundMe, "FundWithdrawByOwner")
          .withArgs(finalBalance);
      });

      // test fund and success to refund
      it("fund and refund successfully", async function () {
        // make sure target not reached
        await fundMe.fund({ value: ethers.parseEther("0.01") });
        // 不能再使用helpers，因为是模拟的真实环境，所以采用promise整
        // make sure window is closed
        await new Promise((resolve) => setTimeout(resolve, [181 * 1000]));

        const finalBalance = await ethers.provider.getBalance(
          await fundMe.getAddress()
        );

        // make sure we can get receipt
        const reFundTx = await fundMe.refund();
        const reFundReceipt = await reFundTx.wait();

        await expect(reFundReceipt)
          .to.be.emit(fundMe, "RefundByFunder")
          .withArgs(firstAccount, finalBalance);
      });
    })
  : describe.skip;
