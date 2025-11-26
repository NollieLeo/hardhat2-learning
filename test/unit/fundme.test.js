const { ethers, deployments, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const networkHelpers = require("@nomicfoundation/hardhat-network-helpers");

describe("test FundMe contract", async function () {
  let fundMe;
  let fundMeSecondAccount;
  let firstAccount;
  let secondAccount;
  let mockV3Aggregator;
  beforeEach(async function () {
    // 通过deployments.fixture获取部署的tag
    await deployments.fixture(["all"]);
    firstAccount = (await getNamedAccounts()).firstAccount;
    secondAccount = (await getNamedAccounts()).secondAccount;
    const fundMeDeployment = await deployments.get("FundMe");
    mockV3Aggregator = await deployments.get("MockV3Aggregator");
    fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address);
    fundMeSecondAccount = await ethers.getContract("FundMe", secondAccount);
    // 添加这行调试代码
    const startingBalance = await ethers.provider.getBalance(
      fundMeDeployment.address
    );
    console.log(`Starting Balance: ${ethers.formatEther(startingBalance)} ETH`);
  });

  it("test if the owner is msg.sender", async function () {
    await fundMe.waitForDeployment();
    assert.equal(await fundMe.owner(), firstAccount);
  });

  it("test if the dataFeed is assigned correctly", async function () {
    await fundMe.waitForDeployment();
    assert.equal(await fundMe.dataFeed(), mockV3Aggregator.address);
  });

  // fund, getFund, refund
  // unit test for fund
  // check window is open , value greater than minimum value, funder balance
  it("window closed, value greater than minimum, fund failed", async function () {
    // mock tome to make sure the window is closed
    await networkHelpers.time.increase(200);
    await networkHelpers.mine();
    // value is greater minimum value
    // 预期失败
    expect(fundMe.fund({ value: ethers.parseEther("0.1") })).to.be.revertedWith(
      "window is closed"
    );
  });

  it("window open, value is less than minimum, fund failed", async function () {
    expect(
      fundMe.fund({ value: ethers.parseEther("0.0001") })
    ).to.be.revertedWith("You need to spend more ETH!");
  });

  it("window open, value greater than minimum, fund success", async function () {
    // greater than minimum
    const mockFundETH = ethers.parseEther("1");
    await fundMe.fund({ value: mockFundETH });
    const balance = await fundMe.fundersToAmount(firstAccount);
    expect(balance).to.equal(mockFundETH);
  });

  // unit test for getFund
  // onlyOwner, window is closed, target reached
  it("not owner, window closed, target reached, getFund failed", async function () {
    // make sure the target is reached
    await fundMe.fund({ value: ethers.parseEther("1") });

    // mock tome to make sure the window is closed
    await networkHelpers.time.increase(200);
    await networkHelpers.mine();

    await expect(fundMeSecondAccount.getFund()).to.be.revertedWith(
      "You are not the owner"
    );
  });

  it("window open, target reached, is owner", async function () {
    await fundMe.fund({ value: ethers.parseEther("1") });

    await expect(fundMe.getFund()).to.be.rejectedWith("window is not closed");
  });

  it("window closed, target not reached", async function () {
    await fundMe.fund({ value: ethers.parseEther("0.01") });

    // mock tome to make sure the window is closed
    await networkHelpers.time.increase(200);
    await networkHelpers.mine();
    await expect(fundMe.getFund()).to.be.revertedWith("Target is not reached");
  });

  it("window closed, target reached, getFund success", async function () {
    await fundMe.fund({ value: ethers.parseEther("20") });

    // 2. 此时合约总余额 = 之前的余额 (0.1?) + 现在的 (20)
    // 获取当前合约的总余额
    const finalBalance = await ethers.provider.getBalance(
      await fundMe.getAddress()
    );

    // mock tome to make sure the window is closed
    await networkHelpers.time.increase(200);
    await networkHelpers.mine();
    await expect(fundMe.getFund())
      .to.emit(fundMe, "FundWithdrawByOwner")
      .withArgs(finalBalance);
  });

  // refund
  // window is closed, target not reached, funder has balance
  it("window open, target not reached, funder has balance", async function () {
    await fundMe.fund({ value: ethers.parseEther("1") });
    await expect(fundMe.refund()).to.be.revertedWith("window is not closed");
  });

  it("window closed, target reached, funder has balance", async function () {
    await fundMe.fund({ value: ethers.parseEther("1") });
    // mock tome to make sure the window is closed
    await networkHelpers.time.increase(200);
    await networkHelpers.mine();
    await expect(fundMe.refund()).to.be.revertedWith("Target is reached");
  });

  it("window closed, target not reached, funder does not has balance", async function () {
    await fundMe.fund({ value: ethers.parseEther("0.1") });
    // mock tome to make sure the window is closed
    await networkHelpers.time.increase(200);
    await networkHelpers.mine();
    await expect(fundMeSecondAccount.refund()).to.be.revertedWith(
      "You are not funder"
    );
  });

  it("window closed, tagret not reached, funder has balance", async function () {
    await fundMe.fund({ value: ethers.parseEther("0.01") });

    // mock tome to make sure the window is closed
    await networkHelpers.time.increase(200);
    await networkHelpers.mine();

    await expect(fundMe.refund())
      .to.emit(fundMe, "RefundByFunder")
      .withArgs(firstAccount, ethers.parseEther("0.01"));
  });
});
