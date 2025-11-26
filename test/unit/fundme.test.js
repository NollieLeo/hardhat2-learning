const { ethers, deployments, getNamedAccounts } = require("hardhat");
const { assert } = require("chai");

describe("test FundMe contract", async function () {
  let fundMe;
  let firstAccount;
  beforeEach(async function () {
    // 通过deployments.fixture获取部署的tag
    await deployments.fixture(["all"]);
    firstAccount = (await getNamedAccounts()).firstAccount;
    const fundMeDeployment = await deployments.get("FundMe");
    fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address);
  });

  it("test if the owner is msg.sender", async function () {
    await fundMe.waitForDeployment();
    assert.equal(await fundMe.owner(), firstAccount);
  });

  it("test if the dataFeed is assigned correctly", async function () {
    await fundMe.waitForDeployment();
    assert.equal(
      await fundMe.dataFeed(),
      "0x694AA1769357215DE4FAC081bf1f309aDC325306"
    );
  });
});
